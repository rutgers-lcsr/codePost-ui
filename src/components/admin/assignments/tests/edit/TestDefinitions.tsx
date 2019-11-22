/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Button, Layout, Menu, Icon, Empty, Spin } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* other library imports */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/* codePost object imports */
import {
  AssignmentType,
  TestCaseType,
  TestCategoryType,
  SubmissionType,
  FileType,
} from '../../../../../infrastructure/types';
import { TestCase } from '../../../../../infrastructure/testCase';
import { TestCategory } from '../../../../../infrastructure/testCategory';
import { SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../infrastructure/autograder/helperFile';
import {
  Environment,
  EnvironmentType,
  TestTemplateType,
  TestsSourceType,
} from '../../../../../infrastructure/autograder/environment';
import { File } from '../../../../../infrastructure/file';

/* codePost component imports */
import { TestItem } from './TestDefinitions/TestItem';
import { AddCategoryModal } from './TestDefinitions/AddCategoryModal';
import { EditCategoryModal } from './TestDefinitions/EditCategoryModal';
import { AddTestModal } from './TestDefinitions/AddTestModal';

/* codePost utils imports */
import { fetchTestData, TestCasesByCategory } from '../../../../core/testFetchUtils';
import { hasNativeTestSupport } from './utils/languageUtils';

import { CodeWindow } from './utils/CodeWindow';

const { Sider, Content } = Layout;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionType[];
  env?: EnvironmentType;
}

enum DETAIL_TYPE {
  EditTests,
  ViewSource,
}

interface IGroupType {
  subMenuTitle?: React.ReactElement;
  isDisabled: boolean;
  files: { name: string; canSave: boolean; code: string; title?: any }[];
  onSave?: any;
}

export const TestDefinitions = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [casesByCategory, setCasesByCategory] = useState<TestCasesByCategory>({});
  const [categories, setCategories] = useState<TestCategoryType[]>([]);
  const [panel, setPanel] = useState<DETAIL_TYPE>(DETAIL_TYPE.EditTests);
  const [activeTest, setActiveTest] = useState<TestCaseType | undefined>(undefined);
  const [tests, setTests] = useState<TestTemplateType[]>([]);
  const [main, setMain] = useState('');
  const [index, setIndex] = useState('0-0');
  const [loading, setLoading] = useState(true);

  const [activeSubmission, setActiveSubmission] = useState<SubmissionType | undefined>(undefined);
  const [currentFiles, setCurrentFiles] = useState<(SolutionFileType | FileType)[]>(props.solutions);

  /******************************* Fetch Data ****************************/
  useEffect(() => {
    const fetchData = async () => {
      const [categories, casesByCategory]: any = await fetchTestData(props.currentAssignment);
      setCategories(categories);
      setCasesByCategory(casesByCategory);
      if (activeTest === undefined) {
        if (categories.length > 0 && activeTest === undefined) setActiveTest(casesByCategory[categories[0].id][0]);
      }
      setLoading(false);
    };

    fetchData();
  }, [props.currentAssignment]);

  useEffect(() => {
    if (props.env !== undefined) {
      const fetchData = async () => {
        const source: TestsSourceType = await Environment.eject(props.env!.id);
        setMain(source.main);
        setTests(source.templates);
      };
      fetchData();
    }
  }, [props.env]);

  useEffect(() => {
    setActiveSubmission(undefined);
    setCurrentFiles([]);
  }, [activeTest]);

  /******************************* TestCategory functions  ****************************/

  const addCategory = async (name: string, proMode: boolean) => {
    const payload = {
      id: -1,
      name: name,
      assignment: props.currentAssignment.id,
      type: proMode ? 'bash' : 'normal',
    };
    const newCategory = await TestCategory.create(payload);

    setCategories([...categories, newCategory]);
    const newCases = { ...casesByCategory };
    newCases[newCategory.id] = [];
    setCasesByCategory(newCases);
  };

  const updateCategory = (testCategory: TestCategoryType) => {
    return TestCategory.update(testCategory).then((newCategory) => {
      replaceTestCategory(newCategory);
    });
  };

  const deleteCategory = (testCategory: TestCategoryType) => {
    return TestCategory.delete(testCategory.id).then(() => {
      setCategories(categories.filter((el) => el.id !== testCategory.id));
    });
  };

  /******************************* TestCase functions  ****************************/

  const saveTest = async (testcase: TestCaseType) => {
    let newTest;
    if (testcase.id < 0) {
      newTest = await TestCase.create(testcase);
    } else {
      newTest = await TestCase.update(testcase);
    }

    replaceTestCase(newTest, testcase);
    setActiveTest(testcase);
    return newTest;
  };

  const addTest = async (language: string | null, category: number) => {
    // If a language doesn't have native support, default to a bash unit test
    const externalOnly = !props.env || !props.env.language;
    const hasNativeSupport = !externalOnly && language && hasNativeTestSupport(language);
    const dummyTestCase: TestCaseType = {
      id: -1,
      sortKey: 0,
      testCategory: category,
      description: 'New Test',
      type: hasNativeSupport ? 'io' : externalOnly ? 'external' : 'bash-unit',
      pointsPass: 0,
      pointsFail: 0,
      text: '',
      function: '',
      fileName: '',
      expectedOutput: '',
      input: '',
      checkReturn: true,
      modified: '',
      exposed: false,
      instances: [],
      explanation: '',
    };

    const newTestCase = await saveTest(dummyTestCase);
    const newCases = { ...casesByCategory };
    newCases[newTestCase.testCategory] = [...casesByCategory[newTestCase.testCategory], newTestCase];
    setCasesByCategory(newCases);
    setActiveTest(newTestCase);
  };

  const deleteTest = (testCase: TestCaseType) => {
    const newCases = { ...casesByCategory };
    newCases[testCase.testCategory] = newCases[testCase.testCategory].filter((el) => el.id !== testCase.id);

    // Load new test
    const sorted = TestCase.sort(casesByCategory[testCase.testCategory]);
    const index = sorted.findIndex((el) => el.id === testCase.id);
    if (index === 0) {
      if (sorted.length > 1) {
        setActiveTest(sorted[1]);
      } else {
        setActiveTest(undefined);
      }
    } else {
      setActiveTest(sorted[index - 1]);
    }

    setCasesByCategory(newCases);
    return TestCase.delete(testCase.id);
  };

  /******************************* State Change Functions  ****************************/

  const replaceTestCase = (newCase: TestCaseType, oldCase: TestCaseType) => {
    const filteredTests = casesByCategory[newCase.testCategory].filter((tc) => {
      return tc.id !== oldCase.id;
    });
    const newCases = { ...casesByCategory };
    newCases[newCase.testCategory] = [...filteredTests, newCase];
    setCasesByCategory(newCases);
  };

  const replaceTestCategory = (newCategory: TestCategoryType) => {
    const filteredCategories = categories.filter((cat) => {
      return cat.id !== newCategory.id;
    });
    setCategories([...filteredCategories, newCategory]);
  };

  const togglePanel = () => {
    if (panel === DETAIL_TYPE.EditTests) {
      setPanel(DETAIL_TYPE.ViewSource);
    } else {
      setPanel(DETAIL_TYPE.EditTests);
    }
  };

  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };

  // Fixme: wire this up to selector in TestItem
  const setTestSubject = (id: string) => {
    const idNum = parseInt(id, 10);
    const match = props.submissions.find((el) => el.id === idNum);
    if (match) {
      const files = match.files.map((fileID) => File.read(fileID));
      Promise.all(files).then((fileList) => setCurrentFiles(fileList));
      setActiveSubmission(match);
    } else {
      setActiveSubmission(undefined);
      setCurrentFiles(props.solutions);
    }
  };

  /******************************* Misc ****************************/

  const download = () => {
    const zip = new JSZip();
    zip.file('main.sh', main);
    let dir = zip.folder('tests');
    tests.map((test) => {
      dir.file(`Test${test.id}${test.extension}`, test.code);
    });
    dir = zip.folder('files');
    currentFiles.map((file) => {
      dir.file(file.name, file.code);
    });
    props.helpers.map((file) => {
      dir.file(file.name, file.code);
    });

    zip.generateAsync({ type: 'blob' }).then(function(content: any) {
      saveAs(content, `test-directory.zip`);
    });
  };

  /******************************* Return  ****************************/

  const externalOnly = !props.env || !props.env.language;
  let menu;
  let content;

  switch (panel) {
    case DETAIL_TYPE.ViewSource:
      const bashGroup: IGroupType = {
        files: [{ name: 'main.sh', code: main, canSave: false }],
        isDisabled: false,
      };

      const helperFiles = props.helpers.map((file) => {
        return { title: <div>{file.name} (Helper)</div>, name: file.name, code: file.code, canSave: false };
      });

      const submissionFiles = currentFiles.map((file) => {
        return { name: file.name, code: file.code, canSave: false };
      });

      const fileGroup: IGroupType = {
        subMenuTitle: <div style={{ display: 'flex', alignItems: 'center' }}>files</div>,
        files: [...helperFiles, ...submissionFiles],
        isDisabled: true,
      };

      const templateGroup: IGroupType = {
        subMenuTitle: <div>tests</div>,
        files: tests.map((test) => {
          return { code: test.code, name: `Test${test.id}${test.extension}`, canSave: false };
        }),
        isDisabled: false,
      };

      const groups = [bashGroup, fileGroup, templateGroup];

      const groupElems = groups.map((group, groupIndex) => {
        const items = group.files.map((file, fileIndex) => {
          return (
            <Menu.Item key={`${groupIndex}-${fileIndex}`} style={{ height: 'fit-content', minHeight: 40 }}>
              <div>{file.title || file.name}</div>
            </Menu.Item>
          );
        });
        if (!group.subMenuTitle) {
          return items;
        }

        return (
          <Menu.SubMenu key={`${groupIndex}`} disabled={group.isDisabled} title={group.subMenuTitle}>
            {items}
          </Menu.SubMenu>
        );
      });

      menu = (
        <Menu onClick={changeIndex} mode="inline" selectedKeys={[index]} openKeys={['0', '1', '2', '3']}>
          {groupElems}
        </Menu>
      );

      const currentGroupIndex = parseInt(index.split('-')[0], 10);
      const currentFileIndex = parseInt(index.split('-')[1], 10);

      const currentGroup = groups[currentGroupIndex];
      const currentFile = currentGroup.files[currentFileIndex];

      if (currentFile !== undefined) {
        content = <CodeWindow code={currentFile.code} name={currentFile.name} />;
      }
      break;
    case DETAIL_TYPE.EditTests:
      menu = (
        <Menu
          defaultOpenKeys={categories.map((el) => el.id.toString())}
          mode="inline"
          selectedKeys={activeTest ? [activeTest.id.toString()] : []}
          style={{ height: '100%' }}
        >
          {TestCategory.sort(categories).map((category) => {
            return (
              <Menu.SubMenu
                key={category.id}
                title={
                  <span>
                    {category.name}{' '}
                    <EditCategoryModal
                      testCategory={category}
                      updateCategory={updateCategory}
                      deleteCategory={deleteCategory}
                      externalOnly={externalOnly}
                    />{' '}
                  </span>
                }
              >
                {category.id in casesByCategory
                  ? TestCase.sort(casesByCategory[category.id]).map((el) => (
                      <Menu.Item
                        key={el.id}
                        style={{ height: 'fit-content', minHeight: 40 }}
                        onClick={() => {
                          setActiveTest(el);
                        }}
                      >
                        {el.description}
                      </Menu.Item>
                    ))
                  : null}
              </Menu.SubMenu>
            );
          })}
        </Menu>
      );

      content = (
        <Content style={{ margin: 15 }}>
          <div>
            {activeTest && (
              <TestItem
                key={activeTest.id}
                currentAssignment={props.currentAssignment}
                testCase={activeTest}
                saveTest={saveTest}
                files={props.solutions}
                env={props.env}
                deleteTest={deleteTest}
                submissions={props.submissions}
                setTestSubject={setTestSubject}
                activeSubmission={activeSubmission}
              />
            )}
          </div>
        </Content>
      );
  }

  const hasTests = Object.values(casesByCategory).some((el) => el.length > 0);

  if (loading) {
    return <Spin />;
  } else if (categories.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Empty
          style={{ marginTop: '20px', maxWidth: '400px' }}
          description={<span>Create a test category to get started.</span>}
        >
          <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} />
        </Empty>
      </div>
    );
  } else {
    return (
      <div>
        <div style={{ fontSize: 11 }} id="Autograder">
          <Layout>
            <Sider theme="light">
              {externalOnly ? null : (
                <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
                  <Button onClick={togglePanel}>
                    {panel === DETAIL_TYPE.ViewSource ? 'Edit tests' : 'View source'}
                  </Button>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ccc',
                  justifyContent: 'space-between',
                  padding: '0 15px',
                  fontSize: '14px',
                  height: '30px',
                }}
              >
                Tests
                <div>
                  <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} icon={true} />
                  &nbsp; &nbsp;
                  <AddTestModal
                    addTest={addTest.bind({}, props.env ? props.env.language : '')}
                    categories={categories}
                  />
                  &nbsp; &nbsp;
                  <Icon type="cloud-download" onClick={download} />
                </div>
              </div>
              {menu}
            </Sider>
            {hasTests ? (
              content
            ) : (
              <Content style={{ margin: 15, display: 'flex', justifyContent: 'center' }}>
                <Empty
                  style={{ marginTop: '20px', maxWidth: '400px' }}
                  description={
                    <span>
                      Now create your first test by clicking the <Icon type="file-add" /> icon on the left.{' '}
                    </span>
                  }
                ></Empty>
              </Content>
            )}
          </Layout>
        </div>
      </div>
    );
  }
};

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Button, Layout, Menu, Icon, Empty, Spin, Tag } from 'antd';
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
import { SourceFileType } from '../../../../../infrastructure/autograder/sourceFile';
import { File } from '../../../../../infrastructure/file';
import { Submission } from '../../../../../infrastructure/submission';
import { BasicTestResultType } from '../../../../../infrastructure/autograder/runTypes';
import { FILE_TYPE } from './TestingSetup';

/* codePost component imports */
import { TestItem } from './TestDefinitions/TestItem';
import { AddCategoryModal } from './TestDefinitions/AddCategoryModal';
import { AddFileModal } from './TestDefinitions/AddFileModal';
import { EditCategoryModal } from './TestDefinitions/EditCategoryModal';
import { AddTestModal } from './TestDefinitions/AddTestModal';
import CPTooltip from '../../../../core/CPTooltip';
import { SourceEditor } from './SourceEditor';
import TestsList from '../../../../code-review/code-panel/TestsList';
import TestsMenu from '../../../../code-review/menu/TestsMenu';

import FileTag from './TestDefinitions/FileTag';

/* codePost utils imports */
import { fetchTestData, TestCasesByCategory } from '../../../../core/testFetchUtils';
import { hasNativeTestSupport } from './utils/languageUtils';

const { Sider, Content } = Layout;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionType[];
  sourceFiles: SourceFileType[];
  updateEnv: (env: EnvironmentType) => void;
  env?: EnvironmentType;
  addFile: (type: FILE_TYPE, name: string, code: string) => Promise<void>;
  updateFile: (type: FILE_TYPE, id: number, newCode: string) => Promise<void>;
  deleteFile: (type: FILE_TYPE, id: number) => Promise<void>;
}

enum DETAIL_TYPE {
  EditTests,
  ViewSource,
}

export interface IBasicFile {
  name: string;
  canSave: boolean;
  code: string;
  id: number;
  type: FILE_TYPE;
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

  const [sourceFiles, setSourceFiles] = useState<SourceFileType[]>([]);

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
    const dummyTestCase = {
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
    };

    const newTestCase = await saveTest(dummyTestCase);
    setCasesByCategory((prevState) => {
      const newCases = { ...prevState };
      const oldTests = (newCases[newTestCase.testCategory] && casesByCategory[newTestCase.testCategory]) || [];
      newCases[newTestCase.testCategory] = [...oldTests, newTestCase];
      return newCases;
    });
    setActiveTest(newTestCase);
  };

  const deleteTest = async (testCase: TestCaseType) => {
    await TestCase.delete(testCase.id);

    // Load new test
    const sorted = TestCase.sort(casesByCategory[testCase.testCategory]);
    const index = sorted.findIndex((el) => el.id === testCase.id);
    if (index === 0) {
      (sorted.length > 1 && setActiveTest(sorted[1])) || setActiveTest(undefined);
    } else {
      setActiveTest(sorted[index - 1]);
    }

    setCasesByCategory((prevState) => {
      const newCases = { ...prevState };
      newCases[testCase.testCategory] = newCases[testCase.testCategory]
        ? newCases[testCase.testCategory].filter((el) => el.id !== testCase.id)
        : [];
      return newCases;
    });
  };

  /******************************* State Change Functions  ****************************/

  const replaceTestCase = (newCase: TestCaseType, oldCase: TestCaseType) => {
    setCasesByCategory((prevState) => {
      const filteredTests = prevState[newCase.testCategory]
        ? prevState[newCase.testCategory].filter((tc) => {
            return tc.id !== oldCase.id;
          })
        : [];
      const newCases = { ...prevState };
      newCases[newCase.testCategory] = [...filteredTests, newCase];
      return newCases;
    });
  };

  const replaceTestCategory = (newCategory: TestCategoryType) => {
    const filteredCategories = categories.filter((cat) => {
      return cat.id !== newCategory.id;
    });
    setCategories([...filteredCategories, newCategory]);
  };

  const togglePanel = () => {
    if (panel === DETAIL_TYPE.EditTests) {
      setCurrentFiles(props.solutions);
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
  let header;
  let headerTitle;

  switch (panel) {
    case DETAIL_TYPE.ViewSource:
      const bashFile = [{ name: 'main.sh', code: main, canSave: false, id: 0 }];

      const helperFiles = props.helpers.map((file) => {
        return {
          id: file.id,
          name: file.name,
          code: file.code,
          canSave: false,
          title: (
            <div>
              {file.name} &nbsp;{' '}
              <CPTooltip title="Helper file">
                <Badge color={'purple'} />
              </CPTooltip>
            </div>
          ),
        };
      });

      const submissionFiles = currentFiles.map((file) => {
        return {
          id: file.id,
          name: file.name,
          code: file.code,
          canSave: false,
          title: (
            <div>
              {file.name} &nbsp;{' '}
              <CPTooltip title="Submission file">
                <Badge color={'orange'} />
              </CPTooltip>
            </div>
          ),
        };
      });

      const templates = tests.map((test) => {
        if (test.id < 0) {
          return {
            id: test.id,
            code: test.code,
            name: `_test${test.id}${test.extension}`,
            canSave: false,
            title: (
              <div>
                {`_test${test.id}${test.extension}`} &nbsp;{' '}
                <CPTooltip title="User-written test">
                  <Badge color={'lime'} />
                </CPTooltip>
              </div>
            ),
          };
        }
        return {
          id: test.id,
          code: test.code,
          name: `_Test${test.id}${test.extension}`,
          canSave: false,
          title: (
            <div>
              {`_Test${test.id}${test.extension}`} &nbsp;{' '}
              <CPTooltip title="codePost generated test">
                <Badge color={'green'} />
              </CPTooltip>
            </div>
          ),
        };
      });

      const groups = [bashFile, helperFiles, submissionFiles, templates];

      const groupElems = groups.map((group: IFileType[], groupIndex) => {
        return group.map((file, fileIndex) => {
          return (
            <Menu.Item key={`${groupIndex}-${fileIndex}`} style={{ height: 'fit-content', minHeight: 40 }}>
              <div>{file.title || file.name}</div>
            </Menu.Item>
          );
        });
      });

      menu = (
        <Collapse expandIconPosition="right" bordered={false}>
          <Collapse.Panel
            header={
              <div style={{ padding: '0px 10px 5px 0px' }}>
                <div className="cp-label cp-label--plus cp-label--bold">Source Files</div>
              </div>
            }
            key="1"
          >
            <Menu onClick={changeIndex} mode="inline" selectedKeys={[index]}>
              {groupElems}
            </Menu>
          </Collapse.Panel>
          <Collapse.Panel
            header={
              <div style={{ padding: '0px 10px 5px 0px' }}>
                <div className="cp-label cp-label--plus cp-label--bold">Source Files</div>
              </div>
            }
            key="2"
          ></Collapse.Panel>
        </Collapse>
      );

      const currentGroupIndex = parseInt(index.split('-')[0], 10);
      const currentFileIndex = parseInt(index.split('-')[1], 10);

      const currentGroup = groups[currentGroupIndex];
      const currentFile = currentGroup[currentFileIndex];

      content = (
        <SourceEditor
          categories={categories}
          casesByCategory={casesByCategory}
          sourceFiles={sourceFiles}
          currentFile={currentFile}
        />
      );

      header = <div />;
      headerTitle = 'Source Files';
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
      header = (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ccc',
            padding: '0 15px',
            fontSize: '14px',
            height: '30px',
          }}
        >
          Tests
          <div>
            <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} icon={true} />
            &nbsp; &nbsp;
            <AddTestModal addTest={addTest.bind({}, props.env ? props.env.language : '')} categories={categories} />
            &nbsp; &nbsp;
          </div>
        </div>
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
                <Button style={{ width: '100%' }} onClick={togglePanel}>
                  {panel === DETAIL_TYPE.ViewSource ? 'Edit tests' : 'View source'}
                </Button>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ccc',
                  padding: '0 15px',
                  fontSize: '14px',
                  height: '30px',
                }}
              >
                {header}
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

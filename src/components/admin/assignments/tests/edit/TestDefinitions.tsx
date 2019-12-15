/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Button, Layout, Menu, Icon, Empty, Spin, Badge } from 'antd';
import { ClickParam } from 'antd/lib/menu';
import _ from 'lodash';

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
import { EditObjectModal } from './TestDefinitions/EditObjectModal';
import { AddTestModal } from './TestDefinitions/AddTestModal';
import CPTooltip from '../../../../core/CPTooltip';
import { SourceEditor } from './SourceEditor';
import TestsList from '../../../../code-review/code-panel/TestsList';

import FileTag from './TestDefinitions/FileTag';

/* codePost utils imports */
import { fetchTestData, TestCasesByCategory } from '../../../../core/testFetchUtils';
import { hasNativeTestSupport } from './utils/languageUtils';

import {
  IFolder,
  IDirectoryStructure,
  buildFolderMenu,
  createDirectoryStructure,
} from '../../../../code-review/menu/fileMenuUtils';

import { RESULT_TYPE } from './TestDefinitions/PsuedoTerminal';

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
  canSave?: boolean;
  code: string;
  id: number;
  type: FILE_TYPE;
  path: string | null;
}

export const TestDefinitions = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [casesByCategory, setCasesByCategory] = useState<TestCasesByCategory>({});
  const [categories, setCategories] = useState<TestCategoryType[]>([]);

  // Edit Tests variables
  const [activeTest, setActiveTest] = useState<TestCaseType | undefined>(undefined);

  // Source Editor / Eject mode variables
  const [tests, setTests] = useState<TestTemplateType[]>([]);
  const [main, setMain] = useState('');
  const [index, setIndex] = useState('0-0'); // file index <group>_<file index>
  const [testResults, setTestResults] = useState<BasicTestResultType[]>([]);

  // render variables
  const [panel, setPanel] = useState<DETAIL_TYPE>(DETAIL_TYPE.EditTests);
  const [loading, setLoading] = useState(true);

  // Submission / Solution code toggle variables
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
      if (categories.length === 0 && props.sourceFiles.length > 0) {
        setPanel(DETAIL_TYPE.ViewSource);
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
    setCurrentFiles(props.solutions);
  }, [activeTest && activeTest.id]);

  useEffect(() => {
    setActiveSubmission(undefined);
    setCurrentFiles(props.solutions);
  }, [props.solutions]);

  /******************************* TestCategory functions  ****************************/

  const addCategory = async (name: string) => {
    const payload = {
      id: -1,
      name: name,
      assignment: props.currentAssignment.id,
    };
    const newCategory = await TestCategory.create(payload);

    setCategories((prevState) => {
      return [...prevState, newCategory];
    });
    setCasesByCategory((prevState) => {
      const newCases = { ...prevState };
      newCases[newCategory.id] = [];
      return newCases;
    });

    return newCategory;
  };

  const updateCategory = async (testCategory: TestCategoryType) => {
    const newCategory = await TestCategory.update(testCategory);
    replaceTestCategory(newCategory);
  };

  // FixME: come up with a generic field saving function
  const updateCategoryName = async (id: number, name: string) => {
    const payload = {
      id: id,
      name: name,
    };
    const newCategory = await TestCategory.update(payload);
    replaceTestCategory(newCategory);
  };

  const deleteCategory = async (id: number) => {
    await TestCategory.delete(id);
    setCategories((prevState) => {
      return prevState.filter((el) => el.id !== id);
    });
    setCasesByCategory((prevState) => {
      return _.omit(prevState, id);
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

    replaceTestCase(newTest, testcase.id);
    setActiveTest(newTest);
    return newTest;
  };

  const updateTestStatus = async (testCaseID: number, result: number) => {
    const newTest = await TestCase.update({ id: testCaseID, lastSolutionRun: result });
    replaceTestCase(newTest, testCaseID);
    setActiveTest(newTest);
  };

  const addTest = async (language: string | null, category: number, sourceFile?: boolean, name?: string) => {
    const externalOnly = !props.env || !props.env.language;
    // If a language doesn't have native support, default to a bash unit test

    const hasNativeSupport = !externalOnly && language && hasNativeTestSupport(language);
    const dummyTestCase: TestCaseType = {
      id: -1,
      sortKey: 0,
      testCategory: category,
      description: name ? name : 'New Test',
      // if the test is connected to a sourcefile, set bash-group
      // if the language is natively supported, set it as 'io'
      // else, set the default to bash-unit
      type: sourceFile ? 'file' : hasNativeSupport ? 'io' : externalOnly ? 'external' : 'shell',
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
      lastSolutionRun: RESULT_TYPE.NONE,
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

  const replaceTestCase = (newCase: TestCaseType, oldID: number) => {
    setCasesByCategory((prevState) => {
      const filteredTests = prevState[newCase.testCategory]
        ? prevState[newCase.testCategory].filter((tc) => {
            return tc.id !== oldID;
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
    setCategories((prevState) => {
      const filteredCategories = prevState.filter((cat) => {
        return cat.id !== newCategory.id;
      });
      return [...filteredCategories, newCategory];
    });
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
    if (panel !== DETAIL_TYPE.ViewSource) {
      setPanel(DETAIL_TYPE.ViewSource);
    }
    setIndex(e.key);
  };

  // Fixme: wire this up to selector in TestItem
  const setTestSubject = async (id: string) => {
    const idNum = parseInt(id, 10);
    const match = props.submissions.find((el) => el.id === idNum);
    if (match) {
      // Get the latest submission files
      const submission = await Submission.read(match.id);
      const files = submission.files.map((fileID) => File.read(fileID));
      Promise.all(files).then((fileList) => setCurrentFiles(fileList));
      setActiveSubmission(match);
      setIndex('0-0');
    } else {
      setActiveSubmission(undefined);
      setCurrentFiles(props.solutions);
    }
  };

  const setResults = (results: BasicTestResultType[]) => {
    setTestResults(results);
  };

  /******************************* Misc ****************************/

  const download = () => {
    const zip = new JSZip();
    zip.file('main.sh', main);
    tests.map((test) => {
      zip.file(`${test.name}`, test.code);
    });
    currentFiles.map((file) => {
      zip.file(file.name, file.code);
    });
    props.helpers.map((file) => {
      zip.file(file.name, file.code);
    });

    zip.generateAsync({ type: 'blob' }).then(function(content: any) {
      saveAs(content, `test-directory.zip`);
    });
  };

  const buildStatusBadge = (status?: number) => {
    let statusText;
    let statusColor;
    switch (status) {
      case 0:
        statusText = 'Solution code passed';
        statusColor = 'lime';
        break;
      case 1:
        statusText = 'Solution code failed';
        statusColor = 'red';
        break;
      case 2:
        statusText = 'Error occurred while testing solution code';
        statusColor = 'blue';
        break;
      case 3:
      default:
        statusText = 'Not tested on solution code';
        statusColor = 'gray';
    }

    return (
      <CPTooltip title={statusText}>
        <Badge color={statusColor} />
      </CPTooltip>
    );
  };

  /******************************* Return  ****************************/

  const externalOnly = !props.env || !props.env.language;
  let menu;
  let content;
  let header;

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#ccc',
    padding: '0 15px',
    fontSize: '14px',
    height: '30px',
  };

  switch (panel) {
    case DETAIL_TYPE.ViewSource:
      const bashFile: IBasicFile[] = [
        { name: 'main.sh', code: main, canSave: false, id: 0, type: FILE_TYPE.MAIN, path: null },
      ];

      const helperFiles: IBasicFile[] = props.helpers.map((file) => {
        return {
          id: file.id,
          name: file.name,
          code: file.code,
          canSave: true,
          type: FILE_TYPE.HELPER,
          path: file.path,
        };
      });

      const submissionFiles: IBasicFile[] = currentFiles.map((file) => {
        return {
          id: file.id,
          name: file.name,
          code: file.code,
          canSave: !activeSubmission,
          type: activeSubmission ? FILE_TYPE.SUBMISSION : FILE_TYPE.SOLUTION,
          path: file.path,
        };
      });

      // filter out test templates for sourcefiles. We want to most up to date source files because
      // we're editing them and the eject mode templates can be stale
      const templates: IBasicFile[] = tests
        .filter((tc) => tc.errorIfMissing)
        .map((template) => {
          return {
            id: template.id,
            code: template.code,
            name: template.name,
            canSave: false,
            type: FILE_TYPE.CODEPOST_TEST_FILE,
            path: null,
          };
        });

      const sourceFiles: IBasicFile[] = props.sourceFiles.map((sourceFile) => {
        return {
          id: sourceFile.id,
          code: sourceFile.code,
          name: sourceFile.name,
          canSave: true,
          type: FILE_TYPE.SOURCEFILE,
          path: null,
        };
      });

      const groups = [bashFile, helperFiles, submissionFiles, templates, sourceFiles];

      header = (
        <div style={headerStyle}>
          Source Files
          <div>
            <AddFileModal addFile={props.addFile} icon={true} />
            &nbsp; &nbsp;
            <Icon type="download" onClick={download} />
          </div>
        </div>
      );

      const buildFileMenu = (groupIndex: number, files: IBasicFile[]) => {
        return files.map((f) => {
          return (
            <Menu.Item key={`${groupIndex}-${f.id}`} style={{ height: 'fit-content', minHeight: 40 }}>
              <FileTag type={f.type} small={true} />
              &nbsp;
              {f.name}
              {f.type === FILE_TYPE.SOURCEFILE && (
                <EditObjectModal item={f} deleteItem={props.deleteFile.bind({}, FILE_TYPE.SOURCEFILE)} />
              )}
            </Menu.Item>
          );
        });
      };

      menu = (
        <div>
          <Menu onClick={changeIndex} mode="inline" selectedKeys={[index]}>
            {groups.map((group: IBasicFile[], groupIndex) => {
              const directoryStructure = createDirectoryStructure<IBasicFile>(group);
              const buildFile = buildFileMenu.bind({}, groupIndex);
              const folders = directoryStructure.folders.map((f: IFolder<IBasicFile>) => {
                return buildFolderMenu('', f, buildFile);
              });
              return [buildFileMenu(groupIndex, directoryStructure.files), folders];
            })}
          </Menu>
          <div>
            <div style={{ ...headerStyle, marginTop: 10 }}>Tests</div>
            <Menu
              selectedKeys={[]}
              defaultOpenKeys={categories.map((el) => el.id.toString())}
              mode="inline"
              style={{ height: '100%' }}
            >
              {TestCategory.sort(categories).map((category) => {
                return (
                  <Menu.SubMenu key={category.id} title={category.name}>
                    {category.id in casesByCategory
                      ? TestCase.sort(casesByCategory[category.id]).map((el) => {
                          return (
                            <Menu.Item key={el.id} style={{ height: 'fit-content', minHeight: 40 }}>
                              {el.description} &nbsp; {buildStatusBadge(el.lastSolutionRun)}
                            </Menu.Item>
                          );
                        })
                      : null}
                  </Menu.SubMenu>
                );
              })}
            </Menu>
          </div>
        </div>
      );

      const currentGroupIndex = parseInt(index.split('-')[0], 10);
      const currentFileIndex = parseInt(index.split('-')[1], 10);

      const currentGroup = groups[currentGroupIndex];
      const currentFile = currentGroup.find((f) => {
        return f.id === currentFileIndex;
      });
      content = (
        <SourceEditor
          categories={categories}
          casesByCategory={casesByCategory}
          sourceFiles={props.sourceFiles}
          currentFile={currentFile}
          setResults={setResults}
          setTestSubject={setTestSubject}
          submissions={props.submissions}
          updateFile={props.updateFile}
          addCategory={addCategory}
          deleteCategory={deleteCategory}
          addTest={addTest}
          deleteTest={deleteTest}
          activeSubmission={activeSubmission}
          updateEnv={props.updateEnv}
          env={props.env}
          saveTest={saveTest}
          updateTestStatus={updateTestStatus}
        />
      );

      break;
    case DETAIL_TYPE.EditTests:
      header = (
        <div style={headerStyle}>
          Tests
          <div>
            <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} icon={true} />
            &nbsp; &nbsp;
            <AddTestModal addTest={addTest.bind({}, props.env ? props.env.language : '')} categories={categories} />
            &nbsp; &nbsp;
          </div>
        </div>
      );
      menu = (
        <div>
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
                      <EditObjectModal item={category} updateItem={updateCategoryName} deleteItem={deleteCategory} />
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
                          {el.description} &nbsp; {buildStatusBadge(el.lastSolutionRun)}
                        </Menu.Item>
                      ))
                    : null}
                </Menu.SubMenu>
              );
            })}
          </Menu>
        </div>
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
                updateTestStatus={updateTestStatus}
              />
            )}
          </div>
        </Content>
      );
  }

  const hasTests = Object.values(casesByCategory).some((el) => el.length > 0);

  if (loading) {
    return (
      <div className="display-flex justify-content-center align-iterms-center">
        <Spin style={{ marginTop: 15 }} />
      </div>
    );
  } else if (categories.length === 0 && panel == DETAIL_TYPE.EditTests) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span>
          <b>Instructions</b>: If you have an existing script with modular unit tests, or want to start fresh, click
          "Add Category". Otherwise, click "Enter File Mode".
        </span>
        <Empty style={{ marginTop: '20px', maxWidth: '400px' }} description={<span> Get started.</span>}>
          <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} />
          {externalOnly ? (
            <span />
          ) : (
            <span>
              {' '}
              &nbsp; <Button onClick={() => setPanel(DETAIL_TYPE.ViewSource)}>Enter File Mode</Button>{' '}
            </span>
          )}
        </Empty>
      </div>
    );
  } else {
    return (
      <div>
        <div style={{ marginBottom: 15, marginLeft: 10, marginRight: 10 }}>
          {panel === DETAIL_TYPE.EditTests ? (
            <span>
              <b>Instructions</b>: This editor shows all the tests you've created. You can create tests in two ways: in{' '}
              <b style={{ fontWeight: 600 }}>this editor </b>(For test cases that have modular blocks of code) or in{' '}
              <b style={{ fontWeight: 600 }}>File Mode </b>(if you want to run a script that includes multiple tests).
            </span>
          ) : (
            <span>
              <b>Instructions</b>: In "File Mode" you can run your existing scripts to output logs, or use our custom
              syntax to structure your test results. If you use our syntax, new tests will automatically be created when
              you run the file, which you can edit attributes of (points, explanations) by exiting File Mode. To learn
              more,{' '}
              <a href="https://help.codepost.io/en/articles/3553024-writing-tests-file-mode" target="_blank">
                click here
              </a>
              .
            </span>
          )}
        </div>
        <div style={{ fontSize: 11 }}>
          <Layout>
            <Sider theme="light">
              {externalOnly ? null : (
                <Button style={{ width: '100%' }} onClick={togglePanel}>
                  {panel === DETAIL_TYPE.ViewSource ? 'Exit File Mode' : 'Enter File Mode'}
                </Button>
              )}
              {header}
              {menu}
            </Sider>
            {hasTests || panel === DETAIL_TYPE.ViewSource ? (
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

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect, useState } from 'react';

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DownloadOutlined,
  FileAddOutlined,
  FileOutlined,
  FolderOutlined,
  MoreOutlined,
} from '@ant-design/icons';

/* antd imports */
import {
  Alert,
  Badge,
  Button,
  Collapse,
  CollapseProps,
  Dropdown,
  Empty,
  Layout,
  Menu,
  message,
  Modal,
  Popconfirm,
  Skeleton,
  Tooltip,
  Typography,
} from 'antd';
import { ClickParam } from 'antd/lib/menu';
import _ from 'lodash';

/* other library imports */
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/* codePost object imports */
import {
  Environment,
  EnvironmentType,
  TestsSourceType,
  TestTemplateType,
} from '../../../../../infrastructure/autograder/environment';
import { HelperFileType } from '../../../../../infrastructure/autograder/helperFile';
import { TestEditorResultType } from '../../../../../infrastructure/autograder/runTypes';
import { SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { SourceFileType } from '../../../../../infrastructure/autograder/sourceFile';
import { File } from '../../../../../infrastructure/file';
import { Submission } from '../../../../../infrastructure/submission';
import { TestCase } from '../../../../../infrastructure/testCase';
import { TestCategory } from '../../../../../infrastructure/testCategory';
import {
  AssignmentType,
  FileType,
  SubmissionInfoType,
  TestCaseType,
  TestCategoryType,
} from '../../../../../infrastructure/types';
import { FILE_TYPE } from './TestingSetup';

/* codePost component imports */
import CPTooltip from '../../../../core/CPTooltip';
import { SourceEditor } from './SourceEditor';
import { AddCategoryModal } from './TestDefinitions/AddCategoryModal';
import { AddFileModal } from './TestDefinitions/AddFileModal';
import { CategorySelectModal } from './TestDefinitions/CategorySelectModal';
import { EditObjectModal } from './TestDefinitions/EditObjectModal';
import { TestItem } from './TestDefinitions/TestItem';

import FileTag from './TestDefinitions/FileTag';

/* codePost utils imports */
import { fetchTestData, TestCasesByCategory } from '../../../../core/testFetchUtils';
import { hasNativeTestSupport } from './utils/languageUtils';

import { LOCAL_SETTINGS } from '../../../../utils/LocalSettings';

import { buildFolderMenu, createDirectoryStructure, IFolder } from '../../../../code-review/menu/fileMenuUtils';

import { RESULT_TYPE } from './TestDefinitions/PseudoTerminal';

const { Sider, Content } = Layout;
const { Paragraph } = Typography;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionInfoType[];
  sourceFiles: SourceFileType[];
  updateEnv: (env: EnvironmentType) => void;
  env?: EnvironmentType;
  addFile: (type: FILE_TYPE, name: string, code: string) => Promise<void>;
  updateFile: (type: FILE_TYPE, id: number, newCode: string) => Promise<void>;
  deleteFile: (type: FILE_TYPE, id: number) => Promise<void>;
  loading: boolean;
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
  const [newTestCounter, setNewTestCounter] = useState(-1);
  // Hack to keep the same component mounted when a new test is saved and the id changes
  const [activeID, setActiveID] = useState<number | undefined>(undefined);

  // Source Editor / Eject mode variables
  const [tests, setTests] = useState<TestTemplateType[]>([]);
  const [main, setMain] = useState('');
  const [index, setIndex] = useState('0-0'); // file index <group>_<file index>

  // render variables
  const [panel, setPanel] = useState<DETAIL_TYPE>(DETAIL_TYPE.EditTests);
  const [loading, setLoading] = useState(true);

  // Submission / Solution code toggle variables
  const [activeSubmission, setActiveSubmission] = useState<SubmissionInfoType | undefined>(undefined);
  const [currentFiles, setCurrentFiles] = useState<(SolutionFileType | FileType)[]>(props.solutions);

  /******************************* Fetch Data ****************************/
  useEffect(() => {
    const fetchData = async () => {
      const [_categories, _casesByCategory]: any = await fetchTestData(props.currentAssignment);
      setCategories(_categories);
      setCasesByCategory(_casesByCategory);
      if (activeTest === undefined) {
        if (_categories.length > 0 && activeTest === undefined)
          updateActiveTest(_casesByCategory[_categories[0].id][0]);
      }
      if (_categories.length === 0 && props.sourceFiles.length > 0) {
        setPanel(DETAIL_TYPE.ViewSource);
      }
      setLoading(false);
    };

    fetchData();
  }, [props.currentAssignment]);

  useEffect(() => {
    if (props.env !== undefined) {
      updateSourceFiles();

      if (categories.length === 0 && props.sourceFiles.length > 0) {
        setPanel(DETAIL_TYPE.ViewSource);
      }
    }
  }, [props.env, props.sourceFiles.length]);

  // If solution files get updated (for example in file mode, update the current files)
  useEffect(() => {
    setActiveSubmission(undefined);
    setCurrentFiles(props.solutions);
  }, [props.solutions]);

  /******************************* Source file functions  ****************************/

  const updateSourceFiles = async () => {
    const source: TestsSourceType = await Environment.eject(props.env!.id);
    setMain(source.main);
    setTests(source.templates);
  };
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
    // We don't change the active test id because if a test id is changing, we don't
    // want the component to remount (causes choppy run behavior)
    updateActiveTest(newTest, true);
    return newTest;
  };

  const updateTestStatus = async (testCaseID: number, result: number) => {
    const newTest = await TestCase.update({ id: testCaseID, lastSolutionRun: result });
    replaceTestCase(newTest, testCaseID);
    updateActiveTest(newTest, true);
  };

  const duplicateTest = async (testToCopy: TestCaseType, category: number) => {
    const newTestCase = {
      ...testToCopy,
      testCategory: category,
      id: newTestCounter,
      description: `${testToCopy.description} (2)`,
    };
    setNewTestCounter((prevState) => prevState - 1);

    setCasesByCategory((prevState) => {
      const newCases = { ...prevState };
      const oldTests = (newCases[newTestCase.testCategory] && casesByCategory[newTestCase.testCategory]) || [];
      newCases[newTestCase.testCategory] = [...oldTests, newTestCase];
      return newCases;
    });
    updateActiveTest(newTestCase);

    // Save the test. Although a broken I/O test that is duplicated will cause issues, it's more unnatural for users to not realize their duplicated test isn't saved
    saveTest(newTestCase);

    message.success('Test copied!');
  };

  const addTest = async (language: string | null, category: number, sourceFile?: boolean, name?: string) => {
    const externalOnly = !props.env || !props.env.language;
    // If a language doesn't have native support, default to a bash unit test

    const hasNativeSupport = !externalOnly && language && hasNativeTestSupport(language);
    // if the test is connected to a sourcefile, set bash-group
    // if the language is natively supported, set it as 'io'
    // else, set the default to shell
    // if it's a shell type,
    const defaultType = sourceFile ? 'file' : hasNativeSupport ? 'io' : externalOnly ? 'external' : 'io_cli';
    const dummyTestCase: TestCaseType = {
      id: newTestCounter,
      sortKey: 0,
      testCategory: category,
      description: name ? name : 'New Test',
      type: defaultType,
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
      outputIsFile: false,
      outputIsRegexp: false,
      isFlexible: false,
    };
    setNewTestCounter((prevState) => prevState - 1);

    setCasesByCategory((prevState) => {
      const newCases = { ...prevState };
      const oldTests = (newCases[dummyTestCase.testCategory] && casesByCategory[dummyTestCase.testCategory]) || [];
      newCases[dummyTestCase.testCategory] = [...oldTests, dummyTestCase];
      return newCases;
    });
    updateActiveTest(dummyTestCase);

    // If the test is file defined, save the test
    if (sourceFile) saveTest(dummyTestCase);
  };

  const deleteTest = async (testCase: TestCaseType) => {
    if (testCase.id > 0) {
      await TestCase.delete(testCase.id);
    }

    // Load new test
    const sorted = TestCase.sort(casesByCategory[testCase.testCategory]);
    const index = sorted.findIndex((el) => el.id === testCase.id);
    if (index === 0) {
      (sorted.length > 1 && updateActiveTest(sorted[1])) || updateActiveTest(undefined);
    } else {
      updateActiveTest(sorted[index - 1]);
    }

    setCasesByCategory((prevState) => {
      const newCases = { ...prevState };
      newCases[testCase.testCategory] = newCases[testCase.testCategory]
        ? newCases[testCase.testCategory].filter((el) => el.id !== testCase.id)
        : [];
      return newCases;
    });
  };

  const handleDelete = (testCase: TestCaseType) => {
    Modal.confirm({
      title: (
        <span>
          Are you sure you want to delete <b>{testCase.description}</b>?
        </span>
      ),
      content: 'This decision cannot be reversed.',
      onOk() {
        return new Promise((resolve, reject) => {
          return resolve(deleteTest(testCase));
        }).catch(() => console.log('Oops errors!'));
      },
    });
  };

  /******************************* State Change Functions  ****************************/

  const updateActiveTest = (newActive: TestCaseType | undefined, dontUpdateID?: boolean) => {
    setActiveTest(newActive);
    if (!dontUpdateID && newActive) setActiveID(newActive.id);
  };

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
    setCategories((prevState) => {
      const filteredCategories = prevState.filter((cat) => {
        return cat.id !== newCategory.id;
      });
      return [...filteredCategories, newCategory];
    });
  };

  const togglePanel = () => {
    if (panel === DETAIL_TYPE.EditTests) {
      updateSourceFiles().then(() => {
        setCurrentFiles(props.solutions);
        setPanel(DETAIL_TYPE.ViewSource);
      });
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

  const parseFileModeResults = async (response: TestEditorResultType) => {
    // In case new tests were created (if file mode, test parsing turned off),
    //    fetch the newest tests before setting resylts
    const [_categories, _casesByCategory]: any = await fetchTestData(props.currentAssignment);
    setCategories(_categories);
    setCasesByCategory(_casesByCategory);

    if (props.env && props.env.dumpMode && activeSubmission) {
      // Refresh submission files after dump, in case a _tests.txt file was created
      setTestSubject(activeSubmission.id.toString());
    }

    //
    const formatted = {
      log: <span style={{ color: '#678CAB' }}>{response.logs}</span>,
      target: activeSubmission ? activeSubmission.students[0] : 'solution code',
      result: RESULT_TYPE.NONE,
      testCaseName: '',
    };

    const logs = response.results.map((el) => {
      const testCase = _casesByCategory[el.testCategory].find((tc: TestCaseType) => tc.id === el.testCase)!;
      const status = el.isError ? RESULT_TYPE.ERROR : el.passed ? RESULT_TYPE.PASSED : RESULT_TYPE.FAILED;

      if (testCase) {
        if (!activeSubmission) {
          updateTestStatus(testCase.id, status);
        }
      }

      return {
        log: el.logs,
        target: activeSubmission ? activeSubmission.students[0] : 'solution code',
        result: status,
        testCaseName: testCase ? testCase.description : '',
      };
    });

    return [formatted, ...logs];
  };

  /******************************* Misc ****************************/

  const download = () => {
    const zip = new JSZip();
    zip.file('main.sh', main);
    tests.map((test) => {
      zip.file(`${test.name}`, test.code);
      return null;
    });
    currentFiles.map((file) => {
      zip.file(file.name, file.code);
      return null;
    });
    props.helpers.map((file) => {
      zip.file(file.name, file.code);
      return null;
    });

    zip.generateAsync({ type: 'blob' }).then(function (content: any) {
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

  // This is the info modal that pops up if a user clicks on a test in filemoda
  const editTestInfo = () => {
    Modal.info({
      title: 'Edit Tests',
      content: (
        <div>
          <p>To edit this test, click "Exit file mode."</p>
        </div>
      ),
    });
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
    background: 'rgb(217,217,217)',
    padding: '6px 15px',
    fontSize: '14px',
    fontWeight: 600,
  };

  switch (panel) {
    case DETAIL_TYPE.ViewSource: {
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
        <div>
          <Button.Group style={{ display: 'flex', alignItems: 'flex-end' }}>
            {externalOnly ? null : (
              <Tooltip title="Exit file mode">
                <Button onClick={togglePanel} style={{ padding: '0px 7px', height: 28, borderBottomLeftRadius: '0px' }}>
                  <ArrowLeftOutlined style={{ fontSize: 10, marginRight: 3 }} />
                  <FileOutlined style={{ fontSize: 12, marginLeft: 0 }} />
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Download files">
              <Button onClick={download} icon={<DownloadOutlined />} style={{ minWidth: 40, height: 28 }} />
            </Tooltip>
            <AddFileModal addFile={props.addFile} />
          </Button.Group>
          <div style={headerStyle}>Files</div>
        </div>
      );

      const buildFileMenu = (groupIndex: number, files: IBasicFile[]) => {
        return files.map((f) => {
          const deleteThisFile = () => {
            props.deleteFile(FILE_TYPE.SOURCEFILE, f.id);
          };
          const actions = (
            <Menu>
              <Menu.Item style={{ paddingRight: '48px', color: '#f5222d' }}>
                <Popconfirm
                  title="Are you sure delete this file?"
                  onConfirm={deleteThisFile}
                  onCancel={() => {}}
                  okText="Yes"
                  cancelText="No"
                >
                  <span>Delete File</span>
                </Popconfirm>
              </Menu.Item>
            </Menu>
          );

          const stop = (e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            e.stopPropagation();
          };

          return (
            <Menu.Item key={`${groupIndex}-${f.id}`}>
              <FileTag type={f.type} small={true} />
              &nbsp;
              {f.name}
              {f.type === FILE_TYPE.SOURCEFILE && (
                <Dropdown overlay={actions}>
                  <MoreOutlined
                    onClick={stop}
                    style={{ position: 'absolute', right: '0px', top: '8px', fontWeight: 900 }}
                  />
                </Dropdown>
              )}
            </Menu.Item>
          );
        });
      };

      menu = (
        <div>
          <div className="tests-menu tests-menu__files">
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
          </div>
          <div className="tests-menu">
            <div style={{ ...headerStyle, marginTop: 10 }}>Test Categories</div>
            <Menu
              selectedKeys={[]}
              defaultOpenKeys={categories.map((el) => el.id.toString())}
              mode="inline"
              style={{ height: '100%' }}
              onClick={editTestInfo}
            >
              {TestCategory.sort(categories).map((category) => {
                return (
                  <Menu.SubMenu
                    key={category.id}
                    title={
                      <span>
                        <FolderOutlined />
                        {category.name}{' '}
                      </span>
                    }
                  >
                    {category.id in casesByCategory ? (
                      casesByCategory[category.id].length === 0 ? (
                        <Menu.Item key={category.id * -1}>
                          <span style={{ color: '#888888' }}>No tests yet...</span>
                        </Menu.Item>
                      ) : (
                        TestCase.sort(casesByCategory[category.id]).map((el) => {
                          return (
                            <Menu.Item key={el.id}>
                              {el.description} &nbsp; {buildStatusBadge(el.lastSolutionRun)}
                            </Menu.Item>
                          );
                        })
                      )
                    ) : null}
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
          parseResults={parseFileModeResults}
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
    }
    case DETAIL_TYPE.EditTests: {
      const addTestButton = (
        <Button
          style={{
            height: 28,
            fontSize: 12,
            padding: '0px 9px',
            borderColor: 'rgb(217,217,217)',
            borderTopRightRadius: '0px',
            borderBottomRightRadius: '0px',
            boxShadow: 'none',
            textShadow: 'none',
          }}
          type="primary"
        >
          Add Test
        </Button>
      );
      header = (
        <div>
          <Button.Group style={{ display: 'flex', alignItems: 'flex-end' }}>
            {externalOnly ? null : (
              <Tooltip title="Enter file mode">
                <Button onClick={togglePanel} style={{ padding: '0px 7px', height: 28, borderBottomLeftRadius: '0px' }}>
                  <ArrowRightOutlined style={{ fontSize: 10, marginRight: 3 }} />
                  <FileOutlined style={{ fontSize: 12, marginLeft: 0 }} />
                </Button>
              </Tooltip>
            )}
            <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} icon={true} />
            <CategorySelectModal
              onSelect={addTest.bind({}, props.env ? props.env.language : '')}
              title="Create a new test case"
              categories={categories}
              childToRender={addTestButton}
            />
          </Button.Group>
          <div style={headerStyle}>Test Categories</div>
        </div>
      );

      // <EditObjectModal item={category} updateItem={updateCategoryName} deleteItem={deleteCategory} />
      menu = (
        <div className="tests-menu">
          <Menu
            defaultOpenKeys={categories.map((el) => el.id.toString())}
            mode="inline"
            selectedKeys={activeTest ? [activeTest.id.toString()] : []}
            style={{ height: '100%' }}
          >
            {TestCategory.sort(categories).map((category) => {
              const deleteThisCategory = (e: any) => {
                deleteCategory(category.id);
              };

              const addTestToThisCategory = (e: any) => {
                e.preventDefault();
                e.stopPropagation();
                addTest(props.env ? props.env.language : '', category.id);
              };

              const stop = (e: any) => {
                e.preventDefault();
                e.stopPropagation();
              };

              const actions = (
                <Menu>
                  <Menu.Item style={{ paddingRight: '48px' }}>
                    <EditObjectModal item={category} updateItem={updateCategoryName} deleteItem={deleteCategory} />
                  </Menu.Item>
                  <Menu.Item style={{ paddingRight: '48px' }}>
                    <span onClick={addTestToThisCategory}>Add Test</span>
                  </Menu.Item>
                  <Menu.Item style={{ paddingRight: '48px', color: '#f5222d' }}>
                    <Popconfirm
                      title="Are you sure delete this category?"
                      onConfirm={deleteThisCategory}
                      onCancel={() => {}}
                      okText="Yes"
                      cancelText="No"
                    >
                      <span>Delete Category</span>
                    </Popconfirm>
                  </Menu.Item>
                </Menu>
              );

              return (
                <Menu.SubMenu
                  key={category.id}
                  title={
                    <span>
                      <FolderOutlined />
                      {category.name}{' '}
                      <Dropdown overlay={actions}>
                        <MoreOutlined
                          onClick={stop}
                          style={{ position: 'absolute', right: '0px', top: '8px', fontWeight: 900 }}
                        />
                      </Dropdown>
                    </span>
                  }
                >
                  {category.id in casesByCategory ? (
                    casesByCategory[category.id].length === 0 ? (
                      <Menu.Item key={category.id * -1}>
                        <span style={{ color: '#888888' }}>No tests yet...</span>
                      </Menu.Item>
                    ) : (
                      TestCase.sort(casesByCategory[category.id]).map((el) => {
                        const testActions = (
                          <Menu>
                            <Menu.Item style={{ paddingRight: '48px' }}>
                              <CategorySelectModal
                                onSelect={duplicateTest.bind({}, el)}
                                title={`Create a copy of: ${el.description}`}
                                categories={categories}
                                childToRender={<span>Duplicate Test</span>}
                                defaultCategory={
                                  activeTest ? categories.find((el) => el.id === activeTest.testCategory) : undefined
                                }
                              />
                            </Menu.Item>
                            <Menu.Item style={{ paddingRight: '48px', color: '#f5222d' }}>
                              <span onClick={handleDelete.bind({}, el)}>Delete Test</span>
                            </Menu.Item>
                          </Menu>
                        );
                        return (
                          <Menu.Item
                            key={el.id}
                            onClick={() => {
                              updateActiveTest(el);
                            }}
                          >
                            {el.description} &nbsp; {buildStatusBadge(el.lastSolutionRun)}{' '}
                            <Dropdown overlay={testActions}>
                              <MoreOutlined
                                onClick={stop}
                                style={{ position: 'absolute', right: '0px', top: '8px', fontWeight: 900 }}
                              />
                            </Dropdown>
                          </Menu.Item>
                        );
                      })
                    )
                  ) : null}
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
                key={activeID}
                currentAssignment={props.currentAssignment}
                testCase={activeTest}
                saveTest={saveTest}
                files={props.solutions}
                env={props.env}
                handleDelete={handleDelete}
                submissions={props.submissions}
                setTestSubject={setTestSubject}
                activeSubmission={activeSubmission}
                updateTestStatus={updateTestStatus}
              />
            )}
          </div>
        </Content>
      );
      break;
    }
  }

  const hasTests = Object.values(casesByCategory).some((el) => el.length > 0);

  if (loading || props.loading) {
    return (
      <div className="display-flex justify-content-center align-items-center">
        <Skeleton active />
      </div>
    );
  } else if (categories.length === 0 && panel === DETAIL_TYPE.EditTests) {
    // No environment has been defined
    if (!props.env) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Empty
            style={{ marginTop: '20px', maxWidth: '400px' }}
            description={
              <span>
                {' '}
                You haven't yet created an environment. Please create one before defining tests. If you are using the
                API, and want to create tests without creating an environment,{' '}
                <AddCategoryModal
                  addCategory={addCategory}
                  externalOnly={externalOnly}
                  textLink={'click here to create a new category'}
                />
                .
              </span>
            }
          />
        </div>
      );
    }

    // An environment HAS been defined
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Empty
          style={{ marginTop: '20px', maxWidth: '400px' }}
          description={
            <span>
              Create a test category to get started, or enter{' '}
              <a
                href="https://help.codepost.io/en/articles/3553024-writing-tests-file-mode"
                target="_blank"
                rel="noopener noreferrer"
              >
                file mode
              </a>
              .
            </span>
          }
        >
          <AddCategoryModal addCategory={addCategory} externalOnly={externalOnly} />
          {externalOnly ? (
            <span />
          ) : (
            <span>
              <span>
                {' '}
                &nbsp; <Button onClick={() => setPanel(DETAIL_TYPE.ViewSource)}>Enter file mode</Button>{' '}
              </span>
              <br />
              <br />
              <span>
                <b>Tip</b>: If you're trying to port an existing test script you've already written, use file mode.
                Otherwise, start by creating a category. For help getting started,
                <a
                  href="https://help.codepost.io/en/articles/3550395-creating-tests-for-the-codepost-autograder"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {' '}
                  click here
                </a>
                .
              </span>
            </span>
          )}
        </Empty>
      </div>
    );
  } else {
    const instructions =
      panel === DETAIL_TYPE.EditTests ? (
        <Paragraph>
          You can create tests in two ways: in <b style={{ fontWeight: 600 }}>this editor </b>
          (for isolated unit tests) or in <b style={{ fontWeight: 600 }}>file mode </b>(for a general script that
          includes multiple tests). <br />
          <br />
          To get started, click the <b style={{ fontWeight: 600 }}>"Add Test"</b> button.
        </Paragraph>
      ) : (
        <Paragraph>
          Import scripts by clicking <b style={{ fontWeight: 600 }}>"Add file"</b>. You can run them to produce logs, or
          use codePost's custom syntax to structure your test results. If you use our syntax, new tests will
          automatically be created when you run the file. You can edit properties of these tests by exiting file mode.{' '}
          <br />
          <br />
          To learn more,{' '}
          <a
            href="https://help.codepost.io/en/articles/3553024-writing-tests-file-mode"
            target="_blank"
            rel="noopener noreferrer"
          >
            click here
          </a>
          .
        </Paragraph>
      );

    const onInstructionsChange = (keys: any) => {
      LOCAL_SETTINGS.autograderInstructionsVisible.setter(keys.length > 0);
    };

    const defaultActiveKey = LOCAL_SETTINGS.autograderInstructionsVisible.getter() ? ['1'] : [];

    const collapseItems: CollapseProps['items'] = [
      {
        key: '1',
        label: 'Instructions',
        style: { backgroundColor: 'white' },
        children: <Alert message={instructions} type="info" />,
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 15, marginLeft: 30, marginRight: 30 }}>
          <Collapse
            bordered={false}
            defaultActiveKey={defaultActiveKey}
            onChange={onInstructionsChange}
            items={collapseItems}
          />
        </div>
        <div style={{ fontSize: 11 }}>
          <Layout style={{ border: '1px solid #ececec', borderRadius: '4px', marginBottom: '120px' }}>
            <Sider theme="light">
              {header}
              {menu}
            </Sider>
            <div style={{ width: '5px', backgroundColor: 'rgb(217, 217, 217)' }} />
            {hasTests || panel === DETAIL_TYPE.ViewSource ? (
              content
            ) : (
              <Content style={{ margin: 15, display: 'flex', justifyContent: 'center' }}>
                <Empty
                  style={{ marginTop: '20px', maxWidth: '400px' }}
                  description={
                    <span>
                      Now create your first test by clicking the <FileAddOutlined /> icon on the left.{' '}
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

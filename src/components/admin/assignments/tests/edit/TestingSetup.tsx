/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Breadcrumb, Button, Checkbox, InputNumber, message, Tabs, Typography } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

/* codePost object imports */
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { HelperFile, HelperFileType } from '../../../../../infrastructure/autograder/helperFile';
import { SolutionFile, SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { SourceFile, SourceFileType } from '../../../../../infrastructure/autograder/sourceFile';
import { SubmissionInfoType } from '../../../../../infrastructure/submission';

/* codePost component imports */
import CPTooltip from '../../../../core/CPTooltip';
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './EnvironmentSpecs';
import { TestDefinitions } from './TestDefinitions';

/* codePost util imports */
import { fetchEnvironment, fetchHelpers, fetchSolutionFiles, fetchSourceFiles } from '../../../../core/testFetchUtils';

const { TabPane } = Tabs;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  submissions: SubmissionInfoType[];
  updateAssignment: (assignmentID: number, field: string, value: number) => void;
  breadcrumbs?: Array<{ title: React.ReactNode }>;
  match: any;
}

export enum FILE_TYPE {
  HELPER,
  SOLUTION,
  SUBMISSION,
  CODEPOST_TEST_FILE,
  SOURCEFILE,
  MAIN,
}

export const TestingSetup = (props: IProps & RouteComponentProps) => {
  // ************************** State Variables ******************************
  let defaultTab;
  if (props.match.params.tabKey !== undefined) {
    defaultTab = props.match.params.tabKey.valueOf();
  } else {
    defaultTab = 'environment';
    props.history.push(`${props.match.url}/environment`);
  }

  const [currTab, setCurrTab] = useState(defaultTab);
  const [env, setEnv] = useState<EnvironmentType | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  const [solutions, setSolutions] = useState<SolutionFileType[]>([]);
  const [helpers, setHelpers] = useState<HelperFileType[]>([]);
  const [sourceFiles, setSourceFiles] = useState<SourceFileType[]>([]);

  /************************** Fetch data ******************************/
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currEnv = await fetchEnvironment(props.currentAssignment);
      setEnv(currEnv);
      if (currEnv) {
        const solutionFiles = await fetchSolutionFiles(currEnv);
        setSolutions(solutionFiles);
        const helpers = await fetchHelpers(currEnv);
        setHelpers(helpers);
        const sourceFiles: SourceFileType[] = await fetchSourceFiles(currEnv);
        setSourceFiles(sourceFiles);
      }
      setLoading(false);
    };
    fetchData();
  }, [props.currentAssignment]);

  /************************** API / State change functions ******************************/

  const addFile = async (type: FILE_TYPE, name: string, code: string, path?: string) => {
    if (!env) {
      return;
    }

    const payload = {
      name: name,
      environment: env.id,
      code: code,
      path: path ? path : null,
      id: -1,
    };

    switch (type) {
      case FILE_TYPE.SOLUTION:
        {
          const newSolution = await SolutionFile.create(payload);
          setSolutions((prevState) => {
            return [...prevState, newSolution];
          });
          // delete old version if it exists
          const existingSolution = solutions.find((f) => {
            return f.name === name && ((!f.path && !path) || f.path === path);
          });
          if (existingSolution) {
            await deleteFile(FILE_TYPE.SOLUTION, existingSolution.id);
          }
        }

        break;
      case FILE_TYPE.HELPER:
        {
          const newHelper = await HelperFile.create(payload);
          setHelpers((prevState) => {
            return [...prevState, newHelper];
          });
          // delete old version if it exists
          const existingHelper = solutions.find((f) => {
            return f.name === name && ((!f.path && !path) || f.path === path);
          });
          if (existingHelper) {
            await deleteFile(FILE_TYPE.HELPER, existingHelper.id);
          }
        }

        break;
      case FILE_TYPE.SOURCEFILE:
        {
          const newSource = await SourceFile.create(payload);
          setSourceFiles((prevState) => {
            return [...prevState, newSource];
          });
          // delete old version if it exists
          const existingSource = solutions.find((f) => {
            return f.name === name && ((!f.path && !path) || f.path === path);
          });
          if (existingSource) {
            await deleteFile(FILE_TYPE.SOURCEFILE, existingSource.id);
          }
        }
        break;
    }
  };

  const deleteFile = async (type: FILE_TYPE, id: number) => {
    switch (type) {
      case FILE_TYPE.SOLUTION:
        await SolutionFile.delete({ id });
        setSolutions((prevState) => {
          return prevState.filter((file) => {
            return file.id !== id;
          });
        });
        break;
      case FILE_TYPE.HELPER:
        await HelperFile.delete({ id });
        setHelpers((prevState) => {
          return prevState.filter((file) => {
            return file.id !== id;
          });
        });
        break;
      case FILE_TYPE.SOURCEFILE:
        await SourceFile.delete({ id });
        setSourceFiles((prevState) => {
          return prevState.filter((file) => {
            return file.id !== id;
          });
        });
        break;
    }
  };

  const updateFile = async (type: FILE_TYPE, id: number, newCode: string) => {
    const payload = {
      id: id,
      code: newCode,
    };
    switch (type) {
      case FILE_TYPE.SOLUTION:
        {
          const newSolution = await SolutionFile.update(payload);

          setSolutions((prevState) => {
            const index = prevState.findIndex((f) => {
              return f.id === id;
            });
            if (index > -1) {
              const newFiles = [...prevState];
              newFiles.splice(index, 1, newSolution);
              return newFiles;
            }
            return prevState;
          });
        }

        break;
      case FILE_TYPE.HELPER:
        {
          const newHelper = await HelperFile.update(payload);
          setHelpers((prevState) => {
            const index = prevState.findIndex((f) => {
              return f.id === id;
            });

            if (index > -1) {
              const newFiles = [...prevState];
              newFiles.splice(index, 1, newHelper);
              return newFiles;
            }
            return prevState;
          });
        }

        break;
      case FILE_TYPE.SOURCEFILE:
        {
          const newSource = await SourceFile.update(payload);
          setSourceFiles((prevState) => {
            const index = prevState.findIndex((f) => {
              return f.id === id;
            });

            if (index > -1) {
              const newFiles = [...prevState];
              newFiles.splice(index, 1, newSource);
              return newFiles;
            }
            return prevState;
          });
        }

        break;
    }
  };

  // ************************** Environment function **************************

  const reloadEnv = async () => {
    if (env) {
      const newEnv = await Environment.read(env.id);

      // HACK: mutate to avoid propagating reference change through children
      setEnv(newEnv);
    }
  };

  const updateEnv = async (language: string, dependencies: string, customDockerfile: string, buildType: string) => {
    let thisEnvironment = env;
    // If environment doesn't exist create it

    if (!thisEnvironment) {
      const payload = {
        id: -1,
        language,
        dockerRunInstructions: dependencies && !customDockerfile ? dependencies.split('\n') : [],
        dockerfile: customDockerfile,
        assignment: props.currentAssignment.id,
        dumpMode: false,
        testParsing: true,
        compileText: '',
        buildType: buildType,
        allowNetworkAccess: false,
        maxStudentTestRuns: null,
        exposeDumpLogs: false,
        maxExposedFailedTests: null,
      };
      thisEnvironment = await Environment.create(payload);
      // Update the assignment environment field
      props.updateAssignment(props.currentAssignment.id, 'environment', thisEnvironment.id);
    } else {
      const payload = {
        id: thisEnvironment.id,
        dockerRunInstructions: dependencies && !customDockerfile ? dependencies.split('\n') : [],
        dockerfile: customDockerfile,
        buildType: buildType,
      };
      thisEnvironment = await Environment.update(payload);
    }
    setEnv({ ...thisEnvironment, language });
    return thisEnvironment;
  };

  const updateCompileText = async (compileText: string) => {
    if (env) {
      const newEnv = await Environment.update({
        id: env.id,
        compileText: compileText,
      });
      setEnv(newEnv);
    }
  };

  const onChange = (val: string) => {
    setCurrTab(val);

    const newUrl = `${props.match.url.split('/').slice(0, -1).join('/')}/${val}`;
    props.history.push(newUrl);
  };

  const updateEnvSetting = async (field: string, value: any) => {
    if (env) {
      const payload = {
        id: env.id,
        [field]: value,
      };
      const newEnv = await Environment.update(payload);
      if (typeof value === 'boolean') {
        // we only show message for boolean settings. Numerical or string fields would be really annoying
        message.success(value ? 'Setting enabled' : 'Setting disabled');
      }
      setEnv(newEnv);
    }
  };

  // ************************** Return ***************************************
  const content = (
    <Tabs defaultActiveKey="environment" activeKey={currTab} onChange={onChange} animated={false}>
      <TabPane tab={'Environment'} key={'environment'}>
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          env={env}
          updateEnv={updateEnv}
          reloadEnv={reloadEnv}
          updateCompileText={updateCompileText}
          addFile={addFile}
          deleteFile={deleteFile}
          updateFile={updateFile}
          solutions={solutions}
          helpers={helpers}
          loading={loading}
        />
      </TabPane>
      <TabPane tab={'Tests'} key={'tests'}>
        <TestDefinitions
          currentAssignment={props.currentAssignment}
          submissions={props.submissions}
          env={env}
          updateEnv={setEnv}
          addFile={addFile}
          deleteFile={deleteFile}
          updateFile={updateFile}
          solutions={solutions}
          helpers={helpers}
          sourceFiles={sourceFiles}
          loading={loading}
        />
      </TabPane>
      <TabPane tab={'Settings'} key={'settings'}>
        <div style={{ padding: '15px 25px' }}>
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography.Title level={4}>Student submit</Typography.Title>
            <div>
              <Checkbox
                style={{ minWidth: '125px', marginLeft: 0, marginBottom: 15 }}
                checked={env && env.maxStudentTestRuns !== null}
                onChange={(e) => {
                  updateEnvSetting('maxStudentTestRuns', e.target.checked ? 10 : null);
                }}
                disabled={!env}
              >
                Limit the number of times exposed tests are run on student submit
              </Checkbox>
              {env && env.maxStudentTestRuns !== null && (
                <span>
                  to &nbsp;{' '}
                  <InputNumber
                    min={1}
                    value={env && env.maxStudentTestRuns}
                    onChange={(value) => {
                      updateEnvSetting('maxStudentTestRuns', value);
                    }}
                  />
                  &nbsp; times{' '}
                </span>
              )}
              <CPTooltip
                infoIcon={true}
                title="Enabling this setting will limit the amount of times students see exposed tests on student submit. After this number has been exceeded, they can still submit, but won't see test results."
              />
            </div>
            <div>
              <Checkbox
                style={{ minWidth: '125px', marginLeft: 0, marginBottom: 15 }}
                checked={env && env.maxExposedFailedTests !== null}
                onChange={(e) => {
                  updateEnvSetting('maxExposedFailedTests', e.target.checked ? 3 : null);
                }}
                disabled={!env}
              >
                Limit the number of failed tests per category that are exposed to students &nbsp;
              </Checkbox>
              {env && env.maxExposedFailedTests !== null && (
                <span>
                  to &nbsp;{' '}
                  <InputNumber
                    min={1}
                    value={env && env.maxExposedFailedTests}
                    onChange={(value) => {
                      updateEnvSetting('maxExposedFailedTests', value);
                    }}
                  />{' '}
                  &nbsp; failed tests per category{' '}
                </span>
              )}
              <CPTooltip
                infoIcon={true}
                title="Enabling this setting will limit the amount of failed tests a student is exposed to when they submit. This is a helpful feature if you'd like your students to slowly work through failed tests, and encourage them to write their own tests."
              />
            </div>
          </div>
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography.Title level={4}>Running tests</Typography.Title>
            <div>
              <Checkbox
                style={{ minWidth: '125px', marginBottom: 15 }}
                checked={env && env.dumpMode}
                onChange={(e) => {
                  updateEnvSetting('dumpMode', e.target.checked);
                }}
                disabled={!env}
              >
                Dump outputs to <Typography.Text code>_tests.txt</Typography.Text>
                &nbsp;
                <CPTooltip
                  infoIcon={true}
                  title="When this setting is enabled, a file called _tests.txt containing the raw output of your tests will be added to every student's submission."
                />
              </Checkbox>
              {env && env.dumpMode && (
                <Checkbox
                  style={{ minWidth: '125px', marginBottom: 15 }}
                  checked={env && env.exposeDumpLogs}
                  onChange={(e) => {
                    updateEnvSetting('exposeDumpLogs', e.target.checked);
                  }}
                  disabled={!env}
                >
                  Expose outputs to students on submit
                </Checkbox>
              )}
            </div>
            <Checkbox
              style={{ minWidth: '125px', marginLeft: 0, marginBottom: 15 }}
              checked={env && env.allowNetworkAccess}
              onChange={(e) => {
                updateEnvSetting('allowNetworkAccess', e.target.checked);
              }}
              disabled={!env}
            >
              Allow network access in containers (Not recommended) &nbsp;
              <CPTooltip
                infoIcon={true}
                title="Enabling this setting will allow student code to have access to the internet. Unless your course requires it (e.g., database connections), it's not recommended to turn this on, as it may allow students to perform unsafe actions (e.g., emailing themselves the test contents)."
              />
            </Checkbox>
          </div>
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography.Title level={4}>Writing tests</Typography.Title>
            <Checkbox
              style={{ minWidth: '125px', marginLeft: 0, marginBottom: 15 }}
              checked={env && env.testParsing}
              onChange={(e) => {
                updateEnvSetting('testParsing', e.target.checked);
              }}
              disabled={!env}
            >
              Parse <Typography.Text code>TestOutput</Typography.Text> calls in source editor &nbsp;
              <CPTooltip
                infoIcon={true}
                title="You should turn this off if you are making bash TestOutput calls in non-bash files (e.g., Makefile, helper python subprocess, etc.)"
              />
            </Checkbox>
          </div>
        </div>
      </TabPane>
    </Tabs>
  );

  const actions = [
    <Button type="primary">
      <Link to={[...props.match.url.split('/').slice(0, props.match.url.split('/').length - 2), 'results'].join('/')}>
        View results
      </Link>
    </Button>,
  ];

  return (
    <div id="Autograder">
      <CPAdminDetail
        breadcrumbs={
          <Breadcrumb
            items={[...(props.breadcrumbs || []), { title: props.currentAssignment.name }, { title: 'Edit' }]}
          />
        }
        goBack={null}
        title={`${props.currentAssignment.name} | Tests Setup`}
        actions={actions}
        content={content}
      />
    </div>
  );
};

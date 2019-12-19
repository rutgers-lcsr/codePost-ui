/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Breadcrumb, Button, Collapse, Tabs, Checkbox, Modal, message, Typography } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SolutionFile, SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../../../../infrastructure/submission';
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { HelperFile, HelperFileType } from '../../../../../infrastructure/autograder/helperFile';
import { SourceFile, SourceFileType } from '../../../../../infrastructure/autograder/sourceFile';

/* codePost component imports */
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './EnvironmentSpecs';
import { TestDefinitions } from './TestDefinitions';
import CPTooltip from '../../../../core/CPTooltip';

/* codePost util imports */
import { fetchSourceFiles, fetchSolutionFiles, fetchEnvironment, fetchHelpers } from '../../../../core/testFetchUtils';

const { TabPane } = Tabs;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  submissions: SubmissionType[];
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  breadcrumbs?: React.ReactElement[];
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
  }, [props.currentAssignment.id]);

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
        break;
      case FILE_TYPE.HELPER:
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
        break;
      case FILE_TYPE.SOURCEFILE:
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
        break;
    }
  };

  const deleteFile = async (type: FILE_TYPE, id: number) => {
    switch (type) {
      case FILE_TYPE.SOLUTION:
        await SolutionFile.delete(id);
        setSolutions((prevState) => {
          return prevState.filter((file) => {
            return file.id !== id;
          });
        });
        break;
      case FILE_TYPE.HELPER:
        await HelperFile.delete(id);
        setHelpers((prevState) => {
          return prevState.filter((file) => {
            return file.id !== id;
          });
        });
        break;
      case FILE_TYPE.SOURCEFILE:
        await SourceFile.delete(id);
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
        break;
      case FILE_TYPE.HELPER:
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
        break;
      case FILE_TYPE.SOURCEFILE:
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
        break;
    }
  };

  // ************************** Environment function **************************

  const buildEnv = async (language: string, dependencies: string[], buildType: string) => {
    let thisEnvironment = env;
    if (!thisEnvironment) {
      const payload = {
        id: -1,
        language,
        dependencies: JSON.stringify(dependencies),
        assignment: props.currentAssignment.id,
        dumpMode: false,
        testParsing: true,
        compileText: '',
        buildType: 'default',
      };
      thisEnvironment = await Environment.create(payload);
    }
    const buildResult = await Environment.build({
      id: thisEnvironment.id,
      dependencies: dependencies,
      language: language,
      buildType: buildType,
    });
    if (buildResult.build.success) {
      setEnv(buildResult.environment);
      message.success('Environment updated');
    } else {
      Modal.error({
        title: 'Build failed',
        width: 700,
        content: (
          <div style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
            The attempt to build an environment with the given specifications was unsuccesful. Please see the logs below
            for more information:
            <br />
            <br />
            <b>Logs:</b> <br />
            <Collapse bordered={false}>
              <Collapse.Panel header="Logs" key="1">
                {buildResult.build.logs.map((l) => (
                  <div>{l}</div>
                ))}
              </Collapse.Panel>
              <Collapse.Panel header="Dockerfile" key="2">
                <div style={{ whiteSpace: 'pre-wrap' }}>{buildResult.dockerfile}</div>
              </Collapse.Panel>
            </Collapse>
          </div>
        ),
      });
    }
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

  const deleteEnv = () => {
    if (env !== undefined) {
      Environment.delete(env.id);
      setEnv(undefined);
      setHelpers([]);
      setSolutions([]);
      setSourceFiles([]);
    }
  };

  const onChange = (val: string) => {
    setCurrTab(val);

    const newUrl = `${props.match.url
      .split('/')
      .slice(0, -1)
      .join('/')}/${val}`;
    props.history.push(newUrl);
  };

  const updateDumpMode = async (e: any) => {
    if (env) {
      const payload = {
        id: env.id,
        dumpMode: e.target.checked,
      };
      const newEnv = await Environment.update(payload);
      message.success(e.target.checked ? 'Setting enabled' : 'Setting disabled');
      setEnv(newEnv);
    }
  };

  const updateTestParsing = async (e: any) => {
    if (env) {
      const payload = {
        id: env.id,
        testParsing: e.target.checked,
      };
      const newEnv = await Environment.update(payload);
      message.success(e.target.checked ? 'Setting enabled' : 'Setting disabled');
      setEnv(newEnv);
    }
  };

  // ************************** Return ***************************************
  const content = (
    <Tabs defaultActiveKey="environment" activeKey={currTab} onChange={onChange} animated={false}>
      <TabPane tab={'Environment'} key={'environment'}>
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          updateAssignment={props.updateAssignment}
          env={env}
          buildEnv={buildEnv}
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Checkbox
            style={{ minWidth: '125px', marginBottom: 15 }}
            defaultChecked={env && env.dumpMode}
            onChange={updateDumpMode}
          >
            Dump outputs to <Typography.Text code>_tests.txt</Typography.Text>
            &nbsp;
            <CPTooltip
              infoIcon={true}
              title="When this setting is enabled, a file called _tests.txt containing the raw output of your tests will be added to every student's submission."
            />
          </Checkbox>
          <Checkbox
            style={{ minWidth: '125px', marginLeft: 0 }}
            defaultChecked={env && env.testParsing}
            onChange={updateTestParsing}
          >
            Parse <Typography.Text code>TestOutput</Typography.Text> calls in source editor &nbsp;
            <CPTooltip
              infoIcon={true}
              title="You should turn this off if you are making bash TestOutput calls in non-bash files (e.g., Makefile, helper python subprocess, etc.)"
            />
          </Checkbox>
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
          <Breadcrumb>
            {props.breadcrumbs}
            <Breadcrumb.Item key="assignment">{props.currentAssignment.name}</Breadcrumb.Item>
            <Breadcrumb.Item key="edit">Edit</Breadcrumb.Item>
          </Breadcrumb>
        }
        goBack={null}
        title={`${props.currentAssignment.name} | Tests Setup`}
        actions={actions}
        content={content}
      />
    </div>
  );
};

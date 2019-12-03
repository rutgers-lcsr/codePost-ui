/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Breadcrumb, Button, Tabs, Checkbox, message, Typography } from 'antd';

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

  const [solutions, setSolutions] = useState<SolutionFileType[]>([]);
  const [helpers, setHelpers] = useState<HelperFileType[]>([]);
  const [sourceFiles, setSourceFiles] = useState<SourceFileType[]>([]);

  /************************** Fetch data ******************************/
  useEffect(() => {
    const fetchData = async () => {
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
        const newSolution = await SolutionFile.create(payload);
        setSolutions((prevState) => {
          return [...prevState, newSolution];
        });
        break;
      case FILE_TYPE.HELPER:
        const newHelper = await HelperFile.create(payload);
        setHelpers((prevState) => {
          return [...prevState, newHelper];
        });
        break;
      case FILE_TYPE.SOURCEFILE:
        const newSource = await SourceFile.create(payload);
        setSourceFiles((prevState) => {
          return [...prevState, newSource];
        });
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

  const createEnv = async (language: string, compileText: string, dependencies: string[]) => {
    const payload = {
      id: -1,
      language,
      dependencies: JSON.stringify(dependencies),
      assignment: props.currentAssignment.id,
      dumpMode: false,
      compileText,
    };
    const newEnv = await Environment.create(payload);
    const buildEnv = await Environment.updateBuild({
      id: newEnv.id,
      dependencies: dependencies,
      language: newEnv.language !== null ? newEnv.language : '',
      simulate: false,
    });
    setEnv(buildEnv);
  };

  const deleteEnv = () => {
    if (env !== undefined) {
      Environment.delete(env.id);
      setEnv(undefined);
      setHelpers([]);
      setSolutions([]);
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

  const updateEnv = async (e: any) => {
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

  // ************************** Return ***************************************
  const content = (
    <Tabs defaultActiveKey="environment" activeKey={currTab} onChange={onChange} animated={false}>
      <TabPane tab={'Environment'} key={'environment'}>
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          updateAssignment={props.updateAssignment}
          env={env}
          createEnv={createEnv}
          updateEnv={setEnv}
          deleteEnv={deleteEnv}
          addFile={addFile}
          deleteFile={deleteFile}
          updateFile={updateFile}
          solutions={solutions}
          helpers={helpers}
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
        />
      </TabPane>
      <TabPane tab={'Settings'} key={'settings'}>
        <Checkbox style={{ minWidth: '125px' }} defaultChecked={env && env.dumpMode} onChange={updateEnv}>
          Dump outputs to <Typography.Text code>_tests.txt</Typography.Text>
          &nbsp;
          <CPTooltip
            infoIcon={true}
            title="When this setting is enabled, a file called _tests.txt containing the raw output of your tests will be added to every student's submission."
          />
        </Checkbox>
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
  );
};

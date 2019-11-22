/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Breadcrumb, Button, Tabs } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SolutionFile, SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../../../../infrastructure/submission';
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { HelperFile, HelperFileType } from '../../../../../infrastructure/autograder/helperFile';

/* codePost component imports */
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './EnvironmentSpecs';
import { TestDefinitions } from './TestDefinitions';

/* codePost util imports */
import { fetchSolutionFiles, fetchEnvironment, fetchHelpers } from '../../../../core/testFetchUtils';

const { TabPane } = Tabs;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  submissions: SubmissionType[];
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  breadcrumbs?: React.ReactElement[];
}

export enum FILE_TYPE {
  HELPER,
  SOLUTION,
}

export const TestingSetup = (props: IProps & RouteComponentProps) => {
  // ************************** State Variables ******************************
  const [currTab, setCurrTab] = useState('1');
  const [solutions, setSolutions] = useState<SolutionFileType[]>([]);
  const [env, setEnv] = useState<EnvironmentType | undefined>(undefined);
  const [helpers, setHelpers] = useState<HelperFileType[]>([]);

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
      }
    };
    fetchData();
  }, [props.currentAssignment]);

  /************************** API / State change functions ******************************/

  const addFile = async (type: FILE_TYPE, name: string, code: string) => {
    if (!env) {
      return;
    }

    const payload = {
      name: name,
      environment: env.id,
      code: code,
      path: null,
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
          const solutionIndex = prevState.findIndex((f) => {
            return f.id === id;
          });
          if (solutionIndex > -1) {
            const newSolutions = [...prevState];
            newSolutions.splice(solutionIndex, 1, newSolution);
            return newSolutions;
          }
          return prevState;
        });
        break;
      case FILE_TYPE.HELPER:
        const newHelper = await HelperFile.update(payload);
        setHelpers((prevState) => {
          const helperIndex = prevState.findIndex((f) => {
            return f.id === id;
          });

          if (helperIndex > -1) {
            const newHelpers = [...prevState];
            newHelpers.splice(helperIndex, 1, newHelper);
            return newHelpers;
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
    }
  };

  // ************************** Return ***************************************
  const content = (
    <Tabs defaultActiveKey="1" activeKey={currTab} onChange={setCurrTab} animated={false}>
      <TabPane tab={'Environment'} key={'1'}>
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          updateAssignment={props.updateAssignment}
          env={env}
          createEnv={createEnv}
          updateEnv={setEnv}
          deleteEnv={deleteEnv}
          helpers={helpers}
          solutions={solutions}
          addFile={addFile}
          deleteFile={deleteFile}
          updateFile={updateFile}
        />
      </TabPane>
      <TabPane tab={'Tests'} key={'4'}>
        <TestDefinitions
          currentAssignment={props.currentAssignment}
          solutions={solutions}
          helpers={helpers}
          submissions={props.submissions}
          env={env}
        />
      </TabPane>
      <TabPane tab={'Settings'} key={'5'}>
        <div>Settings</div>
      </TabPane>
    </Tabs>
  );

  const actions = [
    <Button type="primary">
      <Link to={[...props.match.url.split('/').slice(0, props.match.url.split('/').length - 1), 'results'].join('/')}>
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

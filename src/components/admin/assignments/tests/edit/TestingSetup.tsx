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
import { SourceFile, SourceFileType } from '../../../../../infrastructure/autograder/sourceFile';

/* codePost component imports */
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './EnvironmentSpecs';
import { TestDefinitions } from './TestDefinitions';

/* codePost util imports */
import { fetchSourceFiles, fetchSolutionFiles, fetchEnvironment, fetchHelpers } from '../../../../core/testFetchUtils';

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
  CODEPOST_TEST_FILE,
  SOURCEFILE,
  MAIN,
}

export const TestingSetup = (props: IProps & RouteComponentProps) => {
  // ************************** State Variables ******************************
  const [currTab, setCurrTab] = useState('1');
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
        console.log(newSource);
        setSourceFiles((prevState) => {
          const index = prevState.findIndex((f) => {
            return f.id === id;
          });

          if (index > -1) {
            const newFiles = [...prevState];
            newFiles.splice(index, 1, newSource);
            console.log(newFiles);
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
          addFile={addFile}
          deleteFile={deleteFile}
          updateFile={updateFile}
          solutions={solutions}
          helpers={helpers}
        />
      </TabPane>
      <TabPane tab={'Tests'} key={'4'}>
        <TestDefinitions
          currentAssignment={props.currentAssignment}
          submissions={props.submissions}
          env={env}
          updateEnv={setEnv}
          addFile={addFile}
          updateFile={updateFile}
          solutions={solutions}
          helpers={helpers}
          sourceFiles={sourceFiles}
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

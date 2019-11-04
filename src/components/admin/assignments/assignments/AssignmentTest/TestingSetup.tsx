/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Breadcrumb, Tabs } from 'antd';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SolutionFile, SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../../../../infrastructure/submission';
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { HelperFile, HelperFileType } from '../../../../../infrastructure/autograder/helperFile';

/* codePost component imports */
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './TestingSetup/EnvironmentSpecs';
import { TestDefinitions } from './TestingSetup/TestDefinitions';
import { FileListEditor } from './TestingSetup/FileListEditor';

const { TabPane } = Tabs;

interface IProps {
  currentAssignment: AssignmentType;
  switchDetail: () => void;
  onCancel: () => void;
  submissions: SubmissionType[];
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

const getSolutionFiles = async (env: EnvironmentType) => {
  const solutionFilePromises = env.solutionFiles.map((id) => {
    return SolutionFile.read(id);
  });
  return await Promise.all(solutionFilePromises);
};

const getEnvironment = async (assignment: AssignmentType) => {
  if (assignment.environment) {
    return await Environment.read(assignment.environment);
  } else {
    const payload = { id: -1, language: null, dependencies: '[]', assignment: assignment.id, compileText: '' };
    return await Environment.create(payload);
  }
};

const getHelpers = async (env: EnvironmentType) => {
  const promises = env.helperFiles.map((f) => {
    return HelperFile.read(f);
  });

  const helpers = await Promise.all(promises);
  return helpers;
};

enum FILE_TYPE {
  HELPER,
  SOLUTION,
}

export const TestingSetup = (props: IProps) => {
  // ************************** State Variables ******************************
  const [currTab, setCurrTab] = useState('1');
  const [solutions, setSolutions] = useState<SolutionFileType[]>([]);
  const [env, setEnv] = useState<EnvironmentType | undefined>(undefined);
  const [helpers, setHelpers] = useState<HelperFileType[]>([]);

  /************************** Fetch data ******************************/
  useEffect(() => {
    const fetchData = async () => {
      const currEnv = await getEnvironment(props.currentAssignment);
      setEnv(currEnv);
      const solutionFiles = await getSolutionFiles(currEnv);
      setSolutions(solutionFiles);
      const helpers = await getHelpers(currEnv);
      setHelpers(helpers);
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
        setSolutions([...solutions, newSolution]);
        break;
      case FILE_TYPE.HELPER:
        const newHelper = await HelperFile.create(payload);
        setHelpers([...helpers, newHelper]);
        break;
    }
  };

  const deleteFile = async (type: FILE_TYPE, id: number) => {
    switch (type) {
      case FILE_TYPE.SOLUTION:
        await SolutionFile.delete(id);
        const updatedSolutions = solutions.filter((file) => {
          return file.id !== id;
        });
        setSolutions(updatedSolutions);
        break;
      case FILE_TYPE.HELPER:
        await HelperFile.delete(id);
        const updatedHelpers = helpers.filter((file) => {
          return file.id !== id;
        });
        setHelpers(updatedHelpers);
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
        // FIXME: Mutating state
        const solutionIndex = solutions.findIndex((f) => {
          return f.id === id;
        });
        if (solutionIndex > -1) {
          const newSolutions = [...solutions];
          newSolutions.splice(solutionIndex, 1, newSolution);

          setSolutions(newSolutions);
        }
        break;
      case FILE_TYPE.HELPER:
        const newHelper = await HelperFile.update(payload);
        // FIXME: Mutating state
        const helperIndex = helpers.findIndex((f) => {
          return f.id === id;
        });
        if (helperIndex > -1) {
          const newHelpers = [...helpers];
          newHelpers.splice(helperIndex, 1, newHelper);
          console.log(newHelpers);
          setHelpers(newHelpers);
        }
        break;
    }
  };

  // ************************** Return ***************************************
  const content = (
    <Tabs defaultActiveKey="1" activeKey={currTab} onChange={setCurrTab} animated={false}>
      <TabPane tab={'Environment'} key={'1'}>
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          onContinue={setCurrTab.bind({}, '2')}
          onCancel={props.onCancel}
          updateAssignment={props.updateAssignment}
          env={env}
          updateEnv={setEnv}
        />
      </TabPane>
      <TabPane tab={'Solution Code'} key={'2'}>
        <FileListEditor
          files={solutions}
          addFile={addFile.bind({}, FILE_TYPE.SOLUTION)}
          deleteFile={deleteFile.bind({}, FILE_TYPE.SOLUTION)}
          updateFile={updateFile.bind({}, FILE_TYPE.SOLUTION)}
        />
      </TabPane>
      <TabPane tab={'Helper Files'} key={'3'}>
        <FileListEditor
          files={helpers}
          addFile={addFile.bind({}, FILE_TYPE.HELPER)}
          deleteFile={deleteFile.bind({}, FILE_TYPE.HELPER)}
          updateFile={updateFile.bind({}, FILE_TYPE.HELPER)}
        />
      </TabPane>
      <TabPane tab={'Tests'} key={'4'}>
        <TestDefinitions
          currentAssignment={props.currentAssignment}
          solutions={solutions}
          helpers={helpers}
          submissions={props.submissions}
          env={env!}
        />
      </TabPane>
      <TabPane tab={'Settings'} key={'5'}>
        <div>Settings</div>
      </TabPane>
    </Tabs>
  );
  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item onClick={props.onCancel}>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a>Assignments</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{props.currentAssignment.name}</Breadcrumb.Item>
          <Breadcrumb.Item onClick={props.switchDetail}>Tests Summary</Breadcrumb.Item>
          <Breadcrumb.Item>Edit Tests</Breadcrumb.Item>
        </Breadcrumb>
      }
      goBack={null}
      title={`${props.currentAssignment.name} | Tests Setup`}
      actions={[]}
      content={content}
    />
  );
};

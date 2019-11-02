/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Breadcrumb, Tabs } from 'antd';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SolutionFile, SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../../../../infrastructure/submission';
import { TestEnvironment, TestEnvironmentType } from '../../../../../infrastructure/autograder/testEnvironment';

/* codePost component imports */
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './TestingSetup/EnvironmentSpecs';
import { TestDefinitions } from './TestingSetup/TestDefinitions';
import { SolutionCode } from './TestingSetup/SolutionCode';

const { TabPane } = Tabs;

interface IProps {
  currentAssignment: AssignmentType;
  switchDetail: () => void;
  onCancel: () => void;
  submissions: SubmissionType[];
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

const getSolutionFiles = async (assignment: AssignmentType) => {
  const solutionFilePromises = assignment.solutionFiles.map((id) => {
    return SolutionFile.read(id);
  });
  return await Promise.all(solutionFilePromises);
};

const getEnvironment = async (assignment: AssignmentType) => {
  if (assignment.testEnvironment) {
    return await TestEnvironment.read(assignment.testEnvironment);
  } else {
    const payload = { id: -1, language: null, dependencies: '[]', assignment: assignment.id };
    return await TestEnvironment.create(payload);
  }
};

export const TestingSetup = (props: IProps) => {
  // ************************** State Variables ******************************
  const [currTab, setCurrTab] = useState('1');
  const [solutions, setSolutions] = useState<SolutionFileType[]>([]);
  const [env, setEnv] = useState<TestEnvironmentType | undefined>(undefined);

  /************************** Fetch data ******************************/
  useEffect(() => {
    const fetchData = async () => {
      const solutionFiles = await getSolutionFiles(props.currentAssignment);
      setSolutions(solutionFiles);
      const currEnv = await getEnvironment(props.currentAssignment);
      setEnv(currEnv);
    };
    fetchData();
  }, [props.currentAssignment]);

  /************************** API / State change functions ******************************/

  const addFile = async (testCategory: number | null, name: string, code: string) => {
    const payload = {
      name: name,
      assignment: props.currentAssignment.id,
      code: code,
      path: null,
      id: -1,
      testCategory: testCategory,
    };
    const newFile = await SolutionFile.create(payload);
    setSolutions([...solutions, newFile]);
  };

  const deleteFile = async (id: number) => {
    await SolutionFile.delete(id);
    const updatedFiles = solutions.filter((file) => {
      return file.id !== id;
    });
    setSolutions(updatedFiles);
  };

  const updateFile = async (id: number, newCode: string) => {
    const payload = {
      id: id,
      code: newCode,
    };
    await SolutionFile.update(payload);

    // FIXME: Mutating state
    const newFiles = solutions.map((file) => {
      if (file.id == id) {
        file.code = newCode;
        return file;
      } else {
        return file;
      }
    });
    setSolutions(newFiles);
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
        <SolutionCode
          files={solutions}
          addFile={addFile.bind({}, null)}
          deleteFile={deleteFile}
          updateFile={updateFile}
        />
      </TabPane>
      <TabPane tab={'Tests'} key={'3'}>
        <TestDefinitions
          currentAssignment={props.currentAssignment}
          files={solutions}
          addFile={addFile}
          deleteFile={deleteFile}
          updateFile={updateFile}
          submissions={props.submissions}
          env={env!}
        />
      </TabPane>
      <TabPane tab={'Settings'} key={'4'}>
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

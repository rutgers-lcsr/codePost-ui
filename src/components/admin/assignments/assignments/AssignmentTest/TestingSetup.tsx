/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Breadcrumb, Tabs } from 'antd';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SolutionFile, SolutionFileType } from '../../../../../infrastructure/solutionFile';
import { SubmissionType } from '../../../../../infrastructure/submission';

/* codePost component imports */
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './TestingSetup/EnvironmentSpecs';
import { TestsList } from './TestingSetup/TestDefinitions/TestsList';
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

export const TestingSetup = (props: IProps) => {
  // ************************** State Variables ******************************
  const [currTab, setCurrTab] = useState('1');
  const [solutionFiles, setSolutionFiles] = useState<SolutionFileType[]>([]);

  /************************** Fetch data ******************************/
  useEffect(() => {
    const fetchData = async () => {
      const solutionFiles = await getSolutionFiles(props.currentAssignment);
      setSolutionFiles(solutionFiles);
    };
    fetchData();
  }, [props.currentAssignment]);

  /************************** API / State change functions ******************************/
  const addFile = async (testCategory: number | null, file: any) => {
    const payload = {
      name: file.name,
      assignment: props.currentAssignment.id,
      code: file.code,
      extension: file.extension,
      path: null,
      id: -1,
      testCategory: testCategory,
    };
    const newFile = await SolutionFile.create(payload);
    setSolutionFiles([...solutionFiles, newFile]);
  };

  const deleteFile = async (id: number) => {
    await SolutionFile.delete(id);
    const updatedFiles = solutionFiles.filter((file) => {
      return file.id !== id;
    });
    setSolutionFiles(updatedFiles);
  };

  const updateFile = async (id: number, newCode: string) => {
    const payload = {
      id: id,
      code: newCode,
    };
    await SolutionFile.update(payload);

    // FIXME: Mutating state
    const newFiles = solutionFiles.map((file) => {
      if (file.id == id) {
        file.code = newCode;
        return file;
      } else {
        return file;
      }
    });
    setSolutionFiles(newFiles);
  };

  const solutionCodeFiles = solutionFiles.filter((f) => {
    // filter out solutionFiles attached to a test category
    return !f.testCategory;
  });
  // ************************** Return ***************************************
  const content = (
    <Tabs defaultActiveKey="1" activeKey={currTab} onChange={setCurrTab} animated={false}>
      <TabPane tab={'Environment'} key={'1'}>
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          onContinue={setCurrTab.bind({}, '2')}
          onCancel={props.onCancel}
          updateAssignment={props.updateAssignment}
        />
      </TabPane>
      <TabPane tab={'Solution Code'} key={'2'}>
        <SolutionCode
          files={solutionCodeFiles}
          addFile={addFile.bind({}, null)}
          deleteFile={deleteFile}
          updateFile={updateFile}
        />
      </TabPane>
      <TabPane tab={'Tests'} key={'3'}>
        <TestsList
          currentAssignment={props.currentAssignment}
          files={solutionFiles}
          addFile={addFile}
          deleteFile={deleteFile}
          updateFile={updateFile}
          submissions={props.submissions}
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

import React, { useEffect, useState } from 'react';

import { Assignment, AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SolutionFile, SolutionFileType } from '../../../../../infrastructure/solutionFile';

import { SolutionCode } from './SolutionCode';

import { TestPanel } from './TestPanel';

import { Collapse } from 'antd';

const { Panel } = Collapse;

interface IProps {
  currentAssignment: AssignmentType;
  onCancel: () => void;
  onContinue: () => void;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

const getSolutionFiles = async (assignment: AssignmentType) => {
  const solutionFilePromises = assignment.solutionFiles.map((id) => {
    return SolutionFile.read(id);
  });
  return await Promise.all(solutionFilePromises);
};

export const TestDefinitions = (props: IProps) => {
  const [solutionFiles, setSolutionFiles] = useState<SolutionFileType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const solutionFiles = await getSolutionFiles(props.currentAssignment);
      setSolutionFiles(solutionFiles);
    };
    fetchData();
  }, [props.currentAssignment]);

  const addFile = async (file: any) => {
    const payload = {
      name: file.name,
      assignment: props.currentAssignment.id,
      code: file.code,
      extension: file.extension,
      path: null,
      id: -1,
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

  return (
    <div>
      <Collapse bordered={false} defaultActiveKey={['1']}>
        <Panel header="Correct solution" key="1">
          <SolutionCode
            assignment={props.currentAssignment}
            files={solutionFiles}
            addFile={addFile}
            deleteFile={deleteFile}
            updateFile={updateFile}
          />
        </Panel>
        <Panel header="Tests" key="2">
          <TestPanel currentAssignment={props.currentAssignment} files={solutionFiles} />
        </Panel>
      </Collapse>
    </div>
  );
};

import React, { useEffect, useState } from 'react';

import { Assignment, AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SolutionFile, SolutionFileType } from '../../../../../infrastructure/solutionFile';

import { SolutionCode } from './SolutionCode';

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

  return (
    <div>
      <SolutionCode />
    </div>
  );
};

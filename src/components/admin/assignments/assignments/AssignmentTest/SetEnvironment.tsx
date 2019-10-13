import React, { useState } from 'react';

import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';

import { Select, Steps } from 'antd';
import CPAdminDetail from '../../../other/CPAdminDetail';
const { Step } = Steps;
const { Option } = Select;

interface IProps {
  currentAssignment: AssignmentType;
  onCancel: () => void;
  onContinue: () => void;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

const languages = ['python3', 'python'];

export const SetEnvironment = (props: IProps) => {
  const setAssignmentLanguage = (language: string) => {
    props.updateAssignment({
      id: props.currentAssignment.id,
      testLanguage: language,
    });
  };

  const select = (
    <Select
      defaultValue={props.currentAssignment.testLanguage ? props.currentAssignment.testLanguage : undefined}
      onChange={setAssignmentLanguage}
    >
      {languages.map((language) => {
        return <Option value={language}>{language}</Option>;
      })}
    </Select>
  );
  return <div>{select}</div>;
};

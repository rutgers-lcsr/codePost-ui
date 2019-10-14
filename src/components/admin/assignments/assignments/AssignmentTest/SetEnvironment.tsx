import React, { useState } from 'react';

import { Assignment, AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';

import { Button, Select } from 'antd';
const { Option } = Select;

interface IProps {
  currentAssignment: AssignmentType;
  onCancel: () => void;
  onContinue: () => void;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

const languages = ['python-3.7', 'python-2.7'];

enum BUILD_STATUS {
  Idle,
  TestReady,
  TestRunning,
  Failed,
  SaveReady,
  Saving,
  Success,
}

export const SetEnvironment = (props: IProps) => {
  const [language, setLanguage] = useState<string | null>(props.currentAssignment.testLanguage);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);

  const [buildStatus, setBuildStatus] = useState(BUILD_STATUS.Idle);

  const testEnv = async () => {
    const payload = {
      id: props.currentAssignment.id,
      dependencies: dependencies,
      language: language!,
      simulate: true,
    };
    setBuildStatus(BUILD_STATUS.TestRunning);
    const status = await Assignment.simulateBuild(payload);
    if (status.buildSucceeded) {
      setBuildStatus(BUILD_STATUS.SaveReady);
    } else {
      setBuildStatus(BUILD_STATUS.Failed);
      setErrorLogs(status.logs);
    }
  };

  const saveEnv = async () => {
    const payload = {
      id: props.currentAssignment.id,
      dependencies: dependencies,
      language: language!,
      simulate: false,
    };
    setBuildStatus(BUILD_STATUS.Saving);
    const newAssignment = await Assignment.updateBuild(payload);
    if (newAssignment) {
      props.updateAssignment(newAssignment).then(() => {
        setBuildStatus(BUILD_STATUS.Success);
        props.onContinue();
      });
    }
  };

  const hasChanged = props.currentAssignment.testLanguage !== language;

  const onLanguageChange = (value: string) => {
    setBuildStatus(BUILD_STATUS.TestReady);
    setLanguage(value);
  };

  const select = (
    <Select defaultValue={language ? language : undefined} onChange={onLanguageChange} style={{ minWidth: 300 }}>
      {languages.map((language) => {
        return <Option value={language}>{language}</Option>;
      })}
    </Select>
  );
  const saveBtn = (
    <Button
      type="primary"
      disabled={!hasChanged || buildStatus !== BUILD_STATUS.SaveReady}
      loading={buildStatus === BUILD_STATUS.Saving}
      onClick={saveEnv}
    >
      {buildStatus === BUILD_STATUS.Success
        ? 'Saved Successfully'
        : buildStatus === BUILD_STATUS.Saving
        ? 'Saving'
        : 'Save and Continue'}
    </Button>
  );

  const testBtn = (
    <Button
      disabled={buildStatus !== BUILD_STATUS.TestReady}
      loading={buildStatus == BUILD_STATUS.TestRunning}
      onClick={testEnv}
    >
      {buildStatus === BUILD_STATUS.TestRunning
        ? 'Testing'
        : buildStatus === BUILD_STATUS.SaveReady ||
          buildStatus === BUILD_STATUS.Saving ||
          buildStatus === BUILD_STATUS.Success
        ? 'Successfully Tested'
        : 'Test Environment'}
    </Button>
  );

  return (
    <div>
      <div>{select}</div>
      <div>{testBtn}</div>
      <div>{saveBtn}</div>
      <div>{errorLogs}</div>
    </div>
  );
};

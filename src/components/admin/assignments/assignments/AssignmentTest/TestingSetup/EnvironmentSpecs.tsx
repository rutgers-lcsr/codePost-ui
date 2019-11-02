/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Collapse, Select, Typography } from 'antd';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../../infrastructure/assignment';
import { TestEnvironment, TestEnvironmentType } from '../../../../../../infrastructure/autograder/testEnvironment';

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

interface IProps {
  currentAssignment: AssignmentType;
  onCancel: () => void;
  onContinue: () => void;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  env: TestEnvironmentType | undefined;
  updateEnv: (env: TestEnvironmentType) => void;
}

const languages = ['python-3.7', 'python-2.7', 'java'];

enum BUILD_STATUS {
  Idle,
  TestReady,
  TestRunning,
  Failed,
  SaveReady,
  Saving,
  Success,
}

export const EnvironmentSpecs = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [language, setLanguage] = useState<string | null>(props.env ? props.env.language : null);
  const [dependencies, setDependencies] = useState<string[]>(props.env ? JSON.parse(props.env.dependencies) : []);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [buildStatus, setBuildStatus] = useState(BUILD_STATUS.Idle);

  /******************************* API / State Change Functions ****************************/
  const testEnv = async () => {
    if (!props.env) {
      return;
    }
    const payload = {
      id: props.env.id,
      dependencies: dependencies,
      language: language!,
      simulate: true,
    };
    setBuildStatus(BUILD_STATUS.TestRunning);
    setErrorLogs([]);
    const status = await TestEnvironment.simulateBuild(payload);
    if (status.result) {
      setBuildStatus(BUILD_STATUS.SaveReady);
    } else {
      setBuildStatus(BUILD_STATUS.Failed);
      setErrorLogs(status.logs);
    }
  };

  const saveEnv = async () => {
    if (!props.env) {
      return;
    }
    const payload = {
      id: props.env.id,
      dependencies: dependencies,
      language: language!,
      simulate: false,
    };
    setBuildStatus(BUILD_STATUS.Saving);
    const newEnv = await TestEnvironment.updateBuild(payload);
    if (newEnv) {
      props.updateEnv(newEnv);
      setBuildStatus(BUILD_STATUS.Success);
      props.onContinue();
    }
  };

  /******************************* State Change Functions ****************************/
  const onLanguageChange = (value: string) => {
    setBuildStatus(BUILD_STATUS.TestReady);
    setLanguage(value);
  };

  const onDependenciesChange = (newDependencies: string[]) => {
    setBuildStatus(BUILD_STATUS.TestReady);
    setDependencies(newDependencies);
  };
  /******************************* Utils ****************************/
  const hasChanged = props.env && props.env.language !== language;

  /******************************* Return ****************************/

  const selectLanguage = (
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
      style={{ marginRight: 15 }}
    >
      {buildStatus === BUILD_STATUS.TestRunning
        ? 'Testing'
        : buildStatus === BUILD_STATUS.SaveReady ||
          buildStatus === BUILD_STATUS.Saving ||
          buildStatus === BUILD_STATUS.Success
        ? 'Successfully Tested'
        : buildStatus === BUILD_STATUS.Failed
        ? 'Test Failed'
        : 'Test Environment'}
    </Button>
  );

  const selectDependencies = (
    <Select
      mode="tags"
      style={{ minWidth: 300 }}
      value={dependencies}
      placeholder="Dependencies (optional)"
      onChange={onDependenciesChange}
    />
  );

  const errorPanel =
    errorLogs.length === 0 ? (
      <div />
    ) : (
      <Collapse bordered={false} defaultActiveKey={[]}>
        <Panel header="Traceback" key="1">
          {errorLogs.map((error) => {
            return <div>{error}</div>;
          })}
        </Panel>
      </Collapse>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text type="secondary">Language</Text>
          {selectLanguage}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 15 }}>
          <Text type="secondary">Dependencies</Text>
          {selectDependencies}
        </div>
      </div>
      <div style={{ marginBottom: 10, marginTop: 10 }}>{errorPanel}</div>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
        <div>{testBtn}</div>
        <div>{saveBtn}</div>
      </div>
    </div>
  );
};

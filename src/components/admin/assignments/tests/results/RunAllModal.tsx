import * as React from 'react';

import { Modal, Progress } from 'antd';

import { TestCaseType } from '../../../../../infrastructure/testCase';

interface IResultsType {
  [id: number]: {
    passed: number;
    failed: number;
    error: number;
  };
}

interface IProps {
  raw: string;
  cases: TestCaseType[];
  visible: boolean;
  onCancel: () => void;
}

const RunAllModal = (props: IProps) => {
  const castRaw = (props.raw as any) as IResultsType;
  return (
    <Modal visible={props.visible} title="Results" onCancel={props.onCancel}>
      {Object.keys(castRaw).map((key) => {
        const obj = castRaw[parseInt(key, 10)];
        const foundCase = props.cases.find((el) => el.id === parseInt(key, 10));
        return (
          <div>
            {foundCase ? foundCase.description : ''}
            <Progress
              percent={parseInt(((obj.passed / (obj.passed + obj.failed + obj.error)) * 100).toFixed(0), 0)}
              status="active"
            />
          </div>
        );
      })}
    </Modal>
  );
};

export default RunAllModal;

import * as React from 'react';

import { Divider, Modal, Progress, Typography } from 'antd';

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
  numSubmissions: number;
}

const RunAllProgressModal = (props: IProps) => {
  if (props.raw && props.raw !== '{}') {
    const castRaw = (props.raw as any) as IResultsType;
    const firstKey: number = parseInt(Object.keys(castRaw)[0], 10);
    return (
      <Modal open={props.visible} title="Results" onCancel={props.onCancel}>
        <Typography.Title level={4} style={{ display: 'inline' }}>
          Submissions completed
        </Typography.Title>
        <Progress
          percent={parseInt(
            (
              ((castRaw[firstKey].passed + castRaw[firstKey].failed + castRaw[firstKey].error) / props.numSubmissions) *
              100
            ).toFixed(0),
            10,
          )}
        />
        <Divider />
        <Typography.Title level={4} style={{ display: 'inline', marginBottom: 15 }}>
          Pass rate by test case
        </Typography.Title>
        {Object.keys(castRaw).map((key) => {
          const obj = castRaw[parseInt(key, 10)];
          const foundCase = props.cases.find((el) => el.id === parseInt(key, 10));
          return (
            <div key={key}>
              {foundCase ? foundCase.description : ''}
              <Progress
                percent={parseInt(((obj.passed / (obj.passed + obj.failed + obj.error)) * 100).toFixed(0), 10)}
                showInfo={true}
              />
            </div>
          );
        })}
      </Modal>
    );
  } else {
    return <div />;
  }
};

export default RunAllProgressModal;

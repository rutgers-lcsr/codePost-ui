// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Divider, Modal, Progress, Typography } from 'antd';

import { TestCaseType } from '../../../../../types/models';

export interface IResultsType {
  [id: number]: {
    passed: number;
    failed: number;
    error: number;
  };
}

interface IProps {
  raw: IResultsType | null;
  cases: TestCaseType[];
  open: boolean;
  onCancel: () => void;
  numSubmissions: number;
}

const RunAllProgressModal = (props: IProps) => {
  if (props.raw && Object.keys(props.raw).length > 0) {
    const data = props.raw;
    const keys = Object.keys(data);

    // Calculate total submissions completed by averaging across test cases
    // Each test case tracks passed+failed+error per submission, so we use
    // the max across all test cases as the submission count
    let maxCompleted = 0;
    for (const key of keys) {
      const obj = data[parseInt(key, 10)];
      const completed = obj.passed + obj.failed + obj.error;
      if (completed > maxCompleted) {
        maxCompleted = completed;
      }
    }

    const completionPercent = Math.min(100, Math.round((maxCompleted / Math.max(1, props.numSubmissions)) * 100));

    return (
      <Modal open={props.open} title="Results" onCancel={props.onCancel} footer={null}>
        <Typography.Title level={4} style={{ display: 'inline' }}>
          Submissions completed
        </Typography.Title>
        <Progress percent={completionPercent} />
        <Divider />
        <Typography.Title level={4} style={{ display: 'inline', marginBottom: 15 }}>
          Pass rate by test case
        </Typography.Title>
        {keys.map((key) => {
          const obj = data[parseInt(key, 10)];
          const foundCase = props.cases.find((el) => el.id === parseInt(key, 10));
          const total = obj.passed + obj.failed + obj.error;
          const passRate = total > 0 ? Math.round((obj.passed / total) * 100) : 0;
          return (
            <div key={key}>
              {foundCase ? foundCase.description : `Test ${key}`}
              <Progress percent={passRate} showInfo={true} />
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

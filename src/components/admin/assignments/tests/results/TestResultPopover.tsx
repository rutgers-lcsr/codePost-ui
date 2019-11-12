/* react imports */
import React from 'react';

/* library imports */
import { Popover, Tabs } from 'antd';

/* codePost object imports */
import { SubmissionTestType } from '../../../../../infrastructure/submissionTest';
import { TestCaseType } from '../../../../../infrastructure/testCase';

/* codePost component imports */
import { TestResult } from '../edit/TestResult';

const { TabPane } = Tabs;

interface IProps {
  submissionTests: SubmissionTestType[];
  testCases: TestCaseType[];
}

export const TestResultPopover = (props: IProps) => {
  /******************************* Return helpers ****************************/
  /* Low important FIXME: optimize the speed of this logc, instead of looping 3 times*/
  const passedTests = props.submissionTests.filter((test) => {
    return test.passed;
  });
  const failedTests = props.submissionTests.filter((test) => {
    return !test.passed;
  });
  const runTests = props.submissionTests.map((test) => {
    return test.testCase;
  });

  const testsRun = new Set(runTests);
  const testsNotRun = props.testCases.filter((tc) => {
    return !testsRun.has(tc.id);
  });

  const passedItems = passedTests.map((test) => {
    return <TestResult passed={test.passed} log={test.logs} isError={test.isError} />;
  });
  const failedItems = failedTests.map((test) => {
    return <TestResult passed={test.passed} log={test.logs} isError={test.isError} />;
  });
  const notRunItems = testsNotRun.map((tc) => {
    return <div>Not Run: {tc.description}</div>;
  });

  /******************************* Return ****************************/
  return (
    <Popover
      content={
        <div>
          <Tabs defaultActiveKey="1" animated={false}>
            <TabPane style={{ maxHeight: 500, overflow: 'auto' }} tab={`Passed (${passedTests.length})`} key={'1'}>
              {passedItems}
            </TabPane>
            <TabPane style={{ maxHeight: 500, overflow: 'auto' }} tab={`Failed (${failedTests.length})`} key={'2'}>
              {failedItems}
            </TabPane>
            <TabPane style={{ maxHeight: 500, overflow: 'auto' }} tab={`Not Run (${testsNotRun.length})`} key={'3'}>
              {notRunItems}
            </TabPane>
          </Tabs>
        </div>
      }
      title="Logs"
      trigger="click"
    >
      {`${passedItems.length} / ${props.submissionTests.length}`}
    </Popover>
  );
};

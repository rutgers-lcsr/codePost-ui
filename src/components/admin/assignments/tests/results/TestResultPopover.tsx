/* react imports */
import React from 'react';

/* library imports */
import { Popover, Tabs, Icon, Empty } from 'antd';

/* codePost object imports */
import { SubmissionTestType } from '../../../../../infrastructure/submissionTest';
import { TestCaseType } from '../../../../../infrastructure/testCase';

/* codePost component imports */
import { TestResult } from '../edit/utils/TestResult';

const { TabPane } = Tabs;

interface IProps {
  submissionTests: SubmissionTestType[];
  testCases: TestCaseType[];
}

const getNameFromSubmissionTest = (st: SubmissionTestType, testCases: TestCaseType[]) => {
  const testCase = testCases.find((el) => el.id === st.testCase);
  if (testCase !== undefined) {
    return testCase.description;
  } else {
    return '';
  }
};

export const TestResultPopover = (props: IProps) => {
  /******************************* Return helpers ****************************/
  /* Low important FIXME: optimize the speed of this logc, instead of looping 3 times*/
  let passedTests: SubmissionTestType[] = [];
  let failedTests: SubmissionTestType[] = [];
  let errorTests: SubmissionTestType[] = [];
  for (const st of props.submissionTests) {
    if (st.passed) {
      passedTests.push(st);
    } else if (st.isError) {
      errorTests.push(st);
    } else {
      failedTests.push(st);
    }
  }

  const runTests = props.submissionTests.map((test) => {
    return test.testCase;
  });

  const testsRun = new Set(runTests);
  const testsNotRun = props.testCases.filter((tc) => {
    return !testsRun.has(tc.id);
  });

  const passedItems = passedTests.map((test) => {
    return <div>{getNameFromSubmissionTest(test, props.testCases)}</div>;
  });
  const failedItems = failedTests.map((test) => {
    return <div>{getNameFromSubmissionTest(test, props.testCases)}</div>;
  });
  const errorItems = errorTests.map((test) => {
    return <div>{getNameFromSubmissionTest(test, props.testCases)}</div>;
  });
  const notRunItems = testsNotRun.map((tc) => {
    return tc.description;
  });

  /* UX optimization: open the first tab that has meaningful contents */
  const getActiveKey = () => {
    if (passedItems.length > 0) {
      return 'passed';
    } else if (failedItems.length > 0) {
      return 'failed';
    } else if (errorItems.length > 0) {
      return 'error';
    } else if (notRunItems.length > 0) {
      return 'notrun';
    } else {
      return 'passed';
    }
  };

  /******************************* Return ****************************/
  if (props.submissionTests.length === 0) {
    return <span>--</span>;
  }

  return (
    <Popover
      content={
        <div>
          <Tabs defaultActiveKey={getActiveKey()} animated={false}>
            <TabPane style={{ maxHeight: 500, overflow: 'auto' }} tab={`Passed (${passedTests.length})`} key={'passed'}>
              {passedItems.length > 0 ? passedItems : <Empty />}
            </TabPane>
            <TabPane style={{ maxHeight: 500, overflow: 'auto' }} tab={`Failed (${failedTests.length})`} key={'failed'}>
              {failedItems}
            </TabPane>
            <TabPane style={{ maxHeight: 500, overflow: 'auto' }} tab={`Error (${errorTests.length})`} key={'error'}>
              {errorItems}
            </TabPane>
            <TabPane
              style={{ maxHeight: 500, overflow: 'auto' }}
              tab={`Not Run (${testsNotRun.length})`}
              key={'notrun'}
            >
              {notRunItems}
            </TabPane>
          </Tabs>
        </div>
      }
      title="Results detail"
      trigger="click"
    >
      {`${passedItems.length} / ${props.submissionTests.length}`}
    </Popover>
  );
};

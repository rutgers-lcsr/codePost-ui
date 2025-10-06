/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Badge, Card, Collapse, Input, Spin, Statistic, Table, Typography } from 'antd';

/* other library imports */
import ReactMarkdown from 'react-markdown';

/* codePost imports */
import { BasicTestResultType } from '../../../infrastructure/autograder/runTypes';
import { SubmissionTest, SubmissionTestType } from '../../../infrastructure/submissionTest';
import { TestCategoryType } from '../../../infrastructure/testCategory';
import { StudentTestCasesByCategory, TestCasesByCategory } from '../../core/testFetchUtils';
import useWindowSize from '../../core/useWindowSize';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

/**********************************************************************************************************************/

interface IProps {
  tests: SubmissionTestType[] | BasicTestResultType[];
  cases: TestCasesByCategory | StudentTestCasesByCategory;
  categories: TestCategoryType[];
  isLoading?: boolean;
  hideNotRun?: boolean; // Don't show the tests that haven't been run
  hideSummary?: boolean;
  showLogs?: boolean;
  logs?: string;
  message?: React.ReactNode;
  redactNotShown?: boolean; // Mark the tests that haven't been run as "failed" and hide the info.
}

const TestsList = (props: IProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const windowSize = useWindowSize();

  if (props.isLoading) {
    return (
      <div
        style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
      >
        <div>
          <Spin />
          <br />
          <br />
          <b>Running tests</b>
        </div>
      </div>
    );
  }

  // Can update this logic however
  const failedLabel = 'Failed';

  // Submission-level stats
  let passed = 0;
  let failed = 0;
  const total = Object.keys(props.cases).reduce((acc, val: string) => acc + props.cases[parseInt(val, 10)].length, 0);

  // Index tests by testCategory to access their data more easily when we loop
  // over testCategories below
  const testsByCategory = {} as { [id: number]: SubmissionTestType[] | BasicTestResultType[] };
  for (const category of props.categories) {
    testsByCategory[category.id] = [];
  }

  // If the tests are submission tests, get the latest
  let latestTests = props.tests;
  if (props.tests.length > 0 && 'submission' in props.tests[0]) {
    latestTests = SubmissionTest.getLatest(props.tests as SubmissionTestType[]);
  }

  for (const test of latestTests) {
    testsByCategory[test.testCategory] = [...testsByCategory[test.testCategory], test];
    if (test.passed) {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  if (props.redactNotShown) {
    failed = total - passed;
  }

  const explanationsWidth = Math.max(windowSize.width * 0.25, 350);

  // Top-level columns used used to display individual test information
  const columns = [
    {
      title: 'Test Case',
      dataIndex: 'case',
      key: 'case',
    },
    {
      title: 'Explanation',
      dataIndex: 'explanation',
      key: 'explanation',
      width: `${explanationsWidth}px`,
    },
    {
      title: 'Passed',
      dataIndex: 'passed',
      key: 'passed',
      align: 'center' as const,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      align: 'center' as const,
    },
  ];

  // Styling
  const customPanelStyle = {
    background: consoleTheme.siderBg,
    color: consoleTheme.text,
    marginBottom: 24,
    border: '1px solid #ccc',
    overflow: 'hidden',
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'auto' }}>
      <div style={{ position: 'absolute', width: 'inherit', padding: '25px 50px' }}>
        <div id="tests-list" style={{ height: '100%', width: '100%' }}>
          {props.message && <div style={{ marginBottom: 15 }}>{props.message}</div>}
          {!props.hideSummary && (
            <div className="display-flex justify-content-center">
              <Card style={{ background: consoleTheme.siderBg, borderColor: consoleTheme.siderSubmenuBorder }}>
                <div className="display-flex justify-content-center">
                  <Statistic
                    style={{ textAlign: 'center', margin: '0px 30px' }}
                    title={<span style={{ color: consoleTheme.text }}>Passed</span>}
                    value={`${passed}`}
                    valueStyle={{ color: consoleTheme.text }}
                  />
                  <Statistic
                    style={{ textAlign: 'center', margin: '0px 30px', color: consoleTheme.text }}
                    title={<span style={{ color: consoleTheme.text }}>{failedLabel}</span>}
                    value={`${failed}`}
                    valueStyle={{ color: consoleTheme.text }}
                  />
                  {!props.hideNotRun && !props.redactNotShown && (
                    <Statistic
                      style={{ textAlign: 'center', margin: '0px 30px', color: consoleTheme.text }}
                      title={<span style={{ color: consoleTheme.text }}>Not run</span>}
                      value={`${total - passed - failed}`}
                      valueStyle={{ color: consoleTheme.text }}
                    />
                  )}
                  <Statistic
                    style={{ textAlign: 'center', margin: '0px 30px', color: consoleTheme.text }}
                    title={<span style={{ color: consoleTheme.text }}>Summary</span>}
                    value={`${passed}/${total}`}
                    valueStyle={{ color: consoleTheme.text }}
                  />
                </div>
              </Card>
            </div>
          )}
          <br />
          <Collapse
            defaultActiveKey={props.categories.map((_, i) => i)}
            bordered={false}
            style={{ background: consoleTheme.mainBg }}
          >
            {props.categories.map((category, index) => {
              const theseTests = testsByCategory[category.id];
              const numPassed = theseTests.reduce(
                (acc: number, el: SubmissionTestType | BasicTestResultType) => acc + (el.passed === true ? 1 : 0),
                0,
              );
              const numFailed = props.redactNotShown
                ? props.cases[category.id].length - numPassed
                : theseTests.length - numPassed;
              const numNotRun = props.cases[category.id].length - theseTests.length;

              // If we want to hide the not run, then we filter out tests for which we don't have a submission test
              const testCases = !props.hideNotRun
                ? props.cases[category.id]
                : props.cases[category.id].filter((tc) => {
                    return theseTests.find((el) => el.testCase === tc.id);
                  });

              const data = testCases
                .sort((a, b) => a.id - b.id)
                .map((testCase) => {
                  const result = theseTests.find((el) => el.testCase === testCase.id);

                  // Did submission pass this test?
                  let testOutcome;
                  if (result) {
                    testOutcome = result.passed;
                  }

                  let badgeStatus: 'success' | 'error' | 'default' | 'processing' | 'warning' | undefined;
                  let badgeString;
                  switch (testOutcome) {
                    case true:
                      badgeStatus = 'success';
                      badgeString = 'Passed';
                      break;
                    case false:
                      badgeString = failedLabel;
                      badgeStatus = 'error';
                      break;
                    default:
                      if (props.redactNotShown) {
                        badgeString = failedLabel;
                        badgeStatus = 'error';
                      } else {
                        badgeString = 'Never run';
                        badgeStatus = 'default';
                      }
                  }

                  let points = '--';
                  if (result || props.redactNotShown) {
                    if (result && result.passed) {
                      points = `${testCase.pointsPass > 0 ? '+' : ''}${testCase.pointsPass}`;
                    } else {
                      points = `${testCase.pointsFail > 0 ? '+' : ''}${testCase.pointsFail}`;
                    }
                  }

                  return {
                    key: testCase.id,
                    case: props.redactNotShown && !result ? 'HIDDEN' : testCase.description,
                    passed: (
                      <span>
                        <Badge status={badgeStatus} />
                        {badgeString}
                      </span>
                    ),
                    points,
                    logsRaw: result ? result.logs : '--',
                    logs: <span style={{ whiteSpace: 'pre' }}>{result ? result.logs : '--'}</span>,
                    explanation: (
                      <ReactMarkdown>{props.redactNotShown && !result ? '' : testCase.explanation}</ReactMarkdown>
                    ),
                  };
                });

              // Show logs when a test is expanded
              const expandedRowRender = (record: { case: string; logsRaw: string }) => {
                const columns = [{ title: `Logs: ${record.case}`, dataIndex: 'logs', key: 'logs' }];
                const data = [{ logs: record.logsRaw }];
                return <Table columns={columns} dataSource={data} pagination={false} />;
              };

              return (
                <Collapse.Panel
                  header={
                    <span style={{ background: consoleTheme.siderBg, color: consoleTheme.text }}>
                      {category.name}
                      &nbsp;
                      <span>
                        <Badge count={numPassed} style={{ backgroundColor: '#52c41a' }} />
                        <Badge count={numFailed} style={{ backgroundColor: 'red' }} />
                        {!props.hideNotRun && !props.redactNotShown && (
                          <Badge count={numNotRun} style={{ backgroundColor: 'gray' }} />
                        )}
                      </span>
                    </span>
                  }
                  key={index}
                  style={customPanelStyle}
                >
                  <div className={`tests-menu${consoleTheme === consoleThemes.dark ? '--dark' : ''}`}>
                    <Table
                      scroll={{ x: true }}
                      columns={columns}
                      loading={props.isLoading}
                      dataSource={data}
                      pagination={false}
                      expandedRowRender={expandedRowRender}
                    />
                  </div>
                </Collapse.Panel>
              );
            })}
          </Collapse>
          {props.showLogs && props.logs && (
            <div>
              <Typography.Title level={4}>Logs</Typography.Title>
              <Input.TextArea disabled={true} value={props.logs} style={{ color: 'black' }} autoSize={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestsList;

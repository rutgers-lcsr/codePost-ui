/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Badge, Card, Table, Collapse, Statistic, Spin } from 'antd';

/* other library imports */
import ReactMarkdown from 'react-markdown';

/* codePost imports */
import { SubmissionTest, SubmissionTestType } from '../../../infrastructure/submissionTest';
import { TestCategoryType } from '../../../infrastructure/testCategory';
import useWindowSize from '../../core/useWindowSize';
import { TestCasesByCategory, StudentTestCasesByCategory } from '../../core/testFetchUtils';
import { BasicTestResultType } from '../../../infrastructure/autograder/runTypes';

/**********************************************************************************************************************/

interface IProps {
  tests: SubmissionTestType[] | BasicTestResultType[];
  cases: TestCasesByCategory | StudentTestCasesByCategory;
  categories: TestCategoryType[];
  isLoading?: boolean;
  hideNotRun?: boolean;
  hideSummary?: boolean;
}

const TestsList = (props: IProps) => {
  const windowSize = useWindowSize();

  // Submission-level stats
  let passed = 0;
  let failed = 0;
  let total = Object.keys(props.cases).reduce((acc, val: string) => acc + props.cases[parseInt(val, 10)].length, 0);

  // Index tests by testCategory to access their data more easily when we loop
  // over testCategories below
  const testsByCategory = {} as { [id: number]: SubmissionTestType[] | BasicTestResultType[] };
  for (const category of props.categories) {
    testsByCategory[category.id] = [];
  }

  // If the tests are submission tests, get the latest
  let latestTests = props.tests;
  if (props.tests.length > 0 && 'submission' in props.tests[0]) {
    // @ts-ignore
    latestTests = SubmissionTest.getLatest(props.tests);
  }

  for (const test of latestTests) {
    testsByCategory[test.testCategory] = [...testsByCategory[test.testCategory], test];
    if (test.passed) {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  // Top-level columns used used to display individual test information
  const columns = [
    {
      title: 'Test Case',
      dataIndex: 'case',
      key: 'case',
      width: '20%',
    },
    {
      title: 'Explanation',
      dataIndex: 'explanation',
      key: 'explanation',
      width: '40%',
    },
    {
      title: 'Passed',
      dataIndex: 'passed',
      key: 'passed',
      width: '20%',
      align: 'center' as const,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      width: '20%',
      align: 'center' as const,
    },
  ];

  // Styling
  const customPanelStyle = {
    background: 'white',
    marginBottom: 24,
    border: '1px solid #ccc',
    overflow: 'hidden',
  };

  console.log('DISPLAYED');
  return (
    <div id="tests-list" style={{ padding: '20px', overflow: 'auto', height: `${windowSize.height - 49}px` }}>
      {!props.hideSummary && (
        <div className="display-flex justify-content-center">
          <Card>
            <div className="display-flex justify-content-center">
              <Statistic
                style={{ textAlign: 'center', margin: '0px 30px' }}
                title="Passed"
                value={props.isLoading ? 'Running...' : `${passed}`}
              />
              <Statistic
                style={{ textAlign: 'center', margin: '0px 30px' }}
                title="Failed"
                value={props.isLoading ? 'Running...' : `${failed}`}
              />
              <Statistic
                style={{ textAlign: 'center', margin: '0px 30px' }}
                title="Not Run"
                value={props.isLoading ? 'Running...' : `${total - passed - failed}`}
              />
              <Statistic
                style={{ textAlign: 'center', margin: '0px 30px' }}
                title="Summary"
                value={props.isLoading ? 'Running...' : `${passed}/${total}`}
              />
            </div>
          </Card>
        </div>
      )}
      <br />
      <Collapse defaultActiveKey={props.categories.map((x, i) => i)} bordered={false} style={{ background: '#f2f2f2' }}>
        {props.categories.map((category, index) => {
          const theseTests = testsByCategory[category.id];
          // @ts-ignore
          const numPassed = theseTests.reduce((acc: number, el: any) => acc + (el.passed === true ? 1 : 0), 0);
          const numFailed = theseTests.length - numPassed;
          const numNotRun = props.cases[category.id].length - theseTests.length;

          // If we want to hide the not run, then we fitler out tests for which we don't have a submission test
          const testCases = !props.hideNotRun
            ? props.cases[category.id]
            : props.cases[category.id].filter((tc) => {
                return theseTests.find((el) => el.testCase === tc.id);
              });

          const data = testCases.map((testCase) => {
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
                badgeString = 'Failed';
                badgeStatus = 'error';
                break;
              default:
                badgeString = 'Never run';
                badgeStatus = 'default';
            }

            let points = '--';
            if (result) {
              if (result.passed) {
                points = `${testCase.pointsPass > 0 ? '+' : ''}${testCase.pointsPass}`;
              } else {
                points = `${testCase.pointsFail > 0 ? '+' : ''}${testCase.pointsFail}`;
              }
            }

            return {
              case: testCase.description,
              passed: (
                <span>
                  <Badge status={badgeStatus} />
                  {badgeString}
                </span>
              ),
              points,
              logs: result ? result.logs : '--',
              explanation: <ReactMarkdown>{testCase.explanation}</ReactMarkdown>,
            };
          });

          // Show logs when a test is expanded
          const expandedRowRender = (record: any, index: number, indent: any, expanded: boolean) => {
            const columns = [{ title: `Logs: ${record.case}`, dataIndex: 'logs', key: 'logs' }];
            const data = [{ logs: record.logs }];
            return <Table columns={columns} dataSource={data} pagination={false} />;
          };

          return (
            <Collapse.Panel
              header={
                <span>
                  {category.name}
                  &nbsp;
                  {props.isLoading ? (
                    <Spin />
                  ) : !props.hideNotRun ? (
                    <span>
                      <Badge count={numPassed} style={{ backgroundColor: '#52c41a' }} />
                      <Badge count={numFailed} style={{ backgroundColor: 'red' }} />
                      <Badge count={numNotRun} style={{ backgroundColor: 'gray' }} />
                    </span>
                  ) : (
                    <div />
                  )}
                </span>
              }
              key={index}
              style={customPanelStyle}
            >
              <Table columns={columns} dataSource={data} pagination={false} expandedRowRender={expandedRowRender} />
            </Collapse.Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default TestsList;

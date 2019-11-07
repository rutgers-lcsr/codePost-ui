/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Badge, Table, Collapse, Statistic } from 'antd';

/* codePost imports */
import { SubmissionTestType } from '../../../infrastructure/submissionTest';
import { TestCategoryType } from '../../../infrastructure/testCategory';
import { TestCasesByCategory } from '../../admin/assignments/assignments/AssignmentTest/testUtils';

/**********************************************************************************************************************/

interface IProps {
  tests: SubmissionTestType[];
  cases: TestCasesByCategory;
  categories: TestCategoryType[];
}

const TestsList = (props: IProps) => {
  // Index tests by testCategory to access their data more easily when we loop
  // over testCategories below
  const testsByCategory = {} as { [id: number]: SubmissionTestType[] };
  for (const category of props.categories) {
    testsByCategory[category.id] = [];
  }
  for (const test of props.tests) {
    testsByCategory[test.testCategory] = [...testsByCategory[test.testCategory], test];
  }

  // Top-level columns used used to display individual test information
  const columns = [
    {
      title: 'Test Case',
      dataIndex: 'case',
      key: 'case',
      width: '80%',
    },
    {
      title: 'Passed',
      dataIndex: 'passed',
      key: 'passed',
      width: '20%',
    },
  ];

  // Styling
  const customPanelStyle = {
    background: 'white',
    marginBottom: 24,
    border: '1px solid #ccc',
    overflow: 'hidden',
  };

  return (
    <div style={{ margin: '20px' }}>
      <Statistic
        title="Tests Passed"
        value={`${props.tests.reduce((acc, el) => acc + (el.passed ? 1 : 0), 0)}/${Object.values(props.cases).length}`}
      />
      <br />
      <Collapse defaultActiveKey={props.categories.map((x, i) => i)} bordered={false} style={{ background: '#f2f2f2' }}>
        {props.categories.map((category, index) => {
          const theseTests = testsByCategory[category.id];
          const numPassed = theseTests.reduce((acc, el) => acc + (el.passed === true ? 1 : 0), 0);
          const numFailed = theseTests.length - numPassed;
          const numNotRun = props.cases[category.id].length - theseTests.length;

          const data = props.cases[category.id].map((testCase) => {
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

            return {
              case: testCase.description,
              passed: (
                <span>
                  <Badge status={badgeStatus} />
                  {badgeString}
                </span>
              ),
              logs: result ? result.logs : '--',
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
                  <Badge count={numPassed} style={{ backgroundColor: '#52c41a' }} />
                  <Badge count={numFailed} style={{ backgroundColor: 'red' }} />
                  <Badge count={numNotRun} style={{ backgroundColor: 'gray' }} />
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

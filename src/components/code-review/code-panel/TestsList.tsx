import * as React from 'react';

import { Button, Table, Collapse } from 'antd';

import { SubmissionTest, SubmissionTestType } from '../../../infrastructure/submissionTest';
import { TestCategoryType } from '../../../infrastructure/testCategory';
import { TestCaseType } from '../../../infrastructure/testCase';
import { TestCasesByCategory } from '../../admin/assignments/assignments/AssignmentTest/testUtils';

interface IProps {
  tests: SubmissionTestType[];
  cases: TestCasesByCategory;
  categories: TestCategoryType[];
}

const TestsList = (props: IProps) => {
  const testsByCategory = {} as { [id: number]: SubmissionTestType[] };
  const caseList: TestCaseType[] = Object.values(props.cases).flat();
  for (const category of props.categories) {
    testsByCategory[category.id] = [];
  }
  for (const test of props.tests) {
    testsByCategory[test.testCategory] = [...testsByCategory[test.testCategory], test];
  }

  const columns = [
    {
      title: 'Test Case',
      dataIndex: 'case',
      key: 'case',
    },
    {
      title: 'Passed',
      dataIndex: 'passed',
      key: 'passed',
    },
  ];

  return (
    <div style={{ margin: '20px' }}>
      <Collapse defaultActiveKey={['0']}>
        {props.categories.map((category, index) => {
          const data = props.cases[category.id].map((testCase) => {
            const result = props.tests.find((el) => el.testCase === testCase.id);
            return {
              case: testCase.description,
              passed: result ? result.passed : 'not run',
            };
          });
          return (
            <Collapse.Panel header={category.name} key={index}>
              <Table columns={columns} dataSource={data} pagination={false} />
            </Collapse.Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default TestsList;

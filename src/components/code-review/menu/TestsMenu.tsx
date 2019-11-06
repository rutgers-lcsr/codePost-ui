import * as React from 'react';

import { Button, Table } from 'antd';

import { SubmissionTest, SubmissionTestType } from '../../../infrastructure/submissionTest';
import { TestCategoryType } from '../../../infrastructure/testCategory';
import { TestCaseType } from '../../../infrastructure/testCase';
import { TestCasesByCategory } from '../../admin/assignments/assignments/AssignmentTest/testUtils';

interface IProps {
  tests: SubmissionTestType[];
  cases: TestCasesByCategory;
  categories: TestCategoryType[];
}

const TestsMenu = (props: IProps) => {
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
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Passed',
      dataIndex: 'passed',
      key: 'passed',
    },
  ];

  const data = props.categories.map((category) => {
    const numPassed = testsByCategory[category.id].reduce((prev, newVal) => prev + (newVal.passed ? 1 : 0), 0);
    const numTotal = testsByCategory[category.id].length;
    return {
      category: category.name,
      passed: `${numPassed}/${numTotal}`,
    };
  });

  return (
    <div id="tests-info" style={{ paddingLeft: '15px', paddingBottom: '10px', paddingRight: '15px' }}>
      <div style={{ fontSize: 12, overflowX: 'auto' }}>
        <Table dataSource={data} columns={columns} size="middle" pagination={false} bordered={false} />
      </div>
    </div>
  );
};

export default TestsMenu;

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Table } from 'antd';

/* codePost imports */
import { SubmissionTestType } from '../../../infrastructure/submissionTest';
import { TestCategoryType } from '../../../infrastructure/testCategory';
import { TestCasesByCategory } from '../../core/testFetchUtils';

import { BasicTestResultType } from '../../../infrastructure/autograder/runTypes';
/**********************************************************************************************************************/

interface IProps {
  tests: SubmissionTestType[] | BasicTestResultType[];
  cases: TestCasesByCategory;
  categories: TestCategoryType[];
  isOpen: boolean;
}

const TestsMenu = (props: IProps) => {
  // Index tests by testCategory to access their data more easily when we loop
  // over testCategories below
  const testsByCategory = {} as { [id: number]: BasicTestResultType[] | SubmissionTestType[] };
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
    // @ts-ignore
    const numPassed = testsByCategory[category.id].reduce(
      (prev: number, newVal: SubmissionTestType | BasicTestResultType) => prev + (newVal.passed ? 1 : 0),
      0,
    );
    const numTotal = testsByCategory[category.id].length;
    return {
      category: category.name,
      passed: `${numPassed}/${numTotal}`,
    };
  });

  return (
    <div
      id="tests-info"
      style={{
        paddingLeft: '15px',
        paddingBottom: '10px',
        paddingRight: '15px',
        backgroundColor: props.isOpen ? '#f0fff7' : undefined,
      }}
    >
      <div style={{ fontSize: 12, overflowX: 'auto' }}>
        <Table dataSource={data} columns={columns} size="middle" pagination={false} bordered={false} />
      </div>
    </div>
  );
};

export default TestsMenu;

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Table } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import { AssignmentType, SubmissionTestType, TestCategoryType } from '../../../infrastructure/types';
import { SubmissionTest } from '../../../infrastructure/submissionTest';
import { TestCasesByCategory } from '../../core/testFetchUtils';

import { BasicTestResultType } from '../../../infrastructure/autograder/runTypes';
import Badge from '../../core/Badge';

import { CourseContext } from '../../core/Contexts';

import { encodeForLink } from '../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  tests: SubmissionTestType[] | BasicTestResultType[];
  cases: TestCasesByCategory;
  categories: TestCategoryType[];
  isOpen: boolean;
  assignment: AssignmentType;
  showLink?: boolean;
}

const TestsMenu = (props: IProps) => {
  // Index tests by testCategory to access their data more easily when we loop
  // over testCategories below
  const testsByCategory = {} as { [id: number]: BasicTestResultType[] | SubmissionTestType[] };
  for (const category of props.categories) {
    testsByCategory[category.id] = [];
  }
  for (const test of props.tests) {
    const oldTests = testsByCategory[test.testCategory] || [];
    testsByCategory[test.testCategory] = [...oldTests, test];
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
    let latest = testsByCategory[category.id];
    if (props.tests && props.tests[0] instanceof SubmissionTest) {
      // @ts-ignore
      latest = SubmissionTest.getLatest(latest);
    }
    // @ts-ignore
    const numPassed = latest.reduce((prev, newVal) => prev + (newVal.passed ? 1 : 0), 0);
    const numTotal = latest.length;

    const cases = props.cases[category.id];
    let positivePoints = 0;
    let negativePoints = 0;
    for (const test of latest) {
      const myCase = cases.find((el) => el.id === test.testCase);
      if (myCase !== undefined) {
        const points = test.passed ? myCase.pointsPass : myCase.pointsFail;
        if (points > 0) {
          positivePoints += points;
        } else {
          negativePoints += points;
        }
      }
    }

    const badgeStyle = {
      fontSize: 10,
      padding: '0 2px',
      opacity: props.isOpen ? 1 : 0.7,
    };

    return {
      category: (
        <span>
          {category.name} <Badge hideZero={true} count={positivePoints} size="small" />
          <Badge count={negativePoints} hideZero={true} size="small" />
        </span>
      ),
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
        paddingTop: '10px',
        backgroundColor: props.isOpen ? '#f0fff7' : undefined,
      }}
    >
      <div style={{ fontSize: 12, overflowX: 'auto' }}>
        {props.categories.length > 0 ? (
          <Table dataSource={data} columns={columns} size="small" pagination={false} bordered={false} />
        ) : (
          <span>Soon you'll be able to show test output and run tests on student code using codePost!</span>
        )}
      </div>
    </div>
  );
};

export default TestsMenu;

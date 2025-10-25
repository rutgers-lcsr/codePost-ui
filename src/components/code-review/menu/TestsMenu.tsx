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
import { SubmissionTest } from '../../../infrastructure/submissionTest';
import { AssignmentType, SubmissionTestType, TestCategoryType } from '../../../infrastructure/types';
import { StudentTestCasesByCategory, TestCasesByCategory } from '../../core/testFetchUtils';

import { BasicTestResultType } from '../../../infrastructure/autograder/runTypes';
import Badge from '../../core/Badge';

import { CourseContext } from '../../core/Contexts';

import { encodeForLink } from '../../core/URLutils';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

/**********************************************************************************************************************/

interface IProps {
  tests: SubmissionTestType[] | BasicTestResultType[];
  cases: TestCasesByCategory | StudentTestCasesByCategory;
  categories: TestCategoryType[];
  isOpen: boolean;
  assignment: AssignmentType;
  showLink?: boolean;
  emptyMessage: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  headerActions?: React.ReactNode;
}

const TestsMenu = (props: IProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
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
      // @ts-expect-error --- IGNORE ---
      latest = SubmissionTest.getLatest(latest);
    }
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

    return {
      category: (
        <span>
          {category.name} <Badge showZero={false} count={parseFloat(positivePoints.toPrecision(1))} size="small" />
          <Badge count={parseFloat(negativePoints.toPrecision(1))} showZero={false} size="small" />
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
      }}
      onClick={props.onClick}
    >
      {props.headerActions ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: props.categories.length > 0 ? 12 : 8,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {props.headerActions}
        </div>
      ) : null}
      <div
        className={`tests-menu${consoleTheme === consoleThemes.dark ? '--dark' : ''}`}
        style={{ fontSize: 12, overflowX: 'auto', color: consoleTheme.text, background: consoleTheme.siderBg }}
      >
        {props.categories.length > 0 ? (
          <Table dataSource={data} columns={columns} size="small" pagination={false} bordered={false} />
        ) : (
          <span>
            {props.emptyMessage}
            {props.showLink ? (
              <span>
                {' '}
                You can do so from the{' '}
                <CourseContext.Consumer>
                  {(course) => (
                    <span>
                      <Link
                        to={`/admin/${encodeForLink(course.name)}/${encodeForLink(
                          course.period,
                        )}/assignments/tests/${encodeForLink(props.assignment.name)}/edit`}
                      >
                        Admin Console
                      </Link>
                      .
                    </span>
                  )}
                </CourseContext.Consumer>
              </span>
            ) : (
              ''
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default TestsMenu;

/* react imports */
import React, { useState, useEffect } from 'react';

/* library imports */
import { Breadcrumb, Button, Checkbox, Dropdown, Icon, Menu, Modal, Radio, Tooltip } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

/* codePost object imports */
import { SubmissionType } from '../../../../../infrastructure/submission';
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionTest, SubmissionTestType } from '../../../../../infrastructure/submissionTest';
import { TestCategoryType } from '../../../../../infrastructure/testCategory';
import { TestCaseType } from '../../../../../infrastructure/testCase';

import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { RunAllResultType, SubmissionTestResultType } from '../../../../../infrastructure/autograder/runTypes';

import { awaitTestResult } from '../autograderPollingUtils';

/* codePost component imports */
import { TableDetail } from '../../../other/TableDetail';
import RunAllModal from './RunAllModal';
import ResultDetail from './ResultDetail';

import { bySubmissionColumns, byTestColumns } from './testSummaryUtils';

/* codePost util imports */
import {
  fetchTestData,
  fetchEnvironment,
  fetchTestsBySubmission,
  TestsBySubmission,
  TestCasesByCategory,
  TestsByCase,
  getTestsByCase,
  RESULT_STATUS,
} from '../../../../core/testFetchUtils';
import { openSubmission } from '../../../other/AdminUtils';

interface IProps {
  submissions: SubmissionType[];
  assignment: AssignmentType;
  testCasesByCategory: TestCasesByCategory;
  testsBySubmission: TestsBySubmission;
  categories: TestCategoryType[];
  isLoading: boolean;
  subsLoading: number[];
  runSubmission: (sub: SubmissionType) => Promise<void>;
  hasSourceFiles: boolean;

  breadcrumbs?: React.ReactNode;
  title?: string;
  parentActions: React.ReactNode[];
}

enum MODAL_STATUS {
  None,
  PendingRunAll,
  RunAll,
  ResultDetail,
}

enum SUMMARY_TYPE {
  ByTest = 1,
  BySubmission = 2,
}

const TestResultsTable = (props: IProps) => {
  const [summaryType, setSummaryType] = useState<SUMMARY_TYPE>(SUMMARY_TYPE.BySubmission);
  const [showDetail, setShowDetail] = useState(false);

  // Filters for result detail modal
  const [filterCategory, setFilterCategory] = useState<TestCategoryType | undefined>(undefined);
  const [filterCase, setFilterCase] = useState<TestCaseType | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<RESULT_STATUS | undefined>(undefined);
  const [filterSubmission, setFilterSubmission] = useState<SubmissionType | undefined>(undefined);

  const [passedByCase, setPassedByCase] = useState<TestsByCase>({});
  const [failedByCase, setFailedByCase] = useState<TestsByCase>({});
  const [errorByCase, setErrorByCase] = useState<TestsByCase>({});

  // ************************** Fetch Data ******************************
  useEffect(() => {
    const fetchData = async () => {
      if (props.submissions.length > 0 && props.assignment) {
        const [passed, failed, error]: any = getTestsByCase(props.testsBySubmission, props.testCasesByCategory);

        setPassedByCase(passed);
        setFailedByCase(failed);
        setErrorByCase(error);
        console.log('finished');
      }
    };
    fetchData();
  }, [props.testsBySubmission, props.testCasesByCategory]);

  const openDetail = (
    category: TestCategoryType | undefined,
    testCase: TestCaseType | undefined,
    status: RESULT_STATUS | undefined,
    submission: SubmissionType | undefined,
  ) => {
    setFilterCategory(category);
    setFilterCase(testCase);
    setFilterStatus(status);
    setFilterSubmission(submission);
    setShowDetail(true);
  };

  const onSummaryTypeChange = (e: any) => {
    // @ts-ignore
    const newType: SUMMARY_TYPE = SUMMARY_TYPE[e.target.value];
    setSummaryType(newType);
  };

  const actions = (
    <Radio.Group value={SUMMARY_TYPE[summaryType]} onChange={onSummaryTypeChange} buttonStyle="solid">
      <Tooltip title="Summary by submission">
        <Radio.Button key={SUMMARY_TYPE[SUMMARY_TYPE.BySubmission]} value={SUMMARY_TYPE[SUMMARY_TYPE.BySubmission]}>
          <Icon type="solution" />
        </Radio.Button>
      </Tooltip>
      <Tooltip title="Summary by test">
        <Radio.Button key={SUMMARY_TYPE[SUMMARY_TYPE.ByTest]} value={SUMMARY_TYPE[SUMMARY_TYPE.ByTest]}>
          <Icon type="cluster" />
        </Radio.Button>
      </Tooltip>
    </Radio.Group>
  );

  const detail = (
    <ResultDetail
      visible={showDetail}
      onCancel={setShowDetail.bind({}, false)}
      testsBySubmission={props.testsBySubmission}
      submissions={props.submissions}
      casesByCategory={props.testCasesByCategory}
      categories={props.categories}
      filterCategory={filterCategory}
      filterCase={filterCase}
      filterStatus={filterStatus}
      filterSubmission={filterSubmission}
    />
  );

  let columns: any = [];
  let data: any = [];

  if (!props.isLoading) {
    const totalTests = Object.values(props.testCasesByCategory).flat().length;

    switch (summaryType) {
      case SUMMARY_TYPE.BySubmission:
        columns = bySubmissionColumns(props.categories);
        if (props.submissions === undefined) {
          data = null;
          break;
        }
        data = props.submissions.map((submission: SubmissionType) => {
          const actionsMenu = (
            <Menu key={submission.id}>
              <Menu.Item key="run-tests" onClick={props.runSubmission.bind({}, submission)}>
                <Icon type="caret-right" />
                Run tests
              </Menu.Item>
              <Menu.Item key="submission" onClick={openSubmission.bind({}, submission.id)}>
                <Icon type="code" />
                Open submission
              </Menu.Item>
            </Menu>
          );

          const toRet: any = {
            students: submission.students.join(','),
            key: `submission-${submission.id}`,
            actions: props.subsLoading.includes(submission.id) ? (
              <Icon type="loading" />
            ) : (
              <Dropdown overlay={actionsMenu} trigger={['click']}>
                <Icon type="menu" />
              </Dropdown>
            ),
          };

          const tests = SubmissionTest.getLatest(props.testsBySubmission[submission.id] || []);
          let passed = 0;

          // Group the SubmissionTests by category
          const testByCategory: { [id: number]: SubmissionTestType[] } = {};
          tests.forEach((test) => {
            (testByCategory[test.testCategory] && testByCategory[test.testCategory].push(test)) ||
              (testByCategory[test.testCategory] = [test]);
            if (test.passed) {
              passed += 1;
            }
          });

          for (const category of props.categories) {
            const tests = testByCategory[category.id] || [];
            let categoryPassed = 0;
            let categoryTotal = category.testCases.length;
            for (const t of tests) {
              categoryPassed += t.passed ? 1 : 0;
            }
            toRet[category.name] = (
              <div
                className="text-link"
                onClick={openDetail.bind({}, category, undefined, undefined, submission)}
              >{`${categoryPassed} / ${categoryTotal}`}</div>
            );

            // For sorting (key specified in testSummaryUtils)
            toRet[category.id] = categoryPassed;
          }

          const summaryString = totalTests === 0 ? '-- / --' : `${passed} / ${totalTests}`;

          if (Object.keys(props.testCasesByCategory).length > 0) {
            toRet['summary'] = (
              <div className="text-link" onClick={openDetail.bind({}, undefined, undefined, undefined, submission)}>
                {summaryString}
              </div>
            );
          }

          // For sorting (key specified in testSummaryUtils)
          toRet['passed'] = passed;

          return toRet;
        });
        break;
      case SUMMARY_TYPE.ByTest:
        columns = byTestColumns;
        data = props.categories.map((category) => {
          let passed = 0;
          let failed = 0;
          let notRun = 0;
          let error = 0;

          const numTests = props.testCasesByCategory[category.id] ? props.testCasesByCategory[category.id].length : 0;

          const children = !props.testCasesByCategory[category.id]
            ? []
            : props.testCasesByCategory[category.id].map((testCase) => {
                const thisNotRun =
                  props.submissions.length -
                  passedByCase[testCase.id].length -
                  failedByCase[testCase.id].length -
                  errorByCase[testCase.id].length;
                passed += passedByCase[testCase.id].length;
                failed += failedByCase[testCase.id].length;
                error += errorByCase[testCase.id].length;
                notRun += thisNotRun;
                return {
                  description: (
                    <span className="text-link" onClick={openDetail.bind({}, category, testCase, undefined, undefined)}>
                      {testCase.description}
                    </span>
                  ),
                  passed: (
                    <div
                      className="text-link"
                      onClick={openDetail.bind({}, category, testCase, RESULT_STATUS.Passed, undefined)}
                    >
                      {passedByCase[testCase.id].length}
                    </div>
                  ),
                  failed: (
                    <div
                      className="text-link"
                      onClick={openDetail.bind({}, category, testCase, RESULT_STATUS.Failed, undefined)}
                    >
                      {failedByCase[testCase.id].length}
                    </div>
                  ),
                  error: (
                    <div
                      className="text-link"
                      onClick={openDetail.bind({}, category, testCase, RESULT_STATUS.Error, undefined)}
                    >
                      {errorByCase[testCase.id].length}
                    </div>
                  ),
                  notRun: thisNotRun,
                  key: `testCase-${testCase.id}`,
                };
              });

          return {
            description: (
              <span className="text-link" onClick={openDetail.bind({}, category, undefined, undefined, undefined)}>
                {category.name}
              </span>
            ),
            children: children,
            passed: (
              <div
                className="text-link"
                onClick={openDetail.bind({}, category, undefined, RESULT_STATUS.Passed, undefined)}
              >
                {`${Math.floor((passed / Math.max(1, props.submissions.length * numTests)) * 100)}%`}
              </div>
            ),
            failed: (
              <div
                className="text-link"
                onClick={openDetail.bind({}, category, undefined, RESULT_STATUS.Failed, undefined)}
              >
                {`${Math.floor((failed / Math.max(1, props.submissions.length * numTests)) * 100)}%`}
              </div>
            ),
            notRun: `${Math.floor((notRun / Math.max(1, props.submissions.length * numTests)) * 100)}%`,
            error: (
              <div
                className="text-link"
                onClick={openDetail.bind({}, category, undefined, RESULT_STATUS.Error, undefined)}
              >
                {`${Math.floor((error / Math.max(1, props.submissions.length * numTests)) * 100)}%`}
              </div>
            ),
            passedValue: passed / Math.max(1, props.submissions.length * numTests),
            failedValue: failed / Math.max(1, props.submissions.length * numTests),
            errorValue: error / Math.max(1, props.submissions.length * numTests),
            nullValue: notRun / Math.max(1, props.submissions.length * numTests),
            key: `category-${category.id}`,
          };
        });
        break;
    }
  }

  /* Show a message appropriate to the way in which the user is using the autograder */
  let emptyMessage = '';
  if (props.submissions.length === 0) {
    if (props.assignment.allowStudentUpload) {
      emptyMessage = "Once your students have uploaded, you'll be able to view test results here.";
    } else {
      emptyMessage = "Once you upload submissions for your students, you'll be able to run tests here.";
    }
  } else {
    emptyMessage = 'Create some tests and you will be able to run them here.';
  }

  return (
    <div>
      <TableDetail
        loadComplete={!props.isLoading}
        isEmpty={
          (Object.keys(props.testCasesByCategory).length === 0 && props.hasSourceFiles) ||
          props.submissions.length === 0
        }
        title={props.title}
        breadcrumbs={props.breadcrumbs}
        emptyNode={emptyMessage}
        actions={[actions, ...props.parentActions]}
        columns={columns}
        data={data}
        detail={detail}
      />
    </div>
  );
};

export default TestResultsTable;

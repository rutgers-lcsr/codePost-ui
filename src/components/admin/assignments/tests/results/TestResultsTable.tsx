// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import React, { useEffect, useState } from 'react';

import {
  CaretRightOutlined,
  ClusterOutlined,
  CodeOutlined,
  LoadingOutlined,
  MenuOutlined,
  SolutionOutlined,
} from '@ant-design/icons';

/* library imports */
import type { RadioChangeEvent } from 'antd';
import { Dropdown, Radio, Skeleton, Tooltip } from 'antd';

/* codePost object imports */
import {
  AssignmentType,
  SubmissionInfoType,
  SubmissionTestType,
  TestCaseType,
  TestCategoryType,
} from '../../../../../types/models';

/* codePost component imports */
import { TableDetail } from '../../../other/TableDetail';
import ResultDetail from './ResultDetail';

import { bySubmissionColumns, byTestColumns } from './testSummaryUtils';

/* codePost util imports */
import {
  getTestsByCase,
  RESULT_STATUS,
  TestCasesByCategory,
  TestsByCase,
  TestsBySubmission,
} from '../../../../core/testFetchUtils';
import { getLatestSubmissionTests } from '../../../../../utils/submissionTests';
import { openSubmission } from '../../../other/AdminUtils';

interface IProps {
  submissions: SubmissionInfoType[];
  assignment: AssignmentType;
  testCasesByCategory: TestCasesByCategory;
  testsBySubmission: TestsBySubmission;
  categories: TestCategoryType[];
  isLoading: boolean;
  subsLoading: number[];
  resultsLoading: boolean;
  runSubmission: (sub: SubmissionInfoType) => Promise<void>;

  breadcrumbs?: React.ReactNode;
  title?: string;
  parentActions: React.ReactNode[];
  tableOnly: boolean;
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
  const [filterSubmission, setFilterSubmission] = useState<SubmissionInfoType | undefined>(undefined);

  const [passedByCase, setPassedByCase] = useState<TestsByCase>({});
  const [failedByCase, setFailedByCase] = useState<TestsByCase>({});
  const [errorByCase, setErrorByCase] = useState<TestsByCase>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // ************************** Fetch Data ******************************
  useEffect(() => {
    const fetchData = async () => {
      if (props.submissions.length > 0 && props.assignment) {
        setIsProcessing(true);
        const [passed, failed, error] = getTestsByCase(props.testsBySubmission, props.testCasesByCategory) as [
          TestsByCase,
          TestsByCase,
          TestsByCase,
        ];
        setPassedByCase(passed);
        setFailedByCase(failed);
        setErrorByCase(error);
        setIsProcessing(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.testsBySubmission, props.testCasesByCategory]);

  const openDetail = (
    category: TestCategoryType | undefined,
    testCase: TestCaseType | undefined,
    status: RESULT_STATUS | undefined,
    submission: SubmissionInfoType | undefined,
  ) => {
    setFilterCategory(category);
    setFilterCase(testCase);
    setFilterStatus(status);
    setFilterSubmission(submission);
    setShowDetail(true);
  };

  const onSummaryTypeChange = (e: RadioChangeEvent) => {
    const newType = SUMMARY_TYPE[e.target.value as keyof typeof SUMMARY_TYPE];
    if (newType !== undefined) {
      setSummaryType(newType);
    }
  };

  const actions = (
    <Radio.Group value={SUMMARY_TYPE[summaryType]} onChange={onSummaryTypeChange} buttonStyle="solid">
      <Tooltip title="Summary by submission">
        <Radio.Button key={SUMMARY_TYPE[SUMMARY_TYPE.BySubmission]} value={SUMMARY_TYPE[SUMMARY_TYPE.BySubmission]}>
          <SolutionOutlined />
        </Radio.Button>
      </Tooltip>
      <Tooltip title="Summary by test">
        <Radio.Button key={SUMMARY_TYPE[SUMMARY_TYPE.ByTest]} value={SUMMARY_TYPE[SUMMARY_TYPE.ByTest]}>
          <ClusterOutlined />
        </Radio.Button>
      </Tooltip>
    </Radio.Group>
  );

  const detail = (
    <ResultDetail
      open={showDetail}
      onCancel={() => setShowDetail(false)}
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

  let columns: unknown[] = [];
  let data: unknown[] = [];

  if (!props.isLoading) {
    const totalTests = Object.values(props.testCasesByCategory).flat().length;

    switch (summaryType) {
      case SUMMARY_TYPE.BySubmission: {
        const allowSort = !props.resultsLoading && !props.isLoading;
        columns = bySubmissionColumns(allowSort, props.categories);
        if (props.submissions === undefined) {
          data = [];
          break;
        }
        data = props.submissions.map((submission: SubmissionInfoType) => {
          const actionsMenuItems = [
            {
              key: 'run-tests',
              label: (
                <>
                  <CaretRightOutlined /> Run tests
                </>
              ),
              onClick: () => props.runSubmission(submission),
            },
            {
              key: 'submission',
              label: (
                <>
                  <CodeOutlined /> Open submission
                </>
              ),
              onClick: () => openSubmission(submission.id),
            },
          ];

          const toRet: Record<string, unknown> = {
            students: submission.students.join(','),
            key: `submission-${submission.id}`,
            actions: props.subsLoading.includes(submission.id) ? (
              <LoadingOutlined />
            ) : (
              <Dropdown menu={{ items: actionsMenuItems }} trigger={['click']}>
                <MenuOutlined />
              </Dropdown>
            ),
          };

          // Is the submission's tests still loading via pagination?
          const isLoading = props.testsBySubmission[submission.id] === undefined;
          if (isLoading) {
            toRet['summary'] = <Skeleton.Button active={true} size="default" shape="round" />;
            toRet['passed'] = 0;
            for (const category of props.categories) {
              toRet[category.name] = <Skeleton.Button active={true} size="default" shape="round" />;
            }
            return toRet;
          }

          const tests = getLatestSubmissionTests(props.testsBySubmission[submission.id] || []);
          let passed = 0;

          // Group the SubmissionTests by category
          const testByCategory: { [id: number]: SubmissionTestType[] } = {};
          tests.forEach((test) => {
            if (testByCategory[test.testCategory]) {
              testByCategory[test.testCategory].push(test);
            } else {
              testByCategory[test.testCategory] = [test];
            }
            if (test.passed) {
              passed += 1;
            }
          });

          for (const category of props.categories) {
            const tests = testByCategory[category.id] || [];
            let categoryPassed = 0;
            const categoryTotal = category.testCases.length;
            for (const t of tests) {
              categoryPassed += t.passed ? 1 : 0;
            }
            toRet[category.name] = (
              <div
                className="text-link"
                onClick={() => openDetail(category, undefined, undefined, submission)}
              >{`${categoryPassed} / ${categoryTotal}`}</div>
            );

            // For sorting (key specified in testSummaryUtils)
            toRet[category.id] = categoryPassed;
          }

          const summaryString = totalTests === 0 ? '-- / --' : `${passed} / ${totalTests}`;

          if (Object.keys(props.testCasesByCategory).length > 0) {
            toRet['summary'] = (
              <div className="text-link" onClick={() => openDetail(undefined, undefined, undefined, submission)}>
                {summaryString}
              </div>
            );
          }

          // For sorting (key specified in testSummaryUtils)
          toRet['passed'] = passed;

          return toRet;
        });
        break;
      }
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
                //  If the pagination hasn't completed, show skeletons
                if (props.resultsLoading) {
                  return {
                    description: <span>{testCase.description}</span>,
                    passed: <Skeleton.Button active={true} size="default" shape="round" />,
                    failed: <Skeleton.Button active={true} size="default" shape="round" />,
                    error: <Skeleton.Button active={true} size="default" shape="round" />,
                    notRun: <Skeleton.Button active={true} size="default" shape="round" />,
                    key: `testCase-${testCase.id}`,
                  };
                }

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
                    <span className="text-link" onClick={() => openDetail(category, testCase, undefined, undefined)}>
                      {testCase.description}
                    </span>
                  ),
                  passed: (
                    <div
                      className="text-link"
                      onClick={() => openDetail(category, testCase, RESULT_STATUS.Passed, undefined)}
                    >
                      {passedByCase[testCase.id].length}
                    </div>
                  ),
                  failed: (
                    <div
                      className="text-link"
                      onClick={() => openDetail(category, testCase, RESULT_STATUS.Failed, undefined)}
                    >
                      {failedByCase[testCase.id].length}
                    </div>
                  ),
                  error: (
                    <div
                      className="text-link"
                      onClick={() => openDetail(category, testCase, RESULT_STATUS.Error, undefined)}
                    >
                      {errorByCase[testCase.id].length}
                    </div>
                  ),
                  notRun: thisNotRun,
                  key: `testCase-${testCase.id}`,
                };
              });

          if (props.resultsLoading) {
            //  If the pagination hasn't completed, show skeletons
            return {
              description: <span>{category.name}</span>,
              children: children,
              passed: <Skeleton.Button active={true} size="default" shape="round" />,
              failed: <Skeleton.Button active={true} size="default" shape="round" />,
              error: <Skeleton.Button active={true} size="default" shape="round" />,
              notRun: <Skeleton.Button active={true} size="default" shape="round" />,
              key: `category-${category.id}`,
              passedValue: 0,
              failedValue: 0,
              errorValue: 0,
              nullValue: 0,
            };
          }

          return {
            description: (
              <span className="text-link" onClick={() => openDetail(category, undefined, undefined, undefined)}>
                {category.name}
              </span>
            ),
            children: children,
            passed: (
              <div
                className="text-link"
                onClick={() => openDetail(category, undefined, RESULT_STATUS.Passed, undefined)}
              >
                {`${Math.floor((passed / Math.max(1, props.submissions.length * numTests)) * 100)}%`}
              </div>
            ),
            failed: (
              <div
                className="text-link"
                onClick={() => openDetail(category, undefined, RESULT_STATUS.Failed, undefined)}
              >
                {`${Math.floor((failed / Math.max(1, props.submissions.length * numTests)) * 100)}%`}
              </div>
            ),
            notRun: `${Math.floor((notRun / Math.max(1, props.submissions.length * numTests)) * 100)}%`,
            error: (
              <div
                className="text-link"
                onClick={() => openDetail(category, undefined, RESULT_STATUS.Error, undefined)}
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
  let emptyMessage: string;
  if (props.submissions.length === 0) {
    if (props.assignment.allowStudentUpload) {
      emptyMessage = "Once your students have uploaded, you'll be able to view test results here.";
    } else {
      emptyMessage = "Once you upload submissions for your students, you'll be able to run tests here.";
    }
  } else {
    emptyMessage = 'Create some tests and you will be able to run them here.';
  }

  // Show the full layout
  return (
    <div>
      <TableDetail
        loadComplete={!props.isLoading && !isProcessing}
        isEmpty={props.submissions.length === 0}
        title={props.title}
        breadcrumbs={props.breadcrumbs}
        emptyNode={emptyMessage}
        actions={[actions, ...props.parentActions]}
        columns={columns}
        data={data}
        detail={detail}
        tableOnly={props.tableOnly}
      />
    </div>
  );
};

export default TestResultsTable;

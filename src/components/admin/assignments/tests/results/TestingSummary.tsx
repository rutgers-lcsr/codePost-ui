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
import { SubmissionTestResultType } from '../../../../../infrastructure/autograder/runTypes';

import { awaitTestResult } from '../testResult';

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
  breadcrumbs?: React.ReactElement[];
  submissions: SubmissionType[];
  currentAssignment: AssignmentType;
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

export const TestingSummary = (props: IProps & RouteComponentProps) => {
  // ************************** State Variables ******************************
  // objects
  const [env, setEnv] = useState<EnvironmentType | undefined>(undefined);
  const [categories, setCategories] = useState<TestCategoryType[]>([]);

  // Calculated data structures
  const [testCasesByCategory, setTestCasesByCategory] = useState<TestCasesByCategory>({});
  const [testsBySubmission, setTestsBySubmission] = useState<TestsBySubmission>({});
  const [passedByCase, setPassedByCase] = useState<TestsByCase>({});
  const [failedByCase, setFailedByCase] = useState<TestsByCase>({});
  const [errorByCase, setErrorByCase] = useState<TestsByCase>({});

  // Filters for result detail modal
  const [filterCategory, setFilterCategory] = useState<TestCategoryType | undefined>(undefined);
  const [filterCase, setFilterCase] = useState<TestCaseType | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<RESULT_STATUS | undefined>(undefined);
  const [filterSubmission, setFilterSubmission] = useState<SubmissionType | undefined>(undefined);

  // Loading
  const [subsLoading, setSubsLoading] = useState<number[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Page state
  const [modalStatus, setModalStatus] = useState<MODAL_STATUS>(MODAL_STATUS.None);
  const [summaryType, setSummaryType] = useState<SUMMARY_TYPE>(SUMMARY_TYPE.BySubmission);

  // Run all specific
  const [progress, setProgress] = useState('{}');
  const [sendEmail, setSendEmail] = useState(true);

  // ************************** Fetch Data ******************************
  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      const [categories, casesByCategory]: any = await fetchTestData(props.currentAssignment);
      setCategories(categories);
      setTestCasesByCategory(casesByCategory);
      const currEnv = await fetchEnvironment(props.currentAssignment);
      setEnv(currEnv);

      const tests = await fetchTestsBySubmission(props.submissions);
      setTestsBySubmission(tests);
      const [passed, failed, error]: any = getTestsByCase(tests, casesByCategory);

      setPassedByCase(passed);
      setFailedByCase(failed);
      setErrorByCase(error);
      setFetchLoading(false);
    };
    fetchData();
  }, [props.currentAssignment, props.submissions]);

  // ******************************* API / State change functions  *******************************
  const runAllProgressCallback = (result: any) => {
    setProgress(result);
  };

  const runAllCallback = (result: SubmissionTestResultType) => {
    const newTestBySub: TestsBySubmission = {};
    for (const test of result.submissionTests) {
      const subID = test.submission;
      newTestBySub[subID] = (newTestBySub[subID] && [...newTestBySub[subID], test]) || [test];
    }
    setTestsBySubmission(newTestBySub);
    const newEnv = { ...env! };
    newEnv.isRunning = false;
    setEnv(newEnv);
    setModalStatus(MODAL_STATUS.None);
    setProgress('{}');
  };

  const callback = (sub: SubmissionType, result: SubmissionTestResultType) => {
    const newTestBySub = { ...testsBySubmission };
    newTestBySub[sub.id] = result.submissionTests;
    setTestsBySubmission(newTestBySub);
    const newLoadingSubs = subsLoading.filter((id) => {
      return id !== sub.id;
    });
    setSubsLoading(newLoadingSubs);
  };

  const runTests = async (sub: SubmissionType) => {
    if (env) {
      setSubsLoading([...subsLoading, sub.id]);
      const result = await Environment.run(env.id, { submission: sub.id.toString(), simulate: 'False' });
      awaitTestResult(result.task, callback.bind({}, sub));
    }
  };

  const getEstimate = (numSubmissions: number) => {
    const showWith0 = (value: number) => (value < 10 ? `0${value}` : `${value}`);
    const estimateInSeconds = numSubmissions * 4;

    const hours = showWith0(Math.floor((estimateInSeconds / (60 * 60)) % 60));
    const minutes = showWith0(Math.floor((estimateInSeconds / 60) % 60));
    const seconds = showWith0(Math.floor(estimateInSeconds % 60));
    return `${parseInt(hours) ? `${hours}hr` : ''}${minutes}m ${seconds}s`;
  };

  const triggerRunAll = () => {
    setModalStatus(MODAL_STATUS.PendingRunAll);
  };

  const runAll = async () => {
    if (env) {
      const result = await Environment.runAll({ id: env.id, sendEmail: sendEmail });
      awaitTestResult(result.task, runAllCallback, runAllProgressCallback);
      const newEnv = { ...env };
      newEnv.isRunning = true;
      setModalStatus(MODAL_STATUS.RunAll);
      setEnv(newEnv);
    }
  };

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
    setModalStatus(MODAL_STATUS.ResultDetail);
  };

  // ******************************* Return  *******************************
  let actions: any = [];
  const totalTests = categories.reduce((acc: number, cat) => {
    return acc + cat.testCases.length;
  }, 0);

  let columns: any = [];
  let data: any = [];

  if (!fetchLoading) {
    switch (summaryType) {
      case SUMMARY_TYPE.BySubmission:
        columns = bySubmissionColumns(categories);
        data =
          props.submissions !== undefined
            ? props.submissions.map((submission: SubmissionType) => {
                const actionsMenu = (
                  <Menu key={submission.id}>
                    <Menu.Item key="run-tests" onClick={runTests.bind({}, submission)}>
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
                  actions: subsLoading.includes(submission.id) ? (
                    <Icon type="loading" />
                  ) : (
                    <Dropdown overlay={actionsMenu} trigger={['click']}>
                      <Icon type="menu" />
                    </Dropdown>
                  ),
                };

                const tests = SubmissionTest.getLatest(testsBySubmission[submission.id] || []);
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

                for (const category of categories) {
                  const tests = testByCategory[category.id] || [];
                  let categoryPassed = 0;
                  let categoryTotal = category.testCases.length;
                  for (const t of tests) {
                    categoryPassed += t.passed ? 1 : 0;
                  }
                  toRet[category.id] = (
                    <div
                      className="text-link"
                      onClick={openDetail.bind({}, category, undefined, undefined, submission)}
                    >{`${categoryPassed} / ${categoryTotal}`}</div>
                  );
                }

                const summaryString = totalTests === 0 ? '-- / --' : `${passed} / ${totalTests}`;

                toRet['summary'] = (
                  <div className="text-link" onClick={openDetail.bind({}, undefined, undefined, undefined, submission)}>
                    {summaryString}
                  </div>
                );
                return toRet;
              })
            : null;
        break;
      case SUMMARY_TYPE.ByTest:
        columns = byTestColumns;
        data = categories.map((category) => {
          let passed = 0;
          let failed = 0;
          let notRun = 0;
          let error = 0;

          const numTests = testCasesByCategory[category.id] ? testCasesByCategory[category.id].length : 0;

          const children = !testCasesByCategory[category.id]
            ? []
            : testCasesByCategory[category.id].map((testCase) => {
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
            key: `category-${category.id}`,
          };
        });
        break;
    }
  }

  const onSummaryTypeChange = (e: any) => {
    // @ts-ignore
    const newType: SUMMARY_TYPE = SUMMARY_TYPE[e.target.value];
    setSummaryType(newType);
  };

  const onCloseRunAll = () => {
    setModalStatus(MODAL_STATUS.None);
    setProgress('{}');
  };

  const hasExternalTests = () => {
    let hasExternal = false;
    Object.keys(testCasesByCategory).forEach((category: string) => {
      testCasesByCategory[parseInt(category, 10)].forEach((test) => test.type === 'external' && (hasExternal = true));
    });

    return hasExternal;
  };

  actions = [
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
    </Radio.Group>,
    <Button
      type="default"
      disabled={totalTests === 0 || props.submissions.length === 0}
      onClick={triggerRunAll}
      loading={env && env.isRunning}
    >
      Run all Tests
    </Button>,
    <Button type="primary">
      <Link to={[...props.match.url.split('/').slice(0, props.match.url.split('/').length - 1), 'edit'].join('/')}>
        Edit Tests
      </Link>
    </Button>,
  ];

  const detail = [
    <ResultDetail
      visible={modalStatus === MODAL_STATUS.ResultDetail}
      onCancel={setModalStatus.bind({}, MODAL_STATUS.None)}
      testsBySubmission={testsBySubmission}
      submissions={props.submissions}
      casesByCategory={testCasesByCategory}
      categories={categories}
      filterCategory={filterCategory}
      filterCase={filterCase}
      filterStatus={filterStatus}
      filterSubmission={filterSubmission}
    />,
    <RunAllModal
      visible={modalStatus === MODAL_STATUS.RunAll}
      onCancel={onCloseRunAll}
      cases={Object.values(testCasesByCategory).flat()}
      raw={progress}
      numSubmissions={props.submissions !== undefined ? props.submissions.length : 0}
    />,
    <Modal
      visible={modalStatus === MODAL_STATUS.PendingRunAll}
      onCancel={setModalStatus.bind({}, MODAL_STATUS.None)}
      onOk={runAll}
      okText="Run"
      title="Confirm Run All Tests"
    >
      <div style={{ fontSize: 16 }}>
        {hasExternalTests() && (
          <div style={{ fontSize: 14, marginBottom: 15, color: 'orange' }}>
            WARNING: You have some tests with type 'external'. External tests are to be set using the API, and will not
            be run when you run tests in the codePost autograder. If you would like them to be run in the codePost
            autograder, then please change the test type.
          </div>
        )}
        <div>
          Estimated time to complete:{' '}
          <b>{getEstimate(props.submissions !== undefined ? props.submissions.length : 0)}</b>
        </div>
        <br />
        <div>
          <Checkbox checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} /> Send me an email when
          completed
        </div>
      </div>
    </Modal>,
  ];

  return (
    <div>
      <TableDetail
        loadComplete={!fetchLoading}
        isEmpty={Object.keys(testCasesByCategory).length === 0 || props.submissions.length === 0}
        title={`${props.currentAssignment.name} | Tests Summary`}
        breadcrumbs={
          <Breadcrumb>
            {props.breadcrumbs}
            <Breadcrumb.Item key="assignment">{props.currentAssignment.name}</Breadcrumb.Item>
            <Breadcrumb.Item>Results</Breadcrumb.Item>
          </Breadcrumb>
        }
        emptyNode={
          Object.keys(testCasesByCategory).length === 0
            ? 'Create some tests and you will be able to run them here'
            : 'Upload a submission for your students to see test results.'
        }
        actions={actions}
        columns={columns}
        data={data}
        detail={detail}
      />
    </div>
  );
};

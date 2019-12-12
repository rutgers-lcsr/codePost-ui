/* react imports */
import React, { useState, useEffect } from 'react';

/* library imports */
import { Breadcrumb, Button, Dropdown, Icon, Menu } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

/* codePost object imports */
import { SubmissionType } from '../../../../../infrastructure/submission';
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionTest } from '../../../../../infrastructure/submissionTest';
import { TestCategory, TestCategoryType } from '../../../../../infrastructure/testCategory';
import { TestCaseType } from '../../../../../infrastructure/testCase';

import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { SubmissionTestResultType } from '../../../../../infrastructure/autograder/runTypes';

import { awaitTestResult } from '../testResult';

/* codePost component imports */
import { TableDetail } from '../../../other/TableDetail';
import RunAllModal from './RunAllModal';
import ResultDetail from './ResultDetail';

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
  RunAll,
  ResultDetail,
}

export const TestingSummary = (props: IProps & RouteComponentProps) => {
  // ************************** State Variables ******************************
  const [testCasesByCategory, setTestCasesByCategory] = useState<TestCasesByCategory>({});
  const [categories, setCategories] = useState<TestCategoryType[]>([]);
  const [testsBySubmission, setTestsBySubmission] = useState<TestsBySubmission>({});
  const [passedByCase, setPassedByCase] = useState<TestsByCase>({});
  const [failedByCase, setFailedByCase] = useState<TestsByCase>({});
  const [errorByCase, setErrorByCase] = useState<TestsByCase>({});

  const [filterCategory, setFilterCategory] = useState<TestCategoryType | undefined>(undefined);
  const [filterCase, setFilterCase] = useState<TestCaseType | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<RESULT_STATUS | undefined>(undefined);
  const [filterSubmission, setFilterSubmission] = useState<SubmissionType | undefined>(undefined);

  const [subsLoading, setSubsLoading] = useState<number[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [env, setEnv] = useState<EnvironmentType | undefined>(undefined);
  const [progress, setProgress] = useState('{}');

  const [modalStatus, setModalStatus] = useState<MODAL_STATUS>(MODAL_STATUS.None);

  // ************************** Fetch Data ******************************
  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      const [categories, casesByCategory]: any = await fetchTestData(props.currentAssignment);
      setCategories(categories);
      setTestCasesByCategory(casesByCategory);
      setFetchLoading(false);
      const currEnv = await fetchEnvironment(props.currentAssignment);
      setEnv(currEnv);
    };
    fetchData();
  }, [props.currentAssignment]);

  useEffect(() => {
    const fetchData = async () => {
      const tests = await fetchTestsBySubmission(props.submissions);
      setTestsBySubmission(tests);
      const [passed, failed, error]: any = getTestsByCase(tests);

      setPassedByCase(passed);
      setFailedByCase(failed);
      setErrorByCase(error);
    };
    fetchData();
  }, [props.submissions]);

  // ******************************* API / State change functions  *******************************
  const runAllProgressCallback = (result: any) => {
    setProgress(result);
  };

  const runAllCallback = (result: SubmissionTestResultType) => {
    const newTestBySub: TestsBySubmission = {};
    for (const test of result) {
      const subID = test.submission;
      newTestBySub[subID] = (newTestBySub[subID] && [...newTestBySub[subID], test]) || [test];
    }
    setTestsBySubmission(newTestBySub);
    const newEnv = { ...env! };
    newEnv.isRunning = false;
    setEnv(newEnv);
    setModalStatus(MODAL_STATUS.None);
  };

  const callback = (sub: SubmissionType, result: SubmissionTestResultType) => {
    const newTestBySub = { ...testsBySubmission };
    newTestBySub[sub.id] = result;
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

  const runAll = async () => {
    if (env) {
      const result = await Environment.runAll(env.id);
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

  const columns = [
    {
      title: 'Student(s)',
      dataIndex: 'students',
      key: 'students',
      sorter: (a: any, b: any) => a.students.localeCompare(b.students),
    },
    ...TestCategory.sort(categories).map((category) => {
      return {
        title: category.name,
        dataIndex: category.id.toString(),
        key: category.id.toString(),
        align: 'center' as 'center',
      };
    }),
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      align: 'center' as 'center',
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: 'center' as 'center',
    },
  ];

  const data = props.submissions.map((submission: SubmissionType) => {
    const actionsMenu = (
      <Menu>
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
      key: submission.id,
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
    const testByCategory: any = {};
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
      let categoryTotal = tests.length;
      for (const t of tests) {
        categoryPassed += t.passed ? 1 : 0;
      }
      toRet[category.id] = (
        <div
          onClick={openDetail.bind({}, category, undefined, undefined, submission)}
        >{`${categoryPassed} / ${categoryTotal}`}</div>
      );
    }

    const summaryString = totalTests === 0 ? '-- / --' : `${passed} / ${totalTests}`;

    toRet['summary'] = (
      <div onClick={openDetail.bind({}, undefined, undefined, undefined, submission)}>{summaryString}</div>
    );
    return toRet;
  });

  actions = [
    <Button type="default" disabled={totalTests === 0} onClick={runAll} loading={env && env.isRunning}>
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
      passedByCase={passedByCase}
      failedByCase={failedByCase}
      errorByCase={errorByCase}
      filterCategory={filterCategory}
      filterCase={filterCase}
      filterStatus={filterStatus}
      filterSubmission={filterSubmission}
    />,
    <RunAllModal
      visible={modalStatus === MODAL_STATUS.RunAll}
      onCancel={setModalStatus.bind({}, MODAL_STATUS.None)}
      cases={Object.values(testCasesByCategory).flat()}
      raw={progress}
      numSubmissions={props.submissions.length}
    />,
  ];

  return (
    <TableDetail
      loadComplete={!fetchLoading}
      isEmpty={Object.keys(testCasesByCategory).length === 0}
      title={`${props.currentAssignment.name} | Tests Summary`}
      breadcrumbs={
        <Breadcrumb>
          {props.breadcrumbs}
          <Breadcrumb.Item key="assignment">{props.currentAssignment.name}</Breadcrumb.Item>
          <Breadcrumb.Item>Results</Breadcrumb.Item>
        </Breadcrumb>
      }
      emptyNode={'Create some tests and you will be able to run them here'}
      actions={actions}
      columns={columns}
      data={data}
      detail={detail}
    />
  );
};

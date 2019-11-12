/* react imports */
import React, { useState, useEffect } from 'react';

/* library imports */
import { Breadcrumb, Button, Dropdown, Empty, Icon, Menu, Table, Modal } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

/* codePost object imports */
import { SubmissionType } from '../../../../../infrastructure/submission';
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionTest } from '../../../../../infrastructure/submissionTest';
import { TestCategory, TestCategoryType } from '../../../../../infrastructure/testCategory';
import { Submission } from '../../../../../infrastructure/submission';
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { SubmissionTestResultType } from '../../../../../infrastructure/autograder/runTypes';

import { awaitTestResult } from '../testResult';

/* codePost component imports */
import { TableDetail } from '../../../other/TableDetail';
import { TestResultPopover } from './TestResultPopover';
import RunAllModal from './RunAllModal';

/* codePost util imports */
import {
  fetchTestData,
  fetchEnvironment,
  fetchTestsBySubmission,
  TestsBySubmission,
  TestCasesByCategory,
} from '../../../../core/testFetchUtils';
import { openSubmission } from '../../../other/AdminUtils';

interface IProps {
  breadcrumbs?: React.ReactElement[];
  submissions: SubmissionType[];
  currentAssignment: AssignmentType;
  onCancel: () => void;
}

export const TestingSummary = (props: IProps & RouteComponentProps) => {
  // ************************** State Variables ******************************
  const [testCasesByCategory, setTestCasesByCategory] = useState<TestCasesByCategory>({});
  const [categories, setCategories] = useState<TestCategoryType[]>([]);
  const [testsBySubmission, setTestsBySubmission] = useState<TestsBySubmission>({});
  const [subsLoading, setSubsLoading] = useState<number[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [env, setEnv] = useState<EnvironmentType | undefined>(undefined);
  const [progress, setProgress] = useState('{}');

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
    };
    fetchData();
  }, [props.submissions]);

  // ******************************* API / State change functions  *******************************
  const runAllCallback = (result: any) => {
    setProgress(result);
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
    setSubsLoading([...subsLoading, sub.id]);
    const result = await Submission.run(sub.id);
    awaitTestResult(result.task, callback.bind({}, sub));
  };

  const runAll = async () => {
    if (env) {
      const result = await Environment.runAll(env.id);
      awaitTestResult(result.task, runAllCallback, runAllCallback);
      const newEnv = { ...env };
      newEnv.isRunning = true;
      setEnv(newEnv);
    }
  };

  // ******************************* Return  *******************************
  let content;
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
      toRet[category.id] = (
        <TestResultPopover
          submissionTests={testByCategory[category.id] || []}
          testCases={testCasesByCategory[category.id] || []}
        />
      );
    }

    toRet['summary'] = totalTests === 0 ? '-- / --' : <div>{`${passed} / ${totalTests}`}</div>;
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

  const detail = <RunAllModal raw={JSON.parse(progress)} />;

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

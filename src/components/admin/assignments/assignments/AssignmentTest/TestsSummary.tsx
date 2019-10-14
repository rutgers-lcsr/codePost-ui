import React, { useState, useEffect } from 'react';

import { SubmissionType } from '../../../../../infrastructure/submission';
import { Assignment, AssignmentType } from '../../../../../infrastructure/assignment';
import { TestCase, TestCaseType } from '../../../../../infrastructure/testCase';
import { SubmissionTest, SubmissionTestType } from '../../../../../infrastructure/submissionTest';

import { Breadcrumb, Button, Empty, Spin, Table } from 'antd';

import CPAdminDetail from '../../../other/CPAdminDetail';

interface IProps {
  submissions: SubmissionType[];
  currentAssignment: AssignmentType;

  switchDetail: () => void;
  onCancel: () => void;
}

interface TestsBySubmission {
  [submissionID: number]: SubmissionTestType[];
}

const getTestCases = async (assignment: AssignmentType) => {
  const testPromises = assignment.testCases.map((id) => {
    return TestCase.read(id);
  });
  return await Promise.all(testPromises);
};

const getTestsBySubmission = async (submissions: SubmissionType[]) => {
  const toRet: TestsBySubmission = {};
  await submissions.map(async (submission) => {
    const testPromises = submission.tests.map((id) => {
      return SubmissionTest.read(id);
    });
    const tests = await Promise.all(testPromises);
    toRet[submission.id] = tests;
  });
  return toRet;
};

export const TestsSummary = (props: IProps) => {
  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState<TestCaseType[]>([]);
  const [testsBySubmission, setTestsBySubmission] = useState<TestsBySubmission>({});

  // ******************************* Fetch Data  *******************************
  useEffect(() => {
    const fetchData = async () => {
      const tests = await getTestCases(props.currentAssignment);
      setTestCases(tests);
    };
    fetchData();
  }, [props.currentAssignment]);

  useEffect(() => {
    const fetchData = async () => {
      const tests = await getTestsBySubmission(props.submissions);
      setTestsBySubmission(tests);
    };
    fetchData();
  }, [props.submissions]);

  // ******************************* Return  *******************************
  let content;
  let actions: any = [];
  if (loading) {
    content = <Spin />;
  } else if (props.currentAssignment.testCases.length == 0) {
    content = <Empty />;
  } else {
    const columns = [
      {
        title: 'Student(s)',
        dataIndex: 'students',
        key: 'students',
      },
      ...TestCase.sort(testCases).map((testCase) => {
        return {
          title: testCase.name,
          dataIndex: testCase.id.toString(),
          key: testCase.id.toString(),
        };
      }),
    ];

    const data = props.submissions.map((submission: SubmissionType) => {
      const toRet: any = {
        students: submission.students,
        key: submission.id,
      };
      const tests = submission.id in testsBySubmission ? testsBySubmission[submission.id] : [];

      const casesWithTests = new Set(
        tests.map((test) => {
          return test.testCase;
        }),
      );

      for (const test of tests) {
        toRet[test.testCase] = test.passed ? 'PASSED' : 'FAILED';
      }
      for (const testCase of testCases) {
        if (!casesWithTests.has(testCase.id)) {
          toRet[testCase.id] = 'NOT RUN';
        }
      }
      return toRet;
    });

    content = <Table columns={columns} dataSource={data} />;
  }

  actions = [
    <Button type="primary" onClick={props.switchDetail}>
      Edit Tests
    </Button>,
  ];

  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item onClick={props.onCancel}>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a>Assignments</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{props.currentAssignment.name}</Breadcrumb.Item>
          <Breadcrumb.Item>Tests Summary</Breadcrumb.Item>
        </Breadcrumb>
      }
      goBack={null}
      title={`${props.currentAssignment.name} | Tests Summary`}
      actions={actions}
      content={content}
    />
  );
};

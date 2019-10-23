import React, { useState, useEffect } from 'react';

import { SubmissionType } from '../../../../../infrastructure/submission';
import { Assignment, AssignmentType } from '../../../../../infrastructure/assignment';
import { TestCase, TestCaseType } from '../../../../../infrastructure/testCase';
import { SubmissionTest, SubmissionTestType } from '../../../../../infrastructure/submissionTest';
import { Submission } from '../../../../../infrastructure/submission';

import { Breadcrumb, Button, Dropdown, Empty, Icon, Input, Menu, Popover, Spin, Table } from 'antd';

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
  const promises = submissions.map(async (submission) => {
    const testPromises = submission.tests.map((id) => {
      return SubmissionTest.read(id);
    });
    const tests = await Promise.all(testPromises);
    toRet[submission.id] = tests;
  });
  await Promise.all(promises);
  return toRet;
};

export const TestResults = (props: IProps) => {
  const [loading, setLoading] = useState(false);
  const [testCases, setTestCases] = useState<TestCaseType[]>([]);
  const [testsBySubmission, setTestsBySubmission] = useState<TestsBySubmission>({});
  const [loadingSubs, setLoadingSubs] = useState<number[]>([]);

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

    const runTests = async (sub: SubmissionType) => {
      setLoadingSubs([...loadingSubs, sub.id]);
      const newTests = await Submission.runTests(sub.id);
      const newTestBySub = { ...testsBySubmission };
      newTestBySub[sub.id] = newTests;
      setTestsBySubmission(newTestBySub);
      const newLoadingSubs = loadingSubs.filter((id) => {
        return id !== sub.id;
      });
      setLoadingSubs(newLoadingSubs);
    };

    const data = props.submissions.map((submission: SubmissionType) => {
      const actionsMenu = (
        <Menu>
          <Menu.Item key="1" onClick={runTests.bind({}, submission)}>
            <Icon type="caret-right" />
            Run tests
          </Menu.Item>
        </Menu>
      );
      let passed = 0;
      let total = 0;
      const toRet: any = {
        students: submission.students,
        key: submission.id,
        actions: loadingSubs.includes(submission.id) ? (
          <Icon type="loading" />
        ) : (
          <Dropdown overlay={actionsMenu} trigger={['click']}>
            <Icon type="menu" />
          </Dropdown>
        ),
      };
      const tests = testsBySubmission[submission.id] || [];

      const casesWithTests = new Set(
        tests.map((test) => {
          return test.testCase;
        }),
      );

      for (const test of tests) {
        if (test.passed) {
          passed += 1;
        }
        toRet[test.testCase] = (
          <Popover
            content={
              <div style={{ color: 'black', minWidth: 700 }}>
                <Input.TextArea
                  disabled={true}
                  value={test.logs}
                  autosize={{ minRows: 4, maxRows: 8 }}
                  style={{ marginTop: 15 }}
                />
              </div>
            }
            title="Logs"
          >
            {test.passed ? (
              <Icon type="check-circle" style={{ color: '#24be85' }} />
            ) : (
              <Icon type="exclamation-circle" style={{ color: 'red' }} />
            )}
          </Popover>
        );
      }
      for (const testCase of testCases) {
        total += 1;
        if (!casesWithTests.has(testCase.id)) {
          toRet[testCase.id] = <Icon type="minus" style={{ color: 'grey' }} />;
        }
      }

      toRet['summary'] = <div>{`${passed} / ${total}`}</div>;
      return toRet;
    });

    content = <Table columns={columns} dataSource={data} />;
  }

  const runAll = async () => {
    setLoadingSubs(
      props.submissions.map((sub) => {
        return sub.id;
      }),
    );
    const newTestsBySub: TestsBySubmission = {};
    const promises = props.submissions.map((sub) => {
      return Submission.runTests(sub.id);
    });
    const newTests = await Promise.all(promises);
    newTests.forEach((subTests) => {
      const subID = subTests[0].submission;
      newTestsBySub[subID] = subTests;
    });
    setTestsBySubmission(newTestsBySub);
    setLoadingSubs([]);
  };

  actions = [
    <Button type="default" onClick={runAll}>
      Run all Tests
    </Button>,
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

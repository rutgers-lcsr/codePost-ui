/* react imports */
import React, { useState, useEffect } from 'react';

/* library imports */
import { Breadcrumb, Button, Dropdown, Empty, Icon, Input, Menu, Popover, Table } from 'antd';

/* codePost object imports */
import { SubmissionType } from '../../../../../infrastructure/submission';
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { TestCategory, TestCategoryType } from '../../../../../infrastructure/testCategory';
import { Submission } from '../../../../../infrastructure/submission';

/* codePost component imports */
import CPAdminDetail from '../../../other/CPAdminDetail';

/* codePost util imports */
import { fetchTestData, fetchTestsBySubmission, TestsBySubmission, TestCasesByCategory } from './testUtils';

interface IProps {
  submissions: SubmissionType[];
  currentAssignment: AssignmentType;
  switchDetail: () => void;
  onCancel: () => void;
}

export const TestResults = (props: IProps) => {
  // ************************** State Variables ******************************
  const [testCasesByCategory, setTestCasesByCategory] = useState<TestCasesByCategory>({});
  const [categories, setCategories] = useState<TestCategoryType[]>([]);
  const [testsBySubmission, setTestsBySubmission] = useState<TestsBySubmission>({});
  const [subsLoading, setSubsLoading] = useState<number[]>([]);

  // ************************** Fetch Data ******************************
  useEffect(() => {
    const fetchData = async () => {
      const [categories, casesByCategory]: any = await fetchTestData(props.currentAssignment);
      setCategories(categories);
      setTestCasesByCategory(casesByCategory);
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
  const runTests = async (sub: SubmissionType) => {
    setSubsLoading([...subsLoading, sub.id]);
    const newTests = await Submission.runTests(sub.id);
    const newTestBySub = { ...testsBySubmission };
    newTestBySub[sub.id] = newTests;
    setTestsBySubmission(newTestBySub);
    const newLoadingSubs = subsLoading.filter((id) => {
      return id !== sub.id;
    });
    setSubsLoading(newLoadingSubs);
  };

  const runAll = async () => {
    setSubsLoading(
      props.submissions.map((sub) => {
        return sub.id;
      }),
    );
    const newTestsBySub: TestsBySubmission = {};
    const promises = props.submissions.map(async (sub) => {
      const results = await Submission.runTests(sub.id);
      return {
        submission: sub.id,
        tests: results,
      };
    });

    const newTests = await Promise.all(promises);
    newTests.forEach((obj) => {
      newTestsBySub[obj.submission] = obj.tests;
    });

    setTestsBySubmission(newTestsBySub);
    setSubsLoading([]);
  };

  // ******************************* Return  *******************************
  let content;
  let actions: any = [];
  const totalTests = categories.reduce((acc: number, cat) => {
    return acc + cat.testCases.length;
  }, 0);

  if (props.currentAssignment.testCategories.length == 0) {
    content = <Empty />;
  } else {
    const columns = [
      {
        title: 'Student(s)',
        dataIndex: 'students',
        key: 'students',
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
          <Menu.Item key="1" onClick={runTests.bind({}, submission)}>
            <Icon type="caret-right" />
            Run tests
          </Menu.Item>
        </Menu>
      );

      const toRet: any = {
        students: submission.students,
        key: submission.id,
        actions: subsLoading.includes(submission.id) ? (
          <Icon type="loading" />
        ) : (
          <Dropdown overlay={actionsMenu} trigger={['click']}>
            <Icon type="menu" />
          </Dropdown>
        ),
      };

      const tests = testsBySubmission[submission.id] || [];
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
        const submissionTests = testByCategory[category.id] || [];
        toRet[category.id] = `${
          submissionTests.filter((sub: any) => {
            return sub.passed;
          }).length
        } / ${submissionTests.length}`;
      }

      toRet['summary'] = totalTests === 0 ? '-- / --' : <div>{`${passed} / ${totalTests}`}</div>;
      return toRet;
    });

    content = <Table columns={columns} dataSource={data} />;
  }

  actions = [
    <Button type="default" disabled={totalTests === 0} onClick={runAll}>
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
//
// interface IProps {
//   submissionTests: SubmissionTestType[];
//   testCases: TestCaseType[];
// }

// const TestsPopover = (props: IProps) => {
//   const passedTests = submissionTests.map;
//   return (
//     <Popover
//       content={
//         <div style={{ color: 'black', minWidth: 700 }}>
//           <Input.TextArea
//             disabled={true}
//             value={test.logs}
//             autosize={{ minRows: 4, maxRows: 8 }}
//             style={{ marginTop: 15 }}
//           />
//         </div>
//       }
//       title="Logs"
//     >
//       {`${
//         props.submissionTests.filter((sub: any) => {
//           return sub.passed;
//         }).length
//       }
//       / ${props.submissionTests.length}`}
//     </Popover>
//   );
// };

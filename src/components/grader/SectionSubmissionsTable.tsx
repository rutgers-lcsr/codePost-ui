// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { CodeOutlined, MailOutlined, MenuOutlined, MinusCircleTwoTone } from '@ant-design/icons';
import { Dropdown, message, Spin, Table } from 'antd';
import type { MenuProps, TableColumnsType, TableProps } from 'antd';

/* codePost imports */
import { formatSub, getViewIcon, ISubDataBasic, sortByGrade } from './GraderUtils';

import { AssignmentType, SubmissionType } from '../../types/models';

import { compare } from '../utils/SortUtils';

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface ISubmissionsTableProps {
  isLoading: boolean;
  submissions: { [student: string]: SubmissionType | null };
  onRowSelect: (selectedRowKeys: React.Key[]) => void;
  selectedSubmissions: React.Key[];
  showEmails: boolean;
  assignment: AssignmentType;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  viewsLoading: boolean;
  claimSubmissions: (ids: number[], unclaim: boolean) => void;
  me: string;
}

/* for type checking functions that operate on table rows */
interface ITableRow extends ISubDataBasic {
  key: React.Key;
  student: string;
  viewIcon: React.ReactNode;
  partners: string;
  open: React.ReactNode;
  disableCheck: boolean;
  options: React.ReactNode;
}

const SectionSubmissionsTable = (props: ISubmissionsTableProps) => {
  const rowSelection: TableProps<ITableRow>['rowSelection'] = {
    onChange: props.onRowSelect,
    getCheckboxProps: (row: ITableRow) => {
      return {
        disabled: row.disableCheck,
      };
    },
    selectedRowKeys: props.selectedSubmissions,
  };

  const openGradePage = (submission: SubmissionType) => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open(`/code/${submission.id}`);
    } else {
      window.open(`/code/${submission.id}`, '_self');
    }
  };

  const centerAlign: alignType = 'center';

  const columns: TableColumnsType<ITableRow> = [
    {
      title: 'Open',
      dataIndex: 'open',
      align: centerAlign,
    },
    {
      title: 'Student',
      dataIndex: 'student',
      sorter: (a: ITableRow, b: ITableRow) => compare(true, a.student, b.student),
    },
    {
      title: 'Partner(s)',
      dataIndex: 'partners',
      sorter: (a: ITableRow, b: ITableRow) => compare(true, a.partners, b.partners),
      align: centerAlign,
    },
    {
      title: 'Grade',
      dataIndex: 'gradeText',
      sorter: (a: ITableRow, b: ITableRow) => {
        return sortByGrade(
          { grade: a.grade, isFinalized: a.isFinalized },
          { grade: b.grade, isFinalized: b.isFinalized },
        );
      },
      align: centerAlign,
    },
    {
      title: 'Grader',
      dataIndex: 'grader',
      sorter: (a: ITableRow, b: ITableRow) => compare(true, a.grader, b.grader),
      align: centerAlign,
    },
    {
      title: 'Last Edited',
      dataIndex: 'lastEdited',
      align: centerAlign,
      sorter: (a: ITableRow, b: ITableRow) => {
        const date1 = new Date(a.lastEdited);
        const date2 = new Date(b.lastEdited);
        return date2.valueOf() - date1.valueOf();
      },
    },
    {
      title: 'Viewed by Student(s)',
      dataIndex: 'viewIcon',
      align: centerAlign,
    },
    { title: 'Options', dataIndex: 'options', align: centerAlign },
  ];

  let data: ITableRow[] = [];
  if (props.submissions !== undefined) {
    data = Object.keys(props.submissions).map((student) => {
      const submission = props.submissions[student];
      const shownStudent = props.showEmails || !submission ? student : String(submission.id);

      let partners = '--';
      if (props.showEmails && submission) {
        partners = submission.students
          .filter((obj) => {
            return obj !== student;
          })
          .join(', ');
      }

      const sendStudentNotification = async (submission: SubmissionType | null) => {
        if (submission === null) {
          return;
        }

        fetch(`${process.env.REACT_APP_API_URL}/submissions/${submission.id}/notifyStudents/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({}),
        })
          .then(async (res) => {
            if (res.status === 200) {
              await res.json();
              message.success('Email sent to student notifying them that their submission is ready.');
              return;
            } else {
              const json = await res.json();
              message.error(json);
              return;
            }
          })
          .catch((err) => {
            console.log(err);
          });
        return;
      };

      const menuItems: NonNullable<MenuProps['items']> = [
        ...(submission && submission.grader === props.me
          ? [
              {
                key: '1',
                label: (
                  <>
                    <MinusCircleTwoTone /> Unclaim
                  </>
                ),
                onClick: () => props.claimSubmissions([submission.id], true),
              },
            ]
          : []),
        ...(submission
          ? [
              {
                key: '2',
                label: (
                  <>
                    <MailOutlined /> Notify student
                  </>
                ),
                onClick: () => sendStudentNotification(submission),
              },
            ]
          : []),
      ];

      return {
        ...formatSub(submission, props.assignment),
        key: submission ? submission.id : student,
        student: shownStudent,
        partners,
        viewIcon: props.viewsLoading ? (
          <Spin />
        ) : submission ? (
          <div>{getViewIcon(submission, props.viewsBySubmission, student)}</div>
        ) : null,
        open: submission ? <CodeOutlined onClick={openGradePage.bind({}, submission)} /> : null,
        disableCheck: !submission || !!submission.grader,
        options: (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <MenuOutlined />
          </Dropdown>
        ),
      };
    });
  }

  return (
    <Table
      rowSelection={rowSelection}
      columns={columns}
      dataSource={data}
      pagination={false}
      loading={props.isLoading}
      size="middle"
    />
  );
};

export default SectionSubmissionsTable;

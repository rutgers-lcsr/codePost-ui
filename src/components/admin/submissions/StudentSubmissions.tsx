// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useMemo, useState } from 'react';

import { PlusCircleOutlined, UserAddOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Empty, Typography, Button, Tooltip } from 'antd';
import dayjs from 'dayjs';

/* other library imports */
import Highlighter from 'react-highlight-words';

import { Link, Route, Routes } from 'react-router-dom';

/* codePost imports  */
import type { Assignment, IStudentSubmissionsDataTable, SubmissionInfoType, UploadFile } from '../../../types/common';

import { openSubmission } from '../other/AdminUtils';

import type { Course } from '../../../api-client';
import { sortAssignments } from '../../../utils/assignments';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import StudentDetail from './students/StudentDetail';

import CPButton from '../../../components/core/CPButton';
import { tooltips } from '../../../components/core/tooltips';

import Loading from '../../../components/core/Loading';

/**********************************************************************************************************************/

export interface IByStudentProps {
  /* UI control */
  loadComplete: boolean;

  course?: Course;

  /* submissions data */
  assignments: Assignment[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  students: string[];
  inactiveStudents: string[];

  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  graders: string[];
  changeSubmissionGrader: (submission: SubmissionInfoType, grader: string | undefined) => Promise<void>;
  uploadSubmission: (assignment: Assignment, partners: string[], files: UploadFile[]) => Promise<SubmissionInfoType>;
  addFilesToSubmission: (submission: SubmissionInfoType, files: UploadFile[]) => Promise<SubmissionInfoType>;
  baseURL: string;
  courseURL: string;
}

const StudentData: React.FC<IByStudentProps> = (props) => {
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  const toggleValue = (value: 'showActive' | 'showInactive') => {
    if (value === 'showActive') {
      setShowActive(!showActive);
    } else {
      setShowInactive(!showInactive);
    }
  };

  /* Render Logic */
  if (!props.loadComplete) {
    return <Loading />;
  }

  const currentBaseURL = `${props.baseURL}/by_student`;

  return (
    <Routes>
      {props.students.map((student) => (
        <Route
          key={`route-student-${student}`}
          path={`${student}`}
          element={
            <StudentDetail
              course={props.course!}
              baseURL={currentBaseURL}
              assignments={props.assignments}
              graders={props.graders}
              submissions={props.submissionsByStudent}
              uploadSubmission={props.uploadSubmission}
              addFilesToSubmission={props.addFilesToSubmission}
              students={Object.keys(props.submissionsByStudent)}
              student={student}
              viewsBySubmission={props.viewsBySubmission}
              deleteSubmission={props.deleteSubmission}
              changeSubmissionGrader={props.changeSubmissionGrader}
            />
          }
        />
      ))}
      <Route
        index
        element={
          <StudentIndexRoute
            loadComplete={props.loadComplete}
            assignments={props.assignments}
            submissionsByStudent={props.submissionsByStudent}
            students={props.students}
            inactiveStudents={props.inactiveStudents}
            showActive={showActive}
            showInactive={showInactive}
            toggleValue={toggleValue}
            currentBaseURL={currentBaseURL}
            courseURL={props.courseURL}
          />
        }
      />
    </Routes>
  );
};

/** Extracted stable index route to avoid React.createElement remount */
const StudentIndexRoute: React.FC<{
  loadComplete: boolean;
  assignments: Assignment[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  students: string[];
  inactiveStudents: string[];
  showActive: boolean;
  showInactive: boolean;
  toggleValue: (value: 'showActive' | 'showInactive') => void;
  currentBaseURL: string;
  courseURL: string;
}> = ({
  loadComplete,
  assignments,
  submissionsByStudent,
  students,
  inactiveStudents,
  showActive,
  showInactive,
  toggleValue,
  currentBaseURL,
  courseURL,
}) => {
  const onSubmissionClick = (submissionID: number, event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    openSubmission(submissionID);
  };

  const { columns, data } = useMemo(() => {
    let cols: ITableDetailColumn[] = [];
    let rows: Record<string, unknown>[] = [];
    if (!loadComplete) return { columns: cols, data: rows };

    const aligner: 'left' | 'center' | 'right' = 'center';
    cols = [
      {
        title: 'Student',
        dataIndex: 'student',
        key: 'primary',
        fixed: 'left' as const,
        width: 220,
        defaultSortOrder: 'ascend' as const,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a.key as string).localeCompare(b.key as string),
        renderForSearch: (searchText: string) => {
          return (_text: string, record: Record<string, unknown>, _index: number) => {
            const student = record.student as string;
            const content =
              students.indexOf(student) > -1 ? (
                <Typography.Text strong>
                  <Highlighter
                    highlightStyle={{
                      backgroundColor: '#5CBB8B',
                      padding: 0,
                    }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={student}
                  />
                </Typography.Text>
              ) : (
                <span style={{ color: '#999' }}>
                  <Highlighter
                    highlightStyle={{
                      backgroundColor: '#5CBB8B',
                      padding: 0,
                    }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={student}
                  />
                </span>
              );
            return (
              <Link to={`${currentBaseURL}/${student}`} className="text-link">
                {content}
              </Link>
            );
          };
        },
      },
      ...sortAssignments(assignments).map((assignment) => {
        return {
          title: assignment.name,
          dataIndex: assignment.name,
          key: assignment.name,
          sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => {
            const aVal = a[`${assignment.name}_sort`] as string | number;
            const bVal = b[`${assignment.name}_sort`] as string | number;
            if (typeof aVal === 'number' && typeof bVal === 'number') return bVal - aVal;
            if (typeof aVal === 'number') return -1;
            if (typeof bVal === 'number') return 1;
            if (aVal === 'Unfinalized' && bVal === '--') return -1;
            if (aVal === '--' && bVal === 'Unfinalized') return 1;
            return 0;
          },
          align: aligner,
          className: 'student-table',
          renderForSearch: () => {
            return (_text: string, record: Record<string, unknown>, _index: number) => {
              const score = record[assignment.name] as string | number;
              if (score === '--') {
                return '--';
              } else {
                const studentSubmissions = submissionsByStudent[record.student as string];
                if (!studentSubmissions) return null;
                const submission = studentSubmissions[assignment.id];
                if (!submission) return null;
                const content: React.ReactNode = score;
                const dateTip = submission.dateUploaded
                  ? `Submitted: ${dayjs(submission.dateUploaded).format('MMM D, h:mm A')}`
                  : 'No submission date';
                return (
                  <Tooltip title={dateTip}>
                    <span
                      onClick={(e) => onSubmissionClick(submission.id, e)}
                      style={{
                        cursor: 'pointer',
                        display: 'block',
                        textAlign: 'center',
                        width: '100%',
                        color: 'rgba(0, 0, 0, 0.85)',
                        fontSize: '14px',
                      }}
                    >
                      {content}
                    </span>
                  </Tooltip>
                );
              }
            };
          },
        };
      }),
    ];

    let rowValues: string[] = [];
    if (showActive && showInactive) {
      rowValues = Object.keys(submissionsByStudent);
    } else if (showInactive) {
      rowValues = inactiveStudents;
    } else if (showActive) {
      rowValues = students;
    }

    rows = rowValues.map((studentEmail) => {
      const toRet: Record<string, unknown> = {
        student: studentEmail,
        key: studentEmail,
      };
      for (const assignment of assignments) {
        const studentSubs = submissionsByStudent[studentEmail];
        const submission = studentSubs ? studentSubs[assignment.id] : undefined;

        if (submission && submission.isFinalized) {
          const gradeText =
            submission.grade && assignment.points !== null
              ? submission.grade + '/' + assignment.points
              : submission.grade;
          toRet[assignment.name] = <Typography.Text strong>{gradeText}</Typography.Text>;
          toRet[`${assignment.name}_sort`] = submission.grade ?? 0;
        } else if (submission) {
          toRet[assignment.name] = <Typography.Text strong>Unfinalized</Typography.Text>;
          toRet[`${assignment.name}_sort`] = 'Unfinalized';
        } else {
          toRet[assignment.name] = '--';
          toRet[`${assignment.name}_sort`] = '--';
        }
      }
      return toRet;
    });

    return { columns: cols, data: rows };
  }, [
    loadComplete,
    assignments,
    submissionsByStudent,
    students,
    inactiveStudents,
    showActive,
    showInactive,
    currentBaseURL,
  ]);

  const numStudents = Object.keys(submissionsByStudent).length;

  return (
    <TableDetail
      loadComplete={loadComplete}
      title={
        <Typography.Text strong style={{ fontSize: '16px' }}>
          Submissions by Student
        </Typography.Text>
      }
      isEmpty={assignments.length === 0 || numStudents === 0}
      emptyNode={
        <Empty
          styles={{
            image: {
              height: 60,
            },
          }}
          description={
            assignments.length === 0 && numStudents === 0 ? (
              <span>No students or assignments yet</span>
            ) : numStudents === 0 ? (
              <span>Nice job creating an assignment! Now add some students.</span>
            ) : (
              <span>You added students! Now create an assignment</span>
            )
          }
        >
          {numStudents === 0 ? (
            <Link to={`${courseURL}/roster/students`}>
              <CPButton cpType="primary" key={1} icon={<UserAddOutlined />}>
                Add some students
              </CPButton>
            </Link>
          ) : null}

          {assignments.length === 0 ? (
            <span>
              {numStudents === 0 ? <span>&nbsp; &nbsp;</span> : null}
              <Link to={`${courseURL}/assignments/overview`}>
                <CPButton cpType="primary" key={2} icon={<PlusCircleOutlined />}>
                  Add an assignment
                </CPButton>
              </Link>
            </span>
          ) : null}
        </Empty>
      }
      columns={columns}
      data={data}
      tableProps={{ scroll: { x: 'max-content' } }}
      actions={[
        <Tooltip key="showActive" title={showInactive ? 'Hide inactive students' : 'Show inactive students'}>
          <Button
            shape="circle"
            icon={showInactive ? <UserAddOutlined /> : <UserAddOutlined style={{ color: '#ccc' }} />}
            onClick={() => toggleValue('showInactive')}
          />
        </Tooltip>,
      ]}
      breadcrumbs={<Breadcrumb items={[{ title: 'Submissions' }, { title: 'By Student' }]} />}
      titleInfo={tooltips.admin.studentSubmissions.title}
    />
  );
};

export default StudentData;

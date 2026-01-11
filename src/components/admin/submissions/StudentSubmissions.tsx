/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

import { PlusCircleOutlined, UserAddOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Empty, Typography, Button, Tooltip } from 'antd';
import dayjs from 'dayjs';

/* other library imports */
import Highlighter from 'react-highlight-words';

import { Link, Route, Routes } from 'react-router-dom';

/* codePost imports  */
import { IStudentSubmissionsDataTable } from '../../../types/common';

import { openSubmission } from '../other/AdminUtils';

import { AssignmentType, sortAssignments } from '../../../infrastructure/assignment';
import { CourseType } from '../../../infrastructure/course';
import { SubmissionInfoType } from '../../../infrastructure/submission';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import StudentDetail from './students/StudentDetail';

import CPButton from '../../../components/core/CPButton';
import { tooltips } from '../../../components/core/tooltips';

import Loading from '../../../components/core/Loading';
import { FileType } from '../../../infrastructure/file';

/**********************************************************************************************************************/

export interface IByStudentProps {
  /* UI control */
  loadComplete: boolean;

  course?: CourseType;

  /* submissions data */
  assignments: AssignmentType[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  students: string[];
  inactiveStudents: string[];

  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  graders: string[];
  changeSubmissionGrader: (submission: SubmissionInfoType, grader: string | undefined) => Promise<void>;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: FileType[]) => Promise<SubmissionInfoType>;
  addFilesToSubmission: (submission: SubmissionInfoType, files: FileType[]) => Promise<SubmissionInfoType>;
  baseURL: string;
  courseURL: string;
}

const StudentData: React.FC<IByStudentProps> = (props) => {
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  /* Helper Functions */
  const sortFunction = (a: any, b: any) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return b - a;
    } else if (typeof a === 'number') {
      return -1;
    } else if (typeof b === 'number') {
      return 1;
    } else if (a === 'Unfinalized' && b === '--') {
      return -1;
    } else if (a === '--' && b === 'Unfinalized') {
      return 1;
    }

    return 0;
  };

  const toggleValue = (value: 'showActive' | 'showInactive') => {
    if (value === 'showActive') {
      setShowActive(!showActive);
    } else {
      setShowInactive(!showInactive);
    }
  };

  const onSubmissionClick = (submissionID: number, event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    openSubmission(submissionID);
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
        element={React.createElement(() => {
          let columns: ITableDetailColumn[] = [];
          let data: any[] = [];
          if (props.loadComplete) {
            const aligner: 'left' | 'center' | 'right' = 'center';
            columns = [
              {
                title: 'Student',
                dataIndex: 'student',
                key: 'primary',
                sorter: (a: any, b: any) => a.key.localeCompare(b.key),
                renderForSearch: (searchText: string) => {
                  return (_text: string, record: any, _index: number) => {
                    const student = record.student;
                    const content =
                      props.students.indexOf(student) > -1 ? (
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
              ...sortAssignments(props.assignments).map((assignment) => {
                return {
                  title: assignment.name,
                  dataIndex: assignment.name,
                  key: assignment.name,
                  sorter: (a: any, b: any) => {
                    return sortFunction(a[assignment.name], b[assignment.name]);
                  },
                  align: aligner,
                  className: 'student-table',
                  renderForSearch: () => {
                    return (_text: string, record: any, _index: number) => {
                      const score: string | number = record[assignment.name];
                      if (score === '--') {
                        return '--';
                      } else {
                        const studentSubmissions = props.submissionsByStudent[record.student];
                        if (!studentSubmissions) {
                          return null;
                        }
                        const submission = studentSubmissions[assignment.id];
                        if (!submission) {
                          return null;
                        }
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
                                color: 'rgba(0, 0, 0, 0.85)', // Standard AntD text color
                                fontSize: '14px', // Explicitly match standard table font size if needed, though inheritance should work
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

            // Figure out which set of students to show in table rows
            let rowValues: string[] = [];
            if (showActive && showInactive) {
              rowValues = Object.keys(props.submissionsByStudent);
            } else if (showInactive) {
              rowValues = props.inactiveStudents;
            } else if (showActive) {
              rowValues = props.students;
            }

            data = rowValues.map((studentEmail) => {
              const toRet: any = {
                student: studentEmail,
                key: studentEmail,
              };
              for (const assignment of props.assignments) {
                const studentSubmissions = props.submissionsByStudent[studentEmail];
                const submission = studentSubmissions ? studentSubmissions[assignment.id] : undefined;

                if (submission && submission.isFinalized) {
                  const gradeText =
                    submission.grade && assignment.points !== null
                      ? submission.grade + '/' + assignment.points
                      : submission.grade;
                  toRet[assignment.name] = <Typography.Text strong>{gradeText}</Typography.Text>;
                } else if (submission) {
                  toRet[assignment.name] = <Typography.Text strong>Unfinalized</Typography.Text>;
                } else {
                  toRet[assignment.name] = '--';
                }
              }
              return toRet;
            });
          }

          const numStudents = Object.keys(props.submissionsByStudent).length;

          return (
            <TableDetail
              loadComplete={props.loadComplete}
              title={
                <Typography.Text strong style={{ fontSize: '16px' }}>
                  Submissions by Student
                </Typography.Text>
              }
              isEmpty={props.assignments.length === 0 || numStudents === 0}
              emptyNode={
                <Empty
                  styles={{
                    image: {
                      height: 60,
                    },
                  }}
                  description={
                    props.assignments.length === 0 && numStudents === 0 ? (
                      <span>No students or assignments yet</span>
                    ) : numStudents === 0 ? (
                      <span>Nice job creating an assignment! Now add some students.</span>
                    ) : (
                      <span>You added students! Now create an assignment</span>
                    )
                  }
                >
                  {numStudents === 0 ? (
                    <Link to={`${props.courseURL}/roster/students`}>
                      <CPButton cpType="primary" key={1} icon={<UserAddOutlined />}>
                        Add some students
                      </CPButton>
                    </Link>
                  ) : null}

                  {props.assignments.length === 0 ? (
                    <span>
                      {numStudents === 0 ? <span>&nbsp; &nbsp;</span> : null}
                      <Link to={`${props.courseURL}/assignments/overview`}>
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
              actions={[
                <Tooltip title={showInactive ? 'Hide inactive students' : 'Show inactive students'}>
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
        })}
      />
    </Routes>
  );
};

export default StudentData;

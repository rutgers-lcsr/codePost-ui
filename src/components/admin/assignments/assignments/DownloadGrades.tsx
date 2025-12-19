/* react imports */
import { useState } from 'react';

/* ant imports */
import { Divider, Modal, Radio, Typography } from 'antd';

/* codePost imports */

import { IStudentSubmissionsDataTable } from '../../../../types/common';

import { AssignmentType } from '../../../../infrastructure/assignment';

import { CourseType } from '../../../../infrastructure/course';

export interface BuildAllGradesOptions {
  zeroForMissing?: boolean;
  ungradedAsZero?: boolean;
}

export const buildAllGradesTable = (
  assignments: AssignmentType[],
  students: string[],
  submissionsByStudent: IStudentSubmissionsDataTable,
  options: BuildAllGradesOptions = {},
): string[][] => {
  const { zeroForMissing = false, ungradedAsZero = false } = options;

  const header = ['Active Student', ...assignments.map((assignment) => assignment.name)];
  const rows: string[][] = [header];

  students.forEach((student) => {
    const row: string[] = [student];

    assignments.forEach((assignment) => {
      const submission = submissionsByStudent[student]?.[assignment.id];

      let grade = '';
      if (submission) {
        grade =
          submission.isFinalized && submission.grade !== null ? submission.grade.toString() : ungradedAsZero ? '0' : '';
      } else {
        grade = zeroForMissing ? '0' : '';
      }

      row.push(grade);
    });

    rows.push(row);
  });

  return rows;
};

export interface IProps {
  activeAssignment?: AssignmentType;
  assignments: AssignmentType[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  students: string[];
  currentCourse: CourseType;
  onCancel: () => void;
}

const { Text } = Typography;

interface IWarningSubmissions {
  ungraded: number;
  missing: number;
}

const DownloadGrades = (props: IProps) => {
  const [missingAsZero, setMissingAsZero] = useState(false);
  const [ungradedAsZero, setUngradedAsZero] = useState(false);

  // ********************************** HELPER FUNCTIONS ****************************************
  const onDownload = () => {
    if (props.activeAssignment) {
      downloadAssignmentGrades(props.activeAssignment, missingAsZero);
    } else {
      downloadAllGrades(missingAsZero);
    }
    props.onCancel();
  };

  const changeMissingAsZero = (e: any) => {
    setMissingAsZero(e.target.value);
  };

  const changeUngradedAsZero = (e: any) => {
    setUngradedAsZero(e.target.value);
  };

  const studentSet = new Set(props.students);
  const getAssignmentWarning = (assignment: AssignmentType) => {
    return Object.keys(props.submissionsByStudent).reduce(
      (warningSubmissions: IWarningSubmissions, student: string) => {
        if (!props.submissionsByStudent[student][assignment.id] && studentSet.has(student)) {
          warningSubmissions.missing += 1;
        } else if (
          props.submissionsByStudent[student][assignment.id] &&
          studentSet.has(student) &&
          !props.submissionsByStudent[student][assignment.id].isFinalized
        ) {
          warningSubmissions.ungraded += 1;
        }
        return warningSubmissions;
      },
      { missing: 0, ungraded: 0 },
    );
  };

  const getAllAssignmentWarning = (assignments: AssignmentType[]) => {
    return assignments.reduce(
      (warningSubmissions: IWarningSubmissions, assignment: AssignmentType) => {
        const thisAssignmentWarnings = getAssignmentWarning(assignment);
        warningSubmissions.missing += thisAssignmentWarnings.missing;
        warningSubmissions.ungraded += thisAssignmentWarnings.ungraded;
        return warningSubmissions;
      },
      { missing: 0, ungraded: 0 },
    );
  };
  // ********************************** DOWNLOAD FUNCTIONS ****************************************

  const downloadAssignmentGrades = (assignment: AssignmentType, zeroForMissing?: boolean) => {
    const grades: string[] = [`Student,${assignment.name} Grade`];

    const submissionsByStudent = props.submissionsByStudent;
    const students = props.students;

    students.forEach((student) => {
      const submission = submissionsByStudent[student] ? submissionsByStudent[student][assignment.id] : null;
      let grade;
      if (submission) {
        // If a submission exists
        grade =
          submission.isFinalized && submission.grade !== null ? submission.grade.toString() : ungradedAsZero ? '0' : '';
      } else {
        // If a submission is missing
        grade = zeroForMissing ? '0' : '';
      }
      grades.push(`${student},${grade}`);
    });

    const csv = grades.join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${csv}`;
    a.download = `${props.currentCourse.name}-${props.currentCourse.period}-${assignment.name}-grades.csv`;

    document.body.appendChild(a);
    a.click();
  };

  const downloadAllGrades = (zeroForMissing?: boolean) => {
    const rows = buildAllGradesTable(props.assignments, props.students, props.submissionsByStudent, {
      zeroForMissing,
      ungradedAsZero,
    });
    const csv = rows.map((row) => row.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `${props.currentCourse.name}-${props.currentCourse.period}-grades.csv`;

    document.body.appendChild(a);
    a.click();
  };

  // ********************************** RENDER ****************************************

  const warningSubmissions = props.activeAssignment
    ? getAssignmentWarning(props.activeAssignment)
    : getAllAssignmentWarning(props.assignments);
  const numMissing = warningSubmissions.missing;
  const numUngraded = warningSubmissions.ungraded;

  if (!numMissing && !numUngraded) {
    onDownload();
    return <div />;
  } else {
    return (
      <Modal
        visible={true}
        width={550}
        title={props.activeAssignment ? `Download grades: ${props.activeAssignment.name}` : 'Download grades'}
        okText="Download"
        onCancel={props.onCancel}
        onOk={onDownload}
      >
        <div>
          <div>{`Some students in your course have ${numMissing ? 'missing' : ''} ${numMissing && numUngraded ? 'and' : ''
            } ${numUngraded ? 'unfinalized' : ''} submissions. How would you like to handle these?`}</div>
          {numMissing ? (
            <div>
              <Divider />
              <div style={{ padding: '10px 20px' }} className="display-flex justify-content-space-between">
                <div>
                  <Text style={{ fontWeight: 600 }} type="danger">
                    {numMissing > 1 ? `${numMissing} missing submissions` : '1 missing submission'}
                  </Text>
                </div>
                <Radio.Group onChange={changeMissingAsZero} value={missingAsZero} style={{ width: 250 }}>
                  <Radio value={false}>Leave blank (no grade)</Radio>
                  <Radio value={true}>Assign grade of 0</Radio>
                </Radio.Group>
              </div>
            </div>
          ) : (
            <div />
          )}
          {numUngraded ? (
            <div>
              <Divider />
              <div style={{ padding: '10px 20px' }} className="display-flex justify-content-space-between">
                <Text style={{ fontWeight: 600 }} type="warning">
                  {numUngraded > 1 ? `${numUngraded} unfinalized submissions` : '1 unfinalized submission'}
                </Text>
                <Radio.Group onChange={changeUngradedAsZero} value={ungradedAsZero} style={{ width: 250 }}>
                  <Radio value={false}>Leave blank (no grade)</Radio>
                  <Radio value={true}>Assign grade of 0</Radio>
                </Radio.Group>
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
      </Modal>
    );
  }
};

export default DownloadGrades;

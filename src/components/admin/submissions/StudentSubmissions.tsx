/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Empty, Icon } from 'antd';
import { ColumnProps } from 'antd/lib/table';

/* codePost imports  */
import { IStudentSubmissionsDataTable } from '../../../types/common';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

import { TableDetail } from '../other/TableDetail';

import StudentDetail from './students/StudentDetail';

import CPButton from '../../../components/core/CPButton';

import { PANELS } from '../Admin';

/**********************************************************************************************************************/

interface IProps {
  loadComplete: boolean;
  assignments: AssignmentType[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  graders: string[];
  changeSubmissionGrader: (submission: SubmissionType, grader: string | undefined) => Promise<void>;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
  changeTab: (panel: PANELS) => void;
}

interface IState {
  activeStudent?: string;
}

class StudentData extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {};

  public componentDidUpdate(oldProps: IProps, oldState: IState) {
    if (oldProps.loadComplete && !this.props.loadComplete) {
      this.setState({ activeStudent: undefined });
    }
  }

  public changeActiveStudent = (newStudent: string) => {
    this.setState({ activeStudent: newStudent });
  };

  public sortFunction = (a: any, b: any) => {
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

  public render() {
    if (!this.state.activeStudent) {
      let columns: Array<ColumnProps<any>> = [];
      let data: any[] = [];

      if (this.props.loadComplete) {
        const aligner: 'left' | 'center' | 'right' = 'center';
        columns = [
          { title: 'Expand', dataIndex: 'expand', key: 'expand', align: aligner },
          {
            title: 'Student',
            dataIndex: 'student',
            key: 'primary',
            sorter: (a: any, b: any) => a.key.localeCompare(b.key),
          },
          ...this.props.assignments.map((assignment) => {
            return {
              title: assignment.name,
              dataIndex: assignment.name,
              key: assignment.name,
              sorter: (a: any, b: any) => {
                return this.sortFunction(a[assignment.name], b[assignment.name]);
              },
              align: aligner,
              className: 'student-table',
            };
          }),
        ];

        data = Object.keys(this.props.submissionsByStudent).map((studentEmail) => {
          const expandFn = () => {
            this.setState({ activeStudent: studentEmail });
          };

          const toRet = {
            expand: <Icon type="zoom-in" onClick={expandFn} />,
            student: studentEmail,
            key: studentEmail,
          };
          for (const assignment of this.props.assignments) {
            const submission = this.props.submissionsByStudent[studentEmail][assignment.id];
            if (submission && submission.isFinalized) {
              toRet[assignment.name] = submission.grade;
            } else if (submission) {
              toRet[assignment.name] = 'Unfinalized';
            } else {
              toRet[assignment.name] = '--';
            }
          }
          return toRet;
        });
      }

      const numStudents = Object.keys(this.props.submissionsByStudent).length;

      return (
        <TableDetail
          loadComplete={this.props.loadComplete}
          title={'Student Submissions'}
          isEmpty={this.props.assignments.length === 0 || numStudents === 0}
          emptyNode={
            <Empty
              imageStyle={{
                height: 60,
              }}
              description={
                this.props.assignments.length === 0 && numStudents === 0 ? (
                  <span>No students or assignments yet</span>
                ) : numStudents === 0 ? (
                  <span>Nice job creating an assignment! Now add some students.</span>
                ) : (
                  <span>You added students! Now create an assignment</span>
                )
              }
            >
              {numStudents === 0 ? (
                <CPButton
                  cpType="primary"
                  key={1}
                  icon="user-add"
                  onClick={this.props.changeTab.bind(this, PANELS.ROSTER_STUDENTS)}
                >
                  Add some students
                </CPButton>
              ) : null}

              {this.props.assignments.length === 0 ? (
                <span>
                  {numStudents === 0 ? <span>&nbsp; &nbsp;</span> : null}
                  <CPButton
                    cpType="primary"
                    key={2}
                    icon="plus-circle"
                    onClick={this.props.changeTab.bind(this, PANELS.ASSIGNMENTS)}
                  >
                    Add an assignment
                  </CPButton>
                </span>
              ) : null}
            </Empty>
          }
          columns={columns}
          data={data}
          actions={[]}
          breadcrumbs={
            <Breadcrumb>
              <Breadcrumb.Item>Submissions</Breadcrumb.Item>
              <Breadcrumb.Item>Students</Breadcrumb.Item>
            </Breadcrumb>
          }
        />
      );
    } else {
      return (
        <StudentDetail
          onBack={this.changeActiveStudent.bind(this, undefined)}
          student={this.state.activeStudent!}
          submissionsMap={this.props.submissionsByStudent[this.state.activeStudent!]}
          assignments={this.props.assignments}
          graders={this.props.graders}
          submissions={this.props.submissionsByStudent}
          uploadSubmission={this.props.uploadSubmission}
          students={Object.keys(this.props.submissionsByStudent)}
          viewsBySubmission={this.props.viewsBySubmission}
          deleteSubmission={this.props.deleteSubmission}
          changeSubmissionGrader={this.props.changeSubmissionGrader}
        />
      );
    }
  }
}

export default StudentData;

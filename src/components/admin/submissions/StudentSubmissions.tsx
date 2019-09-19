/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Checkbox, Empty, Icon } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';

/* codePost imports  */
import { IStudentSubmissionsDataTable } from '../../../types/common';

import { openSubmission } from '../other/AdminUtils';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import StudentDetail from './students/StudentDetail';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import { PANELS } from '../Admin';

/**********************************************************************************************************************/

interface IProps {
  /* UI control */
  loadComplete: boolean;
  changeTab: (panel: PANELS) => void;

  /* submissions data */
  assignments: AssignmentType[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  students: string[];
  inactiveStudents: string[];

  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  graders: string[];
  changeSubmissionGrader: (submission: SubmissionType, grader: string | undefined) => Promise<void>;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
}

interface IState {
  showActive: boolean;
  showInactive: boolean;
  activeStudent?: string;
}

class StudentData extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      showActive: true,
      showInactive: false,
    };
  }

  public componentDidUpdate(oldProps: IProps, oldState: IState) {
    if (oldProps.loadComplete && !this.props.loadComplete) {
      this.setState({ activeStudent: undefined });
    }
  }

  public changeActiveStudent = (newStudent?: string) => {
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

  public toggleValue = (value: string) => {
    this.setState((prevState: IState) => {
      const newState: any = { ...prevState };
      newState[value] = !newState[value];
      return newState;
    });
  };

  public onSubmissionClick = (submissionID: number, event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    openSubmission(submissionID);
  };

  public render() {
    let toggleInactiveStudents;

    if (!this.state.activeStudent) {
      let columns: ITableDetailColumn[] = [];
      let data: any[] = [];

      if (this.props.loadComplete) {
        const hasInactiveStudents = this.props.inactiveStudents.length > 0;
        if (hasInactiveStudents) {
          toggleInactiveStudents = (
            <div>
              <Checkbox defaultChecked={this.state.showActive} onChange={this.toggleValue.bind(this, 'showActive')}>
                Active students
              </Checkbox>
              <CPTooltip title={tooltips.admin.studentSubmissions.inactives} hideThisOnHideTips={true}>
                <Checkbox
                  defaultChecked={this.state.showInactive}
                  onChange={this.toggleValue.bind(this, 'showInactive')}
                >
                  Inactive students
                </Checkbox>
              </CPTooltip>
            </div>
          );
        }

        const aligner: 'left' | 'center' | 'right' = 'center';
        columns = [
          {
            title: 'Zoom in',
            dataIndex: 'expand',
            key: 'expand',
            align: aligner,
          },
          {
            title: 'Student',
            dataIndex: 'student',
            key: 'primary',
            sorter: (a: any, b: any) => a.key.localeCompare(b.key),
            renderForSearch: (searchText: string) => {
              return (text: string, record: any, index: number) => {
                const student = record.student;
                if (this.props.students.indexOf(student) > -1) {
                  return (
                    <Highlighter
                      highlightStyle={{
                        backgroundColor: '#5CBB8B',
                        padding: 0,
                      }}
                      searchWords={[searchText]}
                      autoEscape
                      textToHighlight={student}
                    />
                  );
                } else {
                  return (
                    <span style={{ color: '#ccc' }}>
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
                }
              };
            },
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
              renderForSearch: (searchText: string) => {
                return (text: string, record: any, index: number) => {
                  const score: string | number = record[assignment.name];
                  if (score === '--') {
                    return '--';
                  } else {
                    const submission = this.props.submissionsByStudent[record.student][assignment.id];
                    return (
                      <span className="text-link" onClick={this.onSubmissionClick.bind(this, submission.id)}>
                        {score}
                      </span>
                    );
                  }
                };
              },
            };
          }),
        ];

        // Figure out which set of students to show in table rows
        let rowValues: string[] = [];
        if (this.state.showActive && this.state.showInactive) {
          rowValues = Object.keys(this.props.submissionsByStudent);
        } else if (this.state.showInactive) {
          rowValues = this.props.inactiveStudents;
        } else if (this.state.showActive) {
          rowValues = this.props.students;
        }

        data = rowValues.map((studentEmail) => {
          const expandFn = (event: React.MouseEvent<HTMLElement>) => {
            this.setState({ activeStudent: studentEmail });
          };

          const toRet: any = {
            expand: (
              <div style={{ cursor: 'pointer' }} onClick={expandFn}>
                <CPTooltip title={tooltips.admin.studentSubmissions.expand} hideThisOnHideTips={true}>
                  <Icon type="folder-open" />
                </CPTooltip>
              </div>
            ),
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
          title={'Submissions by Student'}
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
          actions={[toggleInactiveStudents]}
          breadcrumbs={
            <Breadcrumb>
              <Breadcrumb.Item>Submissions</Breadcrumb.Item>
              <Breadcrumb.Item>By Student</Breadcrumb.Item>
            </Breadcrumb>
          }
          titleInfo={tooltips.admin.studentSubmissions.title}
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

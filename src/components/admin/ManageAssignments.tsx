/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* React-md imports */
import {
  Button,
  CircularProgress,
  DataTable,
  Drawer,
  FontIcon,
  MenuButtonColumn,
  SelectionControl,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
} from 'react-md';

/* other library imports */
import memoizeOne from 'memoize-one';

/* codePost imports */
import { AssignmentPatchType, AssignmentType } from '../../infrastructure/assignment';

import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../types/common';

import { CourseType } from '../../infrastructure/course';
import { SubmissionType } from '../../infrastructure/submission';

import DeleteAssignmentDialog from './ManageAssignmentsComponents/DeleteAssignmentDialog';
import UploadSubmissionDialog from './ManageAssignmentsComponents/UploadSubmissionDialog';

import { openSubmission } from './AdminUtils';

import NewAssignmentDialog from './ManageAssignmentsComponents/NewAssignmentDialog';

import AssignmentSettingsDialog from './ManageAssignmentsComponents/AssignmentSettingsDialog';

import RubricManager from './ManageAssignmentsComponents/RubricManager';

/**********************************************************************************************************************/

export interface IManageAssignmentsProps {
  /* assignment data */
  assignments: AssignmentType[];
  submissions: IAssignmentToSubmissionsMap;
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;
  currentCourse: CourseType | undefined;

  /* loading state */
  loadComplete: boolean;

  /* UI control */
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  setLoadingDialog: (message: string, title: string) => void;
  clearLoadingDialog: () => void;

  /* object-level REST operations */
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<AssignmentType>;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => void;
  viewsBySubmission: { [submissionID: number]: string[] };
}

export enum DETAIL_TYPE {
  Rubric,
  Upload,
  Settings,
  Delete,
  Drawer,
}

export enum DRAWER_TYPE {
  Submitted,
  Graded,
  Ungraded,
  Unclaimed,
  Missing,
  Unviewed,
}

export interface IAssignmentStats {
  numSubmissions: number;
  numGraded: number;
  numUngraded: number;
  numUnclaimed: number;
  numMissing: number;
  numUnviewed: number;
  median: number;
  mean: number;
}

export interface IAssignmentStatsMap {
  [assignmentID: number]: IAssignmentStats;
}

interface IManageAssignmentsState {
  /* what is selected? */
  activeAssignment?: AssignmentType; // which assignment has been clicked
  detailType?: DETAIL_TYPE; // what detail view are we showing
  drawerContent: { title: string; subtitle: string; content: Array<{ email: string; subID: number | null }> };
  isDownloading: boolean;
}

/**********************************************************************************************************************/

class ManageAssignments extends React.Component<IManageAssignmentsProps, IManageAssignmentsState> {
  public state: Readonly<IManageAssignmentsState> = {
    activeAssignment: undefined,
    detailType: undefined,

    drawerContent: { title: '', subtitle: '', content: [] },
    isDownloading: false,
  };

  /******************************************************************************
   * Assignment stat calculation
   ******************************************************************************/

  public memoizedStats = memoizeOne(
    (
      assignments: AssignmentType[],
      submissions: IAssignmentToSubmissionsMap,
      submissionsByStudent: IStudentSubmissionsDataTable,
    ): IAssignmentStatsMap => {
      const toRet: IAssignmentStatsMap = {};
      assignments.forEach((assignment) => {
        const assignmentSubs = submissions[assignment.id];
        const numSubmissions = assignmentSubs.length;

        // Calculate data for the assignment table:
        //  numGraded: number of submissions graded
        //  numUngraded: number of submissions not yet graded or claimed
        //  numUnclaimed: (subset of numUngraded) submissions not claimed
        //  numMissing: number of students who did not submit
        let numGraded = 0;
        let numUngraded = 0;
        let numUnclaimed = 0;
        let totalScore = 0;
        let numUnviewed = 0;

        assignmentSubs.forEach((submission: SubmissionType) => {
          if (submission.isFinalized) {
            numGraded += 1;
            if (submission.grade !== null) {
              totalScore += submission.grade;
            }
          } else if (submission.grader) {
            numUngraded += 1;
          } else {
            numUnclaimed += 1;
          }
          // Only calculate unviewed, and show a drawer if the assignment is released
          // Student is 'unviewed' if: (a) his/her submission has a History object
          //                           (b) student's email is not in viewsBySubmission
          //                           (c) student's submission is finalized
          if (assignment.isReleased && submission.id in this.props.viewsBySubmission) {
            submission.students.forEach((student) => {
              if (
                !this.props.viewsBySubmission[submission.id].includes(student) &&
                submissionsByStudent[student][assignment.id] &&
                submissionsByStudent[student][assignment.id].isFinalized
              ) {
                numUnviewed += 1;
              }
            });
          }
        });

        const numMissing = Object.keys(submissionsByStudent).reduce((missing: number, student: string) => {
          if (!submissionsByStudent[student][assignment.id]) {
            return missing + 1;
          }
          return missing;
        }, 0);

        // Get Mean and Median stats. If the assignment is released, we take the mean and median calculated by the API
        // so that students will see the same stats that admins see.
        // If the assignment is not released, we want to calculate it across all finalized submissions.
        let mean = 0;
        let median = 0;
        if (typeof assignment.mean === 'number' && typeof assignment.median === 'number') {
          mean = assignment.mean;
          median = assignment.median;
        } else {
          if (numGraded === 0) {
            mean = 0;
            median = 0;
          } else {
            // calculate mean
            mean = totalScore / numGraded;

            // calculate median
            const sortedFinalized = assignmentSubs.reduce((grades: number[], sub: SubmissionType) => {
              if (sub.isFinalized && sub.grade !== null) {
                grades.push(sub.grade);
              }
              return grades;
            }, []);

            sortedFinalized.sort();
            const index = Math.floor(sortedFinalized.length / 2);

            // if odd, get the index, if even average the two middle elements
            if (sortedFinalized.length % 2) {
              median = sortedFinalized[index];
            } else {
              median = (sortedFinalized[index - 1] + sortedFinalized[index]) / 2;
            }
          }
        }

        toRet[assignment.id] = {
          numSubmissions,
          numGraded,
          numUngraded,
          numUnclaimed,
          numMissing,
          numUnviewed,
          mean,
          median,
        };
      });
      return toRet;
    },
  );

  /******************************************************************************
   * UI Control
   ******************************************************************************/

  // This function is called when a an assignment drawer is opened
  // Depending on the type of data (DRAWER_TYPE), different sets of data will
  // be stored in state. We need to store the data in state of on render because
  // the drawer sliding takes time and looks bad if the data changes while it's sliding
  public openDrawer = (assignment: AssignmentType, type: DRAWER_TYPE) => {
    const { submissionsByStudent } = this.props;
    const subs = this.props.submissions[assignment.id];

    const getContent = () => {
      switch (type) {
        case DRAWER_TYPE.Submitted:
          return subs.map((sub: SubmissionType) => {
            return { email: sub.students.toString(), subID: sub.id };
          });
        case DRAWER_TYPE.Graded:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && sub.isFinalized) {
              students.push({ email: sub.students.toString(), subID: sub.id });
            }
            return students;
          }, []);
        case DRAWER_TYPE.Ungraded:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && !sub.isFinalized && sub.grader) {
              students.push({ email: sub.students.toString(), subID: sub.id });
            }
            return students;
          }, []);
        case DRAWER_TYPE.Unclaimed:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && !sub.isFinalized && !sub.grader) {
              students.push({ email: sub.students.toString(), subID: sub.id });
            }
            return students;
          }, []);
        case DRAWER_TYPE.Missing:
          return Object.keys(submissionsByStudent).reduce(
            (students: Array<{ email: string; subID: number | null }>, student: string) => {
              if (!submissionsByStudent[student][assignment.id]) {
                students.push({ email: student, subID: null });
              }
              return students;
            },
            [],
          );
        case DRAWER_TYPE.Unviewed:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            // Append a student if: (a) his/her submission has a History object
            //                      (b) student's email is not in viewsBySubmission
            //                      (c) student's submission is finalized
            if (sub && sub.id in this.props.viewsBySubmission) {
              sub.students.forEach((student) => {
                if (
                  !this.props.viewsBySubmission[sub.id].includes(student) &&
                  submissionsByStudent[student][assignment.id] &&
                  submissionsByStudent[student][assignment.id].isFinalized
                ) {
                  students.push({ email: student, subID: sub.id });
                }
              });
            }
            return students;
          }, []);
      }
    };

    const newContent: Array<{ email: string; subID: number | null }> = getContent();

    // Get the subtitle text to pass to the drawer
    const getText = () => {
      switch (type) {
        case DRAWER_TYPE.Submitted:
          return `Submissions (${newContent.length})`;
        case DRAWER_TYPE.Graded:
          return `Graded Submissions (${newContent.length})`;
        case DRAWER_TYPE.Ungraded:
          return `Ungraded Submissions (${newContent.length})`;
        case DRAWER_TYPE.Unclaimed:
          return `Unclaimed Submissions (${newContent.length})`;
        case DRAWER_TYPE.Missing:
          return `Students with missing submission (${newContent.length})`;
        case DRAWER_TYPE.Unviewed:
          return `Students who haven't viewed their finalized submissions (${newContent.length})`;
      }
    };

    this.setState({
      drawerContent: { title: assignment.name, subtitle: getText(), content: newContent },
      detailType: DETAIL_TYPE.Drawer,
      activeAssignment: assignment,
    });
  };

  public changeDetailType = (newState: DETAIL_TYPE | undefined, newAssignment: AssignmentType | undefined) => {
    this.setState({ detailType: newState, activeAssignment: newAssignment });
  };

  /******************************************************************************
   * Detail callbacks
   ******************************************************************************/

  public saveSettings = (assignment: AssignmentPatchType) => {
    this.props.updateAssignment(assignment);
    this.changeDetailType(undefined, undefined);
  };

  public deleteAssignment = () => {
    const deletingAssignment = this.state.activeAssignment;
    if (deletingAssignment) {
      this.setState({ activeAssignment: undefined, detailType: undefined });
      this.props.setLoadingDialog(
        'This action could impact a lot of data and may take a few minutes.',
        'Assignment is being deleted',
      );
      this.props.deleteAssignment(deletingAssignment).then(() => {
        this.props.clearLoadingDialog();
      });
    }
  };

  public downloadGrades = (assignment: AssignmentType) => {
    const { currentCourse, submissions } = this.props;
    if (!currentCourse) {
      return;
    }

    const subs = submissions[assignment.id];

    const grades: string[] = [`Student,${assignment.name} Grade`];
    subs.forEach((sub) => {
      sub.students.forEach((student) => {
        if (this.props.students.includes(student)) {
          grades.push(`${student},${sub.grade}`);
        }
      });
    });

    const csv = grades.join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8, ${csv}`;
    a.download = `${currentCourse.name}-${currentCourse.period}-${assignment.name}-grades.csv`;

    document.body.appendChild(a);
    a.click();
  };

  public getAllGrades = (
    assignments: AssignmentType[],
    submissions: IAssignmentToSubmissionsMap,
    students: string[],
  ) => {
    const columns: string[] = ['Active Student'].concat(
      assignments.map((assignment: AssignmentType) => {
        return assignment.name;
      }),
    );

    const csv = [columns];
    students.forEach((student: string) => {
      const row: string[] = [student];
      assignments.forEach((assignment: AssignmentType) => {
        const sub = submissions[assignment.id].find((submission: SubmissionType) => {
          return submission.students.includes(student);
        });
        const grade = sub && sub.grade ? sub.grade.toString() : '';
        row.push(grade);
      });
      csv.push(row);
    });

    return csv;
  };

  public downloadAllGrades = () => {
    if (!this.props.currentCourse) {
      return;
    }

    this.setState({ isDownloading: true });
    const csv = this.getAllGrades(this.props.assignments, this.props.submissions, this.props.students).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8, ${csv}`;
    a.download = `${this.props.currentCourse.name}-${this.props.currentCourse.period}-grades.csv`;

    document.body.appendChild(a);
    a.click();

    this.setState({ isDownloading: false });
  };

  /******************************************************************************
   * Render
   ******************************************************************************/

  public render() {
    const { submissions, assignments, loadComplete, submissionsByStudent } = this.props;
    const { activeAssignment, drawerContent, detailType } = this.state;

    const dummyFunction = () => {
      return;
    };

    if (detailType === DETAIL_TYPE.Rubric && activeAssignment) {
      return (
        <RubricManager
          assignment={activeAssignment}
          submissions={submissions[activeAssignment.id]}
          addErrorToast={this.props.addErrorToast}
          addToast={this.props.addToast}
          onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
          setLoadingDialog={this.props.setLoadingDialog}
          clearLoadingDialog={this.props.clearLoadingDialog}
        />
      );
    }

    let tableBody;
    if (loadComplete) {
      const submissionAssignments = assignments
        .filter((assignment) => {
          return assignment.id in submissions;
        })
        .map((assignment) => {
          return `${assignment.id}`;
        });

      const assignmentStats: IAssignmentStatsMap = this.memoizedStats(assignments, submissions, submissionsByStudent);
      tableBody = submissionAssignments.map((assignmentID) => {
        const assignment = assignments.filter((assn) => {
          return assn.id === Number(assignmentID);
        })[0];

        if (!assignment) {
          return <div />;
        }

        const menuItems = [
          {
            leftIcon: <FontIcon>toc</FontIcon>,
            primaryText: 'Edit Rubric',
            onClick: this.changeDetailType.bind(this.props, DETAIL_TYPE.Rubric, assignment),
          },
          {
            leftIcon: <FontIcon>vertical_align_bottom</FontIcon>,
            primaryText: 'Download Grades',
            onClick: this.downloadGrades.bind(this.props, assignment),
          },
          {
            leftIcon: <FontIcon>vertical_align_top</FontIcon>,
            primaryText: 'Upload Submission',
            onClick: this.changeDetailType.bind(this.props, DETAIL_TYPE.Upload, assignment),
          },
          {
            leftIcon: <FontIcon>settings</FontIcon>,
            primaryText: 'Settings',
            onClick: this.changeDetailType.bind(this.props, DETAIL_TYPE.Settings, assignment),
          },
          {
            leftIcon: <FontIcon>cancel</FontIcon>,
            primaryText: 'Delete Assignment',
            onClick: this.changeDetailType.bind(this.props, DETAIL_TYPE.Delete, assignment),
          },
        ];

        const statsForRow = assignmentStats[assignmentID];

        return (
          <TableRow key={assignmentID}>
            <TableColumn
              key={`${assignmentID}-1`}
              style={{ cursor: 'pointer' }}
              className="left-aligned"
              onClick={this.changeDetailType.bind(this.props, DETAIL_TYPE.Rubric, assignment)}
            >
              {assignment.name}
            </TableColumn>
            <TableColumn key={`${assignmentID}-2`}>
              <SelectionControl
                id={`${assignmentID}-release-checkbox`}
                name="assignment-release-checkbox"
                type="switch"
                defaultChecked={assignment.isReleased}
                onChange={this.props.updateAssignment.bind(this, {
                  id: assignment.id,
                  isReleased: !assignment.isReleased,
                })}
              />
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-3`}
              onClick={
                statsForRow.numSubmissions > 0
                  ? this.openDrawer.bind(this, assignment, DRAWER_TYPE.Submitted)
                  : dummyFunction
              }
              style={statsForRow.numSubmissions > 0 ? { cursor: 'pointer' } : {}}
            >
              {statsForRow.numSubmissions}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-4`}
              onClick={
                statsForRow.numGraded > 0 ? this.openDrawer.bind(this, assignment, DRAWER_TYPE.Graded) : dummyFunction
              }
              style={statsForRow.numGraded > 0 ? { cursor: 'pointer' } : {}}
            >
              {statsForRow.numGraded}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-5`}
              onClick={
                statsForRow.numUngraded > 0
                  ? this.openDrawer.bind(this, assignment, DRAWER_TYPE.Ungraded)
                  : dummyFunction
              }
              style={statsForRow.numUngraded > 0 ? { cursor: 'pointer' } : {}}
            >
              {statsForRow.numUngraded}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-6`}
              onClick={
                statsForRow.numUnclaimed > 0
                  ? this.openDrawer.bind(this, assignment, DRAWER_TYPE.Unclaimed)
                  : dummyFunction
              }
              style={statsForRow.numUnclaimed > 0 ? { cursor: 'pointer' } : {}}
            >
              {statsForRow.numUnclaimed}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-7`}
              onClick={
                statsForRow.numMissing > 0 ? this.openDrawer.bind(this, assignment, DRAWER_TYPE.Missing) : dummyFunction
              }
              style={statsForRow.numMissing > 0 ? { cursor: 'pointer' } : {}}
            >
              {statsForRow.numMissing}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-8`}
              onClick={
                statsForRow.numUnviewed > 0
                  ? this.openDrawer.bind(this, assignment, DRAWER_TYPE.Unviewed)
                  : dummyFunction
              }
              style={statsForRow.numUnviewed > 0 ? { cursor: 'pointer' } : {}}
            >
              {assignment.isReleased ? statsForRow.numUnviewed : '--'}
            </TableColumn>
            <TableColumn key={`${assignmentID}-9`}>{statsForRow.numGraded > 0 ? statsForRow.mean : '--'}</TableColumn>
            <TableColumn key={`${assignmentID}-10`}>
              {statsForRow.numGraded > 0 ? statsForRow.median : '--'}
            </TableColumn>
            <MenuButtonColumn className="left-aligned" icon menuItems={menuItems}>
              more_vert
            </MenuButtonColumn>
          </TableRow>
        );
      });
    }

    let detailComponent;
    if (activeAssignment) {
      switch (detailType) {
        case DETAIL_TYPE.Delete:
          detailComponent = (
            <DeleteAssignmentDialog
              isVisible={true}
              assignmentName={activeAssignment.name}
              onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
              onDelete={this.deleteAssignment}
            />
          );
          break;
        case DETAIL_TYPE.Upload:
          detailComponent = (
            <UploadSubmissionDialog
              isVisible={true}
              assignments={this.props.assignments}
              selectedAssignment={activeAssignment!}
              students={this.props.students}
              selectedStudents={null}
              onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
              uploadSubmission={this.props.uploadSubmission}
            />
          );
          break;
        case DETAIL_TYPE.Settings:
          detailComponent = (
            <AssignmentSettingsDialog
              isVisible={true}
              onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
              onSave={this.saveSettings}
              currentAssignment={activeAssignment}
            />
          );
          break;
        default:
          break;
      }
    }

    return (
      <div className="admin__main-panel__content-container">
        <div className="padding" />
        <NewAssignmentDialog
          assignments={this.props.assignments}
          addErrorToast={this.props.addErrorToast}
          createAssignment={this.props.createAssignment}
        />
        {this.state.isDownloading ? (
          <Button raised className="button--download-assignments">
            Downloading...
          </Button>
        ) : (
          <Button raised className="button--download-assignments" onClick={this.downloadAllGrades}>
            Download All Grades
          </Button>
        )}

        <div className="padding" />
        {loadComplete ? (
          <div>
            <DataTable className="DataTable--ManageAssignments" baseId="DataTable--ManageAssignments" plain={true}>
              <TableHeader>
                <TableRow>
                  <TableColumn className="left-aligned" key={'AssignmentName'}>
                    Assignment
                  </TableColumn>
                  <TableColumn key={'Publish'}>Published</TableColumn>
                  <TableColumn key={'SubNumber'}># submissions</TableColumn>
                  <TableColumn key={'GradedNumber'}># finalized</TableColumn>
                  <TableColumn key={'UngradedNumber'}># in progress</TableColumn>
                  <TableColumn key={'UnclaimedNumber'}># unclaimed</TableColumn>
                  <TableColumn key={'NumMissing'}>Students missing </TableColumn>
                  <TableColumn key={'numUnviewed'}># unviewed </TableColumn>
                  <TableColumn key={'Mean'}>Mean Grade</TableColumn>
                  <TableColumn key={'Median'}>Median Grade</TableColumn>
                  <TableColumn className="left-aligned" key={'Menu'} />
                </TableRow>
              </TableHeader>
              <TableBody>{tableBody}</TableBody>
            </DataTable>
            {detailComponent}
            <div>
              <div
                className={`drawer__background${detailType !== DETAIL_TYPE.Drawer ? '--hidden' : ''}`}
                onClick={
                  detailType === DETAIL_TYPE.Drawer
                    ? this.changeDetailType.bind(this.props, undefined, undefined)
                    : dummyFunction
                }
              />
              <Drawer
                id="drawer--ManageAssignments"
                type={Drawer.DrawerTypes.TEMPORARY}
                className="drawer--ManageAssignments"
                visible={detailType === DETAIL_TYPE.Drawer}
                position={'right'}
                onVisibilityChange={this.changeDetailType.bind(this.props, undefined, undefined)}
                style={{ zIndex: 16777271 }}
                header={
                  <div className="drawer__header">
                    <div className="drawer__title">{drawerContent.title}</div>
                    <Button
                      className="drawer__close"
                      icon={true}
                      flat={true}
                      onClick={this.changeDetailType.bind(this.props, undefined, undefined)}
                    >
                      clear
                    </Button>
                    <div className="drawer__subtitle">{drawerContent.subtitle}</div>
                  </div>
                }
              >
                <div className="drawer__content">
                  {drawerContent.content.map((item: { email: string; subID: number | null }) => {
                    return (
                      <div
                        key={item.email}
                        className={`drawer__item${item.subID ? '--allowHover' : ''}`}
                        onClick={item.subID ? openSubmission.bind(this, item.subID) : dummyFunction}
                      >
                        {item.email}
                      </div>
                    );
                  })}
                </div>
              </Drawer>
            </div>
          </div>
        ) : (
          <CircularProgress id="progress" className="progress-circle" />
        )}
      </div>
    );
  }
}

export default ManageAssignments;

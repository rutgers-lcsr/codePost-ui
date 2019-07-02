/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Drawer, Dropdown, Empty, Icon, Menu, message, Popconfirm, Switch, Table, Typography } from 'antd';
const { Text } = Typography;
const SubMenu = Menu.SubMenu;

type alignType = 'left' | 'right' | 'center';

import CPButton from '../../../components/core/CPButton';
import CPAdminDetail from '../other/CPAdminDetail';

/* other library imports */
import memoizeOne from 'memoize-one';

/* codePost imports */
import { AssignmentPatchType, AssignmentType } from '../../../infrastructure/assignment';
import { CourseType } from '../../../infrastructure/course';
import { SubmissionType } from '../../../infrastructure/submission';

import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import DeleteAssignmentDialog from './assignments/DeleteAssignmentDialog';

import UploadSubmissionBulkDialog from './assignments/UploadSubmissionBulkDialog';
import UploadSubmissionDialog from './assignments/UploadSubmissionDialog';

import { openSubmission } from '../other/AdminUtils';

import NewAssignmentDialog from './assignments/NewAssignmentDialog';

import AssignmentSettingsDialog from './assignments/AssignmentSettingsDialog';

import RubricManager from './rubric/RubricManager';

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

  /* object-level REST operations */
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<AssignmentType>;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;

  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  updateSubmission: (submission: SubmissionType) => Promise<void>;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
}

export enum DETAIL_TYPE {
  Rubric,
  Upload_Single,
  Upload_Multiple,
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
  drawerType?: DRAWER_TYPE;
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
   Assignment stat calculation
  *****************************************************************************/

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
                !(student in this.props.viewsBySubmission[submission.id]) &&
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
            mean = parseFloat((totalScore / numGraded).toPrecision(2));

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
            return { email: sub.students.join(', '), subID: sub.id };
          });
        case DRAWER_TYPE.Graded:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && sub.isFinalized) {
              students.push({ email: sub.students.join(', '), subID: sub.id });
            }
            return students;
          }, []);
        case DRAWER_TYPE.Ungraded:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && !sub.isFinalized && sub.grader) {
              students.push({ email: sub.students.join(', '), subID: sub.id });
            }
            return students;
          }, []);
        case DRAWER_TYPE.Unclaimed:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && !sub.isFinalized && !sub.grader) {
              students.push({ email: sub.students.join(', '), subID: sub.id });
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
                  !(student in this.props.viewsBySubmission[sub.id]) &&
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
          return `Total Submissions (${newContent.length})`;
        case DRAWER_TYPE.Graded:
          return `Finalized Submissions (${newContent.length})`;
        case DRAWER_TYPE.Ungraded:
          return `Ungraded Submissions (${newContent.length})`;
        case DRAWER_TYPE.Unclaimed:
          return `Unclaimed Submissions (${newContent.length})`;
        case DRAWER_TYPE.Missing:
          return `Students missing a submission (${newContent.length})`;
        case DRAWER_TYPE.Unviewed:
          return `Unviewed submissions (${newContent.length})`;
      }
    };

    this.setState({
      drawerContent: { title: assignment.name, subtitle: getText(), content: newContent },
      detailType: DETAIL_TYPE.Drawer,
      activeAssignment: assignment,
      drawerType: type,
    });
  };

  public changeDetailType = (newState: DETAIL_TYPE | undefined, newAssignment: AssignmentType | undefined) => {
    this.setState({ detailType: newState, activeAssignment: newAssignment });
  };

  /******************************************************************************
   * Detail callbacks
   ******************************************************************************/

  public saveSettings = (assignment: AssignmentPatchType) => {
    return this.props.updateAssignment(assignment);
  };

  public deleteAssignment = () => {
    const deletingAssignment = this.state.activeAssignment;
    if (deletingAssignment) {
      this.setState({ activeAssignment: undefined, detailType: undefined });
      this.props.deleteAssignment(deletingAssignment).then(() => {
        message.success('Assignment successfully deleted!');
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
    let content;
    let actions: React.ReactNode[] = [];
    let data: any[] = [];

    const aligner: alignType = 'center';
    const columns = [
      {
        title: 'Assignment',
        dataIndex: 'assignment',
        key: 'assignment',
      },
      {
        title: 'Published',
        dataIndex: 'published',
        key: 'published',
        align: aligner,
      },
      {
        title: 'Submissions',
        dataIndex: 'submissions',
        key: 'submissions',
        align: aligner,
      },
      {
        title: 'Finalized',
        dataIndex: 'finalized',
        key: 'finalized',
        align: aligner,
      },
      {
        title: 'Unclaimed',
        dataIndex: 'unclaimed',
        key: 'unclaimed',
        align: aligner,
      },
      {
        title: 'Missing',
        dataIndex: 'missing',
        key: 'missing',
        align: aligner,
      },
      {
        title: 'Unviewed',
        dataIndex: 'unviewed',
        key: 'unviewed',
        align: aligner,
      },
      {
        title: 'Mean',
        dataIndex: 'mean',
        key: 'mean',
        align: aligner,
      },
      {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        align: aligner,
      },
    ];

    if (!this.props.loadComplete) {
      content = (
        <div>
          <Table pagination={false} columns={columns} dataSource={data} loading={!this.props.loadComplete} />
        </div>
      );
    } else {
      if (this.props.assignments.length === 0) {
        content = (
          <Empty
            imageStyle={{
              height: 60,
            }}
            description={<span>No assignments yet</span>}
          >
            <NewAssignmentDialog
              key={1}
              assignments={this.props.assignments}
              createAssignment={this.props.createAssignment}
            />
          </Empty>
        );
      } else {
        actions = [
          <NewAssignmentDialog
            key={1}
            assignments={this.props.assignments}
            createAssignment={this.props.createAssignment}
          />,
          <CPButton onClick={this.downloadAllGrades} cpType="secondary" key={2} icon="download">
            Download grades
          </CPButton>,
        ];

        const assignmentStats: IAssignmentStatsMap = this.memoizedStats(
          this.props.assignments,
          this.props.submissions,
          this.props.submissionsByStudent,
        );

        data = this.props.assignments
          .sort((a, b) => {
            if (a.sortKey === b.sortKey) {
              return a.id - b.id;
            } else {
              return a.sortKey - b.sortKey;
            }
          })
          .map((assignment, i) => {
            const statsForRow = assignmentStats[assignment.id];
            const menu = (
              <Menu>
                <Menu.Item key="1" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Rubric, assignment)}>
                  <Icon type="ordered-list" />
                  Edit rubric
                </Menu.Item>
                <Menu.Item key="2" onClick={this.downloadGrades.bind(this, assignment)}>
                  <Icon type="download" />
                  Download grades
                </Menu.Item>
                <SubMenu
                  key="sub1"
                  title={
                    <span>
                      <Icon type="upload" />
                      <span>&nbsp;&nbsp;Upload submissions</span>
                    </span>
                  }
                >
                  <Menu.Item
                    key="0.1"
                    onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Upload_Single, assignment)}
                  >
                    <Icon type="file" />
                    Single submission
                  </Menu.Item>
                  <Menu.Item
                    key="0.2"
                    onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Upload_Multiple, assignment)}
                  >
                    <Icon type="folder" />
                    Multiple submissions
                  </Menu.Item>
                </SubMenu>
                <Menu.Item key="3" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Settings, assignment)}>
                  <Icon type="setting" />
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key="4"
                  style={{ color: 'red' }}
                  onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Delete, assignment)}
                >
                  <Icon type="delete" />
                  Delete assignment
                </Menu.Item>
              </Menu>
            );

            let publishToggleText = '';
            if (assignment.isReleased) {
              publishToggleText = 'Are you sure you want to un-publish this assignment?';
            } else {
              publishToggleText = 'Are you sure you want to publish this assignment?';
            }

            const hoverStyle = { cursor: 'pointer' };

            return {
              key: assignment.id,
              assignment: <Text strong>{assignment.name}</Text>,
              published: (
                <Popconfirm
                  onConfirm={this.props.updateAssignment.bind(this, {
                    id: assignment.id,
                    isReleased: !assignment.isReleased,
                  })}
                  title={publishToggleText}
                  icon={<Icon type="question-circle-o" />}
                >
                  <Switch checked={assignment.isReleased} />
                </Popconfirm>
              ),
              submissions: (
                <span onClick={this.openDrawer.bind(this, assignment, DRAWER_TYPE.Submitted)} style={hoverStyle}>
                  {statsForRow.numSubmissions}
                </span>
              ),
              finalized: (
                <span onClick={this.openDrawer.bind(this, assignment, DRAWER_TYPE.Graded)} style={hoverStyle}>
                  {statsForRow.numGraded}
                </span>
              ),
              unclaimed: (
                <span onClick={this.openDrawer.bind(this, assignment, DRAWER_TYPE.Unclaimed)} style={hoverStyle}>
                  {statsForRow.numUnclaimed}
                </span>
              ),
              missing: (
                <span onClick={this.openDrawer.bind(this, assignment, DRAWER_TYPE.Missing)} style={hoverStyle}>
                  {statsForRow.numMissing}
                </span>
              ),
              unviewed: (
                <span onClick={this.openDrawer.bind(this, assignment, DRAWER_TYPE.Unviewed)} style={hoverStyle}>
                  {statsForRow.numUnviewed}
                </span>
              ),
              mean: statsForRow.numGraded > 0 ? `${statsForRow.mean.toFixed(1)} / ${assignment.points}` : '--',
              actions: (
                <Dropdown overlay={menu} trigger={['click']}>
                  <Icon type="menu" />
                </Dropdown>
              ),
            };
          });

        let detailComponent;
        switch (this.state.detailType) {
          case DETAIL_TYPE.Settings:
            detailComponent = (
              <AssignmentSettingsDialog
                isVisible={true}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
                onSave={this.saveSettings}
                currentAssignment={this.state.activeAssignment!}
                assignments={this.props.assignments}
              />
            );
            break;
          case DETAIL_TYPE.Upload_Single:
            detailComponent = (
              <UploadSubmissionDialog
                isVisible={true}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
                assignments={[this.state.activeAssignment!]}
                selectedAssignment={this.state.activeAssignment!}
                students={this.props.students}
                selectedStudents={[]}
                submissions={this.props.submissionsByStudent}
                uploadSubmission={this.props.uploadSubmission}
              />
            );
            break;
          case DETAIL_TYPE.Upload_Multiple:
            detailComponent = (
              <UploadSubmissionBulkDialog
                isVisible={true}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
                assignment={this.state.activeAssignment!}
                submissions={this.props.submissions[this.state.activeAssignment!.id]}
                students={this.props.students}
                uploadSubmission={this.props.uploadSubmission}
                updateSubmission={this.props.updateSubmission}
                deleteSubmission={this.props.deleteSubmission}
              />
            );
            break;
          case DETAIL_TYPE.Delete:
            detailComponent = (
              <DeleteAssignmentDialog
                isVisible={true}
                assignmentName={this.state.activeAssignment!.name}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
                onDelete={this.deleteAssignment}
              />
            );
            break;
          case DETAIL_TYPE.Rubric:
            return (
              <RubricManager
                assignment={this.state.activeAssignment!}
                submissions={this.props.submissions[this.state.activeAssignment!.id]}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
              />
            );
            break;
        }

        const drawerColumns = [
          {
            title: 'Students',
            dataIndex: 'students',
            key: 'students',
            align: 'left' as 'left' | 'center' | 'right' /* this is so ugly.. */,
          },
        ];
        if (this.state.drawerType !== undefined && this.state.drawerType !== DRAWER_TYPE.Missing) {
          drawerColumns.push({
            title: 'Open',
            dataIndex: 'open',
            key: 'open',
            align: aligner,
          });
        }

        const drawerData = this.state.drawerContent.content.map((el) => {
          return {
            students: el.email,
            open: el.subID ? (
              <a onClick={openSubmission.bind(this, el.subID)} className="internal-link">
                <Icon type="code" />
              </a>
            ) : null,
          };
        });

        const drawerComponent = (
          <Drawer
            title={`${this.state.drawerContent.title} | ${this.state.drawerContent.subtitle}`}
            placement="right"
            closable={true}
            onClose={this.changeDetailType.bind(this.props, undefined, undefined)}
            visible={this.state.detailType === DETAIL_TYPE.Drawer}
            width={600}
          >
            <Table columns={drawerColumns} dataSource={drawerData} pagination={false} />
          </Drawer>
        );

        content = (
          <div>
            <Table pagination={false} columns={columns} dataSource={data} loading={!this.props.loadComplete} />
            {detailComponent}
            {drawerComponent}
          </div>
        );
      }
    }

    return (
      <CPAdminDetail
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item>Assignments</Breadcrumb.Item>
          </Breadcrumb>
        }
        goBack={null}
        title={'Assignments'}
        actions={actions}
        content={content}
      />
    );
  }
}

export default ManageAssignments;

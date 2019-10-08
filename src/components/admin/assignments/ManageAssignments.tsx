/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Dropdown, Empty, Icon, Menu, message, Popconfirm, Switch, Table, Tag, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import CPAdminDetail from '../other/CPAdminDetail';

/* other library imports */
import memoizeOne from 'memoize-one';

/* codePost imports */
import { AssignmentPatchType, AssignmentType, sortAssignments } from '../../../infrastructure/assignment';
import { CourseType } from '../../../infrastructure/course';
import { SubmissionType } from '../../../infrastructure/submission';
import { UserType } from '../../../infrastructure/user';

import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import DeleteAssignmentDialog from './assignments/DeleteAssignmentDialog';

import UploadSubmissionBulkDialog from './assignments/UploadSubmissionBulkDialog';
import UploadSubmissionDialog from './assignments/UploadSubmissionDialog';

import NewAssignmentDialog from './assignments/NewAssignmentDialog';

import AssignmentSettingsDialog from './assignments/AssignmentSettingsDialog';

import RubricUI from './rubric/RubricUI';

import RubricManager, { IRubricManagerParams } from '../../../components/core/rubric/RubricManager';

import AssignmentStats from './assignments/AssignmentStats/AssignmentStats';

import AssignmentRegrades from './assignments/AssignmentRegrades';

import DownloadGrades from './assignments/DownloadGrades';

import Moss from './assignments/Moss';

import { sendSlack } from '../../../components/core/slack';

import {
  calculateMultipleAssignmentProgressStats,
  DRAWER_TYPE,
  filterDataByStat,
  getDrawerTitle,
  IAssignmentProgressStatsMap,
  StatsDrawer,
} from './assignments/AssignmentStats/StatsUtils';

import SendEmailModal from '../other/SendEmailModal';

const { Text } = Typography;
const SubMenu = Menu.SubMenu;

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

export interface IManageAssignmentsProps {
  /* assignment data */
  assignments: AssignmentType[];
  submissions: IAssignmentToSubmissionsMap;
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;
  currentCourse: CourseType | undefined;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };

  /* loading state */
  loadComplete: boolean;

  /* object-level REST operations */
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<AssignmentType>;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;

  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  updateSubmission: (submission: SubmissionType) => Promise<void>;

  /* Refresh course */
  refreshCourseData: () => void;

  /* misc */
  myEmail: string;

  /* user data */
  user: UserType;

  location: any;
}

export enum DETAIL_TYPE {
  Rubric,
  Upload_Single,
  Upload_Multiple,
  Upload_Import,
  Settings,
  Delete,
  Drawer,
  Stats,
  Regrades,
  Moss,
  DownloadGrades,
}

interface IManageAssignmentsState {
  /* what is selected? */
  activeAssignment?: AssignmentType; // which assignment has been clicked
  detailType?: DETAIL_TYPE; // what detail view are we showing
  drawerType?: DRAWER_TYPE;
  drawerContent: {
    title: string;
    subtitle: string;
    content: Array<{ email: string; subID: number | null }>;
  };
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

  public calculateStats = memoizeOne(calculateMultipleAssignmentProgressStats);

  /******************************************************************************
   * UI Control
   ******************************************************************************/

  // This function is called when a an assignment drawer is opened
  // Depending on the type of data (DRAWER_TYPE), different sets of data will
  // be stored in state. We need to store the data in state of on render because
  // the drawer sliding takes time and looks bad if the data changes while it's sliding
  public openDrawer = (assignment: AssignmentType, type: DRAWER_TYPE) => {
    const newContent: Array<{
      email: string;
      subID: number | null;
    }> = filterDataByStat(
      assignment,
      this.props.submissionsByStudent,
      type,
      this.props.submissions[assignment.id],
      this.props.viewsBySubmission,
      this.props.students,
    );

    const title = getDrawerTitle(type, newContent.length);

    this.setState({
      drawerContent: {
        title: assignment.name,
        subtitle: title,
        content: newContent,
      },
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
        title: (
          <div>
            Published
            <CPTooltip
              title={tooltips.admin.assignments.published}
              infoIcon={true}
              hideThisOnHideTips={true}
              iconStyle={{ paddingLeft: 5 }}
            />
          </div>
        ),
        dataIndex: 'published',
        key: 'published',
        align: aligner,
      },
      {
        title: (
          <div>
            Submissions
            <CPTooltip
              title={tooltips.admin.assignments.submissions}
              infoIcon={true}
              hideThisOnHideTips={true}
              iconStyle={{ paddingLeft: 5 }}
            />
          </div>
        ),
        dataIndex: 'submissions',
        key: 'submissions',
        align: aligner,
      },
      {
        title: (
          <div>
            Finalized
            <CPTooltip
              title={tooltips.admin.assignments.finalized}
              infoIcon={true}
              hideThisOnHideTips={true}
              iconStyle={{ paddingLeft: 5 }}
            />
          </div>
        ),
        dataIndex: 'finalized',
        key: 'finalized',
        align: aligner,
      },
      {
        title: (
          <div>
            Missing
            <CPTooltip
              title={tooltips.admin.assignments.missing}
              infoIcon={true}
              hideThisOnHideTips={true}
              iconStyle={{ paddingLeft: 5 }}
            />
          </div>
        ),
        dataIndex: 'missing',
        key: 'missing',
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
          <Table
            pagination={false}
            columns={columns}
            locale={{ emptyText: 'Loading your assignments...' }}
            loading={!this.props.loadComplete}
          />
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
          <CPButton
            onClick={this.changeDetailType.bind(this, DETAIL_TYPE.DownloadGrades, undefined)}
            cpType="secondary"
            key={2}
            icon="download"
          >
            Download grades
          </CPButton>,
        ];

        const assignmentStats: IAssignmentProgressStatsMap = this.calculateStats(
          this.props.assignments,
          this.props.submissions,
          this.props.submissionsByStudent,
          this.props.viewsBySubmission,
          this.props.students,
        );

        data = sortAssignments(this.props.assignments).map((assignment, i) => {
          const statsForRow = assignmentStats[assignment.id];
          const menu = (
            <Menu>
              <Menu.Item key="1" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Rubric, assignment)}>
                <Icon type="ordered-list" />
                Edit rubric
              </Menu.Item>
              <Menu.Item key="2" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.DownloadGrades, assignment)}>
                <Icon type="download" />
                Download grades
              </Menu.Item>
              <Menu.Item key="3" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Stats, assignment)}>
                <Icon type="bar-chart" />
                View Stats
              </Menu.Item>
              {assignment.allowRegradeRequests ? (
                <Menu.Item key="3.1" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Regrades, assignment)}>
                  <Icon type="message" />
                  View Regrades
                </Menu.Item>
              ) : (
                <div />
              )}
              <Menu.Item key="moss" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Moss, assignment)}>
                <Icon type="diff" />
                Check Moss <Tag>BETA</Tag>
              </Menu.Item>
              <SubMenu
                key="4"
                title={
                  <span>
                    <Icon type="upload" />
                    <span>&nbsp;&nbsp;Upload submissions</span>
                  </span>
                }
              >
                <Menu.Item key="0.1" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Upload_Single, assignment)}>
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
                <Menu.Item key="0.3" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Upload_Import, assignment)}>
                  <Icon type="import" />
                  Import
                </Menu.Item>
              </SubMenu>
              <Menu.Item key="5" onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Settings, assignment)}>
                <Icon type="setting" />
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                key="6"
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

          const notifyButton = (toggleDialog: () => void) => {
            return (
              <CPTooltip title="Notify students via email. ">
                <Icon onClick={toggleDialog} style={{ cursor: 'pointer' }} type="mail" />
              </CPTooltip>
            );
          };

          const onConfirm = () => {
            if (!assignment.isReleased) {
              sendSlack(
                'Assignment published',
                `${assignment.name} | ${this.props.currentCourse ? this.props.currentCourse.name : ''} ${
                  this.props.currentCourse ? this.props.currentCourse.period : ''
                }`,
              );
            }

            this.props.updateAssignment({
              id: assignment.id,
              isReleased: !assignment.isReleased,
            });
          };

          return {
            key: assignment.id,
            assignment: <Text strong>{assignment.name}</Text>,
            published: (
              <span className="display-flex align-items-center justify-content-center">
                <Popconfirm onConfirm={onConfirm} title={publishToggleText} icon={<Icon type="question-circle-o" />}>
                  <Switch checked={assignment.isReleased} />
                </Popconfirm>
                {assignment.isReleased ? (
                  <span>
                    &nbsp; &nbsp;
                    <SendEmailModal
                      buttonText={'Notify students'}
                      title="Notify students via email"
                      template="publish_assignment"
                      course={this.props.currentCourse!}
                      assignment={assignment}
                      me={this.props.myEmail}
                      emails={this.props.students}
                      body={<div>Notify students via email that {assignment.name} has been published.</div>}
                      button={notifyButton}
                    />
                  </span>
                ) : null}
              </span>
            ),
            submissions:
              statsForRow.numSubmissions === 0 ? (
                <CPButton
                  cpType="secondary"
                  onClick={this.changeDetailType.bind(this, DETAIL_TYPE.Upload_Multiple, assignment)}
                >
                  <Icon type="upload" />
                  Upload
                </CPButton>
              ) : (
                <span onClick={this.openDrawer.bind(this, assignment, DRAWER_TYPE.Submitted)} className="text-link">
                  {statsForRow.numSubmissions}
                </span>
              ),
            finalized: (
              <span onClick={this.openDrawer.bind(this, assignment, DRAWER_TYPE.Graded)} className="text-link">
                {statsForRow.numGraded}
              </span>
            ),
            missing: (
              <span onClick={this.openDrawer.bind(this, assignment, DRAWER_TYPE.Missing)} className="text-link">
                {statsForRow.numMissing}
              </span>
            ),
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
                showImportOptions={false}
              />
            );
            break;
          case DETAIL_TYPE.Upload_Import:
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
                showImportOptions={true}
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
                shouldLoadFeedback={true}
              >
                {({ props, state, helpers }: IRubricManagerParams) => {
                  return <RubricUI props={props} state={state} helpers={helpers} />;
                }}
              </RubricManager>
            );
          case DETAIL_TYPE.Stats:
            return (
              <AssignmentStats
                course={this.props.currentCourse!}
                assignment={this.state.activeAssignment!}
                submissions={this.props.submissions[this.state.activeAssignment!.id]}
                students={this.props.students}
                submissionsByStudent={this.props.submissionsByStudent}
                viewsBySubmission={this.props.viewsBySubmission}
                refreshCourseData={this.props.refreshCourseData}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
                myEmail={this.props.myEmail}
              />
            );
          case DETAIL_TYPE.Moss:
            return (
              <Moss
                course={this.props.currentCourse!}
                assignment={this.state.activeAssignment!}
                submissions={this.props.submissions[this.state.activeAssignment!.id]}
                user={this.props.user}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
                location={this.props.location}
              />
            );
          case DETAIL_TYPE.Regrades:
            return (
              <AssignmentRegrades
                assignment={this.state.activeAssignment!}
                submissions={this.props.submissions[this.state.activeAssignment!.id]}
                refreshCourseData={this.props.refreshCourseData}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
                user={this.props.user}
                updateSubmission={this.props.updateSubmission}
                currentCourse={this.props.currentCourse!}
              />
            );
          case DETAIL_TYPE.DownloadGrades:
            detailComponent = (
              <DownloadGrades
                activeAssignment={this.state.activeAssignment}
                assignments={this.props.assignments}
                submissionsByStudent={this.props.submissionsByStudent}
                students={this.props.students}
                currentCourse={this.props.currentCourse!}
                onCancel={this.changeDetailType.bind(this.props, undefined, undefined)}
              />
            );
            break;
        }

        const drawerComponent =
          this.state.drawerType === undefined ? (
            <div />
          ) : (
            <StatsDrawer
              type={this.state.drawerType}
              content={this.state.drawerContent}
              onClose={this.changeDetailType.bind(this.props, undefined, undefined)}
              isVisible={this.state.detailType === DETAIL_TYPE.Drawer}
            />
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

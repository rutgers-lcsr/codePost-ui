/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Dropdown, Empty, Icon, Menu, message, Popconfirm, Switch, Tag, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import { TableDetail } from '../other/TableDetail';

/* other library imports */
import memoizeOne from 'memoize-one';

import { Link } from 'react-router-dom';

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

import DownloadGrades from './assignments/DownloadGrades';

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

import { encodeForLink } from '../../core/URLutils';

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
  match: any;
  history: any;

  activeAssignment?: AssignmentType; // which assignment has been clicked
  detailType?: DETAIL_TYPE; // what detail view are we showing
  baseURL: string;
}

export enum DETAIL_TYPE {
  Upload_Single,
  Upload_Multiple,
  Upload_Import,
  Settings,
  Delete,
  Drawer,
  DownloadGrades,
}

interface IManageAssignmentsState {
  drawerType?: DRAWER_TYPE;
  drawerContent: {
    title: string;
    subtitle: string;
    content: Array<{ email: string; subID: number | null }>;
  };
  isDownloading: boolean;
  activeStudent?: string; // track student from drawer to upload component
}

/**********************************************************************************************************************/

class AssignmentsTable extends React.Component<IManageAssignmentsProps, IManageAssignmentsState> {
  public state: Readonly<IManageAssignmentsState> = {
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
    ).sort((a, b) => {
      return a.email.localeCompare(b.email);
    });

    const title = getDrawerTitle(type, newContent.length);

    this.setState({
      drawerContent: {
        title: assignment.name,
        subtitle: title,
        content: newContent,
      },
      drawerType: type,
    });
  };

  /******************************************************************************
   * Detail callbacks
   ******************************************************************************/

  public saveSettings = (assignment: AssignmentPatchType) => {
    return this.props.updateAssignment(assignment);
  };

  public deleteAssignment = () => {
    const deletingAssignment = this.props.activeAssignment;
    if (deletingAssignment) {
      this.props.deleteAssignment(deletingAssignment).then(() => {
        message.success('Assignment successfully deleted!');
        this.props.history.push(this.props.baseURL);
      });
    }
  };

  public uploadForStudent = (assignmentName: string, student: string) => {
    // Note: this call to setState is futile, because the component will be reloaded when
    // new route is pushed to this.props.history
    this.setState({ activeStudent: student }, () => {
      this.props.history.push(`${this.props.baseURL}/${encodeForLink(assignmentName)}/upload/single`);
    });
  };

  public closeSingleSubmissionUpload = () => {
    this.props.history.push(this.props.baseURL);
    this.setState({ activeStudent: undefined });
  };

  /******************************************************************************
   * Render
   ******************************************************************************/

  public render() {
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

    actions = [
      <NewAssignmentDialog
        key={1}
        assignments={this.props.assignments}
        createAssignment={this.props.createAssignment}
      />,
      <Link to={`${this.props.baseURL}/download/grades`}>
        <CPButton cpType="secondary" key={2} icon="download">
          Download grades
        </CPButton>
      </Link>,
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
      const encodedName = encodeForLink(assignment.name);
      const menu = (
        <Menu>
          <Menu.Item key="1">
            <Link to={`${this.props.baseURL}/${encodedName}/rubric`}>
              <Icon type="ordered-list" />
              &nbsp; Edit rubric
            </Link>
          </Menu.Item>
          <Menu.Item key="tests">
            <Link to={`${this.props.baseURL}/${encodedName}/tests`}>
              <Icon type="file-done" />
              &nbsp; Edit tests
            </Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to={`${this.props.baseURL}/${encodedName}/download/grades`}>
              <Icon type="download" />
              &nbsp; Download grades
            </Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link to={`${this.props.baseURL}/${encodedName}/stats`}>
              <Icon type="bar-chart" />
              &nbsp; View Stats
            </Link>
          </Menu.Item>
          {assignment.allowRegradeRequests ? (
            <Menu.Item key="3.1">
              <Link to={`${this.props.baseURL}/${encodedName}/regrades`}>
                <Icon type="message" />
                &nbsp; View Regrades
              </Link>
            </Menu.Item>
          ) : (
            <div />
          )}
          <Menu.Item key="moss">
            <Link to={`${this.props.baseURL}/${encodedName}/moss`}>
              <Icon type="diff" />
              &nbsp; Check Moss <Tag>BETA</Tag>
            </Link>
          </Menu.Item>
          <SubMenu
            key="4"
            title={
              <span>
                <Icon type="upload" />
                <span>&nbsp; Upload submissions</span>
              </span>
            }
          >
            <Menu.Item key="0.1">
              <Link to={`${this.props.baseURL}/${encodedName}/upload/single`}>
                <Icon type="file" />
                &nbsp; Single submission
              </Link>
            </Menu.Item>
            <Menu.Item key="0.2">
              <Link to={`${this.props.baseURL}/${encodedName}/upload/multiple`}>
                <Icon type="folder" />
                &nbsp; Multiple submissions
              </Link>
            </Menu.Item>
            <Menu.Item key="0.3">
              <Link to={`${this.props.baseURL}/${encodedName}/upload/import`}>
                <Icon type="import" />
                &nbsp; Import
              </Link>
            </Menu.Item>
          </SubMenu>
          <Menu.Item key="5">
            <Link to={`${this.props.baseURL}/${encodedName}/settings`}>
              <Icon type="setting" />
              &nbsp; Settings
            </Link>
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item key="6" style={{ color: 'red' }}>
            <Link to={`${this.props.baseURL}/${encodedName}/delete`}>
              <Icon type="delete" />
              &nbsp; Delete assignment
            </Link>
          </Menu.Item>
        </Menu>
      );

      let publishToggleText: React.ReactElement | string = '';
      if (assignment.isReleased) {
        publishToggleText = 'Are you sure you want to un-publish this assignment?';
      } else {
        const stats = assignmentStats[assignment.id];
        const finalizedRatio = stats.numSubmissions !== 0 ? stats.numGraded / stats.numSubmissions : 1;
        if (!assignment.liveFeedbackMode && finalizedRatio < 0.5) {
          publishToggleText = (
            <div>
              <div style={{ paddingBottom: '4px', maxWidth: '260px' }}>
                Are you sure you want to publish this assignment?
              </div>
              <div style={{ paddingBottom: '4px', maxWidth: '260px' }}>
                The majority of your submissions are still unfinalized, so students will not be able to view them.
              </div>
            </div>
          );
        } else {
          publishToggleText = 'Are you sure you want to publish this assignment?';
        }
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
            <CPButton cpType="secondary">
              <Link to={`${this.props.baseURL}/${encodeURIComponent(assignment.name)}/upload/multiple`}>
                <Icon type="upload" /> &nbsp; Upload
              </Link>
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

    const cancel = () => {
      this.props.history.push(this.props.baseURL);
    };

    const drawerComponent =
      this.state.drawerType === undefined ? (
        <div />
      ) : (
        <StatsDrawer
          type={this.state.drawerType}
          content={this.state.drawerContent}
          isVisible={true}
          onClose={cancel}
          uploadSubmission={this.uploadForStudent}
        />
      );

    let detailComponent;
    if (this.props.activeAssignment !== undefined && this.props.detailType !== undefined) {
      switch (this.props.detailType) {
        case DETAIL_TYPE.Settings:
          detailComponent = (
            <AssignmentSettingsDialog
              isVisible={true}
              onCancel={cancel}
              onSave={this.saveSettings}
              currentAssignment={this.props.activeAssignment}
              assignments={this.props.assignments}
            />
          );
          break;
        case DETAIL_TYPE.Upload_Single:
          detailComponent = (
            <UploadSubmissionDialog
              isVisible={true}
              onCancel={this.closeSingleSubmissionUpload}
              assignments={[this.props.activeAssignment]}
              selectedAssignment={this.props.activeAssignment}
              students={this.props.students}
              selectedStudents={this.state.activeStudent !== undefined ? [this.state.activeStudent] : []}
              submissions={this.props.submissionsByStudent}
              uploadSubmission={this.props.uploadSubmission}
            />
          );
          break;
        case DETAIL_TYPE.Upload_Multiple:
          detailComponent = (
            <UploadSubmissionBulkDialog
              isVisible={true}
              onCancel={cancel}
              assignment={this.props.activeAssignment}
              submissions={this.props.submissions[this.props.activeAssignment.id]}
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
              onCancel={cancel}
              assignment={this.props.activeAssignment}
              submissions={this.props.submissions[this.props.activeAssignment.id]}
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
              assignmentName={this.props.activeAssignment.name}
              onCancel={cancel}
              onDelete={this.deleteAssignment}
            />
          );
          break;
        case DETAIL_TYPE.DownloadGrades:
          detailComponent = (
            <DownloadGrades
              activeAssignment={this.props.activeAssignment}
              assignments={this.props.assignments}
              submissionsByStudent={this.props.submissionsByStudent}
              students={this.props.students}
              currentCourse={this.props.currentCourse!}
              onCancel={cancel}
            />
          );
          break;
      }
    } else if (this.props.detailType) {
      switch (this.props.detailType) {
        case DETAIL_TYPE.DownloadGrades:
          detailComponent = (
            <DownloadGrades
              activeAssignment={this.props.activeAssignment}
              assignments={this.props.assignments}
              submissionsByStudent={this.props.submissionsByStudent}
              students={this.props.students}
              currentCourse={this.props.currentCourse!}
              onCancel={cancel}
            />
          );
          break;
      }
    }

    return (
      <TableDetail
        title={'Assignments'}
        isEmpty={this.props.assignments.length === 0}
        loadComplete={this.props.loadComplete}
        emptyNode={
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
        }
        columns={columns}
        data={data}
        actions={actions}
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item>Assignments</Breadcrumb.Item>
          </Breadcrumb>
        }
        titleInfo={tooltips.admin.graderRoster.title}
        drawer={drawerComponent}
        hideSearch={true}
        detail={detailComponent}
      />
    );
  }
}

export default AssignmentsTable;

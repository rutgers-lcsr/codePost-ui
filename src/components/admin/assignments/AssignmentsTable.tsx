/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

import {
  BarChartOutlined,
  CompassOutlined,
  DeleteOutlined,
  DiffOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  FileDoneOutlined,
  FileOutlined,
  FolderOutlined,
  ImportOutlined,
  MailOutlined,
  MenuOutlined,
  MessageOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/* ant imports */
import { Breadcrumb, Dropdown, Empty, Menu, message, Popconfirm, Spin, Switch, Tooltip, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import DraggableBodyRow from '../../../components/core/DraggableBodyRow';

import update from 'immutability-helper';

import { TableDetail } from '../other/TableDetail';

/* other library imports */
import memoizeOne from 'memoize-one';

import { RouteComponentProps } from 'react-router';

import { Link } from 'react-router-dom';

/* codePost imports */
import { AssignmentPatchType, AssignmentType, sortAssignments } from '../../../infrastructure/assignment';
import { CourseType, SectionType, SubmissionInfoType } from '../../../infrastructure/types';
import { UserType } from '../../../infrastructure/user';

import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import DeleteAssignmentDialog from './assignments/DeleteAssignmentDialog';

import BulkUpload from './assignments/SubmissionUpload/BulkUpload/BulkUpload';
import UploadSubmissionDialog from './assignments/SubmissionUpload/UploadSubmissionDialog';

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

import { openSubmission } from '../other/AdminUtils';
import BulkSubmissionEdit from './assignments/BulkSubmissionEdit';

import { AssignmentSetupDialog } from './assignments/AssignmentSetupDialog';

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
  currentCourse: CourseType;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  sections: SectionType[];
  courses: CourseType[];

  /* loading state */
  loadComplete: boolean;
  partialSubmissionsLoadComplete: boolean;
  fullSubmissionsLoadComplete: boolean;

  /* object-level REST operations */
  createAssignment: (
    assignmentName: string,
    assignmentPoints: number,
    upload: boolean,
    isVisible: boolean,
    dueDate?: string,
    sortKey?: number,
  ) => Promise<AssignmentType>;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;

  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<any>;
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;

  bulkUpdateSubmissions: (assignmentID: number, getPayload: (sub: SubmissionInfoType) => any) => Promise<void>;

  /* Refresh course */
  refreshCourseData: () => void;

  /* misc */
  myEmail: string;

  /* user data */
  user: UserType;

  activeAssignment?: AssignmentType; // which assignment has been clicked
  detailType?: DETAIL_TYPE; // what detail view are we showing
  baseURL: string;

  breadcrumbs?: Array<{ title: React.ReactNode }>;
}

export enum DETAIL_TYPE {
  Upload_Single,
  Upload_Multiple,
  Upload_Import,
  Settings,
  Delete,
  Drawer,
  DownloadGrades,
  BulkSubmissionEdit,
  Onboarding,
}

interface IManageAssignmentsState {
  drawerType?: DRAWER_TYPE;
  drawerContent: {
    title: string;
    subtitle: React.ReactNode;
    content: Array<{ email: string; subID: number | null }> | null;
  };
  isDownloading: boolean;
  activeStudent?: string; // track student from drawer to upload component
  sortedOrder: number[];
}

/**********************************************************************************************************************/

class AssignmentsTable extends React.Component<IManageAssignmentsProps & RouteComponentProps, IManageAssignmentsState> {
  public state: Readonly<IManageAssignmentsState> = {
    drawerContent: { title: '', subtitle: '', content: null },
    isDownloading: false,
    sortedOrder: sortAssignments(this.props.assignments).map((el) => el.id),
  };

  public componentDidUpdate(oldProps: IManageAssignmentsProps) {
    if (this.props.assignments !== oldProps.assignments) {
      this.setState({ sortedOrder: sortAssignments(this.props.assignments).map((el) => el.id) });
    }

    // This is a hacky way to refresh the drawer state (otherwise we get stuck in a
    // loading state). This is becuase the loaded submissions don't update the drawerContent state object.
    //
    // The best solution here will be to paginate the loading of the submissions, update the
    // drawer content (submissions) as they load, use an VirtualizedInfiniteLoad component to render
    // the list.
    if (
      (this.props.fullSubmissionsLoadComplete !== oldProps.fullSubmissionsLoadComplete ||
        this.props.submissions !== oldProps.submissions) &&
      this.state.drawerType !== undefined
    ) {
      const thisAssignment = this.props.assignments.find((assignment: AssignmentType) => {
        return assignment.name === this.state.drawerContent.title;
      });

      if (thisAssignment !== undefined && this.props.submissions[thisAssignment.id]) {
        const newContent: Array<{
          email: string;
          subID: number | null;
        }> = filterDataByStat(
          thisAssignment,
          this.props.submissionsByStudent,
          this.state.drawerType,
          this.props.submissions[thisAssignment.id],
          this.props.viewsBySubmission,
          this.props.students,
        );

        const title = getDrawerTitle(this.state.drawerType, newContent.length, !this.props.fullSubmissionsLoadComplete);

        this.setState({
          drawerContent: {
            title: thisAssignment.name,
            subtitle: title,
            content: newContent,
          },
          drawerType: this.state.drawerType,
        });
      }
    }
  }

  public calculateStats = memoizeOne(calculateMultipleAssignmentProgressStats);

  /******************************************************************************
   * UI Control
   ******************************************************************************/

  // This function is called when a an assignment drawer is opened
  // Depending on the type of data (DRAWER_TYPE), different sets of data will
  // be stored in state. We need to store the data in state of on render because
  // the drawer sliding takes time and looks bad if the data changes while it's sliding
  public openDrawer = (assignment: AssignmentType, type: DRAWER_TYPE) => {
    if (!this.props.submissions.hasOwnProperty(assignment.id)) {
      const title = getDrawerTitle(type, null, !this.props.fullSubmissionsLoadComplete);

      this.setState({
        drawerContent: {
          title: assignment.name,
          subtitle: title,
          content: null,
        },
        drawerType: type,
      });
    } else {
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

      const title = getDrawerTitle(type, newContent.length, !this.props.fullSubmissionsLoadComplete);

      this.setState({
        drawerContent: {
          title: assignment.name,
          subtitle: title,
          content: newContent,
        },
        drawerType: type,
      });
    }
  };

  public closeDrawer = () => {
    this.setState({ drawerType: undefined });
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
        this.props.history.push(`${this.props.baseURL}/overview`);
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
    this.props.history.push(`${this.props.baseURL}/overview`);
    this.setState({ activeStudent: undefined });
  };

  public createAssignment = (name: string, points: number, upload: boolean, isVisible: boolean, dueDate?: string) => {
    const { sortedOrder } = this.state;

    // Place assignment at the end of the assignment list
    let sortKey;
    if (sortedOrder.length > 0) {
      sortKey = sortedOrder[sortedOrder.length - 1] + 1;
    } else {
      sortKey = 0;
    }

    return this.props.createAssignment(name, points, upload, isVisible, dueDate, sortKey);
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
        className: 'draggable',
      },
      {
        title: (
          <div>
            Visible
            <CPTooltip
              title={'If visible, students can see the assignment in the Student Console.'}
              infoIcon={true}
              hideThisOnHideTips={true}
              iconStyle={{ paddingLeft: 5 }}
            />
          </div>
        ),
        dataIndex: 'visible',
        key: 'visible',
        align: aligner,
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
        createAssignment={this.createAssignment}
        timezone={this.props.currentCourse.timezone}
        {...this.props}
      />,
      <Link to={`${this.props.baseURL}/download/grades`}>
        <CPButton
          cpType="secondary"
          key={2}
          icon={<DownloadOutlined />}
          disabled={Object.keys(this.props.submissions).length === 0}
        >
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
      !this.props.fullSubmissionsLoadComplete,
    );

    data = this.state.sortedOrder.map((id, i) => {
      const assignment = this.props.assignments.find((el) => el.id === id);
      if (assignment === undefined) {
        return null;
      }
      const statsForRow = assignmentStats[assignment.id];
      const encodedName = encodeForLink(assignment.name);
      const menuItems = [
        {
          key: '1',
          label: (
            <Link to={`${this.props.baseURL}/rubrics/${encodedName}`}>
              <OrderedListOutlined /> &nbsp; Edit rubric
            </Link>
          ),
        },
        {
          key: 'tests',
          label: (
            <Link to={`${this.props.baseURL}/tests/${encodedName}/edit`}>
              <FileDoneOutlined /> &nbsp; Edit tests
            </Link>
          ),
        },
        {
          key: 'plagiarism',
          label: (
            <Link to={`${this.props.baseURL}/plagiarism/${encodedName}`}>
              <DiffOutlined /> &nbsp; Check for plagiarism
            </Link>
          ),
        },
        {
          key: '2',
          label: (
            <Link to={`${this.props.baseURL}/${encodedName}/download/grades`}>
              {!this.props.fullSubmissionsLoadComplete ? <Spin size="small" /> : <DownloadOutlined />} &nbsp; Download
              grades
            </Link>
          ),
        },
        {
          key: '3',
          label: (
            <Link to={`${this.props.baseURL}/${encodedName}/stats`}>
              <BarChartOutlined /> &nbsp; View stats
            </Link>
          ),
        },
        ...(assignment.allowRegradeRequests
          ? [
              {
                key: '3.1',
                label: (
                  <Link to={`${this.props.baseURL}/${encodedName}/regrades`}>
                    <MessageOutlined /> &nbsp; View Regrades
                  </Link>
                ),
              },
            ]
          : []),
        {
          key: '4',
          label: (
            <span>
              <UploadOutlined /> &nbsp; Upload submissions
            </span>
          ),
          children: [
            {
              key: '0.1',
              label: (
                <Link to={`${this.props.baseURL}/${encodedName}/upload/single`}>
                  <FileOutlined /> &nbsp; Single submission
                </Link>
              ),
            },
            {
              key: '0.2',
              label: (
                <Link to={`${this.props.baseURL}/${encodedName}/upload/multiple`}>
                  <FolderOutlined /> &nbsp; Multiple submissions
                </Link>
              ),
            },
            {
              key: '0.3',
              label: (
                <Link to={`${this.props.baseURL}/${encodedName}/upload/import`}>
                  <ImportOutlined /> &nbsp; Import
                </Link>
              ),
            },
          ],
        },
        {
          key: '5',
          label: (
            <Link to={`${this.props.baseURL}/${encodedName}/bulk-edit`}>
              <EditOutlined /> &nbsp; Bulk edit
            </Link>
          ),
        },
        {
          key: 'onboarding',
          label: (
            <Link to={`${this.props.baseURL}/${encodedName}/onboarding`}>
              <CompassOutlined /> &nbsp; Get started
            </Link>
          ),
        },
        {
          key: '6',
          label: (
            <Link to={`${this.props.baseURL}/${encodedName}/settings`}>
              <SettingOutlined /> &nbsp; Settings
            </Link>
          ),
        },
        {
          type: 'divider' as const,
        },
        {
          key: '7',
          label: (
            <Link to={`${this.props.baseURL}/${encodedName}/delete`}>
              <DeleteOutlined /> &nbsp; Delete assignment
            </Link>
          ),
          danger: true,
        },
      ];

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
            <MailOutlined onClick={toggleDialog} style={{ cursor: 'pointer' }} />
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
            '#24be85',
            '#user_notifications_everything',
            this.props.currentCourse ? this.props.currentCourse.id : 0,
          );
        }

        this.props.updateAssignment({
          id: assignment.id,
          isReleased: !assignment.isReleased,
        });
      };

      const toggleVisible = () => {
        const oldVal = assignment.isVisible;

        this.props
          .updateAssignment({
            id: assignment.id,
            isVisible: !assignment.isVisible,
          })
          .then(() => {
            message.success(`Assignment made ${oldVal ? 'in' : ''}visible.`);
          });
      };

      return {
        key: assignment.id,
        assignment: (
          <Text strong>
            {assignment.name}
            {assignment.hideFrom.length > 0 && (
              <Tooltip
                title={`Assignment hidden from the following sections: ${assignment.hideFrom
                  .map((sectionID) => {
                    const thisSection = this.props.sections.find((s) => s.id === sectionID);
                    return thisSection ? thisSection.name : '';
                  })
                  .join(', ')}`}
              >
                <EyeInvisibleOutlined style={{ marginLeft: 5 }} />
              </Tooltip>
            )}
          </Text>
        ),
        visible: <Switch checked={assignment.isVisible} onChange={toggleVisible} />,
        published: (
          <span className="display-flex align-items-center justify-content-center">
            {!assignment.isVisible && !assignment.isReleased ? (
              <Tooltip title={'Your assignment cannot be published unless it is made visible to students.'}>
                <Switch disabled={true} checked={assignment.isReleased} />
              </Tooltip>
            ) : (
              <Popconfirm onConfirm={onConfirm} title={publishToggleText} icon={<QuestionCircleOutlined />}>
                <Switch checked={assignment.isReleased} />
              </Popconfirm>
            )}
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
                <UploadOutlined /> &nbsp; Upload
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
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <MenuOutlined />
          </Dropdown>
        ),
      };
    });

    const cancel = () => {
      this.props.history.push(`${this.props.baseURL}/overview`);
    };

    const drawerComponent =
      this.state.drawerType === undefined ? (
        <div />
      ) : (
        <StatsDrawer
          type={this.state.drawerType}
          content={this.state.drawerContent}
          isVisible={true}
          onClose={this.closeDrawer}
          uploadSubmission={this.uploadForStudent}
          loadComplete={this.props.fullSubmissionsLoadComplete}
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
              currentAssignment={this.props.activeAssignment!}
              assignments={this.props.assignments}
              timezone={this.props.currentCourse.timezone}
              sections={this.props.sections}
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
              course={this.props.currentCourse}
              onSuccess={openSubmission}
            />
          );
          break;
        case DETAIL_TYPE.Upload_Multiple:
          detailComponent = (
            <BulkUpload
              isVisible={true}
              onCancel={cancel}
              assignment={this.props.activeAssignment}
              submissions={this.props.submissions[this.props.activeAssignment.id]}
              students={this.props.students}
              uploadSubmission={this.props.uploadSubmission}
              updateSubmission={this.props.updateSubmission}
              deleteSubmission={this.props.deleteSubmission}
              showImportOptions={false}
              course={this.props.currentCourse}
            />
          );
          break;
        case DETAIL_TYPE.Upload_Import:
          detailComponent = (
            <BulkUpload
              isVisible={true}
              onCancel={cancel}
              assignment={this.props.activeAssignment}
              submissions={this.props.submissions[this.props.activeAssignment.id]}
              students={this.props.students}
              uploadSubmission={this.props.uploadSubmission}
              updateSubmission={this.props.updateSubmission}
              deleteSubmission={this.props.deleteSubmission}
              showImportOptions={true}
              course={this.props.currentCourse}
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
        case DETAIL_TYPE.BulkSubmissionEdit:
          detailComponent = (
            <BulkSubmissionEdit
              activeAssignment={this.props.activeAssignment}
              submissions={this.props.submissions[this.props.activeAssignment.id]}
              bulkUpdateSubmissions={this.props.bulkUpdateSubmissions}
              currentCourse={this.props.currentCourse!}
              onCancel={cancel}
              myEmail={this.props.myEmail}
            />
          );
          break;
        case DETAIL_TYPE.Onboarding:
          detailComponent = (
            <AssignmentSetupDialog
              course={this.props.currentCourse}
              hasStudents={this.props.students.length > 0}
              onClose={cancel}
              assignment={this.props.activeAssignment}
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

    const components = {
      body: {
        row: DraggableBodyRow,
      },
    };

    const moveRow = (dragIndex: number, hoverIndex: number) => {
      const { sortedOrder } = this.state;
      const dragRow = sortedOrder[dragIndex];

      this.setState(
        update(this.state, {
          sortedOrder: {
            $splice: [
              [dragIndex, 1],
              [hoverIndex, 0, dragRow],
            ],
          },
        }),
        () => {
          this.props.assignments.forEach((assignment) => {
            const newKey = this.state.sortedOrder.indexOf(assignment.id);
            if (newKey !== assignment.sortKey) {
              assignment.sortKey = newKey;
              this.props.updateAssignment(assignment);
            }
          });
        },
      );
    };

    return (
      <TableDetail
        title={'Assignments'}
        isEmpty={this.props.assignments.length === 0}
        loadComplete={this.props.loadComplete}
        emptyNode={
          <Empty
            styles={{
              image: {
                height: 60,
              },
            }}
            description={<span>No assignments yet</span>}
          >
            <NewAssignmentDialog
              key={1}
              assignments={this.props.assignments}
              createAssignment={this.props.createAssignment}
              baseURL={this.props.baseURL}
              timezone={this.props.currentCourse.timezone}
              {...this.props}
            />
          </Empty>
        }
        columns={columns}
        data={data}
        actions={actions}
        breadcrumbs={<Breadcrumb items={[...(this.props.breadcrumbs || []), { title: 'Overview' }]} />}
        titleInfo={'Use this space to add assignments to your course, and edit existing ones.'}
        drawer={drawerComponent}
        hideSearch={true}
        detail={detailComponent}
        components={components}
        onRow={(record: any, index: number) => ({
          index,
          moveRow: moveRow,
        })}
        pagination={this.props.assignments.length < 10 ? false : undefined}
      />
    );
  }
}

export default AssignmentsTable;

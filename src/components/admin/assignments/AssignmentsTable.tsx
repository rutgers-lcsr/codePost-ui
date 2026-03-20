// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  BarChartOutlined,
  CompassOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FileDoneOutlined,
  FileOutlined,
  FolderOutlined,
  ImportOutlined,
  MailOutlined,
  MessageOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/* ant imports */
import {
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  Empty,
  Flex,
  message,
  Modal,
  Popconfirm,
  Popover,
  Progress,
  Space,
  Spin,
  Switch,
  Tooltip,
  Typography,
} from 'antd';

/* codePost imports */
import { colors } from '../../../theme/colors';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import DraggableBodyRow from '../../../components/core/DraggableBodyRow';

import update from 'immutability-helper';

import { TableDetail } from '../other/TableDetail';

/* other library imports */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
import { Link, useNavigate } from 'react-router-dom';

/* codePost imports */
import { SubmissionInfoType, UploadFile } from '../../../types/common';
import { Course, Section, User } from '../../../api-client';

import { Assignment, IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import DeleteAssignmentDialog from './assignments/DeleteAssignmentDialog';

import BulkUpload from './assignments/SubmissionUpload/BulkUpload/BulkUpload';
import UploadSubmissionDialog from './assignments/SubmissionUpload/UploadSubmissionDialog';

import NewAssignmentDialog from './assignments/NewAssignmentDialog';

import AssignmentSettingsDialog from './assignments/AssignmentSettingsDialog';

import DownloadGrades from './assignments/DownloadGrades';

import { Logger } from '../../../utils/logger';

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

import { DETAIL_TYPE } from './types';

type alignType = 'left' | 'right' | 'center';

interface AssignmentRow extends Record<string, unknown> {
  key: number;
  assignment: React.ReactNode;
  status: React.ReactNode;
  progress: React.ReactNode;
  actions: React.ReactNode;
}

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const DEFAULT_PAGINATION_SIZE = 10;
const FINALIZED_THRESHOLD = 0.5;

/**********************************************************************************************************************/

export interface IManageAssignmentsProps {
  /* assignment data */
  assignments: Assignment[];
  submissions: IAssignmentToSubmissionsMap;
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;
  currentCourse: Course;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  sections: Section[];
  courses: Course[];

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
  ) => Promise<Assignment>;
  updateAssignment: (assignment: Partial<Assignment> & { id: number }) => Promise<void>;
  deleteAssignment: (assignment: Assignment) => Promise<void>;

  uploadSubmission: (assignment: Assignment, partners: string[], files: UploadFile[]) => Promise<SubmissionInfoType>;
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;

  bulkUpdateSubmissions: (
    assignmentID: number,
    getPayload: (sub: SubmissionInfoType) => Partial<SubmissionInfoType>,
  ) => Promise<void>;

  /* Refresh course */
  refreshCourseData: () => void;

  /* misc */
  myEmail: string;

  /* user data */
  user: User;

  activeAssignment?: Assignment; // which assignment has been clicked
  detailType?: DETAIL_TYPE; // what detail view are we showing
  baseURL: string;

  breadcrumbs?: Array<{ title: React.ReactNode }>;
}

interface DrawerContentState {
  title: string;
  subtitle: React.ReactNode;
  content: Array<{ email: string; subID: number | null }> | null;
}

/**********************************************************************************************************************/

const AssignmentsTable: React.FC<IManageAssignmentsProps> = (props) => {
  const sortAssignments = (assignments: Assignment[]) => {
    return assignments.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
  };
  const {
    assignments,
    submissions,
    submissionsByStudent,
    viewsBySubmission,
    students,
    fullSubmissionsLoadComplete,
    currentCourse,
    sections,
    myEmail,
    activeAssignment,
    detailType,
    baseURL,
    createAssignment: createAssignmentProp,
    updateAssignment: updateAssignmentProp,
    deleteAssignment: deleteAssignmentProp,
    uploadSubmission,
    deleteSubmission,
    updateSubmission,
    bulkUpdateSubmissions,
    loadComplete,
    breadcrumbs,
    refreshCourseData,
  } = props;

  const navigate = useNavigate();

  // State management with hooks
  const [drawerType, setDrawerType] = useState<DRAWER_TYPE | undefined>(undefined);
  const [drawerContent, setDrawerContent] = useState<DrawerContentState>({
    title: '',
    subtitle: '',
    content: null,
  });
  const [activeStudent, setActiveStudent] = useState<string | undefined>(undefined);
  const [sortedOrder, setSortedOrder] = useState<number[]>(() => sortAssignments(props.assignments).map((el) => el.id));

  // Update sortedOrder when assignments change
  useEffect(() => {
    setSortedOrder(sortAssignments(props.assignments).map((el) => el.id));
  }, [props.assignments]);

  // Handle drawer refresh when submissions load
  useEffect(() => {
    if (drawerType === undefined) return;

    const thisAssignment = assignments.find((assignment: Assignment) => {
      return assignment.name === drawerContent.title;
    });

    if (thisAssignment !== undefined && submissions[thisAssignment.id]) {
      const newContent: Array<{
        email: string;
        subID: number | null;
      }> = filterDataByStat(
        thisAssignment,
        submissionsByStudent,
        drawerType,
        submissions[thisAssignment.id],
        viewsBySubmission,
        students,
      );

      const title = getDrawerTitle(drawerType, newContent.length, !fullSubmissionsLoadComplete);

      setDrawerContent({
        title: thisAssignment.name,
        subtitle: title,
        content: newContent,
      });
    }
  }, [
    fullSubmissionsLoadComplete,
    submissions,
    assignments,
    submissionsByStudent,
    viewsBySubmission,
    students,
    drawerType,
    drawerContent.title,
  ]);

  // Memoize stats calculation
  const assignmentStats: IAssignmentProgressStatsMap = useMemo(
    () =>
      calculateMultipleAssignmentProgressStats(
        assignments,
        submissions,
        submissionsByStudent,
        viewsBySubmission,
        students,
        !fullSubmissionsLoadComplete,
      ),
    [assignments, submissions, submissionsByStudent, viewsBySubmission, students, fullSubmissionsLoadComplete],
  );

  /******************************************************************************
   * UI Control
   ******************************************************************************/

  // This function is called when an assignment drawer is opened
  const openDrawer = useCallback(
    (assignment: Assignment, type: DRAWER_TYPE) => {
      if (!Object.prototype.hasOwnProperty.call(submissions, assignment.id)) {
        const title = getDrawerTitle(type, null, !fullSubmissionsLoadComplete);

        setDrawerContent({
          title: assignment.name,
          subtitle: title,
          content: null,
        });
        setDrawerType(type);
      } else {
        const newContent: Array<{
          email: string;
          subID: number | null;
        }> = filterDataByStat(
          assignment,
          submissionsByStudent,
          type,
          submissions[assignment.id],
          viewsBySubmission,
          students,
        );

        const title = getDrawerTitle(type, newContent.length, !fullSubmissionsLoadComplete);

        setDrawerContent({
          title: assignment.name,
          subtitle: title,
          content: newContent,
        });
        setDrawerType(type);
      }
    },
    [submissions, fullSubmissionsLoadComplete, submissionsByStudent, viewsBySubmission, students],
  );

  const closeDrawer = useCallback(() => {
    setDrawerType(undefined);
  }, []);

  /******************************************************************************
   * Detail callbacks
   ******************************************************************************/

  const saveSettings = useCallback(
    (assignment: Partial<Assignment> & { id: number }) => {
      return updateAssignmentProp(assignment);
    },

    [updateAssignmentProp],
  );

  const deleteAssignment = useCallback(() => {
    const deletingAssignment = activeAssignment;
    if (deletingAssignment) {
      deleteAssignmentProp(deletingAssignment).then(() => {
        message.success('Assignment successfully deleted!');
        navigate(`${baseURL}/overview`);
      });
    }
  }, [activeAssignment, deleteAssignmentProp, navigate, baseURL]);

  const uploadForStudent = useCallback(
    (assignmentName: string, student: string) => {
      setActiveStudent(student);
      navigate(`${baseURL}/${encodeForLink(assignmentName)}/upload/single`);
    },
    [navigate, baseURL],
  );

  const closeSingleSubmissionUpload = useCallback(() => {
    navigate(`${baseURL}/overview`);
    setActiveStudent(undefined);
  }, [navigate, baseURL]);

  const cancel = useCallback(() => {
    navigate(`${baseURL}/overview`);
  }, [navigate, baseURL]);

  const createAssignment = useCallback(
    (name: string, points: number, upload: boolean, isVisible: boolean, dueDate?: string) => {
      // Place assignment at the end of the assignment list
      let sortKey;
      if (sortedOrder.length > 0) {
        sortKey = sortedOrder[sortedOrder.length - 1] + 1;
      } else {
        sortKey = 0;
      }

      return createAssignmentProp(name, points, upload, isVisible, dueDate, sortKey);
    },

    [sortedOrder, createAssignmentProp],
  );

  // Helper to get publish confirmation text based on assignment state
  const getPublishConfirmText = useCallback(
    (assignment: Assignment): React.ReactElement | string => {
      if (assignment.isReleased) {
        return 'Are you sure you want to un-publish this assignment?';
      }

      const stats = assignmentStats[assignment.id];
      const finalizedRatio = stats.numSubmissions !== 0 ? stats.numGraded / stats.numSubmissions : 1;

      if (!assignment.liveFeedbackMode && finalizedRatio < FINALIZED_THRESHOLD) {
        return (
          <div>
            <div style={{ paddingBottom: '4px', maxWidth: '260px' }}>
              Are you sure you want to publish this assignment?
            </div>
            <div style={{ paddingBottom: '4px', maxWidth: '260px' }}>
              The majority of your submissions are still unfinalized, so students will not be able to view them.
            </div>
          </div>
        );
      }

      return 'Are you sure you want to publish this assignment?';
    },
    [assignmentStats],
  );

  // Helper to toggle assignment visibility
  const toggleAssignmentVisibility = useCallback(
    (assignment: Assignment) => {
      const oldVal = assignment.isVisible;

      updateAssignmentProp({
        id: assignment.id,
        isVisible: !assignment.isVisible,
      }).then(() => {
        message.success(`Assignment made ${oldVal ? 'in' : ''}visible.`);
      });
    },
    [updateAssignmentProp],
  );

  // Helper to handle assignment publish toggle
  const toggleAssignmentPublish = useCallback(
    (assignment: Assignment) => {
      if (!assignment.isReleased) {
        Logger.info('Assignment published', {
          text: `${assignment.name} | ${currentCourse ? currentCourse.name : ''} ${
            currentCourse ? currentCourse.period : ''
          }`,
          color: colors.brandPrimary,
          channel: '#user_notifications_everything',
          courseID: currentCourse ? currentCourse.id : 0,
        });
      }

      updateAssignmentProp({
        id: assignment.id,
        isReleased: !assignment.isReleased,
      });
    },
    [currentCourse, updateAssignmentProp],
  );

  // Helper to toggle submissions released
  const toggleSubmissionsReleased = useCallback(
    (assignment: Assignment) => {
      const isReleased = assignment.feedbackReleased;
      const action = isReleased ? 'unrelease' : 'release';
      const title = `Are you sure you want to ${action} submissions?`;
      const content = isReleased
        ? 'Students will no longer be able to see their grades or feedback.'
        : 'Students will immediately be able to see their grades and feedback for finalized submissions.';

      Modal.confirm({
        title,
        content,
        onOk: () => {
          updateAssignmentProp({
            id: assignment.id,
            feedbackReleased: !isReleased,
          }).then(() => {
            message.success(`Submissions ${isReleased ? 'unreleased' : 'released'} successfully.`);
          });
        },
      });
    },
    [updateAssignmentProp],
  );

  // Helper to get section names from IDs
  const getSectionNames = useCallback(
    (sectionIDs: number[]): string => {
      return sectionIDs
        .map((sectionID) => {
          const thisSection = sections.find((s) => s.id === sectionID);
          return thisSection ? thisSection.name : '';
        })
        .join(', ');
    },
    [sections],
  );

  /******************************************************************************
   * Render
   ******************************************************************************/

  const columns = [
    {
      title: 'Assignment',
      dataIndex: 'assignment',
      key: 'assignment',
      width: '30%',
      className: 'draggable',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '230px',
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: '350px',
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: 'right' as alignType,
    },
  ];

  /* ... data mapping ... */

  const data: AssignmentRow[] = sortedOrder
    .map<AssignmentRow | null>((id: number) => {
      const assignment = assignments.find((el) => el.id === id);
      if (assignment === undefined) {
        return null;
      }
      const statsForRow = assignmentStats[assignment.id];
      const encodedName = encodeForLink(assignment.name);

      // --- Actions Menu ---

      const configItems = [
        {
          key: 'settings',
          label: (
            <Link to={`${baseURL}/${encodedName}/settings`}>
              <SettingOutlined /> &nbsp; Settings
            </Link>
          ),
        },
        {
          key: 'onboarding',
          label: (
            <Link to={`${baseURL}/${encodedName}/onboarding`}>
              <CompassOutlined /> &nbsp; Get started
            </Link>
          ),
        },
        {
          key: 'bulk-edit',
          label: (
            <Link to={`${baseURL}/${encodedName}/bulk-edit`}>
              <EditOutlined /> &nbsp; Bulk edit
            </Link>
          ),
        },
      ];

      const uploadItems = [
        {
          key: '0.1',
          label: (
            <Link to={`${baseURL}/${encodedName}/upload/single`}>
              <FileOutlined /> &nbsp; Single submission
            </Link>
          ),
        },
        {
          key: '0.2',
          label: (
            <Link to={`${baseURL}/${encodedName}/upload/multiple`}>
              <FolderOutlined /> &nbsp; Multiple submissions
            </Link>
          ),
        },
        {
          key: '0.3',
          label: (
            <Link to={`${baseURL}/${encodedName}/upload/import`}>
              <ImportOutlined /> &nbsp; Import
            </Link>
          ),
        },
      ];

      const dataItems = [
        {
          key: 'stats',
          label: (
            <Link to={`${baseURL}/${encodedName}/stats`}>
              <BarChartOutlined /> &nbsp; View stats
            </Link>
          ),
        },
        {
          key: 'download',
          label: (
            <Link to={`${baseURL}/${encodedName}/download/grades`}>
              {!fullSubmissionsLoadComplete ? <Spin size="small" /> : <DownloadOutlined />} &nbsp; Download grades
            </Link>
          ),
        },
        ...(assignment.allowRegradeRequests
          ? [
              {
                key: 'regrades',
                label: (
                  <Link to={`${baseURL}/${encodedName}/regrades`}>
                    <MessageOutlined /> &nbsp; View Regrades
                  </Link>
                ),
              },
            ]
          : []),
      ];

      // --- Helpers ---
      const publishToggleText = getPublishConfirmText(assignment);
      const onConfirmPublish = () => toggleAssignmentPublish(assignment);
      const toggleVisible = () => toggleAssignmentVisibility(assignment);

      const notifyButton = (toggleDialog: () => void) => {
        return (
          <CPButton cpType="secondary" size="small" icon={<MailOutlined />} onClick={toggleDialog}>
            Notify
          </CPButton>
        );
      };

      // --- New Status Logic ---
      let statusBadge: 'success' | 'warning' | 'default' = 'default';
      let statusText = 'Draft';

      if (assignment.isReleased) {
        statusBadge = 'success';
        statusText = 'Published';
      } else if (assignment.isVisible) {
        statusBadge = 'warning';
        statusText = 'Visible';
      }

      const statusContent = (
        <div style={{ width: 300 }}>
          <Flex vertical gap="middle">
            <Flex justify="space-between" align="center">
              <span style={{ fontSize: '14px' }}>
                Visible to Students
                <CPTooltip
                  title={'If visible, students can see the assignment in the Student Console.'}
                  infoIcon={true}
                  hideThisOnHideTips={true}
                  iconStyle={{ paddingLeft: 8, color: colors.neutralSecondaryText }}
                />
              </span>
              <Switch checked={assignment.isVisible} onChange={toggleVisible} size="small" />
            </Flex>

            <Flex justify="space-between" align="center">
              <span style={{ fontSize: '14px' }}>
                Published
                <CPTooltip
                  title={tooltips.admin.assignments.published}
                  infoIcon={true}
                  hideThisOnHideTips={true}
                  iconStyle={{ paddingLeft: 8, color: colors.neutralSecondaryText }}
                />
              </span>
              {!assignment.isVisible && !assignment.isReleased ? (
                <Tooltip title={'Your assignment cannot be published unless it is made visible to students.'}>
                  <Switch disabled={true} checked={assignment.isReleased} size="small" />
                </Tooltip>
              ) : (
                <Popconfirm onConfirm={onConfirmPublish} title={publishToggleText} icon={<QuestionCircleOutlined />}>
                  <Switch checked={assignment.isReleased} size="small" />
                </Popconfirm>
              )}
            </Flex>

            {assignment.isReleased && (
              <div style={{ textAlign: 'right' }}>
                <SendEmailModal
                  buttonText={'Notify students'}
                  title="Notify students via email"
                  template="publish_assignment"
                  course={currentCourse}
                  assignment={assignment}
                  me={myEmail}
                  emails={students}
                  body={<div>Notify students via email that {assignment.name} has been published.</div>}
                  button={notifyButton}
                />
              </div>
            )}
          </Flex>
        </div>
      );

      // --- New Progress Logic ---
      const totalSubmissions = statsForRow.numSubmissions;
      const graded = statsForRow.numGraded;
      const missing = statsForRow.numMissing;

      // Calculate percentage for progress bar
      const percent = totalSubmissions > 0 ? Math.round((graded / totalSubmissions) * 100) : 0;

      return {
        key: assignment.id,
        assignment: (
          <Space orientation="vertical" size={0}>
            <Text strong style={{ fontSize: '16px' }}>
              {assignment.name}
              {(assignment.hideFrom ?? []).length > 0 && (
                <Tooltip
                  title={`Assignment hidden from the following sections: ${getSectionNames(assignment.hideFrom ?? [])}`}
                >
                  <EyeInvisibleOutlined style={{ marginLeft: 5, color: colors.neutralMainText }} />
                </Tooltip>
              )}
            </Text>
            {assignment.allowStudentUpload && assignment.uploadDueDate ? (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Due {dayjs(assignment.uploadDueDate).tz(currentCourse.timezone).format('MMM D, h:mm A z')}
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {assignment.allowStudentUpload ? 'No due date' : 'No upload required'}
              </Text>
            )}
          </Space>
        ),
        status: (
          <Popover content={statusContent} trigger="click" title="Assignment Status" styles={{ root: { width: 320 } }}>
            <div style={{ cursor: 'pointer', display: 'inline-block', whiteSpace: 'nowrap' }}>
              <Badge status={statusBadge} text={statusText} />{' '}
              <SettingOutlined style={{ fontSize: '10px', color: colors.neutralMainText, marginLeft: 4 }} />
            </div>
          </Popover>
        ),
        progress: (
          <div style={{ paddingRight: 20 }}>
            <div className="display-flex align-items-center" style={{ marginBottom: 4 }}>
              <Space separator={<span style={{ color: colors.neutralBorder }}>|</span>}>
                <Text
                  type={totalSubmissions === 0 ? 'secondary' : undefined}
                  className={totalSubmissions > 0 ? 'text-link' : ''}
                  onClick={totalSubmissions > 0 ? () => openDrawer(assignment, DRAWER_TYPE.Submitted) : undefined}
                >
                  {totalSubmissions} Submissions
                </Text>
                <Text
                  type="secondary"
                  className={missing > 0 ? 'text-link' : ''}
                  onClick={() => openDrawer(assignment, DRAWER_TYPE.Missing)}
                >
                  {missing} Missing
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {percent}% Graded
                </Text>
              </Space>
            </div>
            <div onClick={() => openDrawer(assignment, DRAWER_TYPE.Graded)} style={{ cursor: 'pointer' }}>
              <Progress
                percent={percent}
                showInfo={false}
                strokeColor={colors.brandPrimary}
                railColor={colors.brandLight}
                size="small"
              />
            </div>
          </div>
        ),
        actions: (
          <Space>
            <Tooltip title="Configure assignment">
              <Dropdown menu={{ items: configItems }} trigger={['click']}>
                <Button shape="circle" icon={<SettingOutlined />} />
              </Dropdown>
            </Tooltip>
            <Tooltip title="Edit rubric">
              <Link to={`${baseURL}/rubrics/${encodedName}`}>
                <Button shape="circle" icon={<OrderedListOutlined />} />
              </Link>
            </Tooltip>
            <Tooltip title="Environment & Tests">
              <Link to={`${baseURL}/environment/${encodedName}/edit`}>
                <Button shape="circle" icon={<FileDoneOutlined />} />
              </Link>
            </Tooltip>
            <Tooltip title="Manage submissions">
              <Dropdown menu={{ items: uploadItems }} trigger={['click']}>
                <Button shape="circle" icon={<UploadOutlined />} />
              </Dropdown>
            </Tooltip>
            <Tooltip title={assignment.feedbackReleased ? 'Unrelease feedback' : 'Release feedback'}>
              <Button
                shape="circle"
                icon={assignment.feedbackReleased ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => toggleSubmissionsReleased(assignment)}
                danger={assignment.feedbackReleased}
              />
            </Tooltip>
            <Tooltip title="Analyze grades & stats">
              <Dropdown menu={{ items: dataItems }} trigger={['click']}>
                <Button shape="circle" icon={<BarChartOutlined />} />
              </Dropdown>
            </Tooltip>
            <Tooltip title="Delete assignment">
              <Link to={`${baseURL}/${encodedName}/delete`}>
                <Button shape="circle" danger icon={<DeleteOutlined />} />
              </Link>
            </Tooltip>
          </Space>
        ),
      };
    })
    .filter((assignment): assignment is AssignmentRow => assignment !== null);

  const tableActions: React.ReactNode[] = [
    <NewAssignmentDialog
      key={1}
      {...props}
      currentCourse={currentCourse}
      assignments={assignments}
      courses={props.courses}
      createAssignment={createAssignment}
      timezone={currentCourse.timezone || 'UTC'}
    />,
    <Link key={2} to={`${baseURL}/download/grades`}>
      <CPButton cpType="secondary" icon={<DownloadOutlined />} disabled={Object.keys(submissions).length === 0}>
        Download grades
      </CPButton>
    </Link>,
  ];

  const handleDeleteSubmission = useCallback(
    (subID: number) => {
      // activeAssignment is undefined when opening drawer via "Submissions" link
      // relying on drawerContent.title which always contains the assignment name
      const assignmentName = drawerContent.title;
      const assignment = assignments.find((a) => a.name === assignmentName);

      if (assignment) {
        const subList = submissions[assignment.id] || [];
        const sub = subList.find((s: SubmissionInfoType) => s.id === subID);

        if (sub) {
          deleteSubmission(sub)
            .then(() => {
              message.success('Submission successfully deleted');
              // Update local state for immediate feedback
              setDrawerContent((prev) => ({
                ...prev,
                content: prev.content ? prev.content.filter((item) => item.subID !== subID) : null,
              }));
              // Refresh global data
              refreshCourseData();
            })
            .catch(() => {
              message.error('Failed to delete submission');
            });
        }
      }
    },
    [drawerContent.title, assignments, submissions, deleteSubmission, refreshCourseData],
  );

  // The StatsDrawer is now rendered directly, not via a variable passed to TableDetail
  // The main component's return structure is also changed to wrap in a div.

  let detailComponent;
  if (activeAssignment !== undefined && detailType !== undefined) {
    switch (detailType) {
      case DETAIL_TYPE.Settings:
        detailComponent = (
          <AssignmentSettingsDialog
            isVisible={true}
            onCancel={cancel}
            onSave={saveSettings}
            currentAssignment={activeAssignment!}
            assignments={assignments}
            timezone={currentCourse.timezone || 'UTC'}
            sections={sections}
          />
        );
        break;
      case DETAIL_TYPE.Upload_Single:
        detailComponent = (
          <UploadSubmissionDialog
            isVisible={true}
            onCancel={closeSingleSubmissionUpload}
            assignments={[activeAssignment]}
            selectedAssignment={activeAssignment}
            students={students}
            selectedStudents={activeStudent !== undefined ? [activeStudent] : []}
            submissions={submissionsByStudent}
            uploadSubmission={(assignment, partners, files) =>
              uploadSubmission(assignment, partners, files as UploadFile[])
            }
            course={currentCourse}
            onSuccess={openSubmission}
          />
        );
        break;
      case DETAIL_TYPE.Upload_Multiple:
        detailComponent = (
          <BulkUpload
            isVisible={true}
            onCancel={cancel}
            assignment={activeAssignment}
            submissions={submissions[activeAssignment.id]}
            students={students}
            uploadSubmission={(assignment: Assignment, partners: string[], files: UploadFile[]) =>
              uploadSubmission(assignment, partners, files)
            }
            updateSubmission={updateSubmission}
            deleteSubmission={deleteSubmission}
            showImportOptions={false}
            course={currentCourse}
          />
        );
        break;
      case DETAIL_TYPE.Upload_Import:
        detailComponent = (
          <BulkUpload
            isVisible={true}
            onCancel={cancel}
            assignment={activeAssignment}
            submissions={submissions[activeAssignment.id]}
            students={students}
            uploadSubmission={(assignment, partners, files) => uploadSubmission(assignment, partners, files)}
            updateSubmission={updateSubmission}
            deleteSubmission={deleteSubmission}
            showImportOptions={true}
            course={currentCourse}
          />
        );
        break;
      case DETAIL_TYPE.Delete:
        detailComponent = (
          <DeleteAssignmentDialog
            isVisible={true}
            assignmentName={activeAssignment.name}
            onCancel={cancel}
            onDelete={deleteAssignment}
          />
        );
        break;
      case DETAIL_TYPE.DownloadGrades:
        detailComponent = (
          <DownloadGrades
            activeAssignment={activeAssignment}
            assignments={assignments}
            submissionsByStudent={submissionsByStudent}
            students={students}
            currentCourse={currentCourse}
            onCancel={cancel}
          />
        );
        break;
      case DETAIL_TYPE.BulkSubmissionEdit:
        detailComponent = (
          <BulkSubmissionEdit
            activeAssignment={activeAssignment}
            submissions={submissions[activeAssignment.id]}
            bulkUpdateSubmissions={bulkUpdateSubmissions}
            currentCourse={currentCourse}
            onCancel={cancel}
            myEmail={myEmail}
          />
        );
        break;
      case DETAIL_TYPE.Onboarding:
        detailComponent = (
          <AssignmentSetupDialog
            course={currentCourse}
            hasStudents={students.length > 0}
            onClose={cancel}
            assignment={activeAssignment}
          />
        );
        break;
    }
  } else if (detailType) {
    switch (detailType) {
      case DETAIL_TYPE.DownloadGrades:
        detailComponent = (
          <DownloadGrades
            activeAssignment={activeAssignment}
            assignments={assignments}
            submissionsByStudent={submissionsByStudent}
            students={students}
            currentCourse={currentCourse}
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

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRow = sortedOrder[dragIndex];

      const newSortedOrder = update(sortedOrder, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRow],
        ],
      });

      setSortedOrder(newSortedOrder);

      // Update assignment sort keys
      assignments.forEach((assignment) => {
        const newKey = newSortedOrder.indexOf(assignment.id);
        if (newKey !== assignment.sortKey) {
          assignment.sortKey = newKey;
          updateAssignmentProp(assignment);
        }
      });
    },

    [sortedOrder, assignments, updateAssignmentProp],
  );

  return (
    <div className="manage-assignments">
      <StatsDrawer
        type={drawerType || DRAWER_TYPE.None}
        content={drawerContent}
        onClose={closeDrawer}
        isVisible={drawerType !== undefined}
        uploadSubmission={uploadForStudent}
        onDeleteSubmission={handleDeleteSubmission}
        loadComplete={loadComplete}
      />

      {detailComponent}
      <TableDetail
        data={data}
        title={'Assignments'}
        columns={columns}
        actions={tableActions}
        loadComplete={loadComplete}
        isEmpty={assignments.length === 0}
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
              {...props}
              currentCourse={currentCourse}
              timezone={currentCourse.timezone || 'UTC'}
              assignments={assignments}
              courses={props.courses}
              createAssignment={createAssignmentProp}
            />
          </Empty>
        }
        breadcrumbs={<Breadcrumb items={[...(breadcrumbs || []), { title: 'Overview' }]} />}
        titleInfo={'Use this space to add assignments to your course, and edit existing ones.'}
        hideSearch={true}
        components={components}
        onRow={(_record: Record<string, unknown>, index?: number) =>
          ({
            index: index ?? 0,
            moveRow: moveRow,
          }) as React.HTMLAttributes<HTMLElement>
        }
        pagination={assignments.length < DEFAULT_PAGINATION_SIZE ? false : undefined}
      />
    </div>
  );
};

export default AssignmentsTable;

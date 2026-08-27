// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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
  InboxOutlined,
  LockOutlined,
  MailOutlined,
  MessageOutlined,
  MoreOutlined,
  NumberOutlined,
  OrderedListOutlined,
  ReadOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/* ant imports */
import {
  Breadcrumb,
  Button,
  Dropdown,
  Empty,
  Flex,
  message,
  Modal,
  Popover,
  Progress,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';

/* codePost imports */
import { colors } from '../../../theme/colors';

import CPButton from '../../../components/core/CPButton';

import DraggableBodyRow from '../../../components/core/DraggableBodyRow';

import update from 'immutability-helper';

import { TableDetail } from '../other/TableDetail';

import useWindowSize from '../../../components/core/useWindowSize';
import layoutVars from '../../../styles/layout/_layoutVars';

/* other library imports */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
import { Link, useNavigate } from 'react-router';

/* codePost imports */
import { SubmissionInfoType, UploadFile } from '../../../types/common';
import { AssignmentFeedbackStatusEnum, AssignmentStateEnum, Course, Section, User } from '../../../api-client';

import { Assignment, IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import AssignmentsFilterBar, {
  AssignmentFilters,
  DEFAULT_FILTERS,
  FeedbackFilter,
  ProgressFilter,
  StatusFilter,
  VisibilityFilter,
} from './AssignmentsFilterBar';

import BulkActionBar from './BulkActionBar';

import DeleteAssignmentDialog from './assignments/DeleteAssignmentDialog';

import BulkUpload from './assignments/SubmissionUpload/BulkUpload/BulkUpload';
import UploadSubmissionDialog from './assignments/SubmissionUpload/UploadSubmissionDialog';

import NewAssignmentDialog from './assignments/NewAssignmentDialog';

import AssignmentSettingsDialog from './assignments/AssignmentSettingsDialog';

import DownloadGrades from './assignments/DownloadGrades';

import { Logger } from '../../../utils/logger';

import { useCourseCapabilities } from '../../../stores/usePermissionsStore';

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
import styles from './AssignmentsTable.module.scss';

type alignType = 'left' | 'right' | 'center';

interface AssignmentRow extends Record<string, unknown> {
  key: number;
  assignment: React.ReactNode;
  status: React.ReactNode;
  feedback: React.ReactNode;
  progress: React.ReactNode;
  actions: React.ReactNode;
  // Searchable plain-text shadow fields (not rendered as columns)
  assignmentName: string;
  statusValue: StatusFilter;
  progressValue: ProgressFilter;
  visibilityValue: VisibilityFilter;
  feedbackValue: FeedbackFilter;
  dueDateValue: string | null;
}

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const DEFAULT_PAGINATION_SIZE = 10;
const FINALIZED_THRESHOLD = 0.5;

/** Per-state presentation + instructor-facing description, in lifecycle order.
 *  The table tag renders the DERIVED effectiveState; the picker sets the stored state.
 *  Tag colors are hand-picked so the label text meets WCAG 2.1 AA (>=4.5:1) on its tinted
 *  background — the antd presets ('gold' especially) do not. State is never conveyed by
 *  color alone: every state pairs a distinct icon with a text label (1.4.1). */
const STATE_META: Record<
  AssignmentStateEnum,
  { label: string; bg: string; border: string; text: string; icon: React.ReactNode; description: string }
> = {
  [AssignmentStateEnum.Draft]: {
    label: 'Draft',
    bg: '#fafafa',
    border: '#d9d9d9',
    text: 'rgba(0, 0, 0, 0.7)',
    icon: <EditOutlined />,
    description: 'Hidden from students while you set it up.',
  },
  [AssignmentStateEnum.Visible]: {
    label: 'Visible',
    bg: '#fffbe6',
    border: '#d4b106',
    text: '#7c4a03', // 7.1:1 on #fffbe6
    icon: <EyeOutlined />,
    description: 'Students see the name and due date — no files, no submitting.',
  },
  [AssignmentStateEnum.Preview]: {
    label: 'Preview',
    bg: '#e6f4ff',
    border: '#91caff',
    text: '#0b53c7', // 5.6:1 on #e6f4ff
    icon: <ReadOutlined />,
    description: "Students can read the assignment files but can't submit yet.",
  },
  [AssignmentStateEnum.Published]: {
    label: 'Published',
    bg: '#f6ffed',
    border: '#b7eb8f',
    text: '#237804', // 5.4:1 on #f6ffed
    icon: <CheckCircleOutlined />,
    description: 'Open for work — students can download files and submit.',
  },
  [AssignmentStateEnum.Closed]: {
    label: 'Closed',
    bg: '#fff2e8',
    border: '#ffbb96',
    text: '#ad2102', // 6.5:1 on #fff2e8
    icon: <LockOutlined />,
    description: 'Submissions are no longer accepted; students keep access to their work.',
  },
  [AssignmentStateEnum.Archived]: {
    label: 'Archived',
    bg: '#fafafa',
    border: '#d9d9d9',
    text: 'rgba(0, 0, 0, 0.7)',
    icon: <InboxOutlined />,
    description: 'Retired — hidden from students entirely.',
  },
};
const STATE_ORDER: AssignmentStateEnum[] = [
  AssignmentStateEnum.Draft,
  AssignmentStateEnum.Visible,
  AssignmentStateEnum.Preview,
  AssignmentStateEnum.Published,
  AssignmentStateEnum.Closed,
  AssignmentStateEnum.Archived,
];

/** Feedback-axis presentation + instructor-facing descriptions, in escalation order.
 *  Same AA-checked palette approach as STATE_META; hideGrades is an independent
 *  modifier and keeps its own menu toggle. */
const FEEDBACK_META: Record<
  AssignmentFeedbackStatusEnum,
  { label: string; bg: string; border: string; text: string; icon: React.ReactNode; description: string }
> = {
  [AssignmentFeedbackStatusEnum.Hidden]: {
    label: 'Hidden',
    bg: '#fafafa',
    border: '#d9d9d9',
    text: 'rgba(0, 0, 0, 0.7)',
    icon: <EyeInvisibleOutlined />,
    description: 'Grading in progress — students see no comments, rubric, or grades.',
  },
  [AssignmentFeedbackStatusEnum.Live]: {
    label: 'Live',
    bg: '#e6f4ff',
    border: '#91caff',
    text: '#0b53c7', // 5.6:1 on #e6f4ff
    icon: <ThunderboltOutlined />,
    description: 'Students see feedback immediately as it is written — for office hours and ungraded work.',
  },
  [AssignmentFeedbackStatusEnum.PerStudent]: {
    label: 'Per student',
    bg: '#f9f0ff',
    border: '#d3adf7',
    text: '#531dab', // 7.6:1 on #f9f0ff
    icon: <UserOutlined />,
    description: 'Each student sees their feedback as soon as THEIR submission is finalized — no global switch.',
  },
  [AssignmentFeedbackStatusEnum.Released]: {
    label: 'Released',
    bg: '#f6ffed',
    border: '#b7eb8f',
    text: '#237804', // 5.4:1 on #f6ffed
    icon: <SendOutlined />,
    description: 'Grades, comments, and the rubric are out for all finalized submissions.',
  },
};
const FEEDBACK_ORDER: AssignmentFeedbackStatusEnum[] = [
  AssignmentFeedbackStatusEnum.Hidden,
  AssignmentFeedbackStatusEnum.Live,
  AssignmentFeedbackStatusEnum.PerStudent,
  AssignmentFeedbackStatusEnum.Released,
];

/** Per-transition confirmation copy for the feedback picker. */
const FEEDBACK_CONFIRM: Record<AssignmentFeedbackStatusEnum, { title: string; content: string; ok: string }> = {
  [AssignmentFeedbackStatusEnum.Hidden]: {
    title: 'Hide feedback?',
    content: 'Students will no longer see grades, comments, or the rubric.',
    ok: 'Hide',
  },
  [AssignmentFeedbackStatusEnum.Live]: {
    title: 'Turn on live feedback?',
    content: 'Students will see comments and grades immediately as they are written, before finalization.',
    ok: 'Go live',
  },
  [AssignmentFeedbackStatusEnum.PerStudent]: {
    title: 'Release feedback per student?',
    content: 'Each student will see their grades, comments, and the rubric as soon as their own submission is finalized.',
    ok: 'Release per student',
  },
  [AssignmentFeedbackStatusEnum.Released]: {
    title: 'Release feedback?',
    content: 'Students will immediately see their grades, comments, and the rubric for finalized submissions.',
    ok: 'Release',
  },
};

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
  const windowSize = useWindowSize();
  const isCompact = windowSize.width < layoutVars.breakpoints.smallScreen.admin;
  const courseCaps = useCourseCapabilities(props.currentCourse?.id);
  const canCreateAssignment = courseCaps.create_assignment !== false;
  const canEditAssignment = courseCaps.edit_assignment ?? canCreateAssignment; // fall back to create_assignment if edit_assignment not yet loaded
  const canEditRubric = courseCaps.edit_rubric !== false;
  const canViewStats = courseCaps.view_analytics !== false;
  const canReleaseGrades = courseCaps.release_grades !== false;
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
  const [filters, setFilters] = useState<AssignmentFilters>(DEFAULT_FILTERS);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

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

  // Publish confirmation: lead with what publishing does (opens the assignment for
  // students); when grading of existing submissions is still in progress, reassure
  // that publishing does NOT reveal it — grading visibility is a separate control.
  const getPublishConfirmText = useCallback(
    (assignment: Assignment): React.ReactElement => {
      const stats = assignmentStats[assignment.id];
      const finalizedRatio = stats.numSubmissions !== 0 ? stats.numGraded / stats.numSubmissions : 1;
      const gradingInProgress = assignment.feedbackStatus !== AssignmentFeedbackStatusEnum.Live && finalizedRatio < FINALIZED_THRESHOLD;

      return (
        <div style={{ maxWidth: '300px' }}>
          <div style={{ paddingBottom: '4px' }}>
            Students will be able to download the assignment files and submit their work.
          </div>
          {gradingInProgress && (
            <div style={{ paddingBottom: '4px' }}>
              Grading in progress is not revealed: most existing submissions are still
              unfinalized, and students can&rsquo;t open a submission until it&rsquo;s finalized.
              Grades and feedback stay hidden until you release feedback.
            </div>
          )}
        </div>
      );
    },
    [assignmentStats],
  );

  // Set the lifecycle state (draft/visible/preview/published/closed/archived).
  // Publishing gets a confirmation dialog; everything else applies directly.
  const setAssignmentState = useCallback(
    (assignment: Assignment, state: AssignmentStateEnum) => {
      const apply = () => {
        if (state === AssignmentStateEnum.Published && assignment.state !== AssignmentStateEnum.Published) {
          Logger.info('Assignment published', {
            text: `${assignment.name} | ${currentCourse ? currentCourse.name : ''} ${
              currentCourse ? currentCourse.period : ''
            }`,
            color: colors.brandPrimary,
            channel: '#user_notifications_everything',
            courseID: currentCourse ? currentCourse.id : 0,
          });
        }
        return updateAssignmentProp({ id: assignment.id, state }).then(() => {
          message.success(`Assignment moved to ${state}.`);
        });
      };

      if (state === AssignmentStateEnum.Published && assignment.state !== AssignmentStateEnum.Published) {
        Modal.confirm({
          title: 'Publish this assignment?',
          content: getPublishConfirmText(assignment),
          okText: 'Publish',
          onOk: apply,
        });
      } else {
        apply();
      }
    },
    [currentCourse, updateAssignmentProp, getPublishConfirmText],
  );

  // Helper to toggle submissions released
  // Set the feedback axis (hidden/live/per_student/released) with a per-transition confirm.
  const setFeedbackStatus = useCallback(
    (assignment: Assignment, status: AssignmentFeedbackStatusEnum) => {
      const confirm = FEEDBACK_CONFIRM[status];
      Modal.confirm({
        title: confirm.title,
        content: confirm.content,
        okText: confirm.ok,
        onOk: () =>
          updateAssignmentProp({
            id: assignment.id,
            feedbackStatus: status,
          }).then(() => {
            message.success(`Feedback set to ${FEEDBACK_META[status].label.toLowerCase()}.`);
          }),
      });
    },
    [updateAssignmentProp],
  );

  // Helper to toggle hideGrades
  const toggleHideGrades = useCallback(
    (assignment: Assignment) => {
      const hiding = assignment.hideGrades;
      const action = hiding ? 'show' : 'hide';
      const title = `Are you sure you want to ${action} grades?`;
      const content = hiding
        ? 'Students will be able to see their numeric grades on finalized submissions.'
        : 'Students will see feedback and comments but not their numeric grade.';

      Modal.confirm({
        title,
        content,
        onOk: () => {
          updateAssignmentProp({
            id: assignment.id,
            hideGrades: !hiding,
          }).then(() => {
            message.success(`Grades ${hiding ? 'shown' : 'hidden'} successfully.`);
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
      width: isCompact ? 100 : 140,
    },
    {
      title: 'Feedback',
      dataIndex: 'feedback',
      key: 'feedback',
      width: isCompact ? 90 : 130,
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: isCompact ? '25%' : '30%',
    },
    {
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      align: 'right' as alignType,
      width: isCompact ? 48 : undefined,
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
          key: 'bulk-edit',
          label: (
            <Link to={`${baseURL}/${encodedName}/bulk-edit`}>
              <EditOutlined /> &nbsp; Bulk edit
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
      const notifyButton = (toggleDialog: () => void) => {
        return (
          <CPButton cpType="secondary" size="small" icon={<MailOutlined />} onClick={toggleDialog}>
            Notify
          </CPButton>
        );
      };

      // --- Status: the table tag shows the DERIVED effectiveState (a past-deadline
      // published assignment reads as Closed on its own); the picker sets the stored state ---
      const storedState = assignment.state ?? AssignmentStateEnum.Draft;
      const effState = assignment.effectiveState ?? storedState;
      const effMeta = STATE_META[effState] ?? STATE_META[AssignmentStateEnum.Draft];
      const isAutoClosed = effState === AssignmentStateEnum.Closed && storedState === AssignmentStateEnum.Published;

      const statusContent = (
        <div style={{ width: 340 }}>
          <Flex vertical gap="small">
            {STATE_ORDER.map((s) => {
              const meta = STATE_META[s];
              const isCurrent = s === storedState;
              // Auto-closed divergence is explained inline, exactly where it applies,
              // instead of a banner: on the current (Published) row and the Closed row.
              let description: React.ReactNode = meta.description;
              if (isAutoClosed && s === AssignmentStateEnum.Published) {
                description = (
                  <>
                    {meta.description}
                    <br />
                    <ClockCircleOutlined aria-hidden style={{ marginRight: 4 }} />
                    Past the due date — students can no longer submit. Extend the due date to
                    reopen.
                  </>
                );
              } else if (isAutoClosed && s === AssignmentStateEnum.Closed) {
                description = `${meta.description} In effect now — select to make it permanent.`;
              }
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={isCurrent}
                  disabled={!canEditAssignment && !isCurrent}
                  onClick={!isCurrent ? () => setAssignmentState(assignment, s) : undefined}
                  className={`${styles.stateOption} ${isCurrent ? styles.stateOptionCurrent : ''}`}
                >
                  <span aria-hidden style={{ marginTop: 2, color: colors.neutralMainText }}>
                    {meta.icon}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.neutralMainText }}>
                      {meta.label}
                      {isCurrent && (
                        <span style={{ fontWeight: 400, color: colors.neutralSecondaryText }}>
                          {' '}
                          — current{isAutoClosed && s === AssignmentStateEnum.Published ? ' setting' : ''}
                        </span>
                      )}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: colors.neutralSecondaryText }}>
                      {description}
                    </span>
                  </span>
                  {isCurrent && (
                    <CheckCircleOutlined aria-hidden style={{ color: colors.brandPrimary, marginTop: 4 }} />
                  )}
                </button>
              );
            })}

            {storedState === AssignmentStateEnum.Published && (
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

      // --- Feedback axis: tag + described picker (Status-popover pattern) ---
      const fbStatus = assignment.feedbackStatus ?? AssignmentFeedbackStatusEnum.Hidden;
      const fbMeta = FEEDBACK_META[fbStatus] ?? FEEDBACK_META[AssignmentFeedbackStatusEnum.Hidden];

      const feedbackContent = (
        <div style={{ width: 340 }}>
          <Flex vertical gap="small">
            {FEEDBACK_ORDER.map((s) => {
              const meta = FEEDBACK_META[s];
              const isCurrent = s === fbStatus;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={isCurrent}
                  disabled={!canReleaseGrades && !isCurrent}
                  onClick={!isCurrent ? () => setFeedbackStatus(assignment, s) : undefined}
                  className={`${styles.stateOption} ${isCurrent ? styles.stateOptionCurrent : ''}`}
                >
                  <span aria-hidden style={{ marginTop: 2, color: colors.neutralMainText }}>
                    {meta.icon}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.neutralMainText }}>
                      {meta.label}
                      {isCurrent && (
                        <span style={{ fontWeight: 400, color: colors.neutralSecondaryText }}> — current</span>
                      )}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: colors.neutralSecondaryText }}>
                      {meta.description}
                    </span>
                  </span>
                  {isCurrent && (
                    <CheckCircleOutlined aria-hidden style={{ color: colors.brandPrimary, marginTop: 4 }} />
                  )}
                </button>
              );
            })}
            {assignment.hideGrades && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Numeric grades are hidden for this assignment (Hide grades) — students see
                comments and the rubric only.
              </Text>
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

      // --- Compute shadow fields for filtering ---
      const statusValue: StatusFilter = (effState as StatusFilter) ?? 'draft';

      const totalSubs = assignmentStats[assignment.id]?.numSubmissions ?? 0;
      const gradedCount = assignmentStats[assignment.id]?.numGraded ?? 0;
      let progressValue: ProgressFilter = 'not_started';
      if (totalSubs > 0) {
        if (gradedCount >= totalSubs) {
          progressValue = 'complete';
        } else if (gradedCount > 0) {
          progressValue = 'in_progress';
        }
      }

      const visibilityValue: VisibilityFilter = assignment.isVisible ? 'visible' : 'hidden';
      const feedbackValue: FeedbackFilter = fbStatus === AssignmentFeedbackStatusEnum.Released ? 'released' : 'not_released';
      const dueDateValue: string | null =
        assignment.allowStudentUpload && assignment.uploadDueDate ? assignment.uploadDueDate : null;

      return {
        key: assignment.id,
        assignmentName: assignment.name,
        statusValue,
        progressValue,
        visibilityValue,
        feedbackValue,
        dueDateValue,
        assignment: (
          <Space orientation="vertical" size={0}>
            <Text strong style={{ fontSize: '15px', letterSpacing: '-0.2px' }}>
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
          <Popover content={statusContent} trigger="click" title="Assignment status" styles={{ root: { width: 360 } }}>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={`Assignment status: ${effMeta.label}${
                isAutoClosed ? ', closed automatically because the due date passed (setting: Published)' : ''
              }. Open status options.`}
              className={styles.cellTrigger}
            >
              <Tag
                icon={effMeta.icon}
                style={{ marginRight: 0, background: effMeta.bg, borderColor: effMeta.border, color: effMeta.text }}
              >
                {effMeta.label}
              </Tag>
              {isAutoClosed && (
                <Tooltip title="Closed automatically — the due date has passed. The setting is still Published; click for options.">
                  <ClockCircleOutlined
                    aria-hidden
                    style={{ fontSize: 11, color: colors.neutralSecondaryText, marginLeft: 4 }}
                  />
                </Tooltip>
              )}
              <SettingOutlined aria-hidden style={{ fontSize: '10px', color: colors.neutralMainText, marginLeft: 4 }} />
            </button>
          </Popover>
        ),
        feedback: (
          <Popover content={feedbackContent} trigger="click" title="Feedback" styles={{ root: { width: 360 } }}>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-label={`Feedback: ${fbMeta.label}${
                assignment.hideGrades ? ', numeric grades hidden' : ''
              }. Open feedback options.`}
              className={styles.cellTrigger}
            >
              <Tag
                icon={fbMeta.icon}
                style={{ marginRight: 0, background: fbMeta.bg, borderColor: fbMeta.border, color: fbMeta.text }}
              >
                {fbMeta.label}
              </Tag>
              {assignment.hideGrades && (
                <Tooltip title="Numeric grades are hidden — students see comments and the rubric only.">
                  <NumberOutlined
                    aria-hidden
                    style={{ fontSize: 11, color: colors.neutralSecondaryText, marginLeft: 4 }}
                  />
                </Tooltip>
              )}
              <SettingOutlined aria-hidden style={{ fontSize: '10px', color: colors.neutralMainText, marginLeft: 4 }} />
            </button>
          </Popover>
        ),
        progress: (
          <Tooltip
            title={
              <span>
                {totalSubmissions} submissions · {missing} missing · {percent}% graded
              </span>
            }
          >
            <div onClick={() => openDrawer(assignment, DRAWER_TYPE.Graded)} style={{ cursor: 'pointer' }}>
              <div style={{ whiteSpace: 'nowrap', fontSize: '12px', marginBottom: 4 }}>
                <Text
                  type={totalSubmissions === 0 ? 'secondary' : undefined}
                  className={totalSubmissions > 0 ? 'text-link' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (totalSubmissions > 0) openDrawer(assignment, DRAWER_TYPE.Submitted);
                  }}
                  style={{ fontSize: '12px' }}
                >
                  {totalSubmissions}
                </Text>
                <span style={{ color: colors.neutralBorder, margin: '0 3px' }}>/</span>
                <Text
                  type="secondary"
                  className={missing > 0 ? 'text-link' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(assignment, DRAWER_TYPE.Missing);
                  }}
                  style={{ fontSize: '12px', color: missing > 0 ? colors.actionRed : undefined }}
                >
                  {missing}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: 6 }}>
                  {percent}%
                </Text>
              </div>
              <Progress
                percent={percent}
                showInfo={false}
                strokeColor={colors.brandPrimary}
                railColor={colors.brandLight}
                size="small"
              />
            </div>
          </Tooltip>
        ),
        actions: isCompact ? (
          <Dropdown
            menu={{
              items: [
                ...(canEditAssignment
                  ? [
                      {
                        key: 'configure',
                        label: 'Configure',
                        icon: <SettingOutlined />,
                        children: configItems,
                      },
                    ]
                  : []),
                ...(canEditRubric
                  ? [
                      {
                        key: 'rubric',
                        label: (
                          <Link to={`${baseURL}/rubrics/${encodedName}`}>
                            <OrderedListOutlined /> Edit rubric
                          </Link>
                        ),
                      },
                    ]
                  : []),
                ...(canEditAssignment
                  ? [
                      {
                        key: 'environment',
                        label: (
                          <Link to={`${baseURL}/environment/${encodedName}/edit`}>
                            <FileDoneOutlined /> Environment & Tests
                          </Link>
                        ),
                      },
                    ]
                  : []),
                {
                  key: 'uploads',
                  label: 'Manage submissions',
                  icon: <UploadOutlined />,
                  children: uploadItems,
                },
                { type: 'divider' as const },
                {
                  key: 'grades',
                  icon: assignment.hideGrades ? <EyeInvisibleOutlined /> : <NumberOutlined />,
                  label: assignment.feedbackStatus === AssignmentFeedbackStatusEnum.Hidden
                    ? 'Grades (feedback hidden)'
                    : assignment.hideGrades
                      ? 'Grades hidden'
                      : 'Grades visible',
                  disabled: assignment.feedbackStatus === AssignmentFeedbackStatusEnum.Hidden || !canReleaseGrades,
                  onClick: () => toggleHideGrades(assignment),
                },
                { type: 'divider' as const },
                ...dataItems,
                ...(canEditAssignment
                  ? [
                      { type: 'divider' as const },
                      {
                        key: 'delete',
                        label: (
                          <Link to={`${baseURL}/${encodedName}/delete`}>
                            <DeleteOutlined /> Delete
                          </Link>
                        ),
                        danger: true,
                      },
                    ]
                  : []),
              ],
            }}
            trigger={['click']}
          >
            <Button shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        ) : (
          <Space>
            {canEditAssignment && (
              <Tooltip title="Configure assignment">
                <Dropdown menu={{ items: configItems }} trigger={['click']}>
                  <Button shape="circle" icon={<SettingOutlined />} />
                </Dropdown>
              </Tooltip>
            )}
            {canEditRubric && (
              <Tooltip title="Edit rubric">
                <Link to={`${baseURL}/rubrics/${encodedName}`}>
                  <Button shape="circle" icon={<OrderedListOutlined />} />
                </Link>
              </Tooltip>
            )}
            {canEditAssignment && (
              <Tooltip title="Environment & Tests">
                <Link to={`${baseURL}/environment/${encodedName}/edit`}>
                  <Button shape="circle" icon={<FileDoneOutlined />} />
                </Link>
              </Tooltip>
            )}
            <Tooltip title="Manage submissions">
              <Dropdown menu={{ items: uploadItems }} trigger={['click']}>
                <Button shape="circle" icon={<UploadOutlined />} />
              </Dropdown>
            </Tooltip>
            <Tooltip
              title={
                assignment.feedbackStatus === AssignmentFeedbackStatusEnum.Hidden
                  ? 'Grades — feedback is hidden, so grades are not shown regardless'
                  : assignment.hideGrades
                    ? 'Grades hidden — click to show numeric grades'
                    : 'Grades visible — click to hide numeric grades'
              }
            >
              <Button
                shape="circle"
                aria-label={
                  assignment.hideGrades
                    ? `Grades hidden for ${assignment.name} — show numeric grades`
                    : `Grades visible for ${assignment.name} — hide numeric grades`
                }
                aria-pressed={!assignment.hideGrades}
                disabled={assignment.feedbackStatus === AssignmentFeedbackStatusEnum.Hidden || !canReleaseGrades}
                onClick={() => toggleHideGrades(assignment)}
                icon={assignment.hideGrades ? <EyeInvisibleOutlined /> : <NumberOutlined />}
                style={
                  !assignment.hideGrades && assignment.feedbackStatus !== AssignmentFeedbackStatusEnum.Hidden
                    ? { borderColor: colors.brandPrimary, color: colors.brandPrimary }
                    : undefined
                }
              />
            </Tooltip>
            {canViewStats && (
              <Tooltip title="Analyze grades & stats">
                <Dropdown menu={{ items: dataItems }} trigger={['click']}>
                  <Button shape="circle" icon={<BarChartOutlined />} />
                </Dropdown>
              </Tooltip>
            )}
            {canEditAssignment && (
              <Tooltip title="Delete assignment">
                <Link to={`${baseURL}/${encodedName}/delete`}>
                  <Button shape="circle" danger icon={<DeleteOutlined />} />
                </Link>
              </Tooltip>
            )}
          </Space>
        ),
      };
    })
    .filter((assignment): assignment is AssignmentRow => assignment !== null);

  // Derived: whether any filter is currently active
  const isFilterActive =
    filters.searchText !== '' ||
    filters.status !== 'all' ||
    filters.progress !== 'all' ||
    filters.visibility !== 'all' ||
    filters.feedback !== 'all' ||
    filters.dateRange !== null;

  // Client-side filter pipeline applied on the fully-rendered data array
  const filteredData = useMemo(() => {
    if (!isFilterActive) return data;

    return data.filter((row) => {
      // Text search on assignment name
      if (filters.searchText !== '' && !row.assignmentName.toLowerCase().includes(filters.searchText.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && row.statusValue !== filters.status) {
        return false;
      }

      // Progress filter
      if (filters.progress !== 'all' && row.progressValue !== filters.progress) {
        return false;
      }

      // Visibility filter
      if (filters.visibility !== 'all' && row.visibilityValue !== filters.visibility) {
        return false;
      }

      // Feedback filter
      if (filters.feedback !== 'all' && row.feedbackValue !== filters.feedback) {
        return false;
      }

      // Due date range filter
      if (filters.dateRange !== null) {
        const [from, to] = filters.dateRange;
        if (row.dueDateValue === null) {
          // No due date — exclude if a date range is specified
          return false;
        }
        const dueDay = dayjs(row.dueDateValue);
        if (from && dueDay.isBefore(from, 'day')) return false;
        if (to && dueDay.isAfter(to, 'day')) return false;
      }

      return true;
    });
  }, [data, filters, isFilterActive]);

  /******************************************************************************
   * Bulk action handlers
   ******************************************************************************/

  const bulkUpdate = useCallback(
    async (patch: Partial<Assignment>) => {
      setBulkLoading(true);
      try {
        const promises = selectedRowKeys.map((key) => updateAssignmentProp({ id: key as number, ...patch }));
        await Promise.all(promises);
        message.success(`Updated ${selectedRowKeys.length} assignment${selectedRowKeys.length > 1 ? 's' : ''}.`);
        setSelectedRowKeys([]);
      } catch {
        message.error('Some updates failed. Please try again.');
      } finally {
        setBulkLoading(false);
      }
    },
    [selectedRowKeys, updateAssignmentProp],
  );

  const bulkPublish = useCallback(() => bulkUpdate({ state: AssignmentStateEnum.Published }), [bulkUpdate]);
  const bulkUnpublish = useCallback(() => bulkUpdate({ state: AssignmentStateEnum.Preview }), [bulkUpdate]);
  const bulkShow = useCallback(() => bulkUpdate({ state: AssignmentStateEnum.Preview }), [bulkUpdate]);
  const bulkHide = useCallback(() => bulkUpdate({ state: AssignmentStateEnum.Draft }), [bulkUpdate]);
  const bulkReleaseFeedback = useCallback(() => bulkUpdate({ feedbackStatus: AssignmentFeedbackStatusEnum.Released }), [bulkUpdate]);
  const clearSelection = useCallback(() => setSelectedRowKeys([]), []);

  const hasSelection = selectedRowKeys.length > 0;

  const tableActions: React.ReactNode[] = [
    canCreateAssignment ? (
      <NewAssignmentDialog
        key={1}
        {...props}
        currentCourse={currentCourse}
        assignments={assignments}
        courses={props.courses}
        createAssignment={createAssignment}
        timezone={currentCourse.timezone || 'UTC'}
      />
    ) : null,
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
            hasSubmissions={(submissions[activeAssignment.id]?.length ?? 0) > 0}
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

  // Only allow drag-and-drop when no filter or selection is active (reordering
  // on a filtered/selected list produces ambiguous sortKey mappings).
  const dndDisabled = isFilterActive || hasSelection;
  const dndComponents = dndDisabled ? undefined : components;
  const dndOnRow = dndDisabled
    ? undefined
    : (_record: Record<string, unknown>, index?: number) =>
        ({
          index: index ?? 0,
          moveRow: moveRow,
        }) as React.HTMLAttributes<HTMLElement>;

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
        data={filteredData}
        title={
          <>
            Assignments
            {isFilterActive && (
              <span
                style={{ fontSize: 13, fontWeight: 400, color: colors.neutralSecondaryText, marginLeft: 10 }}
                aria-live="polite"
              >
                ({filteredData.length} of {assignments.length})
              </span>
            )}
          </>
        }
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
        components={dndComponents}
        tableProps={{
          scroll: { x: 'max-content' },
          rowSelection: canEditAssignment
            ? {
                selectedRowKeys,
                onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
                type: 'checkbox' as const,
              }
            : undefined,
        }}
        onRow={dndOnRow}
        pagination={filteredData.length < DEFAULT_PAGINATION_SIZE ? false : undefined}
        beforeTable={
          loadComplete && assignments.length > 0 ? (
            <>
              <BulkActionBar
                selectedCount={selectedRowKeys.length}
                isLoading={bulkLoading}
                canEditAssignment={canEditAssignment}
                canReleaseGrades={canReleaseGrades}
                onPublish={bulkPublish}
                onUnpublish={bulkUnpublish}
                onShow={bulkShow}
                onHide={bulkHide}
                onReleaseFeedback={bulkReleaseFeedback}
                onClearSelection={clearSelection}
              />
              <AssignmentsFilterBar
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={assignments.length}
                filteredCount={filteredData.length}
              />
            </>
          ) : undefined
        }
      />
    </div>
  );
};

export default AssignmentsTable;

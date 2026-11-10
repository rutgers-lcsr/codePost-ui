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
  DownOutlined,
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
  Alert,
  Button,
  Checkbox,
  Dropdown,
  Empty,
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
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
import { apiErrorMessageAsync } from '../../../lib/apiError';

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
import { encodedCourseLink } from '../../core/CourseMenu';

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
  stage: React.ReactNode;
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
    description: 'Students see the name, due date and description — no files, no submitting.',
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

/** The words under the Stage chip for the feedback axis. */
const FEEDBACK_CAPTION: Record<AssignmentFeedbackStatusEnum, string> = {
  [AssignmentFeedbackStatusEnum.Hidden]: 'feedback hidden',
  [AssignmentFeedbackStatusEnum.Live]: 'live feedback',
  [AssignmentFeedbackStatusEnum.PerStudent]: 'per-student feedback',
  [AssignmentFeedbackStatusEnum.Released]: 'feedback released',
};

/** What students can do right now, one sentence per effective work state. */
const WORK_NOW: Record<AssignmentStateEnum, string> = {
  [AssignmentStateEnum.Draft]: "Students can't see this assignment yet.",
  [AssignmentStateEnum.Visible]: 'Students see the name, due date and description, but no files.',
  [AssignmentStateEnum.Preview]: "Students can read the files but can't submit.",
  [AssignmentStateEnum.Published]: 'Students can download the files and submit.',
  [AssignmentStateEnum.Closed]: 'Students can no longer submit; they keep access to their work.',
  [AssignmentStateEnum.Archived]: "Students can't see this assignment any more.",
};

/** What students see of the grading right now; hideGrades is the modifier. */
const feedbackNow = (status: AssignmentFeedbackStatusEnum, hideGrades: boolean): string => {
  switch (status) {
    case AssignmentFeedbackStatusEnum.Live:
      return hideGrades
        ? 'They see comments and the rubric as they are written; numeric grades stay hidden.'
        : 'They see comments and grades as they are written.';
    case AssignmentFeedbackStatusEnum.PerStudent:
      return hideGrades
        ? 'Each sees their comments and rubric once their own submission is finalized; numeric grades stay hidden.'
        : 'Each sees their grades, comments and rubric once their own submission is finalized.';
    case AssignmentFeedbackStatusEnum.Released:
      return hideGrades
        ? 'They see comments and the rubric on finalized submissions; numeric grades stay hidden.'
        : 'They see grades, comments and the rubric on finalized submissions.';
    default:
      return 'They see no grades, comments or rubric.';
  }
};

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
    content:
      'Each student will see their grades, comments, and the rubric as soon as their own submission is finalized.',
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
  // Seven inline row actions need the room of a wide screen; laptops get the single actions menu.
  const isCompact = windowSize.width < layoutVars.breakpoints.smallScreen.assignmentActionsCompact;
  // The Stage picker shows Work beside Feedback when the window has room for a 620px popover.
  const stageTwoColumn = windowSize.width >= 960;
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
    refreshCourseData,
  } = props;

  const navigate = useNavigate();
  // One tab stop per link-like action: a Button with href keeps open-in-new-tab and the context
  // menu, and onClick keeps in-app routing. An anchor wrapping a button is two stops.
  const linkButtonProps = (to: string) => ({
    href: to,
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(to);
    },
  });

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
    // The dialogs are routes, so closing one is a navigation that drops focus on the body. The
    // delete dialog hands it back to the button that opened it, once the modal has left the DOM.
    const returnTo = detailType === DETAIL_TYPE.Delete && activeAssignment ? `Delete ${activeAssignment.name}` : null;
    navigate(`${baseURL}/overview`);
    if (!returnTo) return;
    const started = Date.now();
    const tryFocus = () => {
      if (document.querySelector('.ant-modal')) {
        if (Date.now() - started < 1500) window.setTimeout(tryFocus, 50);
        return;
      }
      document.querySelector<HTMLElement>(`[aria-label="${CSS.escape(returnTo)}"]`)?.focus();
    };
    window.setTimeout(tryFocus, 50);
  }, [navigate, baseURL, detailType, activeAssignment]);

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
      const gradingInProgress =
        assignment.feedbackStatus !== AssignmentFeedbackStatusEnum.Live && finalizedRatio < FINALIZED_THRESHOLD;

      return (
        <div style={{ maxWidth: '300px' }}>
          <div style={{ paddingBottom: '4px' }}>
            Students will be able to download the assignment files and submit their work.
          </div>
          {gradingInProgress && (
            <div style={{ paddingBottom: '4px' }}>
              Grading in progress is not revealed: most existing submissions are still unfinalized, and students
              can&rsquo;t open a submission until it&rsquo;s finalized. Grades and feedback stay hidden until you
              release feedback.
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
        return updateAssignmentProp({ id: assignment.id, state })
          .then(() => {
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
            message.success(`Assignment moved to ${state}.`);
          })
          .catch(async (e) => {
            message.error((await apiErrorMessageAsync(e, 'state')) ?? 'Could not update the assignment.');
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
      width: '28%',
      className: 'draggable',
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      // One chip plus the words under it; the former Status + Feedback pair took 250.
      width: isCompact ? 130 : 210,
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      // No width: the counts stack, so the column fits at 1440 and takes the slack on wider screens.
    },
    {
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      align: 'right' as alignType,
      // Fixed to what the icons need, so a wide screen does not strand them; compact is the one menu button.
      width: isCompact ? 48 : 300,
    },
  ];

  // What needs attention in this course right now: submissions nobody has claimed to grade.
  // Same counts the mobile console's banner uses (they arrive with each assignment).
  const unclaimedCount = useMemo(
    () => assignments.reduce((sum, a) => sum + (a.submissions_unclaimed_count ?? 0), 0),
    [assignments],
  );
  const unclaimedAssignments = useMemo(
    () => assignments.filter((a) => (a.submissions_unclaimed_count ?? 0) > 0).length,
    [assignments],
  );

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

      // --- Stage: one control for the work state and the feedback state. The chip shows the
      // DERIVED effectiveState (a past-deadline published assignment reads as Closed on its own);
      // the picker sets the stored state. Feedback and the hide-grades modifier live in the same
      // panel, so what students see right now is one read and one click, not three. ---
      const storedState = assignment.state ?? AssignmentStateEnum.Draft;
      const effState = assignment.effectiveState ?? storedState;
      const effMeta = STATE_META[effState] ?? STATE_META[AssignmentStateEnum.Draft];
      const isAutoClosed = effState === AssignmentStateEnum.Closed && storedState === AssignmentStateEnum.Published;
      const fbStatus = assignment.feedbackStatus ?? AssignmentFeedbackStatusEnum.Hidden;
      const hideGrades = !!assignment.hideGrades;
      const studentsCanSee = effState !== AssignmentStateEnum.Draft && effState !== AssignmentStateEnum.Archived;

      // Words under the chip: whatever the work-state chip does not already say.
      const captionParts: string[] = [];
      if (isAutoClosed) captionParts.push('Past due date');
      if (
        studentsCanSee &&
        (fbStatus !== AssignmentFeedbackStatusEnum.Hidden ||
          effState === AssignmentStateEnum.Published ||
          effState === AssignmentStateEnum.Closed)
      ) {
        captionParts.push(FEEDBACK_CAPTION[fbStatus]);
      }
      if (studentsCanSee && hideGrades && fbStatus !== AssignmentFeedbackStatusEnum.Hidden) {
        captionParts.push('grades hidden');
      }
      const captionRaw = captionParts.join(' · ');
      let caption = captionRaw ? captionRaw.charAt(0).toUpperCase() + captionRaw.slice(1) : '';
      const studentsNow = studentsCanSee
        ? `${WORK_NOW[effState]} ${feedbackNow(fbStatus, hideGrades)}`
        : WORK_NOW[effState];

      const stageOption = (
        key: string,
        meta: { label: string; icon: React.ReactNode },
        isCurrent: boolean,
        locked: boolean,
        onSelect: () => void,
        description: React.ReactNode,
        currentLabel = 'current',
      ) => (
        <button
          key={key}
          type="button"
          aria-pressed={isCurrent}
          disabled={locked && !isCurrent}
          onClick={!isCurrent ? onSelect : undefined}
          className={`${styles.stateOption} ${isCurrent ? styles.stateOptionCurrent : ''}`}
        >
          <span aria-hidden style={{ marginTop: 2, color: colors.neutralMainText }}>
            {meta.icon}
          </span>
          <span style={{ flex: 1 }}>
            <span
              style={{
                display: 'block',
                fontSize: 13,
                lineHeight: '18px',
                fontWeight: 600,
                color: colors.neutralMainText,
              }}
            >
              {meta.label}
              {isCurrent && (
                <span style={{ fontWeight: 400, color: colors.neutralSecondaryText }}> — {currentLabel}</span>
              )}
            </span>
            <span style={{ display: 'block', fontSize: 12, lineHeight: '16px', color: colors.neutralSecondaryText }}>
              {description}
            </span>
          </span>
          {isCurrent && <CheckCircleOutlined aria-hidden style={{ color: colors.brandPrimary, marginTop: 3 }} />}
        </button>
      );

      const groupLabel = (text: string) => (
        <Text
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: colors.neutralSecondaryText,
            padding: '0 8px',
            marginBottom: 2,
          }}
        >
          {text}
        </Text>
      );

      const stageContent = (
        <div className="cp-scroll-shade" style={{ maxHeight: 'calc(50vh - 60px)', overflowY: 'auto' }}>
          <Text
            style={{
              display: 'block',
              fontSize: 13,
              lineHeight: '18px',
              color: colors.neutralMainText,
              marginBottom: 10,
            }}
          >
            <strong>Students right now:</strong> {studentsNow}
          </Text>
          {/* Work beside Feedback: the two axes are independent, and side by side the whole
              panel fits a laptop screen; it stacks when the window is narrow. */}
          <div className={stageTwoColumn ? styles.stageGrid : styles.stageStack}>
            <div className={styles.stageColumn}>
              {groupLabel('Work')}
              {STATE_ORDER.map((s) => {
                const meta = STATE_META[s];
                // Auto-closed divergence is explained inline, exactly where it applies,
                // instead of a banner: on the current (Published) row and the Closed row.
                let description: React.ReactNode = meta.description;
                let currentLabel = 'current';
                if (isAutoClosed && s === AssignmentStateEnum.Published) {
                  currentLabel = 'current setting';
                  description = (
                    <>
                      {meta.description}
                      <br />
                      <ClockCircleOutlined aria-hidden style={{ marginRight: 4 }} />
                      Past the due date — students can no longer submit. Extend the due date to reopen.
                    </>
                  );
                } else if (isAutoClosed && s === AssignmentStateEnum.Closed) {
                  description = `${meta.description} In effect now — select to make it permanent.`;
                }
                return stageOption(
                  s,
                  meta,
                  s === storedState,
                  !canEditAssignment,
                  () => setAssignmentState(assignment, s),
                  description,
                  currentLabel,
                );
              })}
              {storedState === AssignmentStateEnum.Published && (
                <div style={{ textAlign: 'right', marginTop: 4 }}>
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
            </div>
            <div className={styles.stageColumn}>
              {groupLabel('Feedback')}
              {FEEDBACK_ORDER.map((s) =>
                stageOption(
                  s,
                  FEEDBACK_META[s],
                  s === fbStatus,
                  !canReleaseGrades,
                  () => setFeedbackStatus(assignment, s),
                  FEEDBACK_META[s].description,
                ),
              )}
              <Tooltip
                title={
                  fbStatus === AssignmentFeedbackStatusEnum.Hidden
                    ? 'Feedback is hidden, so no grades show either way.'
                    : undefined
                }
              >
                <Checkbox
                  checked={hideGrades}
                  disabled={fbStatus === AssignmentFeedbackStatusEnum.Hidden || !canReleaseGrades}
                  onChange={() => toggleHideGrades(assignment)}
                  style={{ fontSize: 13, color: colors.neutralMainText, margin: '4px 8px 0' }}
                >
                  Hide numeric grades
                  {/* Inherits the label colour, so it dims with a disabled checkbox; 0.7 reads as secondary. */}
                  <span style={{ display: 'block', fontSize: 12, lineHeight: '16px', opacity: 0.7 }}>
                    Students see comments and the rubric only.
                  </span>
                </Checkbox>
              </Tooltip>
            </div>
          </div>
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
      const feedbackValue: FeedbackFilter =
        fbStatus === AssignmentFeedbackStatusEnum.Released ? 'released' : 'not_released';
      const dueDateValue: string | null =
        assignment.allowStudentUpload && assignment.uploadDueDate ? assignment.uploadDueDate : null;

      // --- Next action: the one move this row is waiting for, if any. Grading itself is pull-based
      // (graders claim from the queue), so the only moves here are the instructor's own: opening the
      // assignment and releasing feedback. Each opens the same confirmation the picker uses. ---
      const unclaimed = assignment.submissions_unclaimed_count ?? 0;
      let nextAction: { label: string; icon: React.ReactNode; title: string; run: () => void } | null = null;
      if (
        canEditAssignment &&
        (storedState === AssignmentStateEnum.Draft ||
          storedState === AssignmentStateEnum.Visible ||
          storedState === AssignmentStateEnum.Preview)
      ) {
        nextAction = {
          label: 'Publish',
          icon: <CheckCircleOutlined />,
          title: 'Open it for work: students can download the files and submit.',
          run: () => setAssignmentState(assignment, AssignmentStateEnum.Published),
        };
      } else if (
        effState === AssignmentStateEnum.Closed &&
        totalSubmissions > 0 &&
        graded >= totalSubmissions &&
        canReleaseGrades &&
        fbStatus === AssignmentFeedbackStatusEnum.Hidden
      ) {
        nextAction = {
          label: 'Release feedback',
          icon: <SendOutlined />,
          title: 'Everything is graded; students see nothing until you release it.',
          run: () => setFeedbackStatus(assignment, AssignmentFeedbackStatusEnum.Released),
        };
      }
      // Closed and still being graded: say how much is waiting in the queue for graders to claim.
      if (effState === AssignmentStateEnum.Closed && unclaimed > 0 && graded < totalSubmissions) {
        const queued = `${unclaimed} in the queue`;
        caption = caption ? `${caption} · ${queued}` : queued.charAt(0).toUpperCase() + queued.slice(1);
      }
      // A link under the stage chip it moves, not a filled button among the action icons: those stay
      // one uniform row, and the move sits beside the state it changes.
      const nextActionLink = nextAction ? (
        <div style={{ marginTop: 2 }}>
          <Tooltip title={nextAction.title}>
            <Button
              type="link"
              size="small"
              icon={nextAction.icon}
              onClick={nextAction.run}
              aria-label={`${nextAction.label} for ${assignment.name}`}
              style={{ padding: 0, height: 'auto', fontSize: 12 }}
            >
              {nextAction.label}
            </Button>
          </Tooltip>
        </div>
      ) : null;

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
        stage: (
          <div>
            <Popover
              content={stageContent}
              trigger="click"
              // The wide two-column panel drops under the chip (it has no room beside it on a laptop);
              // the narrow stacked one sits beside the chip as before.
              placement={stageTwoColumn ? 'bottom' : 'rightTop'}
              title="Stage"
              // Two columns on a laptop, one on a narrow window. The body is capped at half the window
              // (it scrolls inside, under a shade), so the whole popover fits above or below any row's chip.
              styles={{ root: { width: stageTwoColumn ? 620 : 340, maxWidth: 'calc(100vw - 24px)' } }}
            >
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Stage: ${effMeta.label}${caption ? `, ${caption.toLowerCase()}` : ''}. Open stage options.`}
                className={styles.cellTrigger}
              >
                <Tag
                  icon={effMeta.icon}
                  style={{ marginRight: 0, background: effMeta.bg, borderColor: effMeta.border, color: effMeta.text }}
                >
                  {effMeta.label}
                </Tag>
                <DownOutlined aria-hidden style={{ fontSize: 9, color: colors.neutralSecondaryText, marginLeft: 4 }} />
              </button>
            </Popover>
            {/* Words under the chip, not a second chip: the feedback axis and the past-due note. */}
            {caption && (
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                {caption}
              </Text>
            )}
            {nextActionLink}
          </div>
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
              {/* Labelled counts, one per line: "2 / 222 0%" read as one broken figure. */}
              <div style={{ fontSize: '12px', marginBottom: 4, display: 'flex', flexDirection: 'column' }}>
                <Text
                  type={totalSubmissions === 0 ? 'secondary' : undefined}
                  className={totalSubmissions > 0 ? 'text-link' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (totalSubmissions > 0) openDrawer(assignment, DRAWER_TYPE.Submitted);
                  }}
                  style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                >
                  {totalSubmissions} submitted
                </Text>
                <Text
                  type="secondary"
                  className={missing > 0 ? 'text-link' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(assignment, DRAWER_TYPE.Missing);
                  }}
                  // red-8: 7:1 on white; the brand action red is 3.5:1 at this size.
                  style={{ fontSize: '12px', whiteSpace: 'nowrap', color: missing > 0 ? '#a8071a' : undefined }}
                >
                  {missing} missing
                </Text>
              </div>
              <Progress
                percent={percent}
                format={() => `${percent}% graded`}
                strokeColor={colors.brandPrimary}
                // A visible track: the brand-light tint was indistinguishable from the white row.
                railColor="rgba(0, 0, 0, 0.08)"
                size="small"
                style={{ fontSize: 12 }}
              />
            </div>
          </Tooltip>
        ),
        actions: isCompact ? (
          <Space size={6}>
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
              <Button shape="circle" icon={<MoreOutlined />} aria-label={`Actions for ${assignment.name}`} />
            </Dropdown>
          </Space>
        ) : (
          <Space size={6}>
            {canEditAssignment && (
              <Tooltip title="Configure assignment">
                <Dropdown menu={{ items: configItems }} trigger={['click']}>
                  <Button shape="circle" icon={<SettingOutlined />} aria-label={`Configure ${assignment.name}`} />
                </Dropdown>
              </Tooltip>
            )}
            {canEditRubric && (
              <Tooltip title="Edit rubric">
                <Button
                  shape="circle"
                  icon={<OrderedListOutlined />}
                  aria-label={`Edit rubric for ${assignment.name}`}
                  {...linkButtonProps(`${baseURL}/rubrics/${encodedName}`)}
                />
              </Tooltip>
            )}
            {canEditAssignment && (
              <Tooltip title="Environment & Tests">
                <Button
                  shape="circle"
                  icon={<FileDoneOutlined />}
                  aria-label={`Environment and tests for ${assignment.name}`}
                  {...linkButtonProps(`${baseURL}/environment/${encodedName}/edit`)}
                />
              </Tooltip>
            )}
            <Tooltip title="Manage submissions">
              <Dropdown menu={{ items: uploadItems }} trigger={['click']}>
                <Button
                  shape="circle"
                  icon={<UploadOutlined />}
                  aria-label={`Manage submissions for ${assignment.name}`}
                />
              </Dropdown>
            </Tooltip>
            {canViewStats && (
              <Tooltip title="Analyze grades & stats">
                <Dropdown menu={{ items: dataItems }} trigger={['click']}>
                  <Button
                    shape="circle"
                    icon={<BarChartOutlined />}
                    aria-label={`Analyze grades and stats for ${assignment.name}`}
                  />
                </Dropdown>
              </Tooltip>
            )}
            {canEditAssignment && (
              <Tooltip title="Delete assignment">
                <Button
                  shape="circle"
                  danger
                  className="cp-quiet-delete"
                  icon={<DeleteOutlined />}
                  aria-label={`Delete ${assignment.name}`}
                  {...linkButtonProps(`${baseURL}/${encodedName}/delete`)}
                />
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
  const bulkReleaseFeedback = useCallback(
    () => bulkUpdate({ feedbackStatus: AssignmentFeedbackStatusEnum.Released }),
    [bulkUpdate],
  );
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
    <CPButton
      key={2}
      cpType="secondary"
      icon={<DownloadOutlined />}
      disabled={Object.keys(submissions).length === 0}
      {...linkButtonProps(`${baseURL}/download/grades`)}
    >
      Download grades
    </CPButton>,
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
            submissionCount={assignmentStats[activeAssignment.id]?.numSubmissions}
            gradedCount={assignmentStats[activeAssignment.id]?.numGraded}
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
    // DndProvider lives here (not at the app root) — this drag-sortable table is the
    // only react-dnd consumer, and hoisting the provider would pull react-dnd's
    // redux stack into the entry bundle.
    <DndProvider backend={HTML5Backend}>
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
              {currentCourse.archived && <Tag style={{ marginLeft: 10 }}>Archived</Tag>}
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
                {unclaimedCount > 0 && (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    title={
                      <>
                        <Text strong>{unclaimedCount}</Text> submission{unclaimedCount === 1 ? '' : 's'} across{' '}
                        {unclaimedAssignments} assignment{unclaimedAssignments === 1 ? '' : 's'}{' '}
                        {unclaimedCount === 1 ? 'is' : 'are'} waiting in the grading queue.
                      </>
                    }
                    action={
                      // A button that navigates, not a link wrapping a button: one tab stop.
                      <Button
                        size="small"
                        onClick={() => navigate(encodedCourseLink('admin', currentCourse, 'submissions/by_grader'))}
                      >
                        Grading progress
                      </Button>
                    }
                  />
                )}
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
    </DndProvider>
  );
};

export default AssignmentsTable;

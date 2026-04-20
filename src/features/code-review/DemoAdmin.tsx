// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  Progress,
  Card,
  Typography,
  Switch,
  Input,
  Badge,
  Breadcrumb,
  Popover,
  Popconfirm,
  Descriptions,
  Form,
  Button,
  Space,
  Tooltip,
  Menu,
  Empty,
  Tag,
  Select,
  Radio,
  Tabs,
  InputNumber,
  Divider,
  Alert,
} from 'antd';
import {
  FileTextOutlined,
  InboxOutlined,
  TeamOutlined,
  SettingOutlined,
  BarChartOutlined,
  DeleteOutlined,
  OrderedListOutlined,
  FileDoneOutlined,
  UploadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PushpinOutlined,
  ApiOutlined,
  HistoryOutlined,
  TrophyOutlined,
  DisconnectOutlined,
  UserDeleteOutlined,
  MailOutlined,
  ProfileOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  DownloadOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  LikeOutlined,
  DislikeOutlined,
  EditOutlined,
  UndoOutlined,
  SaveOutlined,
  BuildOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Layout } from 'antd';
import { Link } from 'react-router-dom';

import CPLayoutAdmin from '../../components/admin/other/CPLayoutAdmin';
import CPAdminDetail from '../../components/admin/other/CPAdminDetail';
import CPFlex from '../../components/core/CPFlex';
import CPButton from '../../components/core/CPButton';
import CPTooltip from '../../components/core/CPTooltip';
import CourseMenu from '../../components/core/CourseMenu';
import RoleMenu from '../../components/core/RoleMenu';
import Referral from '../../components/core/Referral';
import StudentSubmissionsTable from '../../components/admin/submissions/StudentSubmissions';
import GraderSubmissionsTable from '../../components/admin/submissions/GraderSubmissions';
import DemoBanner from './DemoBanner';
import { brandColors } from '../../theme/colors';
import { CODE_DEMO } from '../../routes';
import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';
import type { Course } from '../../api-client';
import type { UserType } from '../../types/models';
import {
  USER_TYPE,
  type Assignment,
  type IAssignmentToSubmissionsMap,
  type IGraderSubmissionsDataTable,
  type IStudentSubmissionsDataTable,
  type SubmissionInfoType,
  type UploadFile,
} from '../../types/common';

const { Text } = Typography;
const { TextArea } = Input;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const DEMO_COURSES = [
  { id: 1, name: 'CS 201 – Data Structures', period: 'Spring 2026', assignments: [], sections: [] },
  { id: 2, name: 'CS 111 – Intro to CS', period: 'Spring 2026', assignments: [], sections: [] },
  { id: 3, name: 'CS 100 – Fundamentals', period: 'Fall 2025', archived: true, assignments: [], sections: [] },
] as unknown as Course[];

const DEMO_CURRENT_COURSE = DEMO_COURSES[0];

const DEMO_USER: UserType = {
  id: 1,
  email: 'instructor@university.edu',
  password: '',
  studentCourses: [DEMO_COURSES[0]],
  graderCourses: [DEMO_COURSES[0]],
  superGraderCourses: [],
  courseadminCourses: [DEMO_COURSES[0]],
  leaderSections: [],
  canCreateCourses: true,
  canModifyRosters: true,
  showProductTips: true,
  studentSections: [],
  hasCredentials: true,
  token: null,
};

const CONSOLE_THEME_VALUE = {
  consoleTheme: consoleThemes.light,
  toggleConsoleTheme: () => {},
};

// ----- Assignment mock data -----

interface DemoAssignment {
  key: number;
  name: string;
  dueDate: string;
  points: number;
  submissions: number;
  missing: number;
  graded: number;
  published: boolean;
  visible: boolean;
  mean: number | null;
  rubricCategories: { id: number; name: string }[];
  environment: number | null;
}

const ASSIGNMENTS: DemoAssignment[] = [
  {
    key: 1,
    name: 'HW 1 – Loops',
    dueDate: 'Feb 10, 2026 11:59 PM',
    points: 20,
    submissions: 142,
    missing: 0,
    graded: 142,
    published: true,
    visible: true,
    mean: 17.3,
    rubricCategories: [
      { id: 1, name: 'Correctness' },
      { id: 2, name: 'Style' },
    ],
    environment: 101,
  },
  {
    key: 2,
    name: 'HW 2 – Recursion',
    dueDate: 'Feb 24, 2026 11:59 PM',
    points: 25,
    submissions: 139,
    missing: 3,
    graded: 134,
    published: true,
    visible: true,
    mean: 20.1,
    rubricCategories: [{ id: 3, name: 'Correctness' }],
    environment: 102,
  },
  {
    key: 3,
    name: 'HW 3 – Linked Lists',
    dueDate: 'Mar 10, 2026 11:59 PM',
    points: 30,
    submissions: 135,
    missing: 7,
    graded: 87,
    published: false,
    visible: true,
    mean: null,
    rubricCategories: [],
    environment: null,
  },
  {
    key: 4,
    name: 'HW 4 – Trees',
    dueDate: 'Mar 24, 2026 11:59 PM',
    points: 30,
    submissions: 128,
    missing: 14,
    graded: 12,
    published: false,
    visible: true,
    mean: null,
    rubricCategories: [
      { id: 4, name: 'Correctness' },
      { id: 5, name: 'Efficiency' },
      { id: 6, name: 'Style' },
    ],
    environment: 104,
  },
  {
    key: 5,
    name: 'HW 5 – Graphs',
    dueDate: 'Apr 7, 2026 11:59 PM',
    points: 35,
    submissions: 45,
    missing: 97,
    graded: 0,
    published: false,
    visible: false,
    mean: null,
    rubricCategories: [],
    environment: null,
  },
];

// ----- Rubric mock data -----

interface DemoRubricComment {
  id: number;
  text: string;
  pointDelta: number;
  explanation: string;
  instructionText: string;
  instances: number;
}

interface DemoRubricCategory {
  id: number;
  assignmentKey: number;
  name: string;
  maxPoints: number | null;
  helpText: string;
  applyOnce: boolean;
  comments: DemoRubricComment[];
}

let nextCategoryId = 100;
let nextCommentId = 1000;

const INITIAL_RUBRIC_CATEGORIES: DemoRubricCategory[] = [
  {
    id: 1,
    assignmentKey: 1,
    name: 'Correctness',
    maxPoints: null,
    helpText: 'Deduct points for logic errors.',
    applyOnce: false,
    comments: [
      {
        id: 101,
        text: 'Off-by-one error in loop condition',
        pointDelta: -2,
        explanation: 'The loop should iterate n-1 times, not n.',
        instructionText: '',
        instances: 14,
      },
      {
        id: 102,
        text: 'Infinite loop — missing update',
        pointDelta: -5,
        explanation: '',
        instructionText: '',
        instances: 3,
      },
      {
        id: 103,
        text: 'Correct logic — good job!',
        pointDelta: 0,
        explanation: '',
        instructionText: '',
        instances: 125,
      },
    ],
  },
  {
    id: 2,
    assignmentKey: 1,
    name: 'Style',
    maxPoints: 5,
    helpText: '',
    applyOnce: false,
    comments: [
      {
        id: 201,
        text: 'Missing docstring on function',
        pointDelta: -1,
        explanation: '',
        instructionText: 'Check all function definitions.',
        instances: 28,
      },
      {
        id: 202,
        text: 'Inconsistent indentation',
        pointDelta: -1,
        explanation: '',
        instructionText: '',
        instances: 12,
      },
    ],
  },
  {
    id: 3,
    assignmentKey: 2,
    name: 'Correctness',
    maxPoints: null,
    helpText: '',
    applyOnce: false,
    comments: [
      {
        id: 301,
        text: 'Base case missing',
        pointDelta: -5,
        explanation: '',
        instructionText: '',
        instances: 8,
      },
      {
        id: 302,
        text: 'Stack overflow — no termination',
        pointDelta: -10,
        explanation: '',
        instructionText: '',
        instances: 2,
      },
    ],
  },
  {
    id: 4,
    assignmentKey: 4,
    name: 'Correctness',
    maxPoints: null,
    helpText: '',
    applyOnce: false,
    comments: [
      {
        id: 401,
        text: 'Incorrect traversal order',
        pointDelta: -3,
        explanation: '',
        instructionText: '',
        instances: 5,
      },
    ],
  },
  {
    id: 5,
    assignmentKey: 4,
    name: 'Efficiency',
    maxPoints: 10,
    helpText: 'Evaluate time complexity.',
    applyOnce: false,
    comments: [
      {
        id: 501,
        text: 'O(n²) when O(n log n) is possible',
        pointDelta: -4,
        explanation: '',
        instructionText: '',
        instances: 9,
      },
    ],
  },
  {
    id: 6,
    assignmentKey: 4,
    name: 'Style',
    maxPoints: 5,
    helpText: '',
    applyOnce: true,
    comments: [],
  },
];

// ----- Environment/Tests mock data -----

interface DemoTestCase {
  id: number;
  name: string;
  points: number;
  description: string;
}

interface DemoTestCategory {
  id: number;
  assignmentKey: number;
  name: string;
  maxPoints: number;
  testCases: DemoTestCase[];
}

let nextTestCatId = 200;

const INITIAL_TEST_CATEGORIES: DemoTestCategory[] = [
  {
    id: 10,
    assignmentKey: 1,
    name: 'Unit Tests',
    maxPoints: 15,
    testCases: [
      { id: 2001, name: 'test_basic_loop', points: 5, description: 'Tests basic for-loop iteration' },
      { id: 2002, name: 'test_nested_loop', points: 5, description: 'Tests nested loop correctness' },
      { id: 2003, name: 'test_edge_case', points: 5, description: 'Tests empty input handling' },
    ],
  },
  {
    id: 11,
    assignmentKey: 1,
    name: 'Style Checks',
    maxPoints: 5,
    testCases: [
      { id: 2004, name: 'test_pep8', points: 3, description: 'PEP 8 compliance check' },
      { id: 2005, name: 'test_docstrings', points: 2, description: 'Docstring presence check' },
    ],
  },
  {
    id: 12,
    assignmentKey: 2,
    name: 'Recursion Tests',
    maxPoints: 20,
    testCases: [
      { id: 2006, name: 'test_factorial', points: 5, description: 'Factorial correctness' },
      { id: 2007, name: 'test_fibonacci', points: 5, description: 'Fibonacci correctness' },
      { id: 2008, name: 'test_stack_depth', points: 10, description: 'Stack depth within limits' },
    ],
  },
  {
    id: 13,
    assignmentKey: 4,
    name: 'Tree Tests',
    maxPoints: 20,
    testCases: [
      { id: 2009, name: 'test_insert', points: 5, description: 'BST insert correctness' },
      { id: 2010, name: 'test_traversal', points: 10, description: 'In-order traversal' },
      { id: 2011, name: 'test_balance', points: 5, description: 'Tree balancing check' },
    ],
  },
];

// ----- Roster/submission mock data -----

const STUDENTS = [
  { key: 1, email: 'alice@university.edu', section: 'Section 01', active: true },
  { key: 2, email: 'bob@university.edu', section: 'Section 01', active: true },
  { key: 3, email: 'carol@university.edu', section: 'Section 02', active: true },
  { key: 4, email: 'david@university.edu', section: 'Section 02', active: true },
  { key: 5, email: 'eve@university.edu', section: 'Section 01', active: true },
  { key: 6, email: 'frank@university.edu', section: 'Section 03', active: true },
  { key: 7, email: 'grace@university.edu', section: 'Section 03', active: true },
  { key: 8, email: 'henry@university.edu', section: 'Section 02', active: true },
  { key: 9, email: 'inactive1@university.edu', section: 'Section 01', active: false },
];

const GRADERS = [
  { key: 1, email: 'grader1@university.edu', active: true },
  { key: 2, email: 'grader2@university.edu', active: true },
  { key: 3, email: 'grader3@university.edu', active: true },
  { key: 4, email: 'grader4@university.edu', active: true },
];

const ADMINS = [
  { key: 1, email: 'instructor@university.edu' },
  { key: 2, email: 'ta-lead@university.edu' },
];

const SECTIONS = [
  {
    key: 1,
    name: 'Section 01',
    leader: 'grader1@university.edu',
    students: ['alice@university.edu', 'bob@university.edu', 'eve@university.edu'],
  },
  {
    key: 2,
    name: 'Section 02',
    leader: 'grader2@university.edu',
    students: ['carol@university.edu', 'david@university.edu', 'henry@university.edu'],
  },
  {
    key: 3,
    name: 'Section 03',
    leader: 'grader3@university.edu',
    students: ['frank@university.edu', 'grace@university.edu'],
  },
];

const SUBMISSIONS_BY_STUDENT = [
  { key: 1, student: 'alice@university.edu', hw1: '19/20', hw2: '23/25', hw3: '28/30', hw4: '--', hw5: '--' },
  { key: 2, student: 'bob@university.edu', hw1: '17/20', hw2: '20/25', hw3: 'Unfinalized', hw4: '--', hw5: '--' },
  { key: 3, student: 'carol@university.edu', hw1: '15/20', hw2: '--', hw3: '25/30', hw4: '--', hw5: '--' },
  { key: 4, student: 'david@university.edu', hw1: '20/20', hw2: '24/25', hw3: '27/30', hw4: '--', hw5: '--' },
  { key: 5, student: 'eve@university.edu', hw1: '18/20', hw2: '21/25', hw3: '--', hw4: '--', hw5: '--' },
  { key: 6, student: 'frank@university.edu', hw1: '14/20', hw2: '19/25', hw3: '25/30', hw4: '--', hw5: '--' },
  { key: 7, student: 'grace@university.edu', hw1: '20/20', hw2: '24/25', hw3: '29/30', hw4: '--', hw5: '--' },
  { key: 8, student: 'henry@university.edu', hw1: '16/20', hw2: '20/25', hw3: '--', hw4: '--', hw5: '--' },
];

const REAL_ASSIGNMENTS = ASSIGNMENTS.map((a, i) => ({
  id: a.key,
  name: a.name,
  points: a.points,
  course: DEMO_CURRENT_COURSE.id,
  sortKey: i + 1,
})) as unknown as Assignment[];

const ACTIVE_STUDENT_EMAILS = STUDENTS.filter((s) => s.active).map((s) => s.email);
const INACTIVE_STUDENT_EMAILS = STUDENTS.filter((s) => !s.active).map((s) => s.email);
const ACTIVE_GRADER_EMAILS = GRADERS.filter((g) => g.active).map((g) => g.email);

const DEMO_SUBMISSIONS = (() => {
  const byStudent: IStudentSubmissionsDataTable = {};
  const byAssignment: IAssignmentToSubmissionsMap = {};
  const byGrader: IGraderSubmissionsDataTable = {};
  const viewsBySubmission: { [submissionID: number]: { [student: string]: string } } = {};

  ACTIVE_STUDENT_EMAILS.concat(INACTIVE_STUDENT_EMAILS).forEach((s) => {
    byStudent[s] = {};
  });
  ACTIVE_GRADER_EMAILS.forEach((g) => {
    byGrader[g] = {};
  });

  let nextSubId = 1000;
  SUBMISSIONS_BY_STUDENT.forEach((row) => {
    REAL_ASSIGNMENTS.forEach((assignment, idx) => {
      const score = row[`hw${idx + 1}` as keyof typeof row];
      if (score === '--' || score === undefined) return;
      const isFinalized = score !== 'Unfinalized';
      const parsedGrade = isFinalized ? Number(String(score).split('/')[0]) : undefined;
      const grader = ACTIVE_GRADER_EMAILS[(nextSubId - 1000) % ACTIVE_GRADER_EMAILS.length];
      const submission = {
        id: nextSubId,
        assignment: assignment.id,
        students: [row.student],
        grader,
        isFinalized,
        grade: parsedGrade,
        dateUploaded: '2026-03-10T17:00:00Z',
      } as unknown as SubmissionInfoType;
      byStudent[row.student][assignment.id] = submission;
      if (!byAssignment[assignment.id]) byAssignment[assignment.id] = [];
      byAssignment[assignment.id].push(submission);
      if (!byGrader[grader][assignment.id]) byGrader[grader][assignment.id] = [];
      byGrader[grader][assignment.id].push(submission);
      viewsBySubmission[nextSubId] = { [row.student]: '2026-03-12T10:15:00Z' };
      nextSubId += 1;
    });
  });
  return { byStudent, byAssignment, byGrader, viewsBySubmission };
})();

const noopDeleteSubmission = async (_s: SubmissionInfoType) => {};
const noopChangeGrader = async (_s: SubmissionInfoType, _g: string | undefined) => {};
const noopUpload = async (_a: Assignment, _p: string[], _f: UploadFile[]): Promise<SubmissionInfoType> =>
  ({}) as SubmissionInfoType;
const noopAddFiles = async (_s: SubmissionInfoType, _f: UploadFile[]): Promise<SubmissionInfoType> =>
  ({}) as SubmissionInfoType;

// ===========================================================================
// Panels
// ===========================================================================

// ---------------------------------------------------------------------------
// Assignments Overview
// ---------------------------------------------------------------------------

const AssignmentsPanel: React.FC<{ onEditRubric: (k: number) => void; onEditEnv: (k: number) => void }> = ({
  onEditRubric,
  onEditEnv,
}) => {
  const columns = [
    {
      title: 'Assignment',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (name: string, r: DemoAssignment) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong style={{ fontSize: 16 }}>
              <a>{name}</a>
            </Text>
            {!r.visible && <EyeInvisibleOutlined style={{ color: '#999' }} />}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Due {r.dueDate}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 230,
      render: (_: unknown, r: DemoAssignment) => {
        const pct = r.submissions > 0 ? Math.round((r.graded / r.submissions) * 100) : 0;
        let status: 'success' | 'warning' | 'default' = 'default';
        let text = 'Not Started';
        if (pct === 100 && r.published) {
          status = 'success';
          text = 'Released';
        } else if (pct === 100) {
          status = 'success';
          text = 'Fully Graded';
        } else if (r.graded > 0) {
          status = 'warning';
          text = 'In Progress';
        }
        return (
          <Popover
            content={
              <div style={{ width: 200 }}>
                <div style={{ marginBottom: 8 }}>
                  Visible to Students <Switch size="small" checked={r.visible} style={{ marginLeft: 8 }} />
                </div>
                <div>
                  Published <Switch size="small" checked={r.published} style={{ marginLeft: 8 }} />
                </div>
              </div>
            }
            trigger="click"
          >
            <Badge status={status} text={<a>{text}</a>} />
          </Popover>
        );
      },
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 350,
      render: (_: unknown, r: DemoAssignment) => {
        const pct = r.submissions > 0 ? Math.round((r.graded / r.submissions) * 100) : 0;
        return (
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <a>{r.submissions} Submissions</a> | <a>{r.missing} Missing</a> | <a>{pct}% Graded</a>
            </Text>
            <Progress
              percent={pct}
              showInfo={false}
              strokeColor={brandColors.primary}
              trailColor={brandColors.light}
              size="small"
            />
          </div>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      align: 'right' as const,
      width: 250,
      render: (_: unknown, r: DemoAssignment) => (
        <Space size={4}>
          <Tooltip title="Configure assignment">
            <Button shape="circle" icon={<SettingOutlined />} />
          </Tooltip>
          <Tooltip title="Edit rubric">
            <Button shape="circle" icon={<OrderedListOutlined />} onClick={() => onEditRubric(r.key)} />
          </Tooltip>
          <Tooltip title="Environment & Tests">
            <Button shape="circle" icon={<FileDoneOutlined />} onClick={() => onEditEnv(r.key)} />
          </Tooltip>
          <Tooltip title="Manage submissions">
            <Button shape="circle" icon={<UploadOutlined />} />
          </Tooltip>
          <Tooltip title={r.published ? 'Unrelease feedback' : 'Release feedback'}>
            <Button
              shape="circle"
              icon={r.published ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              danger={r.published}
            />
          </Tooltip>
          <Tooltip title="Analyze grades & stats">
            <Button shape="circle" icon={<BarChartOutlined />} />
          </Tooltip>
          <Tooltip title="Delete assignment">
            <Button shape="circle" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <CPAdminDetail
      goBack={null}
      title="Assignments"
      actions={[
        <CPButton key="new" cpType="primary" icon={<PlusCircleOutlined />}>
          New Assignment
        </CPButton>,
        <CPButton key="download" cpType="secondary" icon={<DownloadOutlined />}>
          Download grades
        </CPButton>,
      ]}
      content={<Table columns={columns} dataSource={ASSIGNMENTS} pagination={false} size="middle" rowKey="key" />}
      breadcrumbs={<Breadcrumb items={[{ title: 'Assignments' }, { title: 'Overview' }]} />}
    />
  );
};

// ---------------------------------------------------------------------------
// Rubric Overview (list of assignments → click Edit/Create)
// ---------------------------------------------------------------------------

const RubricsOverviewPanel: React.FC<{ onEdit: (k: number) => void }> = ({ onEdit }) => {
  const columns = [
    { title: 'Assignment', key: 'assignment', dataIndex: 'name' },
    {
      title: 'Edit',
      key: 'edit',
      align: 'center' as const,
      render: (_: unknown, r: DemoAssignment) => (
        <Button type={r.rubricCategories.length > 0 ? 'default' : 'primary'} onClick={() => onEdit(r.key)}>
          {r.rubricCategories.length > 0 ? 'Edit' : 'Create'}
        </Button>
      ),
    },
  ];
  return (
    <CPAdminDetail
      goBack={null}
      title="Rubrics"
      actions={[]}
      content={<Table columns={columns} dataSource={ASSIGNMENTS} pagination={false} size="middle" rowKey="key" />}
      breadcrumbs={<Breadcrumb items={[{ title: 'Assignments' }, { title: 'Rubrics' }]} />}
    />
  );
};

// ---------------------------------------------------------------------------
// Interactive Rubric Editor (matches RubricUI + RubricCategoryUI)
// ---------------------------------------------------------------------------

const RubricEditorPanel: React.FC<{
  assignmentKey: number;
  categories: DemoRubricCategory[];
  onUpdate: (cats: DemoRubricCategory[]) => void;
  onBack: () => void;
}> = ({ assignmentKey, categories, onUpdate, onBack }) => {
  const myCats = categories.filter((c) => c.assignmentKey === assignmentKey);
  const [activeCatId, setActiveCatId] = useState<number | undefined>(myCats[0]?.id);
  const [showSettings, setShowSettings] = useState(false);
  const [showPointLimits, setShowPointLimits] = useState(true);
  const [showHelpText, setShowHelpText] = useState(true);

  const activeCat = myCats.find((c) => c.id === activeCatId);
  const assignmentName = ASSIGNMENTS.find((a) => a.key === assignmentKey)?.name ?? 'Assignment';

  const updateCat = useCallback(
    (catId: number, patch: Partial<DemoRubricCategory>) => {
      onUpdate(categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)));
    },
    [categories, onUpdate],
  );

  const addCategory = () => {
    const id = ++nextCategoryId;
    const newCat: DemoRubricCategory = {
      id,
      assignmentKey,
      name: '',
      maxPoints: null,
      helpText: '',
      applyOnce: false,
      comments: [],
    };
    onUpdate([...categories, newCat]);
    setActiveCatId(id);
  };

  const deleteCategory = (catId: number) => {
    onUpdate(categories.filter((c) => c.id !== catId));
    if (activeCatId === catId) setActiveCatId(myCats.find((c) => c.id !== catId)?.id);
  };

  const moveCategory = (catId: number, dir: -1 | 1) => {
    const idx = categories.findIndex((c) => c.id === catId);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= categories.length) return;
    const copy = [...categories];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onUpdate(copy);
  };

  const addComment = (catId: number) => {
    const id = ++nextCommentId;
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const newComment: DemoRubricComment = {
      id,
      text: '',
      pointDelta: 0,
      explanation: '',
      instructionText: '',
      instances: 0,
    };
    updateCat(catId, { comments: [...cat.comments, newComment] });
  };

  const deleteComment = (catId: number, commentId: number) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    updateCat(catId, { comments: cat.comments.filter((c) => c.id !== commentId) });
  };

  const updateComment = (catId: number, commentId: number, patch: Partial<DemoRubricComment>) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    updateCat(catId, { comments: cat.comments.map((c) => (c.id === commentId ? { ...c, ...patch } : c)) });
  };

  // Sidebar (matches RubricSideBar.module.css structure)
  const sidebar = (
    <div
      style={{
        width: 280,
        background: '#fafafa',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600, color: '#262626', fontSize: 14 }}>Categories</span>
        <Tooltip title="Add new category">
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addCategory} />
        </Tooltip>
      </div>
      <ul style={{ flex: 1, overflowY: 'auto', padding: 8, listStyle: 'none', margin: 0 }}>
        {myCats.map((cat, index) => {
          const isActive = cat.id === activeCatId;
          return (
            <li
              key={cat.id}
              onClick={() => setActiveCatId(cat.id)}
              style={{
                padding: '10px 12px',
                marginBottom: 4,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: isActive ? '#1890ff' : '#595959',
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                background: isActive ? '#e6f7ff' : 'transparent',
              }}
            >
              <div
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginRight: 8,
                }}
              >
                {cat.name || <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Untitled</span>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Tooltip title="Move Up">
                  <Button
                    type="text"
                    size="small"
                    icon={<CaretUpOutlined style={{ fontSize: 10 }} />}
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCategory(cat.id, -1);
                    }}
                  />
                </Tooltip>
                <Tooltip title="Move Down">
                  <Button
                    type="text"
                    size="small"
                    icon={<CaretDownOutlined style={{ fontSize: 10 }} />}
                    disabled={index === myCats.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveCategory(cat.id, 1);
                    }}
                  />
                </Tooltip>
                <Popconfirm
                  title="Delete category?"
                  onConfirm={() => deleteCategory(cat.id)}
                  okText="Yes"
                  cancelText="No"
                  placement="right"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </div>
            </li>
          );
        })}
        {myCats.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>No categories yet</div>
        )}
      </ul>
    </div>
  );

  // Category editor (matches RubricCategoryUI structure)
  const categoryEditor = activeCat ? (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#fff' }}>
      {/* Header: Category Name */}
      <div style={{ padding: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Input
            value={activeCat.name}
            onChange={(e) => updateCat(activeCat.id, { name: e.target.value })}
            placeholder="Category Name"
            size="large"
            variant="borderless"
            style={{ fontSize: 18, fontWeight: 600, padding: 0 }}
          />
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {/* Settings Bar */}
        {(showPointLimits || showHelpText) && (
          <div
            style={{
              marginBottom: 24,
              padding: '20px 24px',
              background: '#f9f9f9',
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
          >
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              {showPointLimits && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>Max Points</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <InputNumber
                        value={activeCat.maxPoints ?? undefined}
                        onChange={(v) => updateCat(activeCat.id, { maxPoints: v ?? null })}
                        placeholder="—"
                        style={{ width: 80 }}
                      />
                      {activeCat.maxPoints !== null && (
                        <Button
                          type="text"
                          icon={<CloseCircleOutlined />}
                          onClick={() => updateCat(activeCat.id, { maxPoints: null })}
                          style={{ color: '#bfbfbf' }}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>Limits</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Switch
                        size="small"
                        checked={activeCat.applyOnce}
                        onChange={(v) => updateCat(activeCat.id, { applyOnce: v })}
                      />
                      <span style={{ fontSize: 13, color: '#595959' }}>Apply at most once</span>
                    </div>
                  </div>
                </div>
              )}
              {showHelpText && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>Help Text</span>
                  <TextArea
                    value={activeCat.helpText}
                    onChange={(e) => updateCat(activeCat.id, { helpText: e.target.value })}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    placeholder="Enter instructions or guidance for graders using this category..."
                    style={{ resize: 'none', fontSize: 14, borderRadius: 6, padding: '8px 12px' }}
                  />
                </div>
              )}
            </Space>
          </div>
        )}

        {/* Comments section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#262626' }}>Comments</span>
              <Tag style={{ margin: 0, border: 'none', background: '#f5f5f5', color: '#595959' }}>
                {activeCat.comments.length}
              </Tag>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => addComment(activeCat.id)}>
              Add Criteria
            </Button>
          </div>

          <Divider style={{ margin: '24px 0' }} />

          <div style={{ marginTop: 8 }}>
            {activeCat.comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  background: '#fff',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 16,
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                }}
              >
                {/* Left: Content */}
                <div style={{ flex: 1 }}>
                  <TextArea
                    value={comment.text}
                    onChange={(e) => updateComment(activeCat.id, comment.id, { text: e.target.value })}
                    placeholder="Enter comment text..."
                    autoSize
                    variant="borderless"
                    style={{ width: '100%', padding: 0, fontSize: 14, color: '#262626', resize: 'none' }}
                  />
                  <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                    <Button
                      size="small"
                      type={comment.explanation ? 'link' : 'text'}
                      icon={!comment.explanation ? <EditOutlined style={{ fontSize: 10 }} /> : undefined}
                      style={{
                        padding: 0,
                        height: 'auto',
                        fontSize: 12,
                        color: comment.explanation ? '#1890ff' : '#8c8c8c',
                      }}
                    >
                      {comment.explanation ? 'Edit Explanation' : 'Add Explanation'}
                    </Button>
                    <Button
                      size="small"
                      type={comment.instructionText ? 'link' : 'text'}
                      icon={!comment.instructionText ? <EditOutlined style={{ fontSize: 10 }} /> : undefined}
                      style={{
                        padding: 0,
                        height: 'auto',
                        fontSize: 12,
                        color: comment.instructionText ? '#faad14' : '#8c8c8c',
                      }}
                    >
                      {comment.instructionText ? 'Edit Instructions' : 'Add Instructions'}
                    </Button>
                  </div>
                </div>

                {/* Right: Metadata & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#8c8c8c',
                      fontSize: 12,
                      gap: 4,
                      minWidth: 40,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <UserOutlined style={{ fontSize: 12 }} /> {comment.instances}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      minWidth: 60,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <DislikeOutlined /> 0%
                    </span>
                    <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LikeOutlined /> 0%
                    </span>
                  </div>
                  <InputNumber
                    value={comment.pointDelta}
                    onChange={(v) => updateComment(activeCat.id, comment.id, { pointDelta: v ?? 0 })}
                    size="small"
                    style={{ width: 80 }}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteComment(activeCat.id, comment.id)}
                    style={{ color: '#bfbfbf', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ff4d4f')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#bfbfbf')}
                  />
                </div>
              </div>
            ))}
            {activeCat.comments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#bfbfbf' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No criteria defined" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select or create a category to get started">
        <Button type="primary" onClick={addCategory}>
          Create Category
        </Button>
      </Empty>
    </div>
  );

  return (
    <CPAdminDetail
      goBack={null}
      title={`Rubric: ${assignmentName}`}
      actions={[
        <CPButton
          key="settings"
          cpType="secondary"
          icon={<SettingOutlined />}
          onClick={() => setShowSettings(!showSettings)}
        >
          Settings
        </CPButton>,
        <CPButton key="upload" cpType="secondary" icon={<UploadOutlined />}>
          Upload
        </CPButton>,
        <CPButton key="download" cpType="secondary" icon={<DownloadOutlined />}>
          Download
        </CPButton>,
        <CPButton key="undo" cpType="secondary" disabled icon={<UndoOutlined />}>
          Undo
        </CPButton>,
        <CPButton key="save" cpType="primary" icon={<SaveOutlined />}>
          Save
        </CPButton>,
      ]}
      content={
        <div>
          {showSettings && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space size={24}>
                <span>
                  <Switch size="small" checked={showPointLimits} onChange={setShowPointLimits} /> Point Limits
                </span>
                <span>
                  <Switch size="small" checked={showHelpText} onChange={setShowHelpText} /> Help Text
                </span>
              </Space>
            </Card>
          )}
          <div
            style={{
              display: 'flex',
              height: 'calc(100vh - 200px)',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {sidebar}
            {categoryEditor}
          </div>
        </div>
      }
      breadcrumbs={
        <Breadcrumb
          items={[
            { title: <a onClick={onBack}>Assignments</a> },
            { title: <a onClick={onBack}>Rubrics</a> },
            { title: assignmentName },
          ]}
        />
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Environment & Tests Overview (list → click Edit/Create)
// ---------------------------------------------------------------------------

const EnvironmentOverviewPanel: React.FC<{ onEdit: (k: number) => void }> = ({ onEdit }) => {
  const columns = [
    { title: 'Assignment', key: 'assignment', dataIndex: 'name' },
    {
      title: 'Edit Environment',
      key: 'edit',
      align: 'center' as const,
      render: (_: unknown, r: DemoAssignment) => (
        <Button type={r.environment ? 'default' : 'primary'} onClick={() => onEdit(r.key)}>
          {r.environment ? 'Edit' : 'Create'}
        </Button>
      ),
    },
  ];
  return (
    <CPAdminDetail
      goBack={null}
      title={<div className="display-flex align-items-center">Environment & Tests</div>}
      actions={[]}
      content={<Table columns={columns} dataSource={ASSIGNMENTS} pagination={false} size="middle" rowKey="key" />}
      breadcrumbs={<Breadcrumb items={[{ title: 'Assignments' }, { title: 'Environment & Tests' }]} />}
    />
  );
};

// ---------------------------------------------------------------------------
// Interactive Environment & Tests Editor (matches TestingSetup tabs)
// ---------------------------------------------------------------------------

const EnvironmentEditorPanel: React.FC<{
  assignmentKey: number;
  testCategories: DemoTestCategory[];
  onUpdateTests: (cats: DemoTestCategory[]) => void;
  onBack: () => void;
}> = ({ assignmentKey, testCategories, onUpdateTests, onBack }) => {
  const [currTab, setCurrTab] = useState('environment');
  const assignment = ASSIGNMENTS.find((a) => a.key === assignmentKey);
  const assignmentName = assignment?.name ?? 'Assignment';
  const hasEnv = assignment?.environment !== null;

  // Environment state
  const [configMode, setConfigMode] = useState<'auto' | 'manual'>('auto');
  const [strategy, setStrategy] = useState<'managed' | 'custom'>('managed');
  const [language, setLanguage] = useState('python');
  const [langVersion, setLangVersion] = useState('3.11');
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([
    { key: 'PYTHONDONTWRITEBYTECODE', value: '1' },
  ]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  // Test state
  const myTestCats = testCategories.filter((c) => c.assignmentKey === assignmentKey);
  const [activeTestCatId, setActiveTestCatId] = useState<number | undefined>(myTestCats[0]?.id);
  const activeTestCat = myTestCats.find((c) => c.id === activeTestCatId);

  const addTestCategory = () => {
    const id = ++nextTestCatId;
    const newCat: DemoTestCategory = { id, assignmentKey, name: 'New Category', maxPoints: 10, testCases: [] };
    onUpdateTests([...testCategories, newCat]);
    setActiveTestCatId(id);
  };

  const deleteTestCategory = (catId: number) => {
    onUpdateTests(testCategories.filter((c) => c.id !== catId));
    if (activeTestCatId === catId) setActiveTestCatId(myTestCats.find((c) => c.id !== catId)?.id);
  };

  const updateTestCategory = (catId: number, patch: Partial<DemoTestCategory>) => {
    onUpdateTests(testCategories.map((c) => (c.id === catId ? { ...c, ...patch } : c)));
  };

  // Environment tab (matches EnvironmentSpecs layout)
  const environmentTab = (
    <div style={{ padding: 20, backgroundColor: '#f0f2f5', minHeight: '100%' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Typography.Title level={4} style={{ marginBottom: 5 }}>
            Environment Configuration
          </Typography.Title>
          <Space>
            Status:{' '}
            {hasEnv ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Build Successful
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="default">
                Not Configured
              </Tag>
            )}
          </Space>
        </div>
        <Space>
          <Button type="default" size="large" icon={<BuildOutlined />}>
            Build Logs
          </Button>
          <Button icon={<EyeOutlined />} size="large">
            Preview
          </Button>
          <Button type="default" size="large">
            Save Changes
          </Button>
          <Button type="primary" size="large">
            {hasEnv ? 'Update & Build' : 'Create & Build'}
          </Button>
        </Space>
      </div>

      {/* Main Configuration Card */}
      <Card variant="borderless" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ marginRight: 15, fontWeight: 600, fontSize: 16 }}>Mode:</span>
          <Radio.Group value={configMode} onChange={(e) => setConfigMode(e.target.value)} buttonStyle="solid">
            <Radio.Button value="auto">Auto-Detect</Radio.Button>
            <Radio.Button value="manual">Manual Configuration</Radio.Button>
          </Radio.Group>
          {configMode === 'auto' && (
            <Tag color="blue" style={{ marginLeft: 15 }}>
              Recommended
            </Tag>
          )}
        </div>

        {configMode === 'auto' ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <Empty
              image={<RobotOutlined style={{ fontSize: 48, color: brandColors.primary }} />}
              description={
                <div>
                  <Typography.Title level={4}>Auto-Detect Enabled</Typography.Title>
                  <Typography.Text type="secondary">
                    We will automatically detect the language and dependencies from student submissions.
                  </Typography.Text>
                </div>
              }
            />
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {/* Strategy */}
            <div style={{ marginBottom: 20 }}>
              <Typography.Title level={5}>1. Environment Strategy</Typography.Title>
              <Radio.Group value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                <Radio.Button value="managed" style={{ width: 150, textAlign: 'center' }}>
                  Managed
                </Radio.Button>
                <Radio.Button value="custom" style={{ width: 150, textAlign: 'center' }}>
                  Custom Dockerfile
                </Radio.Button>
              </Radio.Group>
              <div style={{ marginTop: 8 }}>
                {strategy === 'managed' ? (
                  <Typography.Text type="secondary">
                    Pre-built environments for common languages. Easy to configure.
                  </Typography.Text>
                ) : (
                  <Typography.Text type="secondary">Full control via Dockerfile. For advanced users.</Typography.Text>
                )}
              </div>
            </div>

            {strategy === 'managed' ? (
              <div style={{ marginTop: 20 }}>
                {/* Language selector */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                  <Select
                    placeholder="Select Language"
                    value={language}
                    onChange={setLanguage}
                    style={{ width: 200 }}
                    size="large"
                    options={[
                      { value: 'python', label: 'Python' },
                      { value: 'java', label: 'Java' },
                      { value: 'c', label: 'C / C++' },
                      { value: 'javascript', label: 'JavaScript' },
                      { value: 'ocaml', label: 'OCaml' },
                      { value: 'racket', label: 'Racket' },
                    ]}
                  />
                  <Select
                    placeholder="Version"
                    value={langVersion}
                    onChange={setLangVersion}
                    style={{ width: 150 }}
                    size="large"
                    options={
                      language === 'python'
                        ? [
                            { value: '3.12', label: '3.12' },
                            { value: '3.11', label: '3.11' },
                            { value: '3.10', label: '3.10' },
                          ]
                        : language === 'java'
                          ? [
                              { value: '21', label: '21' },
                              { value: '17', label: '17' },
                              { value: '11', label: '11' },
                            ]
                          : [{ value: 'latest', label: 'Latest' }]
                    }
                  />
                  <Button icon={<SearchOutlined />} size="large">
                    Scan for Manifests
                  </Button>
                </div>

                <Typography.Title level={5}>2. Configuration</Typography.Title>
                <Tabs
                  type="card"
                  items={[
                    {
                      key: '1',
                      label: language === 'python' ? 'requirements.txt' : 'Project Manifest',
                      children: (
                        <div>
                          <Alert
                            message={
                              language === 'python'
                                ? 'Add Python packages (one per line) to be installed via pip.'
                                : 'Add project dependencies.'
                            }
                            type="info"
                            showIcon
                            style={{ marginBottom: 10 }}
                          />
                          <div
                            style={{
                              height: 250,
                              border: '1px solid #d9d9d9',
                              borderRadius: 4,
                              background: '#1e1e1e',
                              padding: 10,
                              fontFamily: 'monospace',
                              fontSize: 13,
                              color: '#d4d4d4',
                            }}
                          >
                            {language === 'python' ? 'pytest\nnumpy' : '# Dependencies here...'}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: '2',
                      label: 'System Packages',
                      children: (
                        <div>
                          <Alert
                            message="Install system-level packages (e.g. via apt-get or apk)."
                            type="info"
                            showIcon
                            style={{ marginBottom: 10 }}
                          />
                          <div
                            style={{
                              height: 250,
                              border: '1px solid #d9d9d9',
                              borderRadius: 4,
                              background: '#1e1e1e',
                              padding: 10,
                              fontFamily: 'monospace',
                              fontSize: 13,
                              color: '#d4d4d4',
                            }}
                          >
                            # System packages here...
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: '4',
                      label: 'Environment Variables',
                      children: (
                        <div style={{ padding: 10 }}>
                          {envVars.map((ev, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                              <Input value={ev.key} disabled style={{ width: '30%' }} />
                              <Input
                                value={ev.value}
                                onChange={(e) => {
                                  const copy = [...envVars];
                                  copy[i] = { ...copy[i], value: e.target.value };
                                  setEnvVars(copy);
                                }}
                                style={{ flex: 1 }}
                                placeholder="Value"
                              />
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => setEnvVars(envVars.filter((_, j) => j !== i))}
                              />
                            </div>
                          ))}
                          <div
                            style={{
                              display: 'flex',
                              marginTop: 15,
                              gap: 10,
                              alignItems: 'center',
                              borderTop: '1px solid #eee',
                              paddingTop: 15,
                            }}
                          >
                            <Input
                              placeholder="NEW_VAR_NAME"
                              value={newEnvKey}
                              onChange={(e) => setNewEnvKey(e.target.value)}
                              style={{ width: '30%' }}
                            />
                            <Input
                              placeholder="Value"
                              value={newEnvVal}
                              onChange={(e) => setNewEnvVal(e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="primary"
                              disabled={!newEnvKey.trim()}
                              onClick={() => {
                                setEnvVars([...envVars, { key: newEnvKey.trim(), value: newEnvVal }]);
                                setNewEnvKey('');
                                setNewEnvVal('');
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            ) : (
              <div style={{ marginTop: 20 }}>
                <div style={{ marginBottom: 20 }}>
                  <Typography.Text strong>Base Image Logic: </Typography.Text>
                  <Radio.Group defaultValue="ubuntu">
                    <Radio value="ubuntu">Ubuntu 18.04 (apt-get)</Radio>
                    <Radio value="alpine">Alpine Linux (apk)</Radio>
                  </Radio.Group>
                </div>
                <Alert
                  message="You are in Custom Mode. The detected overrides will be appended to the Ubuntu base image."
                  type="info"
                  showIcon
                  style={{ marginBottom: 15 }}
                />
                <Typography.Title level={5}>Additional Dockerfile Commands</Typography.Title>
                <div
                  style={{
                    height: 300,
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    background: '#1e1e1e',
                    padding: 10,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: '#d4d4d4',
                  }}
                >
                  {'# Custom Dockerfile\nFROM ubuntu:22.04\nRUN apt-get update && apt-get install -y python3'}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );

  // Tests tab — sidebar + editor (matches TestManager + TestCategoryUI)
  const testsTab = (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 200px)',
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Sidebar (250px, matches TestManager) */}
      <div
        style={{
          width: 250,
          borderRight: '1px solid #f0f0f0',
          background: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '10px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <span style={{ fontWeight: 600 }}>Test Categories</span>
          <Tooltip title="Add new category">
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addTestCategory} />
          </Tooltip>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', height: '100%' }}>
          {myTestCats.map((cat) => {
            const isActive = cat.id === activeTestCatId;
            return (
              <li
                key={cat.id}
                onClick={() => setActiveTestCatId(cat.id)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  background: isActive ? '#e6f7ff' : 'transparent',
                  borderRight: isActive ? '3px solid #1890ff' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.name || <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Untitled</span>}
                </div>
                {isActive && (
                  <Popconfirm
                    title="Delete category?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      deleteTestCategory(cat.id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                    placement="right"
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                )}
              </li>
            );
          })}
          {myTestCats.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>No categories yet</div>
          )}
        </ul>
      </div>

      {/* Editor (matches TestCategoryUI) */}
      {activeTestCat ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header / Settings */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Space>
                <div>
                  <Space orientation="vertical" size={0}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Category Name
                    </Typography.Text>
                    <Input
                      value={activeTestCat.name}
                      onChange={(e) => updateTestCategory(activeTestCat.id, { name: e.target.value })}
                      style={{ width: 250, display: 'block' }}
                    />
                  </Space>
                </div>
                <div>
                  <Space orientation="vertical" size={0}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Target File
                    </Typography.Text>
                    <Select
                      style={{ width: 250 }}
                      placeholder="Select file to test"
                      allowClear
                      options={[
                        { value: 'solution.py', label: 'solution.py' },
                        { value: 'test_main.py', label: 'test_main.py' },
                        { value: 'helpers.py', label: 'helpers.py' },
                      ]}
                    />
                  </Space>
                </div>
                <div>
                  <Space orientation="vertical" size={0}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Max Points
                    </Typography.Text>
                    <InputNumber
                      value={activeTestCat.maxPoints}
                      onChange={(v) => updateTestCategory(activeTestCat.id, { maxPoints: v ?? 0 })}
                      style={{ width: 80, display: 'block' }}
                      disabled
                      title="Calculated from @test(points=...) in script"
                    />
                  </Space>
                </div>
              </Space>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px 10px 20px' }}>
              <Button type="primary" icon={<SaveOutlined />}>
                Save Changes
              </Button>
            </div>

            <Divider style={{ margin: '10px 0' }} />

            {/* Script Editor placeholder */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography.Text strong style={{ marginBottom: 10 }}>
                Test Script
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginBottom: 10 }}>
                Write a Python script. Use <code>{'@test(name="Name", points=5)'}</code> to define tests.
              </Typography.Text>
              <div
                style={{
                  flex: 1,
                  minHeight: 300,
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  background: '#1e1e1e',
                  padding: 10,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: '#d4d4d4',
                  whiteSpace: 'pre',
                  overflow: 'auto',
                }}
              >
                {`
@test(name="Test addition", points=5)
def test_addition():
    assert add(2, 3) == 5

@test(name="Test subtraction", points=5)
def test_subtraction():
    assert subtract(5, 3) == 2`}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Select or create a test category"
            style={{ marginTop: 100 }}
          >
            <Button type="primary" onClick={addTestCategory}>
              Create Category
            </Button>
          </Empty>
        </div>
      )}
    </div>
  );

  // Settings tab (matches TestingSetup settings)
  const settingsTab = (
    <div style={{ padding: '24px 32px', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={4} style={{ marginBottom: 8 }}>
          Student Submit
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Control how test results are displayed to students when they submit.
        </Typography.Text>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Typography.Text>
          Settings for assignments are located in the Grading tab inside Assignment settings. There you can set how
          tests behave based on the assignment.
        </Typography.Text>
      </div>
    </div>
  );

  return (
    <CPAdminDetail
      goBack={null}
      title={`${assignmentName} | Environment & Tests`}
      actions={[
        <Button key="results" type="primary">
          View Results
        </Button>,
      ]}
      content={
        <Tabs
          activeKey={currTab}
          onChange={setCurrTab}
          items={[
            { key: 'environment', label: 'Environment', children: environmentTab },
            { key: 'tests', label: 'Tests', children: testsTab },
            { key: 'settings', label: 'Settings', children: settingsTab },
          ]}
        />
      }
      breadcrumbs={
        <Breadcrumb
          items={[
            { title: <a onClick={onBack}>Assignments</a> },
            { title: <a onClick={onBack}>Environment & Tests</a> },
            { title: assignmentName },
          ]}
        />
      }
    />
  );
};

// ---------------------------------------------------------------------------
// Submissions by Student
// ---------------------------------------------------------------------------

const SubmissionsByStudentPanel: React.FC = () => (
  <StudentSubmissionsTable
    loadComplete={true}
    course={DEMO_CURRENT_COURSE}
    assignments={REAL_ASSIGNMENTS}
    submissionsByStudent={DEMO_SUBMISSIONS.byStudent}
    students={ACTIVE_STUDENT_EMAILS}
    inactiveStudents={INACTIVE_STUDENT_EMAILS}
    viewsBySubmission={DEMO_SUBMISSIONS.viewsBySubmission}
    deleteSubmission={noopDeleteSubmission}
    graders={ACTIVE_GRADER_EMAILS}
    changeSubmissionGrader={noopChangeGrader}
    uploadSubmission={noopUpload}
    addFilesToSubmission={noopAddFiles}
    baseURL={`${CODE_DEMO}/admin/submissions`}
    courseURL={`${CODE_DEMO}/admin`}
  />
);

// ---------------------------------------------------------------------------
// Submissions by Grader
// ---------------------------------------------------------------------------

const SubmissionsByGraderPanel: React.FC = () => (
  <GraderSubmissionsTable
    loadComplete={true}
    baseURL={`${CODE_DEMO}/admin/submissions`}
    courseURL={`${CODE_DEMO}/admin`}
    assignments={REAL_ASSIGNMENTS}
    submissionsByAssignment={DEMO_SUBMISSIONS.byAssignment}
    submissionsByGrader={DEMO_SUBMISSIONS.byGrader}
    graders={ACTIVE_GRADER_EMAILS}
    inactiveGraders={[]}
    viewsBySubmission={DEMO_SUBMISSIONS.viewsBySubmission}
    deleteSubmission={noopDeleteSubmission}
  />
);

// ---------------------------------------------------------------------------
// Roster panels
// ---------------------------------------------------------------------------

const RosterStudentsPanel: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = STUDENTS.filter((s) => s.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <CPAdminDetail
      goBack={null}
      title="Students"
      actions={[
        <CPButton key="invite" cpType="secondary">
          Send invites
        </CPButton>,
        <CPButton key="download" cpType="secondary">
          Download roster
        </CPButton>,
        <CPButton key="upload" cpType="secondary">
          Upload roster
        </CPButton>,
      ]}
      content={
        <div>
          <Input.Search
            placeholder="Search students..."
            style={{ width: 300, marginBottom: 16 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Table
            columns={[
              {
                title: 'Student',
                dataIndex: 'email',
                key: 'email',
                render: (email: string, r: (typeof STUDENTS)[0]) =>
                  r.active ? (
                    <Text strong>{email}</Text>
                  ) : (
                    <Text style={{ color: '#80808082' }}>
                      <DisconnectOutlined style={{ marginRight: 6 }} />
                      {email}
                    </Text>
                  ),
              },
              { title: 'Section', dataIndex: 'section', key: 'section', width: 180 },
              {
                title: '',
                key: 'actions',
                align: 'right' as const,
                width: 130,
                render: (_: unknown, r: (typeof STUDENTS)[0]) => (
                  <Space size={4}>
                    {!r.active && (
                      <Tooltip title="Send activation email">
                        <Button shape="circle" size="small" icon={<MailOutlined />} />
                      </Tooltip>
                    )}
                    <Tooltip title="View submissions">
                      <Button shape="circle" size="small" icon={<ProfileOutlined />} />
                    </Tooltip>
                    <Tooltip title="Remove student">
                      <Button shape="circle" size="small" icon={<UserDeleteOutlined />} />
                    </Tooltip>
                  </Space>
                ),
              },
            ]}
            dataSource={filtered}
            pagination={false}
            size="middle"
            rowKey="key"
          />
        </div>
      }
      breadcrumbs={<Breadcrumb items={[{ title: 'Roster' }, { title: 'Students' }]} />}
    />
  );
};

const RosterGradersPanel: React.FC = () => (
  <CPAdminDetail
    goBack={null}
    title="Graders"
    actions={[]}
    content={
      <Table
        columns={[
          { title: 'Grader', dataIndex: 'email', key: 'email', render: (e: string) => <Text strong>{e}</Text> },
          {
            title: '',
            key: 'actions',
            align: 'right' as const,
            width: 130,
            render: () => (
              <Tooltip title="Remove grader">
                <Button shape="circle" size="small" icon={<UserDeleteOutlined />} />
              </Tooltip>
            ),
          },
        ]}
        dataSource={GRADERS}
        pagination={false}
        size="middle"
        rowKey="key"
      />
    }
    breadcrumbs={<Breadcrumb items={[{ title: 'Roster' }, { title: 'Graders' }]} />}
  />
);

const RosterAdminsPanel: React.FC = () => (
  <CPAdminDetail
    goBack={null}
    title="Admins"
    actions={[]}
    content={
      <Table
        columns={[{ title: 'Admin', dataIndex: 'email', key: 'email', render: (e: string) => <Text strong>{e}</Text> }]}
        dataSource={ADMINS}
        pagination={false}
        size="middle"
        rowKey="key"
      />
    }
    breadcrumbs={<Breadcrumb items={[{ title: 'Roster' }, { title: 'Admins' }]} />}
  />
);

const RosterSectionsPanel: React.FC = () => (
  <CPAdminDetail
    goBack={null}
    title="Sections"
    actions={[
      <CPButton key="add" cpType="primary" icon={<PlusCircleOutlined />}>
        Add Section
      </CPButton>,
    ]}
    content={
      <Table
        columns={[
          { title: 'Section', dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
          { title: 'Leader', dataIndex: 'leader', key: 'leader' },
          {
            title: 'Students',
            key: 'count',
            width: 100,
            render: (_: unknown, r: (typeof SECTIONS)[0]) => <Tag>{r.students.length}</Tag>,
          },
          {
            title: '',
            key: 'actions',
            align: 'right' as const,
            width: 130,
            render: () => (
              <Space size={4}>
                <Tooltip title="Edit section">
                  <Button shape="circle" size="small" icon={<SettingOutlined />} />
                </Tooltip>
                <Tooltip title="Delete section">
                  <Button shape="circle" size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Space>
            ),
          },
        ]}
        dataSource={SECTIONS}
        pagination={false}
        size="middle"
        rowKey="key"
      />
    }
    breadcrumbs={<Breadcrumb items={[{ title: 'Roster' }, { title: 'Sections' }]} />}
  />
);

// ---------------------------------------------------------------------------
// Course settings panels
// ---------------------------------------------------------------------------

const SettingsPanel: React.FC = () => (
  <CPAdminDetail
    goBack={null}
    title="Settings: CS 201 – Data Structures | Spring 2026"
    actions={[
      <CPButton key="undo" cpType="secondary" disabled>
        Undo
      </CPButton>,
      <CPButton key="save" cpType="primary" disabled>
        Save changes
      </CPButton>,
    ]}
    content={
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <Card title="Course Identity" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="Course Name">
            <Input value="CS 201 – Data Structures" />
          </Form.Item>
          <Form.Item label="Course Period">
            <Input value="Spring 2026" />
          </Form.Item>
        </Card>
        {[
          { label: 'Show Statistics to Students', checked: true },
          { label: 'Send Released to Back of Queue', checked: false },
          { label: 'Email Users on Roster Add', checked: true },
          { label: 'Default to Anonymous Grading', checked: false },
        ].map((s) => (
          <Card key={s.label} size="small" style={{ background: '#fafafa', borderColor: '#f0f0f0', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{s.label}</Text>
              <Switch checked={s.checked} size="small" />
            </div>
          </Card>
        ))}
        <Card size="small" style={{ background: '#fafafa', borderColor: '#f0f0f0', marginBottom: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="danger">Archive Course</Text>
            <Switch checked={false} size="small" />
          </div>
        </Card>
        <Card title="Course Information" size="small" style={{ maxWidth: 800 }}>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Course ID">
              <code>42</code>
            </Descriptions.Item>
            <Descriptions.Item label="Expires">Dec 31, 2026</Descriptions.Item>
          </Descriptions>
        </Card>
      </Form>
    }
    breadcrumbs={<Breadcrumb items={[{ title: 'Course Settings' }, { title: 'General' }]} />}
  />
);

const WebhooksPanelDemo: React.FC = () => (
  <CPAdminDetail
    goBack={null}
    title="Webhooks: CS 201 – Data Structures | Spring 2026"
    actions={[]}
    content={
      <div>
        <Table
          columns={[
            { title: 'Enabled', dataIndex: 'enabled', key: 'enabled', width: 80 },
            { title: 'Object', dataIndex: 'object', key: 'object', render: (o: string) => <Tag>{o}</Tag> },
            { title: 'Action', dataIndex: 'action', key: 'action' },
            { title: 'Target', dataIndex: 'target', key: 'target' },
          ]}
          dataSource={[
            {
              key: 1,
              enabled: <Switch size="small" checked />,
              object: 'Submission',
              action: 'on_finalize',
              target: 'https://hooks.example.com/codepost',
            },
          ]}
          pagination={false}
          size="middle"
          rowKey="key"
        />
        <div style={{ marginTop: 16 }}>
          <CPButton cpType="primary" icon={<PlusCircleOutlined />}>
            Add Webhook
          </CPButton>
        </div>
      </div>
    }
    breadcrumbs={<Breadcrumb items={[{ title: 'Course Settings' }, { title: 'Webhooks' }]} />}
  />
);

// ---------------------------------------------------------------------------
// Navigation (matches real AdminNav)
// ---------------------------------------------------------------------------

const DemoAdminNav: React.FC<{ activeKey: string; onSelect: (key: string) => void; collapsed: boolean }> = ({
  activeKey,
  onSelect,
  collapsed,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 'calc(100vh - 90px - 48px)',
      overflow: 'auto',
    }}
  >
    <div>
      <Menu
        theme="dark"
        defaultOpenKeys={['assignments', 'course-settings']}
        selectedKeys={[activeKey]}
        mode="inline"
        onClick={(e) => onSelect(e.key)}
        items={[
          {
            key: 'assignments',
            icon: <FileTextOutlined />,
            label: 'Assignments',
            children: [
              { key: 'assignments/overview', label: 'Overview' },
              { key: 'assignments/rubrics', label: 'Rubrics' },
              { key: 'assignments/environment', label: 'Environment & Tests' },
            ],
          },
          {
            key: 'submissions',
            icon: <InboxOutlined />,
            label: 'Submissions',
            children: [
              { key: 'submissions/by_student', label: 'By Student' },
              { key: 'submissions/by_grader', label: 'By Grader' },
            ],
          },
          {
            key: 'roster',
            icon: <TeamOutlined />,
            label: 'Roster',
            children: [
              { key: 'roster/students', label: 'Students' },
              { key: 'roster/graders', label: 'Graders' },
              { key: 'roster/admins', label: 'Admins' },
              { key: 'roster/sections', label: 'Sections' },
            ],
          },
          {
            key: 'course-settings',
            icon: <SettingOutlined />,
            label: 'Course Settings',
            children: [
              { key: 'course-settings/general', label: 'General' },
              { key: 'course-settings/webhooks', label: 'Webhooks' },
            ],
          },
        ]}
      />
    </div>
    <div style={{ margin: 'auto auto', flexGrow: 1 }} />
    <div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[]}
        items={[
          { key: 'docs', icon: <PushpinOutlined />, label: 'Docs' },
          { key: 'api-reference', icon: <ApiOutlined />, label: 'API Reference' },
          { key: 'changelog', icon: <HistoryOutlined />, label: 'Changelog' },
          {
            key: 'scholarship',
            icon: <TrophyOutlined />,
            label: 'Scholarship',
            style: { whiteSpace: 'normal', height: 'auto', lineHeight: 1.4, display: 'flex', alignItems: 'center' },
          },
        ]}
      />
      {!collapsed && (
        <div className="version" style={{ color: '#848484', paddingLeft: 24, paddingBottom: 14 }}>
          v{process.env.REACT_APP_VERSION}
        </div>
      )}
    </div>
  </div>
);

// ===========================================================================
// Main Component
// ===========================================================================

const DemoAdmin: React.FC = () => {
  const [activePanel, setActivePanel] = useState('assignments/overview');
  const [rubricCategories, setRubricCategories] = useState<DemoRubricCategory[]>(INITIAL_RUBRIC_CATEGORIES);
  const [testCategories, setTestCategories] = useState<DemoTestCategory[]>(INITIAL_TEST_CATEGORIES);

  // For drill-down views: rubric editor and environment editor
  const [editingRubricAssignment, setEditingRubricAssignment] = useState<number | null>(null);
  const [editingEnvAssignment, setEditingEnvAssignment] = useState<number | null>(null);

  const openRubricEditor = useCallback((assignmentKey: number) => {
    setEditingRubricAssignment(assignmentKey);
    setActivePanel('assignments/rubrics');
  }, []);

  const openEnvEditor = useCallback((assignmentKey: number) => {
    setEditingEnvAssignment(assignmentKey);
    setActivePanel('assignments/environment');
  }, []);

  const renderPanel = () => {
    // Rubric drill-down
    if (activePanel === 'assignments/rubrics' && editingRubricAssignment !== null) {
      return (
        <RubricEditorPanel
          assignmentKey={editingRubricAssignment}
          categories={rubricCategories}
          onUpdate={setRubricCategories}
          onBack={() => setEditingRubricAssignment(null)}
        />
      );
    }
    // Environment drill-down
    if (activePanel === 'assignments/environment' && editingEnvAssignment !== null) {
      return (
        <EnvironmentEditorPanel
          assignmentKey={editingEnvAssignment}
          testCategories={testCategories}
          onUpdateTests={setTestCategories}
          onBack={() => setEditingEnvAssignment(null)}
        />
      );
    }

    switch (activePanel) {
      case 'assignments/overview':
        return <AssignmentsPanel onEditRubric={openRubricEditor} onEditEnv={openEnvEditor} />;
      case 'assignments/rubrics':
        return <RubricsOverviewPanel onEdit={openRubricEditor} />;
      case 'assignments/environment':
        return <EnvironmentOverviewPanel onEdit={openEnvEditor} />;
      case 'submissions/by_student':
        return <SubmissionsByStudentPanel />;
      case 'submissions/by_grader':
        return <SubmissionsByGraderPanel />;
      case 'roster/students':
        return <RosterStudentsPanel />;
      case 'roster/graders':
        return <RosterGradersPanel />;
      case 'roster/admins':
        return <RosterAdminsPanel />;
      case 'roster/sections':
        return <RosterSectionsPanel />;
      case 'course-settings/general':
        return <SettingsPanel />;
      case 'course-settings/webhooks':
        return <WebhooksPanelDemo />;
      default:
        return <AssignmentsPanel onEditRubric={openRubricEditor} onEditEnv={openEnvEditor} />;
    }
  };

  const handleNavSelect = useCallback((key: string) => {
    setActivePanel(key);
    // Clear drill-down when navigating away
    if (key !== 'assignments/rubrics') setEditingRubricAssignment(null);
    if (key !== 'assignments/environment') setEditingEnvAssignment(null);
  }, []);

  const header = useMemo(
    () => (
      <CPFlex
        left={[
          <CourseMenu
            key="course"
            base="admin"
            panel="assignments"
            courses={DEMO_COURSES}
            currentCourse={DEMO_CURRENT_COURSE}
          />,
          <CPButton key="new" cpType="secondary" icon={<PlusCircleOutlined />}>
            Create a course
          </CPButton>,
        ]}
        right={[
          <span key="email" className="cp-label cp-label--bold">
            {DEMO_USER.email}
          </span>,
          <Referral key="referral" user={DEMO_USER} theme="light" />,
          <RoleMenu key="roles" user={DEMO_USER} thisApp={USER_TYPE.ADMIN} theme="light" />,
          <CPTooltip key="settings" title="User Settings" hideThisOnHideTips={true}>
            <Link className="internal-link" to="/settings">
              <SettingOutlined />
            </Link>
          </CPTooltip>,
          <Button key="logout">Logout</Button>,
        ]}
        gutterSize={10}
      />
    ),
    [],
  );

  const navigation = useCallback(
    (collapsed: boolean) => <DemoAdminNav activeKey={activePanel} onSelect={handleNavSelect} collapsed={collapsed} />,
    [activePanel, handleNavSelect],
  );

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <DemoBanner
        isStudentView={false}
        label="Admin Console Demo"
        description="You are viewing the instructor's admin console. Browse assignments, submissions, roster, and settings."
        switchLabel="Try Grader Console"
        switchTo={`${CODE_DEMO}/grader-console`}
      />
      <ConsoleThemeContext.Provider value={CONSOLE_THEME_VALUE}>
        <CPLayoutAdmin
          header={header}
          detail={<span>{renderPanel()}</span>}
          navigation={navigation}
          collapsible={true}
          role={USER_TYPE.ADMIN}
        />
      </ConsoleThemeContext.Provider>
    </Layout>
  );
};

export default DemoAdmin;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  InputNumber,
  Layout,
  Menu,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { MenuProps, TableProps } from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ClusterOutlined,
  CodeOutlined,
  ContainerOutlined,
  DownOutlined,
  EyeFilled,
  EyeInvisibleOutlined,
  EyeTwoTone,
  FilterOutlined,
  HeartFilled,
  InboxOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  MinusCircleTwoTone,
  PlusCircleOutlined,
  PushpinOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';

import CPAdminDetail from '../../components/admin/other/CPAdminDetail';
import CPLayoutAdmin from '../../components/admin/other/CPLayoutAdmin';
import CPButton from '../../components/core/CPButton';
import CPDropdown from '../../components/core/CPDropdown';
import CPFlex from '../../components/core/CPFlex';
import CPTooltip from '../../components/core/CPTooltip';
import MySubmissionsPanel from '../../components/grader/MySubmissionsPanel';
import SectionSubmissionsTable from '../../components/grader/SectionSubmissionsTable';
import ViewAllPanel from '../../components/grader/ViewAllPanel';
import RegradesTable from '../../components/admin/assignments/assignments/AssignmentRegrades/RegradesTable';
import DemoBanner from './DemoBanner';
import { brandColors } from '../../theme/colors';
import { CODE_DEMO } from '../../routes';
import { Course } from '../../api-client';
import type { AssignmentType, SubmissionType } from '../../types/models';
import type { Assignment, SubmissionInfoType } from '../../types/common';
import { USER_TYPE } from '../../types/common';
import type { User } from '../../api-client';

const { Text } = Typography;

type PanelKey = 'my_submissions' | 'my_sections' | 'all_submissions' | 'regrades';
type DetailView = 'overview' | 'detail';
type ClaimFilter = 'none' | 'section';
type ViewedState = 'yes' | 'no' | 'partial';

type AssignmentSummary = {
  key: number;
  assignment: string;
  claimed?: number;
  finalized?: number;
  unfinalized?: number;
  submissions?: number;
  missing?: number;
  total?: number;
  open?: number;
  closed?: number;
  grade: string;
};

type ClaimedSubmission = {
  key: number;
  student: string;
  gradeText: string;
  lastEdited: string;
};

type SectionSubmission = {
  key: number;
  student: string;
  partners: string;
  gradeText: string;
  grader: string;
  lastEdited: string;
  viewed: ViewedState;
};

type ViewAllSubmission = {
  key: number;
  students: string;
  gradeText: string;
  grader: string;
  lastEdited: string;
  viewed: ViewedState;
};

type RegradeSubmission = {
  key: number;
  students: string;
  grader: string;
  question: string;
  status: 'Open' | 'Closed';
  updated: string;
};

type RecentlyFinalizedRow = {
  key: number;
  student: string;
  score: string;
  finalizedAt: string;
};

const COURSE_LABEL = 'CS 201 | Spring 2026';
const VERSION = 'v3.2.0';
const SECTION_OPTIONS = ['Section 01', 'Section 02'];
const GRADER_OPTIONS = ['grader1@university.edu', 'grader2@university.edu', 'grader3@university.edu'];

const MY_SUBMISSIONS_OVERVIEW: AssignmentSummary[] = [
  { key: 1, assignment: 'HW 1 – Loops', claimed: 34, finalized: 34, unfinalized: 0, grade: '17.3/20' },
  { key: 2, assignment: 'HW 2 – Recursion', claimed: 31, finalized: 28, unfinalized: 3, grade: '20.1/25' },
  { key: 3, assignment: 'HW 3 – Linked Lists', claimed: 22, finalized: 15, unfinalized: 7, grade: '--' },
  { key: 4, assignment: 'HW 4 – Trees', claimed: 3, finalized: 0, unfinalized: 3, grade: '--' },
];

const SECTION_OVERVIEW: AssignmentSummary[] = [
  { key: 1, assignment: 'HW 1 – Loops', submissions: 8, finalized: 8, missing: 0, grade: '17.3/20' },
  { key: 2, assignment: 'HW 2 – Recursion', submissions: 7, finalized: 7, missing: 1, grade: '20.1/25' },
  { key: 3, assignment: 'HW 3 – Linked Lists', submissions: 6, finalized: 3, missing: 2, grade: '--' },
  { key: 4, assignment: 'HW 4 – Trees', submissions: 2, finalized: 0, missing: 6, grade: '--' },
];

const REGRADES_OVERVIEW: AssignmentSummary[] = [
  { key: 1, assignment: 'HW 1 – Loops', total: 3, open: 1, closed: 2, grade: '--' },
  { key: 2, assignment: 'HW 2 – Recursion', total: 2, open: 1, closed: 1, grade: '--' },
  { key: 3, assignment: 'HW 3 – Linked Lists', total: 4, open: 2, closed: 2, grade: '--' },
];

const CLAIMED_SUBMISSIONS_BY_ASSIGNMENT: Record<string, ClaimedSubmission[]> = {
  'HW 1 – Loops': [
    { key: 101, student: 'alice@university.edu', gradeText: '20/20', lastEdited: '3/6/2026, 4:55 PM' },
    { key: 102, student: 'bob@university.edu', gradeText: '18/20', lastEdited: '3/6/2026, 5:18 PM' },
  ],
  'HW 2 – Recursion': [
    { key: 201, student: 'david@university.edu', gradeText: '25/25', lastEdited: '3/8/2026, 6:11 PM' },
    { key: 202, student: 'erin@university.edu', gradeText: 'Unfinalized', lastEdited: '3/8/2026, 7:04 PM' },
  ],
  'HW 3 – Linked Lists': [
    { key: 301, student: 'carol@university.edu', gradeText: 'Unfinalized', lastEdited: '3/9/2026, 11:42 PM' },
    { key: 302, student: 'frank@university.edu', gradeText: 'Unfinalized', lastEdited: '3/10/2026, 12:01 AM' },
    { key: 303, student: 'henry@university.edu', gradeText: '22/30', lastEdited: '3/8/2026, 9:15 PM' },
    { key: 304, student: 'eve@university.edu', gradeText: '20/30', lastEdited: '3/7/2026, 1:30 AM' },
    { key: 305, student: 'alice@university.edu', gradeText: '28/30', lastEdited: '3/6/2026, 4:55 PM' },
  ],
  'HW 4 – Trees': [
    { key: 401, student: 'olivia@university.edu', gradeText: 'Unfinalized', lastEdited: '3/11/2026, 8:18 PM' },
  ],
};

const SECTION_SUBMISSIONS_BY_ASSIGNMENT: Record<string, SectionSubmission[]> = {
  'HW 1 – Loops': [
    {
      key: 1001,
      student: 'alice@university.edu',
      partners: '--',
      gradeText: '20/20',
      grader: 'grader1@university.edu',
      lastEdited: '3/5/2026, 9:15 PM',
      viewed: 'yes',
    },
  ],
  'HW 2 – Recursion': [
    {
      key: 2001,
      student: 'bob@university.edu',
      partners: '--',
      gradeText: '23/25',
      grader: 'grader2@university.edu',
      lastEdited: '3/8/2026, 4:12 PM',
      viewed: 'partial',
    },
  ],
  'HW 3 – Linked Lists': [
    {
      key: 3001,
      student: 'alice@university.edu',
      partners: '--',
      gradeText: '28/30',
      grader: 'grader1@university.edu',
      lastEdited: '3/9/2026, 11:42 PM',
      viewed: 'yes',
    },
    {
      key: 3002,
      student: 'bob@university.edu',
      partners: '--',
      gradeText: 'Unfinalized',
      grader: 'grader1@university.edu',
      lastEdited: '3/8/2026, 10:20 PM',
      viewed: 'no',
    },
    {
      key: 3003,
      student: 'carol@university.edu',
      partners: '--',
      gradeText: '25/30',
      grader: 'grader2@university.edu',
      lastEdited: '3/7/2026, 9:15 PM',
      viewed: 'partial',
    },
    {
      key: 3004,
      student: 'david@university.edu',
      partners: 'eve@university.edu',
      gradeText: '27/30',
      grader: '--',
      lastEdited: '--',
      viewed: 'no',
    },
    {
      key: 3005,
      student: 'eve@university.edu',
      partners: 'david@university.edu',
      gradeText: '27/30',
      grader: '--',
      lastEdited: '--',
      viewed: 'no',
    },
    {
      key: 3006,
      student: 'frank@university.edu',
      partners: '--',
      gradeText: '--',
      grader: '--',
      lastEdited: '--',
      viewed: 'no',
    },
  ],
  'HW 4 – Trees': [
    {
      key: 4001,
      student: 'mia@university.edu',
      partners: '--',
      gradeText: '--',
      grader: '--',
      lastEdited: '--',
      viewed: 'no',
    },
  ],
};

const VIEW_ALL_DETAIL_BY_ASSIGNMENT: Record<string, ViewAllSubmission[]> = {
  'HW 1 – Loops': [
    {
      key: 5001,
      students: 'alice@university.edu',
      gradeText: '20/20',
      grader: 'grader1@university.edu',
      lastEdited: '3/5/2026, 9:15 PM',
      viewed: 'yes',
    },
  ],
  'HW 2 – Recursion': [
    {
      key: 6001,
      students: 'bob@university.edu',
      gradeText: '23/25',
      grader: 'grader2@university.edu',
      lastEdited: '3/8/2026, 4:12 PM',
      viewed: 'partial',
    },
  ],
  'HW 3 – Linked Lists': [
    {
      key: 7001,
      students: 'alice@university.edu',
      gradeText: '28/30',
      grader: 'grader1@university.edu',
      lastEdited: '3/9/2026, 11:42 PM',
      viewed: 'yes',
    },
    {
      key: 7002,
      students: 'bob@university.edu',
      gradeText: 'Unfinalized',
      grader: 'grader1@university.edu',
      lastEdited: '3/8/2026, 10:20 PM',
      viewed: 'no',
    },
    {
      key: 7003,
      students: 'carol@university.edu, david@university.edu',
      gradeText: '25/30',
      grader: 'grader2@university.edu',
      lastEdited: '3/7/2026, 9:15 PM',
      viewed: 'partial',
    },
    {
      key: 7004,
      students: 'eve@university.edu',
      gradeText: '--',
      grader: '--',
      lastEdited: '--',
      viewed: 'no',
    },
  ],
  'HW 4 – Trees': [
    {
      key: 8001,
      students: 'mia@university.edu',
      gradeText: '--',
      grader: '--',
      lastEdited: '--',
      viewed: 'no',
    },
  ],
};

const REGRADES_DETAIL_BY_ASSIGNMENT: Record<string, RegradeSubmission[]> = {
  'HW 1 – Loops': [
    {
      key: 9001,
      students: 'alice@university.edu',
      grader: 'grader1@university.edu',
      question: 'Could you recheck Question 3? I think the loop invariant is correct.',
      status: 'Closed',
      updated: '3/6/2026, 6:02 PM',
    },
  ],
  'HW 2 – Recursion': [
    {
      key: 9101,
      students: 'bob@university.edu',
      grader: 'grader2@university.edu',
      question: 'The stack trace shows the base case works locally. Could this be reconsidered?',
      status: 'Open',
      updated: '3/9/2026, 2:18 PM',
    },
  ],
  'HW 3 – Linked Lists': [
    {
      key: 9201,
      students: 'carol@university.edu',
      grader: 'grader1@university.edu',
      question: 'I believe my reverseList implementation handles empty input correctly.',
      status: 'Open',
      updated: '3/10/2026, 8:44 AM',
    },
    {
      key: 9202,
      students: 'frank@university.edu',
      grader: 'grader3@university.edu',
      question: 'Could you clarify the deduction for pointer updates in Question 5?',
      status: 'Closed',
      updated: '3/10/2026, 1:09 PM',
    },
    {
      key: 9203,
      students: 'grace@university.edu',
      grader: 'grader2@university.edu',
      question: 'The test passed in the latest submission; should the rubric comment be updated?',
      status: 'Closed',
      updated: '3/10/2026, 4:21 PM',
    },
  ],
};

const RECENTLY_FINALIZED: Record<string, RecentlyFinalizedRow[]> = {
  'HW 1 – Loops': [{ key: 1, student: 'alice@university.edu', score: '20/20', finalizedAt: '3/6/2026, 4:55 PM' }],
  'HW 2 – Recursion': [{ key: 2, student: 'david@university.edu', score: '25/25', finalizedAt: '3/8/2026, 6:11 PM' }],
  'HW 3 – Linked Lists': [
    { key: 3, student: 'henry@university.edu', score: '22/30', finalizedAt: '3/8/2026, 9:15 PM' },
    { key: 4, student: 'eve@university.edu', score: '20/30', finalizedAt: '3/7/2026, 1:30 AM' },
    { key: 5, student: 'alice@university.edu', score: '28/30', finalizedAt: '3/6/2026, 4:55 PM' },
  ],
  'HW 4 – Trees': [],
};

const DEMO_CURRENT_COURSE = {
  id: 1,
  name: 'CS 201',
  period: 'Spring 2026',
  assignments: [],
  sections: [],
} as unknown as Course;

const REAL_GRADER_ASSIGNMENTS = MY_SUBMISSIONS_OVERVIEW.map((assignment) => {
  const points = Number(String(assignment.grade || '--').split('/')[1]) || 30;
  return {
    id: assignment.key,
    name: assignment.assignment,
    points,
    course: DEMO_CURRENT_COURSE.id,
    submissions_count: assignment.claimed || 0,
    submissions_finalized_count: assignment.finalized || 0,
    submissions_inprogress_count: assignment.unfinalized || 0,
    stats_mean: assignment.grade !== '--' ? Number(String(assignment.grade).split('/')[0]) : null,
  };
}) as unknown as AssignmentType[];

const DEMO_REGRADES_USER = {
  id: 2,
  email: 'grader1@university.edu',
} as unknown as User;

const getViewedIcon = (viewed: ViewedState) => {
  if (viewed === 'yes') {
    return <EyeFilled style={{ color: brandColors.primary }} />;
  }

  if (viewed === 'partial') {
    return <EyeTwoTone twoToneColor="#646464" />;
  }

  return <EyeInvisibleOutlined style={{ color: '#bfbfbf' }} />;
};

const renderTextLink = (label: string, onClick?: () => void) => (
  <a className="text-link" onClick={onClick}>
    <Text strong className="text-link">
      {label}
    </Text>
  </a>
);

const DemoGrader: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelKey>('my_submissions');
  const [claimedView, setClaimedView] = useState<DetailView>('overview');
  const [sectionsView, setSectionsView] = useState<DetailView>('overview');
  const [viewAllView, setViewAllView] = useState<DetailView>('overview');
  const [regradesView, setRegradesView] = useState<DetailView>('overview');
  const [selectedAssignment, setSelectedAssignment] = useState('HW 3 – Linked Lists');
  const [selectedSection, setSelectedSection] = useState('Section 01');
  const [claimAmount, setClaimAmount] = useState(1);
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>('none');
  const [selectedClaimSections, setSelectedClaimSections] = useState<string[]>([]);
  const [showClaimedStudents, setShowClaimedStudents] = useState(false);
  const [showSectionStudents, setShowSectionStudents] = useState(false);
  const [selectedSectionRows, setSelectedSectionRows] = useState<React.Key[]>([]);
  const [showViewAllStudents, setShowViewAllStudents] = useState(false);
  const [selectedGraders, setSelectedGraders] = useState<string[]>([]);
  const [showRegradeStudents, setShowRegradeStudents] = useState(false);
  const [viewAllRegrades, setViewAllRegrades] = useState(false);
  const [regradeSubmissionsByAssignment, setRegradeSubmissionsByAssignment] = useState<
    Record<string, SubmissionInfoType[]>
  >(() => {
    const initial: Record<string, SubmissionInfoType[]> = {};

    Object.entries(REGRADES_DETAIL_BY_ASSIGNMENT).forEach(([assignmentName, rows]) => {
      const assignmentKey = MY_SUBMISSIONS_OVERVIEW.find((a) => a.assignment === assignmentName)?.key || 1;

      initial[assignmentName] = rows.map((row, index) => {
        const isOpen = row.status === 'Open';
        return {
          id: Number(row.key),
          assignment: assignmentKey,
          students: row.students.split(',').map((student) => student.trim()),
          grader: row.grader === '--' ? null : row.grader,
          questionText: row.question,
          questionIsOpen: isOpen,
          questionIsRegrade: true,
          questionResponder: row.grader === '--' ? null : row.grader,
          questionResponse: isOpen ? '' : 'Thanks for your question — we have reviewed and updated this request.',
          questionDate: `2026-03-${10 + index}T08:00:00Z`,
          responseDate: isOpen ? null : `2026-03-${10 + index}T18:00:00Z`,
        } as unknown as SubmissionInfoType;
      });
    });

    return initial;
  });

  const claimedRows = CLAIMED_SUBMISSIONS_BY_ASSIGNMENT[selectedAssignment] ?? [];
  const sectionRows = SECTION_SUBMISSIONS_BY_ASSIGNMENT[selectedAssignment] ?? [];
  const viewAllRows = VIEW_ALL_DETAIL_BY_ASSIGNMENT[selectedAssignment] ?? [];
  const regradeRows = regradeSubmissionsByAssignment[selectedAssignment] ?? [];
  const recentlyFinalizedRows = RECENTLY_FINALIZED[selectedAssignment] ?? [];

  const queueLength = useMemo(() => {
    const summary = MY_SUBMISSIONS_OVERVIEW.find((assignment) => assignment.assignment === selectedAssignment);
    return summary?.unfinalized ? summary.unfinalized * 7 + 34 : 48;
  }, [selectedAssignment]);

  const claimSummary = useMemo(
    () => MY_SUBMISSIONS_OVERVIEW.find((assignment) => assignment.assignment === selectedAssignment),
    [selectedAssignment],
  );

  const assignmentMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'clear-assignment',
        label: 'Clear assignment',
        onClick: () => {
          setClaimedView('overview');
          setSectionsView('overview');
          setViewAllView('overview');
          setRegradesView('overview');
        },
      },
      ...MY_SUBMISSIONS_OVERVIEW.map((assignment) => ({
        key: assignment.assignment,
        label: assignment.assignment,
        onClick: () => {
          setSelectedAssignment(assignment.assignment);

          switch (activePanel) {
            case 'my_sections':
              setSectionsView('detail');
              break;
            case 'all_submissions':
              setViewAllView('detail');
              break;
            case 'regrades':
              setRegradesView('detail');
              break;
            default:
              setClaimedView('detail');
          }
        },
      })),
    ],
    [activePanel],
  );

  const courseMenuItems: MenuProps['items'] = [
    { key: 'course-1', label: 'CS 201 | Spring 2026' },
    { key: 'course-2', label: 'CS 314 | Fall 2025' },
    { key: 'course-3', label: 'CS 344 | Spring 2025' },
  ];

  const roleMenuItems: MenuProps['items'] = [
    {
      key: 'student',
      label: (
        <span>
          <span style={{ marginRight: 8 }}>🎓</span>
          Student
        </span>
      ),
    },
    {
      key: 'grader',
      label: (
        <span>
          <AuditOutlined style={{ marginRight: 8 }} />
          Grader
        </span>
      ),
    },
    {
      key: 'admin',
      label: (
        <span>
          <DownOutlined rotate={270} style={{ marginRight: 8 }} />
          Admin
        </span>
      ),
    },
    {
      key: 'org',
      label: (
        <span>
          <TeamOutlined style={{ marginRight: 8 }} />
          Organization
        </span>
      ),
    },
    { type: 'divider' },
    {
      key: 'info',
      label: <span style={{ color: '#8c8c8c', fontSize: 10, fontStyle: 'italic' }}>Learn more about roles</span>,
    },
  ];

  const claimedColumns: TableProps<ClaimedSubmission>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'student',
      sorter: true,
      render: (student: string) => renderTextLink(showClaimedStudents ? student : student),
    },
    { title: 'Grade', dataIndex: 'gradeText', align: 'center', sorter: true },
    { title: 'Last Edited', dataIndex: 'lastEdited', align: 'center', sorter: true },
    {
      title: (
        <span>
          Unclaim &nbsp;
          <CPTooltip
            title="Remove yourself as the grader of this submission, and return the submission to the ungraded queue."
            hideThisOnHideTips={true}
            infoIcon={true}
          />
        </span>
      ),
      key: 'unclaim',
      align: 'center',
      render: () => (
        <Popconfirm
          title="Are you sure you want to unclaim this submission?"
          okText="Unclaim"
          cancelText="Cancel"
          placement="left"
        >
          <Button shape="circle" icon={<MinusCircleTwoTone twoToneColor="#eb2f96" />} />
        </Popconfirm>
      ),
    },
  ];

  const viewAllColumns: TableProps<ViewAllSubmission>['columns'] = [
    {
      title: 'Student(s)',
      dataIndex: 'students',
      sorter: true,
      render: (students: string) => renderTextLink(showViewAllStudents ? students : students),
    },
    { title: 'Grade', dataIndex: 'gradeText', sorter: true, align: 'center' },
    { title: 'Grader', dataIndex: 'grader', sorter: true, align: 'center' },
    { title: 'Last Edited', dataIndex: 'lastEdited', sorter: true, align: 'center' },
    {
      title: 'Viewed by Student(s)',
      key: 'viewed',
      align: 'center',
      render: (_value, row) => getViewedIcon(row.viewed),
    },
  ];

  const recentFinalizedColumns: TableProps<RecentlyFinalizedRow>['columns'] = [
    {
      title: 'Student',
      dataIndex: 'student',
      render: (student: string) => <Text strong>{student}</Text>,
    },
    { title: 'Score', dataIndex: 'score', align: 'center' },
    { title: 'Finalized', dataIndex: 'finalizedAt', align: 'center' },
  ];

  const claimControls = (
    <Space size="small">
      <Space.Compact>
        <CPTooltip title="Claim another submission from the queue." hideThisOnHideTips={true}>
          <CPButton cpType="primary" icon={<PlusCircleOutlined />} style={{ display: 'inline-block' }}>
            Claim
          </CPButton>
        </CPTooltip>
        <InputNumber
          min={1}
          max={10}
          value={claimAmount}
          onChange={(value) => setClaimAmount(value || 1)}
          style={{ width: 60 }}
        />
      </Space.Compact>
      <Tag color="blue" icon={<InfoCircleOutlined />}>
        {queueLength} in queue
      </Tag>
    </Space>
  );

  const claimFilterControl =
    claimFilter === 'none' ? (
      <CPTooltip title="Filter the claim queue." hideThisOnHideTips={true}>
        <Dropdown
          menu={{
            items: [
              {
                key: 'by-section',
                label: 'By section',
                onClick: () => setClaimFilter('section'),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button icon={<FilterOutlined />}>Filter</Button>
        </Dropdown>
      </CPTooltip>
    ) : (
      <Space size="small">
        <Select
          placeholder="Filter by section"
          mode="multiple"
          style={{ width: 250 }}
          value={selectedClaimSections}
          onChange={setSelectedClaimSections}
          options={SECTION_OPTIONS.map((section) => ({ value: section, label: section }))}
        />
        <CloseCircleOutlined onClick={() => setClaimFilter('none')} />
      </Space>
    );

  const claimedDetail = (
    <CPAdminDetail
      goBack={null}
      breadcrumbs={
        <Breadcrumb
          items={[
            {
              title: (
                <span style={{ cursor: 'pointer' }} onClick={() => setClaimedView('overview')}>
                  Claimed by me
                </span>
              ),
            },
            { title: selectedAssignment },
          ]}
        />
      }
      title={<div>{`Claimed by Me: ${selectedAssignment}`}</div>}
      titleInfo="Submissions currently assigned to you, plus quick claim controls and queue info."
      actions={[
        <Space key="toolbar" size="large" align="center">
          <Space size="small">
            <span>Reveal students:</span>
            <Switch checked={showClaimedStudents} onChange={setShowClaimedStudents} />
          </Space>
          <Divider type="vertical" />
          {claimControls}
          {claimFilterControl}
        </Space>,
      ]}
      content={
        <div>
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Claimed" value={claimSummary?.claimed || 0} prefix={<ClockCircleOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Finalized"
                  value={claimSummary?.finalized || 0}
                  prefix={<CheckCircleOutlined style={{ color: brandColors.primary }} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Unfinalized" value={claimSummary?.unfinalized || 0} prefix={<ContainerOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Queue Remaining" value={queueLength} prefix={<InboxOutlined />} />
              </Card>
            </Col>
          </Row>

          <Table columns={claimedColumns} dataSource={claimedRows} pagination={{ pageSize: 20 }} />

          <Card size="small" title="Recently Finalized" style={{ marginTop: 20 }}>
            <Table
              columns={recentFinalizedColumns}
              dataSource={recentlyFinalizedRows}
              pagination={false}
              size="small"
            />
          </Card>
        </div>
      }
      gutterSize={0}
    />
  );

  const claimedOverview = (
    <MySubmissionsPanel
      assignments={REAL_GRADER_ASSIGNMENTS}
      course={DEMO_CURRENT_COURSE}
      graderEmail={'grader1@university.edu'}
    />
  );

  const sectionDetail = (
    <CPAdminDetail
      goBack={null}
      breadcrumbs={
        <Breadcrumb
          items={[
            {
              title: (
                <span style={{ cursor: 'pointer' }} onClick={() => setSectionsView('overview')}>
                  My sections
                </span>
              ),
            },
            { title: selectedAssignment },
          ]}
        />
      }
      title={`Section: ${selectedSection}`}
      titleInfo="Submissions for the active section, including viewed state and batch-claim behavior."
      actions={[
        <div key="anonymous-toggle">
          <div style={{ display: 'inline-block' }}>
            Reveal students: &nbsp;
            <Switch
              checked={showSectionStudents}
              onChange={setShowSectionStudents}
              style={{ display: 'inline-block' }}
            />
          </div>
          <Divider type="vertical" style={{ height: 25 }} />
        </div>,
        <Select
          key="section-select"
          value={selectedSection}
          style={{ width: 200 }}
          onChange={(value) => {
            setSelectedSection(value);
            setSelectedSectionRows([]);
          }}
          options={SECTION_OPTIONS.map((section) => ({ value: section, label: section }))}
        />,
        <Button key="claim-selected" type="primary" disabled={selectedSectionRows.length === 0}>
          Claim Selected
        </Button>,
      ]}
      content={
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: 'Overview',
              children: (() => {
                const sectionSubmissions = sectionRows.reduce(
                  (acc, row) => {
                    if (row.gradeText === '--') {
                      acc[row.student] = null;
                      return acc;
                    }

                    const isFinalized = row.gradeText !== 'Unfinalized';
                    const grade = isFinalized ? Number(String(row.gradeText).split('/')[0]) : null;
                    const partners = row.partners === '--' ? [] : row.partners.split(',').map((s) => s.trim());

                    acc[row.student] = {
                      id: Number(row.key),
                      students: [row.student, ...partners],
                      grader: row.grader === '--' ? null : row.grader,
                      isFinalized,
                      grade,
                      dateEdited: row.lastEdited === '--' ? '2026-03-01T12:00:00Z' : '2026-03-10T17:00:00Z',
                    } as unknown as SubmissionType;

                    return acc;
                  },
                  {} as { [student: string]: SubmissionType | null },
                );

                const viewsBySubmission = sectionRows.reduce(
                  (acc, row) => {
                    if (row.gradeText === '--') {
                      return acc;
                    }

                    if (row.viewed === 'yes' || row.viewed === 'partial') {
                      acc[row.key] = { [row.student]: '2026-03-10T17:00:00Z' };
                    }

                    return acc;
                  },
                  {} as { [submissionID: number]: { [student: string]: string } },
                );

                const assignmentForTable = {
                  id: Number(
                    (MY_SUBMISSIONS_OVERVIEW.find((a) => a.assignment === selectedAssignment)?.key || 1) as number,
                  ),
                  name: selectedAssignment,
                  points: selectedAssignment.includes('25') ? 25 : selectedAssignment.includes('20') ? 20 : 30,
                } as unknown as AssignmentType;

                return (
                  <SectionSubmissionsTable
                    isLoading={false}
                    submissions={sectionSubmissions}
                    onRowSelect={setSelectedSectionRows}
                    selectedSubmissions={selectedSectionRows}
                    showEmails={showSectionStudents}
                    assignment={assignmentForTable}
                    viewsBySubmission={viewsBySubmission}
                    viewsLoading={false}
                    claimSubmissions={() => {}}
                    me={'grader1@university.edu'}
                  />
                );
              })(),
            },
            {
              key: '2',
              label: 'Test results',
              children: <Text type="secondary">Autograder summary would appear here for this assignment.</Text>,
            },
          ]}
        />
      }
      gutterSize={0}
    />
  );

  const sectionsOverview = (
    <CPAdminDetail
      breadcrumbs={<Breadcrumb items={[{ title: 'My sections' }]} />}
      goBack={null}
      title={<div>My sections</div>}
      actions={[
        <Select
          key="overview-section-select"
          value={selectedSection}
          style={{ width: 200 }}
          onChange={setSelectedSection}
          options={SECTION_OPTIONS.map((section) => ({ value: section, label: section }))}
        />,
      ]}
      content={
        <Table
          columns={[
            {
              title: 'Zoom in',
              key: 'zoom',
              align: 'center',
              render: (_value, row: AssignmentSummary) => (
                <a
                  onClick={() => {
                    setSelectedAssignment(row.assignment);
                    setSectionsView('detail');
                  }}
                >
                  <CodeOutlined />
                </a>
              ),
            },
            {
              title: 'Assignment',
              dataIndex: 'assignment',
              render: (assignment: string) =>
                renderTextLink(assignment, () => {
                  setSelectedAssignment(assignment);
                  setSectionsView('detail');
                }),
            },
            { title: 'Submissions', dataIndex: 'submissions', align: 'center' },
            { title: 'Finalized', dataIndex: 'finalized', align: 'center' },
            { title: 'Missing', dataIndex: 'missing', align: 'center' },
            { title: 'Avg. Grade', dataIndex: 'grade', align: 'center' },
          ]}
          dataSource={SECTION_OVERVIEW}
          pagination={false}
        />
      }
      gutterSize={0}
    />
  );

  const filteredViewAllRows =
    selectedGraders.length === 0 ? viewAllRows : viewAllRows.filter((row) => selectedGraders.includes(row.grader));

  const viewAllDetail = (
    <CPAdminDetail
      goBack={null}
      breadcrumbs={
        <Breadcrumb
          items={[
            {
              title: (
                <span style={{ cursor: 'pointer' }} onClick={() => setViewAllView('overview')}>
                  View All
                </span>
              ),
            },
            { title: selectedAssignment },
          ]}
        />
      }
      title={`All submissions: ${selectedAssignment}`}
      titleInfo="Browse every submission for an assignment, optionally filtering by grader."
      actions={[
        <div key="view-all-anon" style={{ display: 'inline-block', padding: '0px 20px' }}>
          Reveal students: &nbsp;
          <Switch checked={showViewAllStudents} onChange={setShowViewAllStudents} style={{ display: 'inline-block' }} />
        </div>,
      ]}
      content={
        <div>
          <div>
            <Select
              placeholder="Select Graders..."
              mode="multiple"
              value={selectedGraders}
              onChange={setSelectedGraders}
              style={{ width: 500, marginBottom: 20 }}
              options={GRADER_OPTIONS.map((grader) => ({ value: grader, label: grader }))}
            />
            <CPTooltip
              title="Filter all submissions by assigned grader."
              placement="right"
              infoIcon={true}
              hideThisOnHideTips={true}
              iconStyle={{ paddingLeft: 10 }}
            />
          </div>
          <Table columns={viewAllColumns} dataSource={filteredViewAllRows} pagination={false} />
        </div>
      }
      gutterSize={0}
    />
  );

  const viewAllOverview = <ViewAllPanel assignments={REAL_GRADER_ASSIGNMENTS} course={DEMO_CURRENT_COURSE} />;

  const filteredRegrades = viewAllRegrades
    ? regradeRows
    : regradeRows.filter((row) => row.grader === 'grader1@university.edu');

  const regradesAssignment = {
    id: Number(MY_SUBMISSIONS_OVERVIEW.find((a) => a.assignment === selectedAssignment)?.key || 1),
    name: selectedAssignment,
    points:
      Number(
        String(MY_SUBMISSIONS_OVERVIEW.find((a) => a.assignment === selectedAssignment)?.grade || '--').split('/')[1],
      ) || 30,
    regradeInstructions:
      'Please provide a clear explanation for your request and include references to rubric items or test results where possible.',
  } as unknown as Assignment;

  const updateRegradeSubmission = async (submission: SubmissionInfoType) => {
    setRegradeSubmissionsByAssignment((prev) => {
      const current = prev[selectedAssignment] || [];
      return {
        ...prev,
        [selectedAssignment]: current.map((s) => (s.id === submission.id ? submission : s)),
      };
    });
  };

  const regradesDetail = (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb
          items={[
            {
              title: (
                <span style={{ cursor: 'pointer' }} onClick={() => setRegradesView('overview')}>
                  Regrade Requests
                </span>
              ),
            },
            { title: selectedAssignment },
          ]}
        />
      }
      goBack={null}
      title={<div>{`Regrade Requests: ${selectedAssignment}`}</div>}
      titleInfo={'Quesitons or regrade requests from submissions that you have graded.'}
      actions={[
        <div key="reveal-students">
          <div style={{ display: 'inline-block' }}>
            Reveal students: &nbsp;
            <Switch
              checked={showRegradeStudents}
              onChange={setShowRegradeStudents}
              style={{ display: 'inline-block' }}
            />
          </div>
        </div>,
        <div key="view-all-regrades">
          <div style={{ display: 'inline-block', marginLeft: 15 }}>
            View all regrades: &nbsp;
            <Switch checked={viewAllRegrades} onChange={setViewAllRegrades} style={{ display: 'inline-block' }} />
          </div>
        </div>,
      ]}
      content={
        <RegradesTable
          assignment={regradesAssignment}
          submissions={filteredRegrades}
          refreshCourseData={() => {}}
          user={DEMO_REGRADES_USER}
          updateSubmission={updateRegradeSubmission}
          isAnonymous={!showRegradeStudents}
          isLoading={false}
        />
      }
      gutterSize={0}
    />
  );

  const regradesOverview = (
    <CPAdminDetail
      breadcrumbs={<Breadcrumb items={[{ title: 'Regrade Requests' }]} />}
      goBack={null}
      title={<div>Regrade Requests</div>}
      actions={[
        <div key="regrades-toggle">
          View all regrades: &nbsp;
          <Switch checked={viewAllRegrades} onChange={setViewAllRegrades} />
        </div>,
      ]}
      content={
        <Table
          columns={[
            {
              title: 'Assignment',
              dataIndex: 'assignment',
              render: (assignment: string) =>
                renderTextLink(assignment, () => {
                  setSelectedAssignment(assignment);
                  setRegradesView('detail');
                }),
            },
            { title: 'Total', dataIndex: 'total', align: 'center' },
            { title: 'Open', dataIndex: 'open', align: 'center' },
            { title: 'Closed', dataIndex: 'closed', align: 'center' },
          ]}
          dataSource={REGRADES_OVERVIEW}
          pagination={false}
        />
      }
      gutterSize={0}
    />
  );

  const renderPanel = () => {
    switch (activePanel) {
      case 'my_sections':
        return sectionsView === 'detail' ? sectionDetail : sectionsOverview;
      case 'all_submissions':
        return viewAllView === 'detail' ? viewAllDetail : viewAllOverview;
      case 'regrades':
        return regradesView === 'detail' ? regradesDetail : regradesOverview;
      default:
        return claimedView === 'detail' ? claimedDetail : claimedOverview;
    }
  };

  const header = (
    <CPFlex
      left={[
        <CPDropdown
          key="course-menu"
          value={COURSE_LABEL}
          menu={{ items: courseMenuItems }}
          justifyContent="space-between"
        />,
        <CPDropdown
          key="assignment-menu"
          value={selectedAssignment}
          menu={{ items: assignmentMenuItems }}
          justifyContent="space-between"
        />,
      ]}
      right={[
        <span key="user" className="cp-label cp-label--bold">
          grader1@university.edu
        </span>,
        <CPTooltip
          key="referral"
          title="Know another course that might find codePost useful? Let us know!"
          placement="left"
        >
          <HeartFilled style={{ color: '#8c8c8c' }} />
        </CPTooltip>,
        <Dropdown key="roles" menu={{ items: roleMenuItems }} trigger={['click']}>
          <span>
            <CPTooltip title="Switch Roles" placement="left">
              <UserSwitchOutlined />
            </CPTooltip>
          </span>
        </Dropdown>,
        <CPTooltip key="settings" title="Manage your personal settings." placement="left">
          <a className="internal-link">
            <SettingOutlined />
          </a>
        </CPTooltip>,
        <Button key="logout">Log Out</Button>,
      ]}
      gutterSize={10}
    />
  );

  const navigation = (collapsed: boolean) => {
    const mainMenuItems: MenuProps['items'] = [
      {
        key: '0',
        icon: <ContainerOutlined />,
        label: <span onClick={() => setActivePanel('my_submissions')}>Claimed by Me</span>,
      },
      {
        key: '1',
        icon: <ClusterOutlined />,
        label: <span onClick={() => setActivePanel('my_sections')}>My Sections</span>,
      },
      {
        key: '2',
        icon: <InboxOutlined />,
        label: <span onClick={() => setActivePanel('all_submissions')}>All Submissions</span>,
      },
      {
        key: '3',
        icon: <MessageOutlined />,
        label: <span onClick={() => setActivePanel('regrades')}>Regrade Requests</span>,
      },
    ];

    const bottomMenuItems: MenuProps['items'] = [
      {
        key: 'docs',
        icon: <PushpinOutlined />,
        label: 'Docs',
      },
      {
        key: 'scholarship',
        icon: <TrophyOutlined />,
        label: 'CS Education Scholarship',
        style: {
          whiteSpace: 'normal',
          height: 'auto',
          lineHeight: 1.4,
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
        },
      },
    ];

    const selectedKey =
      activePanel === 'my_submissions'
        ? '0'
        : activePanel === 'my_sections'
          ? '1'
          : activePanel === 'all_submissions'
            ? '2'
            : '3';

    return (
      <div>
        <div>
          <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={mainMenuItems} />
        </div>
        <div style={{ height: '100%' }}>
          <Menu
            theme="dark"
            mode="inline"
            style={{ position: 'absolute', bottom: 75 }}
            selectedKeys={[]}
            items={bottomMenuItems}
          />
        </div>
        {!collapsed && (
          <div style={{ paddingLeft: 24, paddingBottom: 14, color: '#848484', fontSize: 12 }}>{VERSION}</div>
        )}
      </div>
    );
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <DemoBanner
        isStudentView={false}
        label="Grader Console Demo"
        description="Static demo modeled after the real grader console UI."
        switchLabel="Switch to Admin"
        switchTo={`${CODE_DEMO}/admin`}
      />
      <CPLayoutAdmin
        header={header}
        detail={renderPanel()}
        navigation={navigation}
        collapsible={true}
        role={USER_TYPE.GRADER}
      />
    </Layout>
  );
};

export default DemoGrader;

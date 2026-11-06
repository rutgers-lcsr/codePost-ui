// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import {
  ApiOutlined,
  BookOutlined,
  KeyOutlined,
  SafetyOutlined,
  RobotOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  UserSwitchOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

/* style imports */
import { Button, Descriptions, Flex, Form, Input, message, Modal, Select, Skeleton, Switch, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { apiErrorMessageAsync } from '../../../lib/apiError';

/* codePost imports */
import { Course, Webhook } from '../../../api-client';
import { webhooksApi } from '../../../api-client/clients';
import WebhooksTable from './WebhooksTable';
import InputNumberOrNull from './InputNumberOrNull';
import AISettingsCard from './AISettingsCard';
import CourseAIUsageCard from './CourseAIUsageCard';
import CourseAPIKeysCard from './CourseAPIKeysCard';
import PendingAgentActionsCard from './PendingAgentActionsCard';
import StudentAliasLookupCard from './StudentAliasLookupCard';
import FieldStatusText, { FieldStatus, useSaveAnnouncer } from './FieldStatusText';

import { timezones } from '../other/timezones';
import { colors } from '../../../theme/colors';
import { useCourseCapabilities } from '../../../stores/usePermissionsStore';

const { Text } = Typography;
import dayjs from 'dayjs';

/**********************************************************************************************************************/
/* Section definitions
/**********************************************************************************************************************/

import type { Capability } from '../../../stores/usePermissionsStore';

interface SectionDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  capability?: Capability;
}

/** The course fields this page saves one at a time, the moment a control changes. */
type SettingKey =
  | 'name'
  | 'period'
  | 'timezone'
  | 'lateDayCreditsAllowable'
  | 'sendReleasedSubmissionsToBack'
  | 'showStudentsStatistics'
  | 'emailNewUsers'
  | 'anonymousGradingDefault'
  | 'gradersCanGradeQuizzes'
  | 'allowGradersToEditRubric'
  | 'archived';

const ALL_SECTIONS: SectionDef[] = [
  { key: 'identity', label: 'Identity', icon: <BookOutlined />, description: 'Name and period' },
  { key: 'behavior', label: 'Behavior', icon: <SettingOutlined />, description: 'Toggles and defaults' },
  { key: 'scheduling', label: 'Scheduling', icon: <ClockCircleOutlined />, description: 'Late days and timezone' },
  {
    key: 'ai',
    label: 'AI Features',
    icon: <RobotOutlined />,
    description: 'Provider and config',
    capability: 'configure_ai',
  },
  {
    key: 'ai-usage',
    label: 'AI Usage',
    icon: <BarChartOutlined />,
    description: 'Usage analytics',
    capability: 'view_ai_usage',
  },
  {
    key: 'api-keys',
    label: 'API Keys',
    icon: <KeyOutlined />,
    description: 'Course-scoped keys',
    capability: 'manage_course_api_keys',
  },
  { key: 'webhooks', label: 'Webhooks', icon: <ApiOutlined />, description: 'Event notifications' },
  {
    key: 'pending-agent-actions',
    label: 'Pending Agent Actions',
    icon: <SafetyOutlined />,
    description: 'Agent approvals',
    capability: 'manage_course_api_keys',
  },
  {
    key: 'student-aliases',
    label: 'Student Aliases',
    icon: <UserSwitchOutlined />,
    description: 'Resolve agent aliases',
    capability: 'manage_course_api_keys',
  },
  { key: 'info', label: 'Info', icon: <InfoCircleOutlined />, description: 'IDs and metadata' },
];

/** Scroll `el` to the top and keep it there while the cards above it finish loading and grow;
 *  a single scroll on mount ends up thousands of pixels off once AI usage and API keys arrive. */
const followDeepLink = (el: HTMLElement) => {
  const pin = () => el.scrollIntoView({ block: 'start' });
  requestAnimationFrame(pin);
  const grower = el.parentElement;
  if (!grower || typeof ResizeObserver === 'undefined') return;
  const observer = new ResizeObserver(pin);
  observer.observe(grower);
  window.setTimeout(() => observer.disconnect(), 3000);
};

/**********************************************************************************************************************/
/* Main component
/**********************************************************************************************************************/

interface IProps {
  currentCourse: Course;
  updateSettings: (newCourse: Course) => Promise<Course>;
}

const CourseSettingsPanel: React.FC<IProps> = (props) => {
  const [fieldStatus, setFieldStatus] = React.useState<Record<string, FieldStatus>>({});
  const { announce, region: announcer } = useSaveAnnouncer();
  const [form] = Form.useForm();
  const [activeSection, setActiveSection] = React.useState('identity');
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const navItemRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const railInnerRef = React.useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({ opacity: 0 });
  const courseCaps = useCourseCapabilities(props.currentCourse.id);
  const canEditSettings = courseCaps.edit_course_settings !== false;

  // Filter sections based on capabilities — stabilize reference
  const sectionKeys = ALL_SECTIONS.filter((s) => !s.capability || courseCaps[s.capability] !== false)
    .map((s) => s.key)
    .join(',');
  const sections = React.useMemo(
    () => ALL_SECTIONS.filter((s) => !s.capability || courseCaps[s.capability] !== false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionKeys],
  );

  // Reset form when course changes
  React.useEffect(() => {
    setFieldStatus({});
    form.resetFields();
  }, [props.currentCourse.id, form]);

  // Position the sliding indicator behind the active nav item
  const activeSectionRef = React.useRef(activeSection);
  activeSectionRef.current = activeSection;

  React.useLayoutEffect(() => {
    const activeEl = navItemRefs.current[activeSection];
    const container = railInnerRef.current;
    if (!activeEl || !container) return;
    const containerRect = container.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    setIndicatorStyle({
      top: itemRect.top - containerRect.top,
      height: itemRect.height,
      opacity: 1,
    });
  }, [activeSection]);

  // Intersection observer — uses the outer layout scroll container (nearest scrollable ancestor)
  React.useEffect(() => {
    // Track which sections are currently intersecting
    const visibleKeys = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.sectionKey;
          if (!key) continue;
          if (entry.isIntersecting) {
            visibleKeys.add(key);
          } else {
            visibleKeys.delete(key);
          }
        }
        // Pick the topmost visible section (first in sections order)
        for (const section of sections) {
          if (visibleKeys.has(section.key)) {
            setActiveSection(section.key);
            break;
          }
        }
      },
      { rootMargin: '-120px 0px -50% 0px', threshold: 0 },
    );

    for (const section of sections) {
      const el = sectionRefs.current[section.key];
      if (!el) continue;
      el.dataset.sectionKey = section.key;
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (key: string) => {
    const el = sectionRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Deep link: /settings?section=<key> scrolls to that section the moment its element mounts
  // (agents hand instructors this link to reach Pending agent actions; the sidebar's old
  // Webhooks link lands on ?section=webhooks). The sections mount inside a child that renders
  // after this panel, so the hook lives in the ref callback rather than a parent effect.
  const deepLinkedSection = React.useRef(false);

  // Every control saves itself; there is no Save button. Saves run one after another so
  // two quick toggles never race: each sends the latest known course plus its own change,
  // and the server's answer is carried forward to the next.
  const latestCourse = React.useRef<Course>(props.currentCourse);
  React.useEffect(() => {
    latestCourse.current = props.currentCourse;
  }, [props.currentCourse]);
  const queue = React.useRef<Promise<unknown>>(Promise.resolve());
  const clearTimers = React.useRef<Record<string, number>>({});
  React.useEffect(() => () => Object.values(clearTimers.current).forEach((t) => window.clearTimeout(t)), []);

  const setStatus = (key: string, status: FieldStatus | null) => {
    setFieldStatus((prev) => {
      const next = { ...prev };
      if (status) next[key] = status;
      else delete next[key];
      return next;
    });
  };

  const saveField = (key: SettingKey, value: unknown, label: string, previous: unknown): Promise<unknown> => {
    window.clearTimeout(clearTimers.current[key]);
    setStatus(key, { state: 'saving' });
    const run = async () => {
      try {
        const saved = await props.updateSettings({
          ...latestCourse.current,
          [key]: value,
          assignments: [],
          sections: [],
        } as Course);
        latestCourse.current = saved;
        setStatus(key, { state: 'saved' });
        announce(`${label} saved.`);
        clearTimers.current[key] = window.setTimeout(() => setStatus(key, null), 2500);
        message.success({
          key: 'course-settings-save',
          duration: 6,
          content: (
            <span>
              {label} saved.{' '}
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto' }}
                onClick={() => {
                  message.destroy('course-settings-save');
                  form.setFieldValue(key, previous);
                  void saveField(key, previous, label, value);
                }}
              >
                Undo
              </Button>
            </span>
          ),
        });
      } catch (e) {
        // Put the control back, unless the user has already typed something newer into it.
        if (form.getFieldValue(key) === value) form.setFieldValue(key, previous);
        const detail = (await apiErrorMessageAsync(e, key)) ?? 'Could not save this setting.';
        setStatus(key, { state: 'error', detail });
        announce(`${label} was not saved. ${detail}`);
      }
    };
    queue.current = queue.current.then(run, run);
    return queue.current;
  };

  const setSectionRef = (key: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el;
    if (el && !deepLinkedSection.current && key === new URLSearchParams(window.location.search).get('section')) {
      deepLinkedSection.current = true;
      followDeepLink(el);
    }
  };

  return (
    <div style={styles.shell}>
      {/* ── Sticky top bar ── */}
      <div style={styles.topBar}>
        <Flex align="center" justify="space-between" style={{ width: '100%' }}>
          {/* Same title treatment as the other sections' page frames; the rail is the breadcrumb. */}
          <div>
            <h1
              className="cp-label cp-label--large cp-label--bold"
              style={{ margin: 0, color: 'inherit', letterSpacing: '-0.3px', lineHeight: 1.2 }}
            >
              Course Settings
            </h1>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Changes save as you make them.
          </Text>
        </Flex>
      </div>

      <div style={styles.body}>
        {/* ── Left rail navigation ── */}
        <nav style={styles.rail} aria-label="Settings sections">
          <div style={styles.railSticky}>
            <div style={styles.railHeader}>
              <Text style={styles.railHeaderText}>Sections</Text>
            </div>
            <div ref={railInnerRef} style={styles.railInner}>
              {/* sliding indicator */}
              <div
                style={{
                  ...styles.indicator,
                  ...indicatorStyle,
                }}
              />
              {sections.map((section) => {
                const isActive = activeSection === section.key;
                return (
                  <button
                    key={section.key}
                    ref={(el) => {
                      navItemRefs.current[section.key] = el;
                    }}
                    onClick={() => scrollToSection(section.key)}
                    style={styles.navItem}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span
                      style={{
                        ...styles.navIconBadge,
                        color: isActive ? colors.brandPrimary : 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {section.icon}
                    </span>
                    <span
                      style={{
                        ...styles.navLabel,
                        color: isActive ? colors.brandPrimary : 'rgba(0, 0, 0, 0.55)',
                        fontWeight: isActive ? 600 : 450,
                      }}
                    >
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ── Content area ── */}
        <div style={styles.content}>
          {announcer}
          <SettingsForm
            form={form}
            thisCourse={props.currentCourse}
            lastSaved={() => latestCourse.current}
            canEdit={canEditSettings}
            fieldStatus={fieldStatus}
            saveField={saveField}
            setStatus={setStatus}
            setSectionRef={setSectionRef}
            visibleSectionKeys={sections.map((s) => s.key)}
          />
        </div>
      </div>
    </div>
  );
};

/***********************************************************************************/
/* Form component
/***********************************************************************************/

interface IFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  thisCourse: Course;
  /** The last course the server confirmed: the baseline for "did this change?" and for Undo,
   *  which the `thisCourse` prop lags behind while a save is in flight. */
  lastSaved: () => Course;
  canEdit: boolean;
  fieldStatus: Record<string, FieldStatus>;
  saveField: (key: SettingKey, value: unknown, label: string, previous: unknown) => Promise<unknown>;
  setStatus: (key: string, status: FieldStatus | null) => void;
  setSectionRef: (key: string) => (el: HTMLDivElement | null) => void;
  visibleSectionKeys: string[];
}

const SettingsForm: React.FC<IFormProps> = (props) => {
  const { form, thisCourse, lastSaved, canEdit, fieldStatus, saveField, setStatus, setSectionRef, visibleSectionKeys } =
    props;

  // Text fields save when you leave them (or press Enter), once they pass their rules.
  const commitText = (key: 'name' | 'period', label: string) => {
    form.validateFields([key]).then(
      (values) => {
        const value = (values as Record<string, string>)[key];
        setStatus(key, null);
        const previous = lastSaved()[key];
        if (value === previous) return;
        void saveField(key, value, label, previous);
      },
      () => setStatus(key, { state: 'error', detail: 'Not saved until this is fixed.' }),
    );
  };

  const commitLateDays = () => {
    const value = form.getFieldValue('lateDayCreditsAllowable') as number | null;
    const previous = lastSaved().lateDayCreditsAllowable;
    if (value === previous) return;
    void saveField('lateDayCreditsAllowable', value, 'Late day credits', previous);
  };

  // Archiving locks the whole course, so it is the one switch that asks first.
  const onToggle = (setting: { key: string; title: string; danger?: boolean }, checked: boolean) => {
    const key = setting.key as SettingKey;
    if (setting.danger && checked) {
      Modal.confirm({
        title: 'Archive this course?',
        content:
          'Nothing in it can be edited until you unarchive it. Everything is kept, and students and graders keep read access.',
        okText: 'Archive',
        okButtonProps: { danger: true },
        cancelText: 'Keep editing',
        onOk: () => saveField(key, true, setting.title, false),
        onCancel: () => form.setFieldValue(key, false),
      });
      return;
    }
    void saveField(key, checked, setting.title, !checked);
  };

  // Webhooks are their own resources; the course only lists their ids.
  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery({
    queryKey: ['webhooks', thisCourse.id] as const,
    queryFn: async (): Promise<Webhook[]> =>
      Promise.all((thisCourse.webhooks ?? []).map((id: number) => webhooksApi.retrieve({ id }))),
    enabled: (thisCourse.webhooks?.length ?? 0) > 0,
  });

  // Watch form values for visual feedback
  const showStudentsStatistics = Form.useWatch('showStudentsStatistics', form);
  const sendReleasedSubmissionsToBack = Form.useWatch('sendReleasedSubmissionsToBack', form);
  const emailNewUsers = Form.useWatch('emailNewUsers', form);
  const anonymousGradingDefault = Form.useWatch('anonymousGradingDefault', form);
  const gradersCanGradeQuizzes = Form.useWatch('gradersCanGradeQuizzes', form);
  const allowGradersToEditRubric = Form.useWatch('allowGradersToEditRubric', form);
  const archived = Form.useWatch('archived', form);

  const settingsData = [
    {
      key: 'showStudentsStatistics',
      title: 'Show Statistics to Students',
      description: 'Display assignment mean and median to students when the assignment is released.',
      enabled: showStudentsStatistics ?? thisCourse.showStudentsStatistics,
      initialValue: thisCourse.showStudentsStatistics,
    },
    {
      key: 'sendReleasedSubmissionsToBack',
      title: 'Send Released to Back of Queue',
      description:
        'Move released submissions to the back of the grader queue, preventing graders from reclaiming just-released work.',
      enabled: sendReleasedSubmissionsToBack ?? thisCourse.sendReleasedSubmissionsToBack,
      initialValue: thisCourse.sendReleasedSubmissionsToBack,
    },
    {
      key: 'emailNewUsers',
      title: 'Email Users on Roster Add',
      description:
        'Send notification emails to users when they are added to this course. New users will be prompted to create an account.',
      enabled: emailNewUsers ?? thisCourse.emailNewUsers,
      initialValue: thisCourse.emailNewUsers,
    },
    {
      key: 'anonymousGradingDefault',
      title: 'Default to Anonymous Grading',
      description: 'New assignments will default to Anonymous Grading Mode. This can be toggled per-assignment.',
      enabled: anonymousGradingDefault ?? thisCourse.anonymousGradingDefault,
      initialValue: thisCourse.anonymousGradingDefault,
    },
    {
      key: 'gradersCanGradeQuizzes',
      title: 'Graders Can Grade Quizzes',
      description:
        'All graders can view and grade quiz responses (essay/code). Turn off to grant quiz ' +
        'grading per-grader via the Quiz Grader role on the Graders roster page.',
      enabled: gradersCanGradeQuizzes ?? thisCourse.gradersCanGradeQuizzes ?? true,
      initialValue: thisCourse.gradersCanGradeQuizzes ?? true,
    },
    {
      key: 'allowGradersToEditRubric',
      title: 'Allow Graders to Edit Rubric',
      description:
        'Graders can add rubric comments and edit ones not yet used in grading. They cannot delete ' +
        'comments or change categories.',
      enabled: allowGradersToEditRubric ?? thisCourse.allowGradersToEditRubric ?? false,
      initialValue: thisCourse.allowGradersToEditRubric ?? false,
    },
    {
      key: 'archived',
      title: 'Archive Course',
      description: 'Archived courses are read-only. All content will be preserved but cannot be edited.',
      enabled: archived ?? thisCourse.archived,
      initialValue: thisCourse.archived,
      danger: true,
    },
  ];

  return (
    <>
      <Form form={form} layout="horizontal">
        {/* ━━━ Course Identity ━━━ */}
        <div ref={setSectionRef('identity')} style={styles.section}>
          <SectionHeader
            icon={<BookOutlined />}
            title="Course Identity"
            subtitle="Your course's name and term period. Each field saves when you leave it."
          />
          <div style={styles.sectionCard}>
            <Flex vertical gap={20} style={{ padding: '20px 24px' }}>
              <Form.Item
                name="name"
                label={
                  <Text strong style={styles.fieldLabel}>
                    Course Name
                  </Text>
                }
                initialValue={thisCourse.name}
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: 'Please enter a course name with at least 4 characters', min: 4 },
                  { message: 'Course name cannot exceed 36 characters', max: 36 },
                ]}
                extra={<FieldStatusText status={fieldStatus.name} />}
              >
                <Input
                  id="course-name"
                  aria-label="Course Name"
                  maxLength={36}
                  minLength={4}
                  count={{ show: true }}
                  style={styles.input}
                  disabled={!canEdit}
                  onBlur={() => commitText('name', 'Course name')}
                  onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                />
              </Form.Item>
              <Form.Item
                name="period"
                label={
                  <Text strong style={styles.fieldLabel}>
                    Course Period
                  </Text>
                }
                initialValue={thisCourse.period}
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: 'Please enter a course period.' },
                  { message: 'Course period cannot exceed 32 characters', max: 32 },
                ]}
                extra={<FieldStatusText status={fieldStatus.period} />}
              >
                <Input
                  id="course-period"
                  aria-label="Course Period"
                  maxLength={32}
                  minLength={1}
                  count={{ show: true }}
                  style={styles.input}
                  disabled={!canEdit}
                  onBlur={() => commitText('period', 'Course period')}
                  onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                />
              </Form.Item>
            </Flex>
          </div>
        </div>

        {/* ━━━ Behavior ━━━ */}
        <div ref={setSectionRef('behavior')} style={styles.section}>
          <SectionHeader icon={<SettingOutlined />} title="Behavior" subtitle="How your course operates" />
          <div style={styles.sectionCard}>
            <Flex vertical gap={0}>
              {settingsData.map((setting, idx) => (
                <div
                  key={setting.key}
                  style={{
                    ...styles.toggleRow,
                    borderBottom: idx < settingsData.length - 1 ? '1px solid rgba(0,0,0,0.045)' : 'none',
                    borderLeft: setting.enabled
                      ? `3px solid ${setting.danger ? colors.actionRed : colors.brandPrimary}`
                      : '3px solid transparent',
                    background: setting.enabled
                      ? setting.danger
                        ? 'rgba(246, 72, 82, 0.02)'
                        : 'rgba(25, 134, 101, 0.015)'
                      : 'transparent',
                  }}
                >
                  <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                    <Flex vertical style={{ flex: 1, paddingRight: 24 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 14,
                          lineHeight: '22px',
                          color: setting.danger && setting.enabled ? colors.actionRed : 'rgba(0, 0, 0, 0.78)',
                        }}
                      >
                        {setting.title}
                      </Text>
                      <Text style={{ fontSize: 13, lineHeight: '20px', color: 'rgba(0, 0, 0, 0.6)' }}>
                        {setting.description}
                      </Text>
                    </Flex>
                    <FieldStatusText status={fieldStatus[setting.key]} style={{ marginRight: 12 }} />
                    <Form.Item
                      name={setting.key}
                      valuePropName="checked"
                      initialValue={setting.initialValue}
                      style={{ marginBottom: 0, flexShrink: 0 }}
                    >
                      <Switch
                        id={`switch-${setting.key}`}
                        aria-label={setting.title}
                        disabled={!canEdit}
                        loading={fieldStatus[setting.key]?.state === 'saving'}
                        onChange={(checked) => onToggle(setting, checked)}
                      />
                    </Form.Item>
                  </Flex>
                </div>
              ))}
            </Flex>
          </div>
        </div>

        {/* ━━━ Scheduling ━━━ */}
        <div ref={setSectionRef('scheduling')} style={styles.section}>
          <SectionHeader icon={<ClockCircleOutlined />} title="Scheduling" subtitle="Late days and timezone settings" />
          <div style={styles.sectionCard}>
            <Flex vertical gap={0}>
              <div style={styles.toggleRow}>
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                  <Flex vertical style={{ flex: 1, paddingRight: 24 }}>
                    <Text strong style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.78)' }}>
                      Late Day Credits
                    </Text>
                    <Text style={{ fontSize: 13, color: 'rgba(0, 0, 0, 0.6)' }}>
                      Maximum late day credits a student can use per assignment.
                    </Text>
                  </Flex>
                  <FieldStatusText status={fieldStatus.lateDayCreditsAllowable} style={{ marginRight: 12 }} />
                  {/* Saves once focus leaves the On/Off + number pair, not on every keystroke. */}
                  <span
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commitLateDays();
                    }}
                  >
                    <Form.Item
                      name="lateDayCreditsAllowable"
                      initialValue={thisCourse.lateDayCreditsAllowable}
                      style={{ marginBottom: 0, flexShrink: 0 }}
                    >
                      <InputNumberOrNull value={null} onChange={() => undefined} disabled={!canEdit} />
                    </Form.Item>
                  </span>
                </Flex>
              </div>
              <div style={{ ...styles.toggleRow, borderBottom: 'none' }}>
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                  <Flex vertical style={{ flex: 1, paddingRight: 24 }}>
                    <Text strong style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.78)' }}>
                      Course Timezone
                    </Text>
                    <Text style={{ fontSize: 13, color: 'rgba(0, 0, 0, 0.6)' }}>
                      All dates and times are displayed in this timezone.
                    </Text>
                  </Flex>
                  <FieldStatusText status={fieldStatus.timezone} style={{ marginRight: 12 }} />
                  <Form.Item
                    name="timezone"
                    initialValue={thisCourse.timezone}
                    style={{ marginBottom: 0, flexShrink: 0 }}
                  >
                    <Select
                      aria-label="Course Timezone"
                      style={{ width: 220 }}
                      disabled={!canEdit}
                      onChange={(tz: string) => void saveField('timezone', tz, 'Course timezone', lastSaved().timezone)}
                      showSearch
                    >
                      {timezones.map((tz, i) => (
                        <Select.Option key={i} value={tz}>
                          {tz}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Flex>
              </div>
            </Flex>
          </div>
        </div>
      </Form>

      {/* ━━━ AI Features ━━━ */}
      {visibleSectionKeys.includes('ai') && (
        <div ref={setSectionRef('ai')} style={styles.section}>
          <AISettingsCard courseId={thisCourse.id} />
        </div>
      )}

      {/* ━━━ AI Usage ━━━ */}
      {visibleSectionKeys.includes('ai-usage') && (
        <div ref={setSectionRef('ai-usage')} style={styles.section}>
          <CourseAIUsageCard courseId={thisCourse.id} />
        </div>
      )}

      {/* ━━━ API Keys ━━━ */}
      {visibleSectionKeys.includes('api-keys') && (
        <div ref={setSectionRef('api-keys')} style={styles.section}>
          <CourseAPIKeysCard courseId={thisCourse.id} />
        </div>
      )}

      {/* ━━━ Webhooks ━━━ */}
      {visibleSectionKeys.includes('webhooks') && (
        <div ref={setSectionRef('webhooks')} style={styles.section}>
          <SectionHeader icon={<ApiOutlined />} title="Webhooks" subtitle="Send course events to your own services" />
          <div style={styles.sectionCard}>
            {webhooksLoading ? <Skeleton active /> : <WebhooksTable webhooks={webhooks} course={thisCourse} />}
          </div>
        </div>
      )}

      {/* ━━━ Pending Agent Actions ━━━ */}
      {visibleSectionKeys.includes('pending-agent-actions') && (
        <div ref={setSectionRef('pending-agent-actions')} style={styles.section}>
          <PendingAgentActionsCard courseId={thisCourse.id} />
        </div>
      )}

      {/* ━━━ Student Aliases ━━━ */}
      {visibleSectionKeys.includes('student-aliases') && (
        <div ref={setSectionRef('student-aliases')} style={styles.section}>
          <StudentAliasLookupCard courseId={thisCourse.id} />
        </div>
      )}

      {/* ━━━ Course Info ━━━ */}
      <div ref={setSectionRef('info')} style={styles.section}>
        <SectionHeader icon={<InfoCircleOutlined />} title="Course Information" subtitle="Read-only metadata" />
        <div style={styles.sectionCard}>
          <Descriptions
            column={1}
            size="small"
            styles={{
              label: {
                color: 'rgba(0, 0, 0, 0.6)',
                fontWeight: 500,
                fontSize: 13,
                padding: '12px 24px',
              },
              content: { fontSize: 13, padding: '12px 24px' },
            }}
            style={{ background: 'transparent' }}
          >
            <Descriptions.Item label="Course ID">
              <Text code style={{ fontSize: 12, padding: '2px 8px' }}>
                {thisCourse.id}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Expires">
              {thisCourse.expirationDate ? dayjs(thisCourse.expirationDate).format('MMMM D, YYYY') : 'Never'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div style={{ height: 80 }} />
    </>
  );
};

/***********************************************************************************/
/* Section header
/***********************************************************************************/

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({
  icon,
  title,
  subtitle,
}) => (
  <Flex align="center" gap={14} style={{ marginBottom: 16 }}>
    <div style={styles.sectionIconBadge}>
      <span style={{ fontSize: 16, color: colors.brandPrimary, lineHeight: 1 }}>{icon}</span>
    </div>
    <Flex vertical gap={1}>
      {/* Real section headings under the page's h1, so the card titles (h3) keep a valid order. */}
      <Text role="heading" aria-level={2} style={styles.sectionTitle}>
        {title}
      </Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </Flex>
  </Flex>
);

/***********************************************************************************/
/* Styles
/***********************************************************************************/

const styles: Record<string, React.CSSProperties> = {
  // Same frame as CPAdminDetail: a white card with the console's margins and shadow.
  shell: {
    margin: '24px 48px',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  },

  // ── Top bar ──
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Same title line as the other sections' page frames (28px above the h1 in CPAdminDetail).
    padding: '28px 36px 16px',
    minHeight: 56,
    background: '#fff',
    borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
    borderRadius: '8px 8px 0 0',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  // ── Body layout ──
  body: {
    display: 'flex',
  },

  // ── Left rail ──
  rail: {
    width: 200,
    flexShrink: 0,
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    background: '#fff',
  },
  railSticky: {
    position: 'sticky' as const,
    top: 56,
    padding: '0 0 16px 0',
  },
  railHeader: {
    padding: '20px 20px 12px 20px',
  },
  railHeaderText: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1.2px',
    color: 'rgba(0, 0, 0, 0.55)',
    textTransform: 'uppercase' as const,
  },
  railInner: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    padding: '0 8px',
    position: 'relative' as const,
  },
  indicator: {
    position: 'absolute' as const,
    left: 8,
    right: 8,
    borderRadius: 8,
    background: 'rgba(25, 134, 101, 0.06)',
    transition: 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s ease, opacity 0.2s ease',
    pointerEvents: 'none' as const,
    zIndex: 0,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: 8,
    textAlign: 'left' as const,
    width: '100%',
    position: 'relative' as const,
    zIndex: 1,
  },
  navIconBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 7,
    fontSize: 14,
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  navLabel: {
    fontSize: 13,
    lineHeight: '18px',
    letterSpacing: '-0.1px',
    transition: 'all 0.15s ease',
  },

  // ── Content ──
  content: {
    flex: 1,
    padding: '36px 48px 24px 48px',
    minWidth: 0,
  },

  // ── Sections ──
  section: {
    marginBottom: 40,
    // Clears the sticky title bar (56px) when a rail click or deep link scrolls a section into view.
    scrollMarginTop: 76,
    maxWidth: 780,
  },
  sectionIconBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 9,
    background: `linear-gradient(135deg, ${colors.brandLight}, rgba(25, 134, 101, 0.07))`,
    border: `1px solid rgba(25, 134, 101, 0.1)`,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 650,
    color: 'rgba(0, 0, 0, 0.82)',
    letterSpacing: '-0.3px',
    lineHeight: '22px',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: '18px',
  },
  sectionCard: {
    background: '#fff',
    border: '1px solid rgba(0, 0, 0, 0.07)',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
    padding: '4px 0',
    overflow: 'hidden',
  },

  // ── Shared ──
  toggleRow: {
    padding: '16px 24px',
    transition: 'background 0.2s ease',
    borderBottom: '1px solid rgba(0,0,0,0.045)',
  },
  fieldLabel: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.65)',
  },
  input: {
    maxWidth: 380,
  },
};

export default CourseSettingsPanel;

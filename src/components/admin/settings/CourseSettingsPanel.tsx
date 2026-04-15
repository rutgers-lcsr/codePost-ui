// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import {
  BookOutlined,
  KeyOutlined,
  RedoOutlined,
  RobotOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

/* style imports */
import { Descriptions, Flex, Form, Input, message, Select, Switch, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';

/* codePost imports */
import { Course } from '../../../api-client';
import InputNumberOrNull from './InputNumberOrNull';
import AISettingsCard from './AISettingsCard';
import CourseAIUsageCard from './CourseAIUsageCard';
import CourseAPIKeysCard from './CourseAPIKeysCard';

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
  { key: 'info', label: 'Info', icon: <InfoCircleOutlined />, description: 'IDs and metadata' },
];

/**********************************************************************************************************************/
/* Main component
/**********************************************************************************************************************/

interface IProps {
  currentCourse: Course;
  updateSettings: (newCourse: Course) => Promise<Course>;
}

const CourseSettingsPanel: React.FC<IProps> = (props) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
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
    setIsLoading(false);
    setIsDirty(false);
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

  const resetForm = () => {
    form.resetFields();
    setIsDirty(false);
  };

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        updateSettings(values);
      })
      .catch((info) => {
        console.log('Validation Failed:', info);
      });
  };

  const updateSettings = (values: Course & { allowGradersToEditRubric?: boolean }) => {
    setIsLoading(true);
    const { currentCourse } = props;

    const payload: Course = {
      ...currentCourse,
      name: values.name,
      period: values.period,
      sendReleasedSubmissionsToBack: values.sendReleasedSubmissionsToBack,
      showStudentsStatistics: values.showStudentsStatistics,
      timezone: values.timezone,
      emailNewUsers: values.emailNewUsers,
      anonymousGradingDefault: values.anonymousGradingDefault,
      lateDayCreditsAllowable: values.lateDayCreditsAllowable,
      assignments: [],
      sections: [],
      archived: values.archived,
    };

    props.updateSettings(payload).then(() => {
      message.success('Your settings were saved!');

      setTimeout(() => {
        window.location.reload();
      }, 1000);

      setIsLoading(false);
      setIsDirty(false);
    });
  };

  const makeDirty = () => {
    setIsDirty(true);
  };

  const setSectionRef = (key: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el;
  };

  return (
    <div style={styles.shell}>
      {/* ── Sticky top bar ── */}
      <div style={styles.topBar}>
        <Flex align="center" justify="space-between" style={{ width: '100%' }}>
          <Text style={styles.topBarTitle}>Settings</Text>
          <Flex gap={8}>
            {isDirty && (
              <div style={styles.unsavedPill}>
                <div style={styles.unsavedDot} />
                <Text style={styles.unsavedText}>Unsaved changes</Text>
              </div>
            )}
            <CPButton
              disabled={!isDirty || isLoading || !canEditSettings}
              icon={<RedoOutlined />}
              cpType="secondary"
              onClick={resetForm}
              size="small"
            >
              Undo
            </CPButton>
            <CPButton
              loading={isLoading}
              cpType="primary"
              onClick={handleSave}
              disabled={!isDirty || !canEditSettings}
              size="small"
            >
              Save changes
            </CPButton>
          </Flex>
        </Flex>
      </div>

      <div style={styles.body}>
        {/* ── Left rail navigation ── */}
        <nav style={styles.rail} aria-label="Settings sections">
          <div style={styles.railSticky}>
            <div style={styles.railHeader}>
              <Text style={styles.railHeaderText}>SETTINGS</Text>
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
                        color: isActive ? colors.brandPrimary : 'rgba(0, 0, 0, 0.3)',
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
          <SettingsForm
            form={form}
            thisCourse={props.currentCourse}
            makeDirty={makeDirty}
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
  makeDirty: () => void;
  setSectionRef: (key: string) => (el: HTMLDivElement | null) => void;
  visibleSectionKeys: string[];
}

const SettingsForm: React.FC<IFormProps> = (props) => {
  const { form, thisCourse, makeDirty, setSectionRef, visibleSectionKeys } = props;

  // Watch form values for visual feedback
  const showStudentsStatistics = Form.useWatch('showStudentsStatistics', form);
  const sendReleasedSubmissionsToBack = Form.useWatch('sendReleasedSubmissionsToBack', form);
  const emailNewUsers = Form.useWatch('emailNewUsers', form);
  const anonymousGradingDefault = Form.useWatch('anonymousGradingDefault', form);
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
      <Form form={form} layout="horizontal" onChange={makeDirty}>
        {/* ━━━ Course Identity ━━━ */}
        <div ref={setSectionRef('identity')} style={styles.section}>
          <SectionHeader
            icon={<BookOutlined />}
            title="Course Identity"
            subtitle="Your course's name and term period"
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
              >
                <Input
                  id="course-name"
                  aria-label="Course Name"
                  defaultValue={thisCourse.name}
                  maxLength={36}
                  minLength={4}
                  count={{ show: true }}
                  style={styles.input}
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
              >
                <Input
                  id="course-period"
                  aria-label="Course Period"
                  defaultValue={thisCourse.period}
                  maxLength={32}
                  minLength={1}
                  count={{ show: true }}
                  style={styles.input}
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
                      <Text style={{ fontSize: 13, lineHeight: '20px', color: 'rgba(0, 0, 0, 0.4)' }}>
                        {setting.description}
                      </Text>
                    </Flex>
                    <Form.Item
                      name={setting.key}
                      valuePropName="checked"
                      initialValue={setting.initialValue}
                      style={{ marginBottom: 0, flexShrink: 0 }}
                    >
                      <Switch id={`switch-${setting.key}`} aria-label={setting.title} onChange={makeDirty} />
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
                    <Text style={{ fontSize: 13, color: 'rgba(0, 0, 0, 0.4)' }}>
                      Maximum late day credits a student can use per assignment.
                    </Text>
                  </Flex>
                  <Form.Item
                    name="lateDayCreditsAllowable"
                    initialValue={thisCourse.lateDayCreditsAllowable}
                    style={{ marginBottom: 0, flexShrink: 0 }}
                  >
                    <InputNumberOrNull value={null} onChange={makeDirty} />
                  </Form.Item>
                </Flex>
              </div>
              <div style={{ ...styles.toggleRow, borderBottom: 'none' }}>
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                  <Flex vertical style={{ flex: 1, paddingRight: 24 }}>
                    <Text strong style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.78)' }}>
                      Course Timezone
                    </Text>
                    <Text style={{ fontSize: 13, color: 'rgba(0, 0, 0, 0.4)' }}>
                      All dates and times are displayed in this timezone.
                    </Text>
                  </Flex>
                  <Form.Item
                    name="timezone"
                    initialValue={thisCourse.timezone}
                    style={{ marginBottom: 0, flexShrink: 0 }}
                  >
                    <Select aria-label="Course Timezone" style={{ width: 220 }} onChange={makeDirty} showSearch>
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

      {/* ━━━ Course Info ━━━ */}
      <div ref={setSectionRef('info')} style={styles.section}>
        <SectionHeader icon={<InfoCircleOutlined />} title="Course Information" subtitle="Read-only metadata" />
        <div style={styles.sectionCard}>
          <Descriptions
            column={1}
            size="small"
            labelStyle={{
              color: 'rgba(0, 0, 0, 0.45)',
              fontWeight: 500,
              fontSize: 13,
              padding: '12px 24px',
            }}
            contentStyle={{ fontSize: 13, padding: '12px 24px' }}
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
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </Flex>
  </Flex>
);

/***********************************************************************************/
/* Styles
/***********************************************************************************/

const styles: Record<string, React.CSSProperties> = {
  shell: {
    background: '#f5f6f8',
    minHeight: '100%',
  },

  // ── Top bar ──
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: 56,
    background: '#fff',
    borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(0, 0, 0, 0.45)',
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
  },
  unsavedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 14px',
    borderRadius: 20,
    background: 'rgba(255, 191, 0, 0.06)',
    border: '1px solid rgba(255, 191, 0, 0.2)',
  },
  unsavedDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: colors.actionYellow,
    boxShadow: '0 0 6px rgba(255, 191, 0, 0.4)',
  },
  unsavedText: {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(0, 0, 0, 0.5)',
  },

  // ── Body layout ──
  body: {
    display: 'flex',
    minHeight: 'calc(100dvh - 56px)',
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
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '1.2px',
    color: 'rgba(0, 0, 0, 0.25)',
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
    padding: '36px 48px 0 48px',
    minWidth: 0,
  },

  // ── Sections ──
  section: {
    marginBottom: 40,
    scrollMarginTop: 20,
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
    color: 'rgba(0, 0, 0, 0.38)',
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

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { RedoOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Card, Descriptions, Flex, Form, Input, message, Select, Space, Switch, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';
import CPAdminDetail from '../other/CPAdminDetail';

/* codePost imports */
import { CoursePatchType, CourseType } from '../../../infrastructure/course';
import InputNumberOrNull from './InputNumberOrNull';

import { timezones } from '../other/timezones';

const { Text } = Typography;
import dayjs from 'dayjs';

/**********************************************************************************************************************/

interface IProps {
  currentCourse: CourseType;
  updateSettings: (newCourse: CoursePatchType) => Promise<CourseType>;
}

const CourseSettingsPanel: React.FC<IProps> = (props) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [form] = Form.useForm();

  // Reset form when course changes
  React.useEffect(() => {
    setIsLoading(false);
    setIsDirty(false);
    form.resetFields();
  }, [props.currentCourse.id, form]);

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

  const updateSettings = (values: CoursePatchType & { allowGradersToEditRubric?: boolean }) => {
    setIsLoading(true);
    const { currentCourse } = props;
    const payload = {
      id: currentCourse.id, // codePost convention
      name: values.name,
      period: values.period,
      sendReleasedSubmissionsToBack: values.sendReleasedSubmissionsToBack,
      showStudentsStatistics: values.showStudentsStatistics,
      timezone: values.timezone,
      emailNewUsers: values.emailNewUsers,
      anonymousGradingDefault: values.anonymousGradingDefault,
      lateDayCreditsAllowable: values.lateDayCreditsAllowable,
      assignments: [], // ignored by API
      sections: [], // ignored by API
      archived: values.archived,
    } as CoursePatchType;

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

  const content = <SettingsForm form={form} thisCourse={props.currentCourse} makeDirty={makeDirty} />;

  const actions = [
    <CPButton key={0} disabled={!isDirty || isLoading} icon={<RedoOutlined />} cpType="secondary" onClick={resetForm}>
      Undo
    </CPButton>,
    <CPButton key={1} loading={isLoading} cpType="primary" onClick={handleSave} disabled={!isDirty}>
      Save changes
    </CPButton>,
  ];

  return (
    <CPAdminDetail
      goBack={null}
      title={`Settings: ${props.currentCourse.name} | ${props.currentCourse.period}`}
      actions={actions}
      content={content}
      breadcrumbs={<Breadcrumb items={[{ title: 'Course Settings' }]} />}
    />
  );
};

/***********************************************************************************/
/* Form component
/***********************************************************************************/

interface IFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  thisCourse: CourseType;
  makeDirty: () => void;
}

const SettingsForm: React.FC<IFormProps> = (props) => {
  const { form, thisCourse, makeDirty } = props;

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
    <Form form={form} layout="horizontal" onChange={makeDirty}>
      {/* Course Name & Period */}
      <Card title="Course Identity" style={{ marginBottom: 24, maxWidth: 600 }}>
        <Flex vertical gap={16}>
          <Form.Item
            name="name"
            initialValue={thisCourse.name}
            style={{ marginBottom: 0 }}
            rules={[
              { required: true, message: 'Please enter a course name with at least 4 characters', min: 4 },
              { message: 'Course name cannot exceed 36 characters', max: 36 },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Space.Addon>Name</Space.Addon>
              <Input defaultValue={thisCourse.name} maxLength={36} minLength={4} count={{ show: true }} />
            </Space.Compact>
          </Form.Item>
          <Form.Item
            name="period"
            initialValue={thisCourse.period}
            style={{ marginBottom: 0 }}
            rules={[
              { required: true, message: 'Please enter a course period.' },
              { message: 'Course period cannot exceed 32 characters', max: 32 },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Space.Addon>Period</Space.Addon>
              <Input defaultValue={thisCourse.period} maxLength={32} minLength={1} count={{ show: true }} />
            </Space.Compact>
          </Form.Item>
        </Flex>
      </Card>

      {/* AI Settings - Prominent position after Course Identity */}
      <AISettingsCard courseId={thisCourse.id} />

      {/* Toggle Settings */}
      <Card
        title="Course Settings"
        extra={<Text type="secondary">Configure course behavior</Text>}
        style={{ marginBottom: 24, maxWidth: 800 }}
      >
        <Flex vertical gap={12}>
          {settingsData.map((setting) => (
            <Card
              key={setting.key}
              size="small"
              style={{
                background: setting.enabled ? (setting.danger ? '#fff2f0' : '#f6ffed') : '#fafafa',
                borderColor: setting.enabled ? (setting.danger ? '#ffccc7' : '#b7eb8f') : '#f0f0f0',
              }}
            >
              <Flex justify="space-between" align="flex-start">
                <Flex vertical style={{ flex: 1, paddingRight: 16 }}>
                  <Text
                    strong
                    style={{
                      fontSize: 15,
                      color: setting.danger && setting.enabled ? '#cf1322' : undefined,
                    }}
                  >
                    {setting.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {setting.description}
                  </Text>
                </Flex>
                <Form.Item
                  name={setting.key}
                  valuePropName="checked"
                  initialValue={setting.initialValue}
                  style={{ marginBottom: 0 }}
                >
                  <Switch onChange={makeDirty} />
                </Form.Item>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Card>

      {/* Additional Settings */}
      <Card
        title="Additional Options"
        extra={<Text type="secondary">Late days and timezone</Text>}
        style={{ marginBottom: 24, maxWidth: 800 }}
      >
        <Flex vertical gap={12}>
          {/* Late Day Credits */}
          <Card size="small" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
            <Flex justify="space-between" align="flex-start">
              <Flex vertical style={{ flex: 1, paddingRight: 16 }}>
                <Text strong style={{ fontSize: 15 }}>
                  Late Day Credits Allowed
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Maximum late day credits a student can use. Only applies when "Allow Student Upload" is enabled.
                </Text>
              </Flex>
              <Form.Item
                name="lateDayCreditsAllowable"
                initialValue={thisCourse.lateDayCreditsAllowable}
                style={{ marginBottom: 0 }}
              >
                <InputNumberOrNull value={null} onChange={makeDirty} />
              </Form.Item>
            </Flex>
          </Card>

          {/* Timezone */}
          <Card size="small" style={{ background: '#fafafa', borderColor: '#f0f0f0' }}>
            <Flex justify="space-between" align="flex-start">
              <Flex vertical style={{ flex: 1, paddingRight: 16 }}>
                <Text strong style={{ fontSize: 15 }}>
                  Course Timezone
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  All dates and times in this course will be displayed in this timezone.
                </Text>
              </Flex>
              <Form.Item name="timezone" initialValue={thisCourse.timezone} style={{ marginBottom: 0 }}>
                <Select style={{ width: 180 }} onChange={makeDirty}>
                  {timezones.map((tz, i) => (
                    <Select.Option key={i} value={tz}>
                      {tz}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Flex>
          </Card>
        </Flex>
      </Card>

      {/* Course Info */}
      <Card title="Course Information" style={{ marginBottom: 24, maxWidth: 800 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Course ID">
            <Text code>{thisCourse.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Expires">
            {thisCourse.expiration_date ? dayjs(thisCourse.expiration_date).format('YYYY-MM-DD') : 'Never'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <div style={{ height: 60 }} />
    </Form>
  );
};

/***********************************************************************************/
/* AI Settings Card (Separate from main settings to use different API endpoint)
/***********************************************************************************/

import { RobotOutlined } from '@ant-design/icons';
import {
  getCourseAISettings,
  updateCourseAISettings,
  AI_PROVIDERS,
  DEFAULT_MODELS,
} from '../../../infrastructure/aiService';
import type { AIProvider } from '../../../infrastructure/aiService';

interface IAISettingsCardProps {
  courseId: number;
}

const AISettingsCard: React.FC<IAISettingsCardProps> = ({ courseId }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [provider, setProvider] = React.useState<AIProvider | undefined>(undefined);
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [model, setModel] = React.useState('');
  const [isDirty, setIsDirty] = React.useState(false);

  // Fetch AI settings on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getCourseAISettings(courseId);
        setAiEnabled(settings.ai_enabled);
        setProvider((settings.ai_provider as AIProvider) || undefined);
        setBaseUrl(settings.ai_base_url || '');
        setModel(settings.ai_model || '');
        // Note: API key is never returned
      } catch (error) {
        console.error('Failed to fetch AI settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [courseId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings: Parameters<typeof updateCourseAISettings>[1] = {};
      if (provider) settings.ai_provider = provider;
      if (apiKey) settings.ai_api_key = apiKey;
      if (baseUrl) settings.ai_base_url = baseUrl;
      if (model) settings.ai_model = model;

      const result = await updateCourseAISettings(courseId, settings);
      setAiEnabled(result.ai_enabled);
      setApiKey(''); // Clear API key from form after save (for security)
      setIsDirty(false);
      message.success('AI settings saved!');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to save AI settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderChange = (value: AIProvider) => {
    setProvider(value);
    setModel(DEFAULT_MODELS[value] || '');
    setIsDirty(true);
  };

  const showBaseUrl = provider === 'ollama' || provider === 'custom';

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>AI Comment Generation</span>
          {aiEnabled && (
            <Text type="success" style={{ fontSize: 12 }}>
              (Enabled)
            </Text>
          )}
        </Space>
      }
      extra={
        <CPButton
          cpType="primary"
          size="small"
          onClick={handleSave}
          loading={isSaving}
          disabled={!isDirty || isLoading}
        >
          Save AI Settings
        </CPButton>
      }
      style={{ marginBottom: 24, maxWidth: 800 }}
    >
      {isLoading ? (
        <Text type="secondary">Loading AI settings...</Text>
      ) : (
        <Flex vertical gap={16}>
          <Text type="secondary" style={{ marginBottom: 8 }}>
            Enable AI-powered comment generation for graders. Configure an API key to allow graders to generate feedback
            suggestions when leaving comments on student code.
          </Text>

          {/* Provider */}
          <Flex vertical gap={4}>
            <Text strong>AI Provider</Text>
            <Select
              value={provider}
              onChange={handleProviderChange}
              placeholder="Select a provider"
              style={{ width: 250 }}
              allowClear
            >
              {AI_PROVIDERS.map((p) => (
                <Select.Option key={p.value} value={p.value}>
                  {p.label}
                </Select.Option>
              ))}
            </Select>
          </Flex>

          {/* API Key */}
          {provider && (
            <Flex vertical gap={4}>
              <Text strong>API Key</Text>
              <Input.Password
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={aiEnabled ? '••••••••  (key saved, enter new key to update)' : 'Enter API key'}
                style={{ maxWidth: 400 }}
              />
            </Flex>
          )}

          {/* Base URL (for Ollama/Custom) */}
          {showBaseUrl && (
            <Flex vertical gap={4}>
              <Text strong>Base URL</Text>
              <Input
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com'}
                style={{ maxWidth: 400 }}
              />
            </Flex>
          )}

          {/* Model */}
          {provider && (
            <Flex vertical gap={4}>
              <Text strong>Model</Text>
              <Input
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={DEFAULT_MODELS[provider] || 'default'}
                style={{ maxWidth: 300 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Leave blank to use default: {DEFAULT_MODELS[provider]}
              </Text>
            </Flex>
          )}
        </Flex>
      )}
    </Card>
  );
};

export default CourseSettingsPanel;

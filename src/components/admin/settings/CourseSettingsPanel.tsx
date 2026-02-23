// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { RedoOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Card, Descriptions, Flex, Form, Input, message, Select, Switch, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';
import CPAdminDetail from '../other/CPAdminDetail';

/* codePost imports */
import { Course } from '../../../api-client';
import InputNumberOrNull from './InputNumberOrNull';
import AISettingsCard from './AISettingsCard';

import { timezones } from '../other/timezones';

const { Text } = Typography;
import dayjs from 'dayjs';

/**********************************************************************************************************************/

interface IProps {
  currentCourse: Course;
  updateSettings: (newCourse: Course) => Promise<Course>;
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

  const updateSettings = (values: Course & { allowGradersToEditRubric?: boolean }) => {
    setIsLoading(true);
    const { currentCourse } = props;

    // Updated this to use the spread operator to keep all the other fields
    // Need to check if this worked
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
  thisCourse: Course;
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
      <Card
        title={
          <Typography.Title level={2} style={{ margin: 0 }}>
            Course Identity
          </Typography.Title>
        }
        style={{ marginBottom: 24, maxWidth: 600 }}
      >
        <Flex vertical gap={16}>
          <Form.Item
            name="name"
            label="Course Name"
            initialValue={thisCourse.name}
            style={{ marginBottom: 16 }}
            rules={[
              { required: true, message: 'Please enter a course name with at least 4 characters', min: 4 },
              { message: 'Course name cannot exceed 36 characters', max: 36 },
            ]}
          >
            <label htmlFor="course-name" className="sr-only">
              Course Name
            </label>
            <Input
              id="course-name"
              defaultValue={thisCourse.name}
              maxLength={36}
              minLength={4}
              count={{ show: true }}
            />
          </Form.Item>
          <Form.Item
            name="period"
            label="Course Period"
            initialValue={thisCourse.period}
            style={{ marginBottom: 16 }}
            rules={[
              { required: true, message: 'Please enter a course period.' },
              { message: 'Course period cannot exceed 32 characters', max: 32 },
            ]}
          >
            <label htmlFor="course-period" className="sr-only">
              Course Period
            </label>
            <Input
              id="course-period"
              defaultValue={thisCourse.period}
              maxLength={32}
              minLength={1}
              count={{ show: true }}
            />
          </Form.Item>
        </Flex>
      </Card>

      {/* AI Settings - Prominent position after Course Identity */}
      <AISettingsCard courseId={thisCourse.id} />

      {/* Toggle Settings */}
      <Card
        title={
          <Typography.Title level={2} style={{ margin: 0 }}>
            Course Settings
          </Typography.Title>
        }
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
                  <label htmlFor={`switch-${setting.key}`} className="sr-only">
                    {setting.title}
                  </label>
                  <Switch id={`switch-${setting.key}`} aria-label={setting.title} onChange={makeDirty} />
                </Form.Item>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Card>

      {/* Additional Settings */}
      <Card
        title={
          <Typography.Title level={2} style={{ margin: 0 }}>
            Additional Options
          </Typography.Title>
        }
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
                <Select aria-label="Course Timezone" style={{ width: 180 }} onChange={makeDirty}>
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
      <Card
        title={
          <Typography.Title level={2} style={{ margin: 0 }}>
            Course Information
          </Typography.Title>
        }
        style={{ marginBottom: 24, maxWidth: 800 }}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Course ID">
            <Text code>{thisCourse.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Expires">
            {thisCourse.expirationDate ? dayjs(thisCourse.expirationDate).format('YYYY-MM-DD') : 'Never'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <div style={{ height: 60 }} />
    </Form>
  );
};

export default CourseSettingsPanel;

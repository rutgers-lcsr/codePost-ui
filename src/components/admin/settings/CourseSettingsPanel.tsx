/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { RedoOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Form, Input, message, Select, Space, Switch, Table, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';
import CPAdminDetail from '../other/CPAdminDetail';

/* codePost imports */
import { CoursePatchType, CourseType } from '../../../infrastructure/course';
import InputNumberOrNull from './InputNumberOrNull';

import { timezones } from '../other/timezones';

type alignType = 'left' | 'right' | 'center';

const { Text, Title } = Typography;
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

  /* create misc. settings table */
  const aligner: alignType = 'center';
  const columns = [
    {
      title: 'Setting',
      dataIndex: 'setting',
      key: 'setting',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      align: aligner,
    },
  ];

  /* UPDATE TABLE HERE */
  const data = [
    {
      key: '1',
      setting: <Text strong>Show statistics to students</Text>,
      description: 'Selecting will show assignment mean and median to students when the assignment is released.',
      action: (
        <Form.Item
          name="showStudentsStatistics"
          valuePropName="checked"
          initialValue={thisCourse.showStudentsStatistics}
        >
          <Switch onChange={makeDirty} />
        </Form.Item>
      ),
    },
    {
      key: '2',
      setting: <Text strong>Send released submissions to back of grader queue</Text>,
      description: `Selecting will move released assignments to the back of the course queue, preventing
         situations in which a grader reclaims a submission that was just released. For more information see our
         docs.`,
      action: (
        <Form.Item
          name="sendReleasedSubmissionsToBack"
          valuePropName="checked"
          initialValue={thisCourse.sendReleasedSubmissionsToBack}
        >
          <Switch onChange={makeDirty} />
        </Form.Item>
      ),
    },
    {
      key: '3',
      setting: <Text strong>Email users when added to roster</Text>,
      description: `If selected, emails will be sent to users notifying them that they have been added
         to this course's roster. New codePost users will be prompted to create an account.`,
      action: (
        <Form.Item name="emailNewUsers" valuePropName="checked" initialValue={thisCourse.emailNewUsers}>
          <Switch onChange={makeDirty} />
        </Form.Item>
      ),
    },
    {
      key: '4',
      setting: <Text strong>Default to Anonymous Grading Mode</Text>,
      description: `If selected, new Assignments will default to Anonymous Grading Mode. You can
          toggle this setting at the assignment level from Assignment settings.`,
      action: (
        <Form.Item
          name="anonymousGradingDefault"
          valuePropName="checked"
          initialValue={thisCourse.anonymousGradingDefault}
        >
          <Switch onChange={makeDirty} />
        </Form.Item>
      ),
    },
    {
      key: '5',
      setting: <Text strong>Late Day Credits Allowed</Text>,
      description:
        "The maximum number of Late Day Credits a student can use. Only used if the Assignment Setting 'Allow Student Upload' is turned on.",
      action: (
        <Form.Item name="lateDayCreditsAllowable" initialValue={thisCourse.lateDayCreditsAllowable}>
          <InputNumberOrNull value={null} onChange={makeDirty} />
        </Form.Item>
      ),
    },
    {
      key: '6',
      setting: <Text strong>Course timezone</Text>,
      description: 'Timezone in which all time fields for this course (for all users) will appear.',
      action: (
        <Form.Item name="timezone" initialValue={thisCourse.timezone}>
          <Select style={{ width: 200 }} onChange={makeDirty}>
            {timezones.map((tz, i) => {
              return (
                <Select.Option key={i} value={tz}>
                  {tz}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
      ),
    },
    {
      key: '7',
      setting: <Text strong>Archived</Text>,
      description: 'When a Course is Archived, its content will not be editable.',
      action: (
        <Form.Item name="archived" valuePropName="checked" initialValue={thisCourse.archived}>
          <Switch onChange={makeDirty} />
        </Form.Item>
      ),
    },
  ];

  const tableTitle = () => <Title level={4}>Misc. settings</Title>;

  const courseInfoTitle = () => <Title level={4}>Course info</Title>;


  const courseInfoData = [
    {
      key: '1',
      info: <Text strong>ID</Text>,
      description: thisCourse.id,
    },
    {
      key: "5",
      info: <Text strong>Expires</Text>,
      description: thisCourse.expiration_date ? dayjs(thisCourse.expiration_date).format('YYYY-MM-DD') : "Never",
    }
  ];

  const courseInfoColumns = [
    {
      title: 'Course Info',
      dataIndex: 'info',
      key: 'info',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <Form form={form} layout="horizontal" onChange={makeDirty}>
      <div style={{ width: 500 }}>
        <Form.Item
          name="name"
          initialValue={thisCourse.name}
          rules={[
            {
              required: true,
              message: 'Please enter a course name with at least 4 characters',
              min: 4,
            },
            {
              message: 'Course name cannot exceed 36 characters',
              max: 36,
            },
          ]}
        >
          <Space.Compact style={{ width: 500 }}>
            <Space.Addon >Name</Space.Addon>
            <Input defaultValue={thisCourse.name} maxLength={36} minLength={4} count={{
              show: true,
            }} />
          </Space.Compact>
        </Form.Item>
        <Form.Item
          name="period"
          initialValue={thisCourse.period}
          rules={[
            { required: true, message: 'Please enter a course period.' },
            {
              message: 'Course period cannot exceed 32 characters',
              max: 32,
            },
          ]}
        >
          <Space.Compact style={{ width: 500 }}>
            <Space.Addon>Period</Space.Addon>
            <Input defaultValue={thisCourse.period} maxLength={32} minLength={1} count={{
              show: true,
            }} />
          </Space.Compact>
        </Form.Item>
      </div>
      <Table title={tableTitle} pagination={false} columns={columns} dataSource={data} />
      <Table title={courseInfoTitle} pagination={false} columns={courseInfoColumns} dataSource={courseInfoData} />
      <div style={{ height: 60 }} />
    </Form>
  );
};

export default CourseSettingsPanel;

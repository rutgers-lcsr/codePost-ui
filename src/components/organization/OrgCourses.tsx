// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Table, Card, Input, Button, Modal, Form, Switch, message, Select, InputNumber, Tooltip, Tabs } from 'antd';
import { Course } from '../../api-client';
import { coursesApi } from '../../api-client/clients';
import { PAGE_SIZE_OPTIONS } from '../utils/LocalSettings';
import useDefaultPageSize from '../utils/useDefaultPageSize';
import { ColumnsType } from 'antd/es/table';
import { EditOutlined, SearchOutlined, CopyOutlined, RedoOutlined } from '@ant-design/icons';

// Common US timezones
const TIMEZONES = [
  'US/Eastern',
  'US/Central',
  'US/Mountain',
  'US/Pacific',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
];

interface IProps {
  courses: Course[];
  loading: boolean;
  onRefresh: () => void;
}

const OrgCourses: React.FC<IProps> = ({ courses, loading, onRefresh }) => {
  const [searchText, setSearchText] = React.useState('');
  const [pageSize, setPageSize] = useDefaultPageSize();
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form] = Form.useForm();

  const api = coursesApi;

  const filteredCourses = courses.filter((course) => course.name.toLowerCase().includes(searchText.toLowerCase()));

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    form.setFieldsValue({
      name: course.name,
      period: course.period,
      archived: course.archived,
      timezone: course.timezone,
      emailNewUsers: course.emailNewUsers,
      anonymousGradingDefault: course.anonymousGradingDefault,
      allowGradersToEditRubric: (course as any).allowGradersToEditRubric || false, // Check if this exists in generated model
      minComments: course.minComments,
      studentsCanSeeGraders: course.studentsCanSeeGraders,
      inviteCodeEnabled: course.inviteCodeEnabled,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingCourse) {
        await api.partialUpdate({
          id: editingCourse.id,
          patchedCourse: values,
        });
        message.success('Course updated successfully');
        setModalVisible(false);
        onRefresh();
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = () => {
    if (editingCourse?.inviteCode) {
      navigator.clipboard.writeText(editingCourse.inviteCode);
      message.success('Invite code copied!');
    }
  };

  const resetInviteCode = async () => {
    if (!editingCourse) return;
    Modal.confirm({
      title: 'Reset Invite Code?',
      content: 'The old code will no longer work. This cannot be undone.',
      onOk: async () => {
        try {
          // Use generated client for changeInviteCode
          const updatedCourse = await api.changeInviteCodePartialUpdate({ id: editingCourse.id });
          // Update editing state with new invite code (API may return Course or just the code string)
          if (typeof updatedCourse === 'string') {
            setEditingCourse({ ...editingCourse, inviteCode: updatedCourse });
          } else {
            setEditingCourse(updatedCourse);
          }

          message.success('Invite code reset!');
          onRefresh(); // Refresh list to get updated code in table
        } catch (error) {
          message.error('Failed to reset invite code');
        }
      },
    });
  };

  const columns: ColumnsType<Course> = [
    {
      title: 'Course Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      sorter: (a, b) => a.period.localeCompare(b.period),
    },
    {
      title: 'Student Count',
      key: 'students',
      render: (_, record) => record.studentCount,
    },
    {
      title: 'Active',
      key: 'archived',
      render: (_, record) => (record.archived ? 'No' : 'Yes'),
      filters: [
        { text: 'Active', value: false },
        { text: 'Archived', value: true },
      ],
      onFilter: (value: any, record: Course) => record.archived === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
          Edit
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: 'Basic Info',
      children: (
        <>
          <Form.Item name="name" label="Course Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="period" label="Period" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="timezone" label="Timezone">
            <Select>
              {TIMEZONES.map((tz) => (
                <Select.Option key={tz} value={tz}>
                  {tz}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="archived" label="Archived" valuePropName="checked">
            <Switch aria-label="Archive course" />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'settings',
      label: 'Settings',
      children: (
        <>
          <Form.Item name="emailNewUsers" label="Email New Users" valuePropName="checked">
            <Switch aria-label="Email new users" />
          </Form.Item>
          <Form.Item name="inviteCodeEnabled" label="Invite Code Enabled" valuePropName="checked">
            <Switch aria-label="Enable invite code" />
          </Form.Item>
          {editingCourse?.inviteCode && (
            <Form.Item label="Invite Code">
              <Input.Group compact>
                <Input value={editingCourse.inviteCode} readOnly style={{ width: 'calc(100% - 80px)' }} />
                <Tooltip title="Copy">
                  <Button aria-label="Copy invite code" icon={<CopyOutlined />} onClick={copyInviteCode} />
                </Tooltip>
                <Tooltip title="Reset Code">
                  <Button aria-label="Reset invite code" icon={<RedoOutlined />} onClick={resetInviteCode} />
                </Tooltip>
              </Input.Group>
            </Form.Item>
          )}
          <Form.Item name="studentsCanSeeGraders" label="Students Can See Graders" valuePropName="checked">
            <Switch aria-label="Students can see graders" />
          </Form.Item>
        </>
      ),
    },
    {
      key: 'grading',
      label: 'Grading',
      children: (
        <>
          <Form.Item name="anonymousGradingDefault" label="Anonymous Grading Default" valuePropName="checked">
            <Switch aria-label="Anonymous grading default" />
          </Form.Item>
          <Form.Item name="allowGradersToEditRubric" label="Allow Graders to Edit Rubric" valuePropName="checked">
            <Switch aria-label="Allow graders to edit rubric" />
          </Form.Item>
          <Form.Item name="minComments" label="Minimum Comments">
            <InputNumber min={0} />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <Card
      title="Courses"
      bordered={false}
      extra={
        <Input
          placeholder="Search courses..."
          aria-label="Search courses"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
      }
    >
      <Table
        dataSource={filteredCourses}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onShowSizeChange: (_current, size) => setPageSize(size),
          onChange: (_page, size) => setPageSize(size),
        }}
      />

      <Modal
        title="Edit Course"
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Tabs items={tabItems} />
        </Form>
      </Modal>
    </Card>
  );
};

export default OrgCourses;

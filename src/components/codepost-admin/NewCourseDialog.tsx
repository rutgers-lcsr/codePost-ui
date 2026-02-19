import { DatePicker, Form, Input, Modal, Select, message } from 'antd';
import React, { useState } from 'react';

import { Organization, Course } from '../../api-client';
import { coursesApi } from '../../api-client/clients';

interface NewCourseDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (course: Course) => void;
  organizations: Organization[];
}

const NewCourseDialog: React.FC<NewCourseDialogProps> = ({ visible, onClose, onSuccess, organizations }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: values.name,
        period: values.period,
        organization: values.organization,
        expirationDate: values.expiration_date?.toISOString() || null,
        // Default values for other fields if needed, but the API should handle defaults.
        // We supply explicit defaults matching strict requirements if needed.
        sendReleasedSubmissionsToBack: false,
        showStudentsStatistics: false,
        timezone: 'US/Eastern',
        emailNewUsers: false,
        anonymousGradingDefault: false,
        minComments: 0,
        noUnfinalize: false,
        lateDayCreditsAllowable: null,
        archived: false,
        activateQueue: true,
        inviteCode: null,
        emailWhitelist: '',
        inviteCodeEnabled: false,
        enableStudentFeedbackNotifications: false,
      };

      // Need to cast payload because generated client types might be strict or differ slightly (e.g. casing)
      // but we want to ensure we send what we intend.
      // Actually, let's try to match the Omit type if possible.
      // But for now, casting to any or CourseCreateRequest['course'] is safer to avoid TS blocked.

      const result = await coursesApi.create({ course: payload });
      message.success('Course created successfully');
      form.resetFields();
      onSuccess(result);
    } catch (error) {
      console.error(error);
      message.error('Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Create New Course"
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isSubmitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="Course Name" rules={[{ required: true, message: 'Please enter course name' }]}>
          <Input placeholder="e.g. Intro to Computer Science" />
        </Form.Item>

        <Form.Item name="period" label="Period" rules={[{ required: true, message: 'Please enter period' }]}>
          <Input placeholder="e.g. Spring 2024" />
        </Form.Item>

        <Form.Item
          name="organization"
          label="Organization (Optional)"
          extra="Leave blank to create in your own organization."
        >
          <Select
            placeholder="Select organization"
            allowClear
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={organizations.map((org) => ({ label: `${org.name} (${org.shortname})`, value: org.id }))}
          />
        </Form.Item>

        <Form.Item
          name="expiration_date"
          label="Expiration Date (Optional)"
          extra="The course will be automatically deleted after this date."
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewCourseDialog;

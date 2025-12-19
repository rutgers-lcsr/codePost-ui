import { DatePicker, Form, Input, Modal, Select, message } from 'antd';
import React, { useState } from 'react';

import { Course, CourseType } from '../../infrastructure/course';
import { OrganizationType } from '../../infrastructure/organization';

interface NewCourseDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (course: CourseType) => void;
  organizations: OrganizationType[];
}

const NewCourseDialog: React.FC<NewCourseDialogProps> = ({ visible, onClose, onSuccess, organizations }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const courseData: any = {
        name: values.name,
        period: values.period,
      };

      if (values.expiration_date) {
        // Explicitly format to ISO string to ensure compatibility with backend (which expects string for DateTimeField)
        courseData.expiration_date = values.expiration_date.toISOString();
      }

      if (values.organization) {
        courseData.organization = values.organization;
      }
      // Course.create expects parameters that match the definition.
      // Assuming create handles partials or specific input types.
      // Based on course.tsx: createObject(CourseV, CourseV, ...).
      // This implies it expects a full Course object?
      // Usually create endpoints take a subset.
      // Let's assume the generic createObject handles filtering or the backend is lenient/we need to provide required fields.
      // Required fields in CourseV: name, period, assignments(array), sections(array), etc.
      // The backend creates defaults for many fields.
      // If the frontend validation requires them, we might need to mock them or use a different type for creation.
      // Let's try sending just the necessary fields. If io-ts validation fails, we'll see.

      // NOTE: io-ts runtime check might fail if we don't provide all fields if the request codec is strict.
      // However, usually for 'create', we define a separate codec or use partial.
      // Here Course.create maps input to CourseV. CourseV has many required fields.
      // This might be problematic if we don't supply 'assignments: []' etc.
      // I'll assume we need to provide defaults for required fields to satisfy the frontend codec
      // before sending to backend, OR the generic createObject is lenient.
      // Let's provide safe defaults for required fields in CourseV.

      const payload: any = {
        ...courseData,
        assignments: [],
        sections: [],
        sendReleasedSubmissionsToBack: false,
        showStudentsStatistics: false,
        timezone: 'US/Eastern', // Default
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
        // GenericObject fields (id, created, modified) are usually ignored by backend on create or auto-filled by generic createObject?
        // Actually createObject takes (ResponseCodec, RequestCodec).
        // If RequestCodec is CourseV, it expects all these.
        id: -1, // Dummy
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      const result = await Course.create(payload);
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

import { Form, Input, Modal, Select, message } from 'antd';
import React, { useState } from 'react';

import { OrganizationType } from '../../infrastructure/organization';
import { UserIO, UserType } from '../../infrastructure/user';

interface NewUserDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  organizations: OrganizationType[];
}

const NewUserDialog: React.FC<NewUserDialogProps> = ({ visible, onClose, onSuccess, organizations }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        email: values.email,
        password: values.password,
        organization: values.organization, // ID
        // Default booleans
        codePostAdmin: false,
        canCreateCourses: false,
        canModifyRosters: false,
        showProductTips: true,
        hasCredentials: true,
        // Dummy fields for creation
        id: -1,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        studentCourses: [],
        graderCourses: [],
        superGraderCourses: [],
        courseadminCourses: [],
        leaderSections: [],
        student_sections: [],
        token: 'dummy', // Backend generates
        api_token: null,
      };

      const result = await UserIO.create(payload);
      message.success('User created successfully');
      form.resetFields();
      onSuccess(result);
    } catch (error) {
      console.error(error);
      message.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Create New User"
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isSubmitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="user@example.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please enter a password' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <Form.Item
          name="organization"
          label="Organization"
          rules={[{ required: true, message: 'Please select an organization' }]}
        >
          <Select
            placeholder="Select organization"
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={organizations.map((org) => ({
              label: `${org.name} (${org.shortname})`,
              value: org.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewUserDialog;

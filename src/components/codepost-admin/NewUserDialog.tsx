// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Form, Input, Modal, Select, message } from 'antd';
import React, { useState } from 'react';

import { Organization } from '../../api-client';
import { UserIO } from '../../services/user';
import type { UserType } from '../../types/models';

interface NewUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  organizations: Organization[];
}

const NewUserDialog: React.FC<NewUserDialogProps> = ({ open, onClose, onSuccess, organizations }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: { email: string; password: string; organization: number }) => {
    setIsSubmitting(true);
    try {
      const payload = {
        email: values.email,
        password: values.password,
        organization: values.organization,
        codePostAdmin: false,
        canCreateCourses: false,
        canModifyRosters: false,
        showProductTips: true,
        studentCourses: [],
        graderCourses: [],
        superGraderCourses: [],
        courseadminCourses: [],
        leaderSections: [],
        studentSections: [],
      } as unknown as Omit<UserType, 'id'>;

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
      open={open}
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

        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter a password' }]}>
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

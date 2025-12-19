import { Form, Input, Modal, message } from 'antd';
import React, { useState } from 'react';

import { Organization, OrganizationType } from '../../infrastructure/organization';

interface NewOrganizationDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (org: OrganizationType) => void;
}

const NewOrganizationDialog: React.FC<NewOrganizationDialogProps> = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: values.name,
        shortname: values.shortname,
        emailDomain: values.emailDomain,
        // GenericObject fields placeholders
        id: -1,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      const result = await Organization.create(payload);
      message.success('Organization created successfully');
      form.resetFields();
      onSuccess(result);
    } catch (error) {
      console.error(error);
      message.error('Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Create New Organization"
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isSubmitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Organization Name"
          rules={[{ required: true, message: 'Please enter organization name' }]}
        >
          <Input placeholder="e.g. Princeton University" />
        </Form.Item>

        <Form.Item
          name="shortname"
          label="Short Name (Slug)"
          rules={[{ required: true, message: 'Please enter short name' }]}
        >
          <Input placeholder="e.g. Princeton" />
        </Form.Item>

        <Form.Item
          name="emailDomain"
          label="Email Domain"
          rules={[{ required: true, message: 'Please enter email domain' }]}
        >
          <Input placeholder="e.g. princeton.edu" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewOrganizationDialog;

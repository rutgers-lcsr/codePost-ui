import { Checkbox, Form, Modal, Select, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';

import { UserIO, UserType } from '../../infrastructure/user';
import { OrganizationType } from '../../infrastructure/organization';

interface EditUserDialogProps {
  visible: boolean;
  user: UserType | null;
  onClose: () => void;
  onSuccess: () => void;
  organizations: OrganizationType[];
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ visible, user, onClose, onSuccess, organizations }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        codePostAdmin: user.codePostAdmin,
        canCreateCourses: user.canCreateCourses,
        canModifyRosters: user.canModifyRosters,
        organization: user.organization, // Allow editing organization
      });
    }
  }, [visible, user, form]);

  const handleSubmit = async (values: any) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await UserIO.update({ ...values, id: user.id, email: user.email });
      message.success('User updated successfully');
      onSuccess();
    } catch (error) {
      console.error(error);
      message.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Edit Permissions: ${user?.email}`}
      open={visible}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isSubmitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="organization" label="Organization">
          <Select
            placeholder="Select organization"
            showSearch
            allowClear
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={organizations.map((org) => ({ label: `${org.name} (${org.shortname})`, value: org.id }))}
          />
        </Form.Item>

        <Form.Item name="codePostAdmin" valuePropName="checked" label="Platform Admin">
          <Switch />
        </Form.Item>
        <p style={{ color: '#888', fontSize: '12px', marginTop: '-10px' }}>
          Grant full platform administrative checks (Manage Orgs, All Courses, etc.)
        </p>

        <Form.Item name="canCreateCourses" valuePropName="checked">
          <Checkbox>Can Create Courses</Checkbox>
        </Form.Item>

        <Form.Item name="canModifyRosters" valuePropName="checked">
          <Checkbox>Can Modify Rosters</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditUserDialog;

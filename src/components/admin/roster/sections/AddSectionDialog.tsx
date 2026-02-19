/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useEffect, useState } from 'react';

import { PlusCircleOutlined } from '@ant-design/icons';

/* ant imports */
import { Form, Input, message, Modal } from 'antd';

/* codePost imports */
import CPButton from '../../../../components/core/CPButton';

import { Section } from '../../../../api-client';

/**********************************************************************************************************************/

interface IProps {
  sections: Section[];
  addSection: (sectionName: string) => Promise<Section>;
}

const AddSectionDialog: React.FC<IProps> = ({ sections, addSection }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const toggleDialog = () => {
    if (modalVisible) {
      form.resetFields();
    }
    setModalVisible(!modalVisible);
  };

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        // show saving animation in modal ok button
        setSaving(true);
        addSection(values.section).then(() => {
          // notify user via message
          message.success(`Added section ${values.section}.`);

          // clear form and reset fields
          setSaving(false);
          toggleDialog();
          form.resetFields();
        });
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <div>
      <CPButton onClick={toggleDialog} cpType="primary" icon={<PlusCircleOutlined />}>
        Add section
      </CPButton>
      <CollectionCreateFormModal
        form={form}
        open={modalVisible}
        onCancel={toggleDialog}
        onCreate={handleCreate}
        sections={sections}
        saving={saving}
      />
    </div>
  );
};

interface IModalProps {
  form: any;
  open: boolean;
  onCreate: () => void;
  onCancel: () => void;
  sections: Section[];
  saving: boolean;
}

const CollectionCreateFormModal: React.FC<IModalProps> = ({ form, open, onCreate, onCancel, sections, saving }) => {
  useEffect(() => {
    const keyboardShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && open) {
        e.preventDefault();
        e.stopPropagation();
        onCreate();
      }
    };

    document.addEventListener('keydown', keyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', keyboardShortcuts);
    };
  }, [open, onCreate]);

  const handleConfirmSection = (_: any, value: string) => {
    // Test 1: does name correspond to an existing section?
    if (sections.some((el) => el.name === value)) {
      return Promise.reject(new Error('A section with this name already exists within this course.'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      open={open}
      title="Add a section"
      okText="Create"
      onCancel={onCancel}
      onOk={onCreate}
      confirmLoading={saving}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Section name"
          name="section"
          validateFirst
          validateTrigger="onBlur"
          rules={[
            { required: true, message: 'Please input a name for the new section' },
            { validator: handleConfirmSection },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddSectionDialog;

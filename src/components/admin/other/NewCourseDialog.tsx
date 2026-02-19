/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useState } from 'react';

import { PlusCircleOutlined } from '@ant-design/icons';

/* ant imports */
import { Form, Input, Modal, Radio, Select } from 'antd';

/* codePost imports */
import CPButton from '../../core/CPButton';
import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

import { Course } from '../../../api-client';

/**********************************************************************************************************************/

interface IProps {
  courses: Course[];
  createCourse: (courseName: string, coursePeriod: string, copiedCourse: Course | undefined) => Promise<void>;
}

const NewCourseDialog: React.FC<IProps> = (props) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleDialog = () => {
    setDialogVisible(!dialogVisible);
  };

  const createNewCourse = (name: string, period: string, cloneID?: number) => {
    const cloneCourse = props.courses.find((c) => {
      return c.id === cloneID;
    });

    if (!cloneID || cloneCourse) {
      setLoading(true);
      props
        .createCourse(name, period, cloneCourse)
        .then(() => {
          setLoading(false);
          toggleDialog();
          // Reload the page to show the new course
          window.location.reload();
        })
        .catch((error) => {
          console.error('Error creating course:', error);
          setLoading(false);
        });
    }
  };

  return (
    <div>
      <CPButton id="new-course-button" onClick={toggleDialog} cpType="secondary" icon={<PlusCircleOutlined />}>
        Create a course
      </CPButton>
      <CollectionCreateFormModal
        open={dialogVisible}
        onCancel={toggleDialog}
        onCreate={createNewCourse}
        courses={props.courses}
        loading={loading}
      />
    </div>
  );
};

interface IFormModalProps {
  open: boolean;
  onCreate: (name: string, period: string, cloneID?: number) => void;
  onCancel: () => void;
  courses: Course[];
  loading: boolean;
}

const CollectionCreateFormModal: React.FC<IFormModalProps> = ({ open, onCreate, onCancel, courses, loading }) => {
  const [form] = Form.useForm();
  const [modifier, setModifier] = useState('public');

  const validateName = (_: any, value: string) => {
    const isInvalid = ['/', '?', '\\'].some((token: string) => {
      return value.indexOf(token) >= 0;
    });
    if (isInvalid) {
      return Promise.reject(new Error('Please enter a valid course name.'));
    }
    return Promise.resolve();
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onCreate(values.name, values.period, values.cloneID ? parseInt(values.cloneID, 10) : undefined);
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      open={open}
      title="Create a course"
      okText="Create"
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" name="form_in_modal">
        <Form.Item
          label="Course name"
          name="name"
          validateFirst
          rules={[
            { required: true, message: 'Please enter a course name with at least 4 characters', min: 4 },
            { message: 'Course name cannot exceed 36 characters', max: 36 },
            { validator: validateName },
          ]}
        >
          <Input placeholder="CS 101" />
        </Form.Item>
        <Form.Item
          label="Course period"
          name="period"
          validateFirst
          rules={[
            { required: true, message: 'Please enter a course period.' },
            { message: 'Course period cannot exceed 32 characters', max: 32 },
          ]}
        >
          <Input placeholder="Fall 2024" />
        </Form.Item>
        {courses.length > 0 && (
          <div>
            <Form.Item name="modifier" initialValue="public" className="collection-create-form_last-form-item">
              <Radio.Group onChange={(e) => setModifier(e.target.value)}>
                <Radio value="public">Start from scratch</Radio>
                <Radio value="private">Clone existing course</Radio>
              </Radio.Group>
              <CPTooltip title={tooltips.admin.newCourse.clone} infoIcon={true} />
            </Form.Item>
            <Form.Item label="Course to clone" name="cloneID">
              <Select disabled={modifier === 'public'}>
                {courses.map((course) => (
                  <Select.Option key={course.id} value={course.id}>
                    {course.name} | {course.period}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default NewCourseDialog;

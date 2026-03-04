// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { PlusCircleOutlined } from '@ant-design/icons';

/* ant imports */
import { DatePicker, Form, Input, InputNumber, Modal, Radio, Select, message } from 'antd';

/* other library imports */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

import { useNavigate } from 'react-router-dom';

/* codePost imports */
import CPButton from '../../../../components/core/CPButton';
import CPTooltip from '../../../../components/core/CPTooltip';

import { Course, Assignment as NativeAssignment } from '../../../../api-client';
import { Assignment } from '../../../../types/common';
import { assignmentsApi } from '../../../../api-client/clients';
import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps extends Record<string, unknown> {
  assignments: Assignment[];
  createAssignment: (
    assignmentName: string,
    assignmentPoints: number,
    upload: boolean,
    isVisible: boolean,
    dueDate?: string,
  ) => Promise<Assignment>;
  baseURL: string;
  timezone: string;
  courses: Course[];
  currentCourse: Course;
}

const NewAssignmentDialog: React.FC<IProps> = (props) => {
  const navigate = useNavigate();
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [studentsCanUpload, setStudentsCanUpload] = React.useState(false);
  const [isAssignmentVisible, setIsAssignmentVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = React.useState(false);
  const [allAssignments, setAllAssignments] = React.useState<{ [courseTitle: string]: NativeAssignment[] }>({});

  const [form] = Form.useForm();

  const loadAllAssignments = async () => {
    const assignments: { [courseTitle: string]: NativeAssignment[] } = {};

    await Promise.all(
      props.courses.map(async (course: Course) => {
        const courseTitle = `${course.name} | ${course.period}`;
        // assignments[courseTitle] = await loadIDList<AssignmentType>(course.assignments, Assignment);
        const fetchedAssignments = await Promise.all(
          course.assignments.map(async (id) => {
            try {
              return await assignmentsApi.retrieve({ id });
            } catch (e) {
              return null;
            }
          }),
        );
        assignments[courseTitle] = fetchedAssignments.filter((a) => a !== null) as NativeAssignment[];
        return;
      }),
    );

    setAllAssignments(assignments);
  };

  const toggleDialog = async () => {
    setIsLoadingAssignments(true);
    await loadAllAssignments();
    setIsLoadingAssignments(false);
    setDialogVisible(!dialogVisible);
    form.resetFields();
    setStudentsCanUpload(false);
    setIsAssignmentVisible(false);
  };

  const toggleStudentUpload = () => {
    setStudentsCanUpload(!studentsCanUpload);
  };

  const toggleIsAssignmentVisible = () => {
    setIsAssignmentVisible(!isAssignmentVisible);
  };

  const createNewAssignment = (
    name: string,
    points: number,
    upload: boolean,
    isVisible: boolean,
    uploadDueDate: string | null,
  ) => {
    return props.createAssignment(name, points, upload, isVisible, uploadDueDate || undefined);
  };

  const cloneAssignment = async (cloneID: number) => {
    try {
      // assignmentsApi is imported
      const data = await assignmentsApi.cloneCreate({
        id: cloneID,
        assignmentClone: {
          course: props.currentCourse.id,
        },
      });
      return Promise.resolve(data);
    } catch (err: any) {
      if (err.json) {
        const data = await err.json();
        message.error(JSON.stringify(data));
        return Promise.reject(data);
      }
      message.error(err.message || 'Failed to clone assignment');
      return Promise.reject(err);
    }
  };

  const handleCreate = () => {
    form
      .validateFields()
      .then(async (values) => {
        setIsLoading(true);

        if (values.modifier === 'private') {
          if (values.cloneID === undefined) {
            setDialogVisible(false);
            setIsLoading(false);
          } else {
            const split = values.cloneID.split('-');
            const assignmentID = split[split.length - 1];
            await cloneAssignment(assignmentID);
            message.success('Success!');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else {
          await createNewAssignment(
            values.name,
            values.points,
            studentsCanUpload,
            isAssignmentVisible,
            values.uploadDueDate
              ? dayjs.tz((values.uploadDueDate as any).format('YYYY-MM-DD HH:mm:ss'), props.timezone).format()
              : null,
          );

          setDialogVisible(false);
          setIsLoading(false);

          // NOTE: in the future, we could decide to only show this onboarding modal if we think
          // the admin is "new". Some heuristics:
          //    * first assignment created
          //    * no students
          //    * no submissions in course
          if (props.assignments.length < 2) {
            navigate(`${props.baseURL}/${encodeForLink(values.name)}/onboarding`);
          }
        }
      })
      .catch((info) => {
        console.log('Validation Failed:', info);
      });
  };

  return (
    <div>
      <CPButton onClick={toggleDialog} cpType="primary" icon={<PlusCircleOutlined />} loading={isLoadingAssignments}>
        Add assignment
      </CPButton>
      <CollectionCreateForm
        form={form}
        open={dialogVisible}
        onCancel={toggleDialog}
        onCreate={handleCreate}
        assignments={props.assignments}
        toggleStudentUpload={toggleStudentUpload}
        toggleIsAssignmentVisible={toggleIsAssignmentVisible}
        isAssignmentVisible={isAssignmentVisible}
        studentsCanUpload={studentsCanUpload}
        timezone={props.timezone}
        loading={isLoading}
        allAssignments={allAssignments}
      />
    </div>
  );
};

interface IFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  open: boolean;
  onCreate: () => void;
  onCancel: () => void;
  assignments: Assignment[];
  allAssignments: { [courseTitle: string]: NativeAssignment[] };
  toggleStudentUpload: () => void;
  toggleIsAssignmentVisible: () => void;
  studentsCanUpload: boolean;
  isAssignmentVisible: boolean;
  timezone: string;
  loading: boolean;
}

const CollectionCreateForm: React.FC<IFormProps> = (props) => {
  const { open, onCancel, onCreate, form, assignments } = props;

  // Validation rules
  const validateName = (_: unknown, value: string) => {
    if (assignments.some((el) => el.name === value)) {
      return Promise.reject('An assignment with this name already exists in this course.');
    }
    return Promise.resolve();
  };

  const validatePoints = (_: unknown, value: number) => {
    if (parseFloat(String(value)) < 0 || !Number.isInteger(parseFloat(String(value)))) {
      return Promise.reject('Points must be a non-negative integer.');
    }
    return Promise.resolve();
  };

  const modifier = Form.useWatch('modifier', form);

  return (
    <Modal
      open={open}
      title="Create an assignment"
      okText="Create"
      onCancel={onCancel}
      onOk={onCreate}
      confirmLoading={props.loading}
    >
      <Form form={form} layout="vertical" initialValues={{ modifier: 'public' }}>
        <div>
          <Form.Item className="collection-create-form_last-form-item" name="modifier">
            <Radio.Group>
              <Radio value="public">Start from scratch</Radio>
              <Radio value="private">Clone existing assignment</Radio>
            </Radio.Group>
          </Form.Item>
          <CPTooltip title={"Copy an old assignment's settings, rubric, and tests."} infoIcon={true} />
        </div>
        {modifier === 'private' ? (
          <Form.Item label="Assignment to clone" name="cloneID">
            <Select showSearch={true}>
              {Object.keys(props.allAssignments).map((courseTitle: string) => {
                return (
                  <Select.OptGroup key={`select-course-${courseTitle}`} label={courseTitle}>
                    {props.allAssignments[courseTitle].map((assignment: NativeAssignment) => {
                      return (
                        <Select.Option
                          key={`assignment-${assignment.id}`}
                          value={`${assignment.name}-${assignment.id}`}
                        >
                          {assignment.name}
                        </Select.Option>
                      );
                    })}
                  </Select.OptGroup>
                );
              })}
            </Select>
          </Form.Item>
        ) : (
          <div>
            <Form.Item
              label="Name"
              name="name"
              validateFirst
              rules={[
                {
                  required: true,
                  message: 'Please input an assignment name with at least 4 characters',
                  min: 4,
                },
                {
                  message: 'Assignment name cannot exceed 32 characters',
                  max: 32,
                },
                { validator: validateName },
              ]}
            >
              <Input placeholder="Hello World" />
            </Form.Item>
            <Form.Item
              label="Points"
              name="points"
              validateFirst
              rules={[{ required: true, message: 'Please specify a point value' }, { validator: validatePoints }]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <span>Do you want students to be able to submit directly to codePost?</span>
            <br />
            <Radio
              checked={props.studentsCanUpload}
              onChange={props.toggleStudentUpload}
              disabled={modifier === 'private'}
            >
              Yes
            </Radio>
            <Radio
              checked={!props.studentsCanUpload}
              onChange={props.toggleStudentUpload}
              disabled={modifier === 'private'}
            >
              No
            </Radio>
            <br />
            <br />
            {props.studentsCanUpload ? (
              <span>
                <Form.Item
                  label="Set a due date. You'll be able to edit this later in the assignment settings."
                  name="uploadDueDate"
                  // Wall clock shift as in AssignmentSettingsDialog
                  initialValue={dayjs(dayjs().tz(props.timezone).endOf('day').format('YYYY-MM-DD HH:mm:ss'))}
                >
                  <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder="Click to select" />
                </Form.Item>
                <span>
                  Do you want students to be able to submit right away? If not, you can choose when to make your
                  assignment visible.
                </span>
                <br />
                <Radio checked={props.isAssignmentVisible} onChange={props.toggleIsAssignmentVisible}>
                  Yes
                </Radio>
                <Radio checked={!props.isAssignmentVisible} onChange={props.toggleIsAssignmentVisible}>
                  No
                </Radio>
              </span>
            ) : null}
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default NewAssignmentDialog;

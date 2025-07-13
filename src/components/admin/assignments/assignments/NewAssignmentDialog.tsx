/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { Form } from '@ant-design/compatible';
import { PlusCircleOutlined, DownOutlined } from '@ant-design/icons';
import '@ant-design/compatible/assets/index.css';

/* ant imports */
import { Input, InputNumber, Modal, Radio, DatePicker, Select, message, Menu, Dropdown, Button } from 'antd';
import { FormComponentProps } from '@ant-design/compatible/lib/form';

/* other library imports */
import moment from 'moment-timezone';

import { RouteComponentProps } from 'react-router';

/* codePost imports */
import CPButton from '../../../../components/core/CPButton';
import CPTooltip from '../../../../components/core/CPTooltip';

import { Assignment } from '../../../../infrastructure/assignment';
import { loadIDList } from '../../../../infrastructure/generics';
import { AssignmentType, CourseType } from '../../../../infrastructure/types';

import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  createAssignment: (
    assignmentName: string,
    assignmentPoints: number,
    upload: boolean,
    isVisible: boolean,
    dueDate?: string,
  ) => Promise<AssignmentType>;
  baseURL: string;
  timezone: string;
  courses: CourseType[];
  currentCourse: CourseType;
}

interface IState {
  dialogVisible: boolean;
  studentsCanUpload: boolean;
  isAssignmentVisible: boolean;
  isLoading: boolean;
  isLoadingAssignments: boolean;
  allAssignments: { [courseTitle: string]: AssignmentType[] };
}

class NewAssignmentDialog extends React.Component<IProps & RouteComponentProps, {}> {
  public state: Readonly<IState> = {
    dialogVisible: false,
    studentsCanUpload: false,
    isAssignmentVisible: false,
    isLoading: false,
    isLoadingAssignments: false,
    allAssignments: {},
  };

  private formRef: React.RefObject<FormComponentProps> = React.createRef();

  public toggleDialog = async () => {
    this.setState({
      isLoadingAssignments: true,
    });
    await this.loadAllAssignments();
    this.setState({
      isLoadingAssignments: false,
    });
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
    });
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.resetFields();
    this.setState({ studentsCanUpload: false });
  };

  public toggleStudentUpload = () => {
    this.setState((oldState: IState) => {
      return { studentsCanUpload: !oldState.studentsCanUpload };
    });
  };

  public toggleIsAssignmentVisible = () => {
    this.setState((oldState: IState) => {
      return { isAssignmentVisible: !oldState.isAssignmentVisible };
    });
  };

  public loadAllAssignments = async () => {
    let allAssignments: any = {};

    await Promise.all(
      this.props.courses.map(async (course: CourseType) => {
        const courseTitle = `${course.name} | ${course.period}`;

        allAssignments[courseTitle] = await loadIDList(course.assignments, Assignment);
        return;
      }),
    );

    this.setState({ allAssignments });
  };

  public handleCreate = () => {
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.validateFields(async (err: any, values: any) => {
      if (err) {
        return;
      }

      this.setState({ isLoading: true });

      if (values.modifier === 'private') {
        if (values.cloneID === undefined) {
          this.setState({ dialogVisible: false, isLoading: false });
        } else {
          const split = values.cloneID.split('-');
          const assignmentID = split[split.length - 1];
          await this.cloneAssignment(assignmentID);
          message.success('Success!');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        await this.createNewAssignment(
          values.name,
          values.points,
          this.state.studentsCanUpload,
          this.state.isAssignmentVisible,
          values.uploadDueDate,
        );

        this.setState({ dialogVisible: false, isLoading: false });

        // NOTE: in the future, we could decide to only show this onboarding modal if we think
        // the admin is "new". Some heuristics:
        //    * first assignment created
        //    * no students
        //    * no submissions in course
        if (this.props.assignments.length < 2) {
          this.props.history.push(`${this.props.baseURL}/${encodeForLink(values.name)}/onboarding`);
        }
      }
    });
  };

  public createNewAssignment = (
    name: string,
    points: number,
    upload: boolean,
    isVisible: boolean,
    uploadDueDate: string,
  ) => {
    return this.props.createAssignment(name, points, upload, isVisible, uploadDueDate);
  };

  public cloneAssignment = async (cloneID: number) => {
    const object = {
      course: this.props.currentCourse.id,
    };
    const res = await fetch(`${process.env.REACT_APP_API_URL}/assignments/${cloneID}/clone/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(object),
    });

    if ((await res.status) === 200) {
      const data = await res.json();
      return Promise.resolve(data);
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  public saveFormRef = (formRef: any) => {
    this.formRef = formRef;
  };

  public reset = () => {
    this.setState({ dialogVisible: false, isLoading: false, setupMode: false, studentsCanUpload: false });
  };

  public render() {
    return (
      <div>
        <CPButton
          onClick={this.toggleDialog}
          cpType="primary"
          icon={<PlusCircleOutlined />}
          loading={this.state.isLoadingAssignments}
        >
          Add assignment
        </CPButton>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.dialogVisible}
          onCancel={this.toggleDialog}
          onCreate={this.handleCreate}
          assignments={this.props.assignments}
          toggleStudentUpload={this.toggleStudentUpload}
          toggleIsAssignmentVisible={this.toggleIsAssignmentVisible}
          isAssignmentVisible={this.state.isAssignmentVisible}
          studentsCanUpload={this.state.studentsCanUpload}
          timezone={this.props.timezone}
          loading={this.state.isLoading}
          allAssignments={this.state.allAssignments}
        />
      </div>
    );
  }
}

interface IFormProps extends FormComponentProps {
  visible: boolean;
  onCreate: () => Promise<void>;
  onCancel: () => void;
  assignments: AssignmentType[];
  allAssignments: { [courseTitle: string]: AssignmentType[] };
  toggleStudentUpload: () => void;
  toggleIsAssignmentVisible: () => void;
  studentsCanUpload: boolean;
  isAssignmentVisible: boolean;
  timezone: string;
  loading: boolean;
}

// FIXME: figure out how to type output of Form.create HOC
const CollectionCreateForm: any = Form.create({ name: 'form_in_modal' })(
  class extends React.Component<IFormProps, {}> {
    public validateName = (rule: any, value: string, callback: any) => {
      if (
        this.props.assignments.some((el) => {
          return el.name === value;
        })
      ) {
        callback('An assignment with this name already exists in this course.');
      }

      // Call callback with no arguments to signal that value passed validation
      callback();
    };

    public validatePoints = (rule: any, value: any, callback: any) => {
      // Test 1: are the points a non-negative integer? Note that we could prevent
      // offending values from being input into this field using the precision prop
      // of InputNumber, but it's nicer to alert the user explicitly if they
      // try to enter a disallowed value.
      if (parseFloat(value) < 0 || !Number.isInteger(parseFloat(value))) {
        callback('Points must be a non-negative integer.');
      }

      // Call callback with no arguments to signal that value passed validation
      callback();
    };

    public render() {
      const { visible, onCancel, onCreate, form } = this.props;
      const { getFieldDecorator } = form;

      return (
        <Modal
          visible={visible}
          title="Create an assignment"
          okText="Create"
          onCancel={onCancel}
          onOk={onCreate}
          confirmLoading={this.props.loading}
        >
          <Form layout="vertical">
            <div>
              <Form.Item className="collection-create-form_last-form-item">
                {getFieldDecorator('modifier', {
                  initialValue: 'public',
                })(
                  <Radio.Group>
                    <Radio value="public">Start from scratch</Radio>
                    <Radio value="private">Clone existing assignment</Radio>
                  </Radio.Group>,
                )}
                <CPTooltip title={"Copy an old assignment's settings, rubric, and tests."} infoIcon={true} />
              </Form.Item>
            </div>
            {this.props.form.getFieldValue('modifier') === 'private' ? (
              <Form.Item label="Assignment to clone">
                {getFieldDecorator('cloneID')(
                  <Select showSearch={true}>
                    {Object.keys(this.props.allAssignments).map((courseTitle: string) => {
                      return (
                        <Select.OptGroup key={`select-course-${courseTitle}`} label={courseTitle}>
                          {this.props.allAssignments[courseTitle].map((assignment: AssignmentType) => {
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
                  </Select>,
                )}
              </Form.Item>
            ) : (
              <div>
                <Form.Item label="Name">
                  {getFieldDecorator('name', {
                    validateFirst: true,
                    rules: [
                      {
                        required: true,
                        message: 'Please input an assignment name with at least 4 characters',
                        min: 4,
                      },
                      {
                        message: 'Assignment name cannot exceed 32 characters',
                        max: 32,
                      },
                      { validator: this.validateName },
                    ],
                  })(<Input placeholder="Hello World" />)}
                </Form.Item>
                <Form.Item label="Points">
                  {getFieldDecorator('points', {
                    validateFirst: true,
                    rules: [
                      { required: true, message: 'Please specify a point value' },
                      { validator: this.validatePoints },
                    ],
                  })(<InputNumber min={0} />)}
                </Form.Item>
                <span>Do you want students to be able to submit directly to codePost?</span>
                <br />
                <Radio
                  checked={this.props.studentsCanUpload}
                  onChange={this.props.toggleStudentUpload}
                  disabled={this.props.form.getFieldValue('modifier') === 'private'}
                >
                  Yes
                </Radio>
                <Radio
                  checked={!this.props.studentsCanUpload}
                  onChange={this.props.toggleStudentUpload}
                  disabled={this.props.form.getFieldValue('modifier') === 'private'}
                >
                  No
                </Radio>
                <br />
                <br />
                {this.props.studentsCanUpload ? (
                  <span>
                    <Form.Item label="Set a due date. You'll be able to edit this later in the assignment settings.">
                      {getFieldDecorator('uploadDueDate', {
                        valuePropName: 'value',
                        initialValue: moment()
                          .tz(this.props.timezone)
                          .endOf('day'),
                      })(<DatePicker showTime placeholder="Click to select" />)}
                    </Form.Item>
                    <span>
                      Do you want students to be able to submit right away? If not, you can choose when to make your
                      assignment visible.
                    </span>
                    <br />
                    <Radio checked={this.props.isAssignmentVisible} onChange={this.props.toggleIsAssignmentVisible}>
                      Yes
                    </Radio>
                    <Radio checked={!this.props.isAssignmentVisible} onChange={this.props.toggleIsAssignmentVisible}>
                      No
                    </Radio>
                  </span>
                ) : null}
              </div>
            )}
          </Form>
        </Modal>
      );
    }
  },
);

export default NewAssignmentDialog;

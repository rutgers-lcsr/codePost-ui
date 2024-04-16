/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { PlusCircleOutlined } from '@ant-design/icons';

/* ant imports */
import { Input, Modal, Radio, Select } from 'antd';

/* codePost imports */
import CPButton from '../../core/CPButton';
import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

import { CourseType } from '../../../infrastructure/course';

/**********************************************************************************************************************/

interface IProps {
  courses: CourseType[];
  createCourse: (courseName: string, coursePeriod: string, copiedCourse: CourseType | undefined) => Promise<void>;
}

interface IState {
  dialogVisible: boolean;
  loading: boolean;
}

class NewCourseDialog extends React.Component<IProps, IState> {
  private formRef = React.createRef();

  public constructor(props: IProps) {
    super(props);
    this.state = {
      dialogVisible: false,
      loading: false,
    };
  }

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
    });
  };

  public createNewCourse = (name: string, period: string, cloneID?: number) => {
    const { courses } = this.props;
    const cloneCourse = courses.find((c) => {
      return c.id === cloneID;
    });

    if (!cloneID || cloneCourse) {
      this.setState({ loading: true }, () => {
        this.props.createCourse(name, period, cloneCourse);
      });
    }
  };

  public handleCreate = () => {
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.validateFields((err: any, values: any) => {
      if (err) {
        return;
      }

      this.createNewCourse(values.name, values.period, parseInt(values.cloneID, 10));
    });
  };

  public saveFormRef = (formRef: any) => {
    this.formRef = formRef;
  };

  public render() {
    return (
      <div>
        <CPButton id="new-course-button" onClick={this.toggleDialog} cpType="secondary" icon={<PlusCircleOutlined />}>
          Create a course
        </CPButton>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.dialogVisible}
          onCancel={this.toggleDialog}
          onCreate={this.handleCreate}
          courses={this.props.courses}
          loading={this.state.loading}
        />
      </div>
    );
  }
}

interface ISubProps {
  form: any;
  visible: any;
  onCreate: any;
  onCancel: any;
  courses: CourseType[];
  loading: boolean;
}

const CollectionCreateForm: any = Form.create({ name: 'form_in_modal' })(
  class extends React.Component<ISubProps, {}> {
    public handleConfirmPeriod = (rule: any, value: any, callback: any) => {
      // use this function to validate that (name, period) are unique

      callback();
    };

    public validateName = (rule: any, value: string, callback: any) => {
      const isInvalid = ['/', '?', '\\'].some((token: string) => {
        return value.indexOf(token) >= 0;
      });
      if (isInvalid) {
        callback('Please enter a valid course name.');
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
          title="Create a course"
          okText="Create"
          onCancel={onCancel}
          onOk={onCreate}
          confirmLoading={this.props.loading}
        >
          <Form layout="vertical">
            <Form.Item label="Course name">
              {getFieldDecorator('name', {
                validateFirst: true,
                validate: [
                  {
                    trigger: 'onBlur',
                    rules: [
                      { required: true, message: 'Please enter a course name with at least 4 characters', min: 4 },
                      { message: 'Course name cannot exceed 36 characters', max: 36 },
                      { validator: this.validateName },
                    ],
                  },
                ],
              })(<Input placeholder="CS 101" />)}
            </Form.Item>
            <Form.Item label="Course period">
              {getFieldDecorator('period', {
                validateFirst: true,
                validate: [
                  {
                    trigger: 'onBlur',
                    rules: [
                      { required: true, message: 'Please enter a course period.' },
                      { message: 'Course period cannot exceed 32 characters', max: 32 },
                    ],
                  },
                ],
              })(<Input placeholder="Fall 2024" />)}
            </Form.Item>
            {this.props.courses.length > 0 ? (
              <div>
                <Form.Item className="collection-create-form_last-form-item">
                  {getFieldDecorator('modifier', {
                    initialValue: 'public',
                  })(
                    <Radio.Group>
                      <Radio value="public">Start from scratch</Radio>
                      <Radio value="private">Clone existing course</Radio>
                    </Radio.Group>,
                  )}
                  <CPTooltip title={tooltips.admin.newCourse.clone} infoIcon={true} />
                </Form.Item>
                <Form.Item label="Course to clone">
                  {getFieldDecorator('cloneID')(
                    <Select disabled={this.props.form.getFieldValue('modifier') === 'public'}>
                      {this.props.courses.map((course, i) => {
                        return (
                          <Select.Option key={course.id} value={course.id}>
                            {course.name} | {course.period}
                          </Select.Option>
                        );
                      })}
                    </Select>,
                  )}
                </Form.Item>
              </div>
            ) : null}
          </Form>
        </Modal>
      );
    }
  },
);

export default NewCourseDialog;

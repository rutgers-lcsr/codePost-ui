import * as React from 'react';

import { Form, Icon, Input, Modal, Radio, Select, Tooltip } from 'antd';

import CPButton from '../../components/core/CPButton';

import { CourseType } from '../../infrastructure/course';

interface IProps {
  courses: CourseType[];
  createCourse: (courseName: string, coursePeriod: string, copiedCourse: CourseType | undefined) => Promise<void>;
}

interface IState {
  dialogVisible: boolean;
}

class NewCourseDialog extends React.Component<IProps, IState> {
  private formRef = React.createRef();

  public constructor(props: IProps) {
    super(props);
    this.state = {
      dialogVisible: false,
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
      this.props.createCourse(name, period, cloneCourse);
      this.toggleDialog();
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
      form.resetFields();
      this.setState({ dialogVisible: false });
    });
  };

  public saveFormRef = (formRef: any) => {
    this.formRef = formRef;
  };

  public render() {
    return (
      <div>
        <CPButton onClick={this.toggleDialog} cpType="secondary" icon="plus-circle">
          Create a course
        </CPButton>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.dialogVisible}
          onCancel={this.toggleDialog}
          onCreate={this.handleCreate}
          courses={this.props.courses}
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
}

const CollectionCreateForm: any = Form.create({ name: 'form_in_modal' })(
  // eslint-disable-next-line
  class extends React.Component<ISubProps, {}> {
    public render() {
      const { visible, onCancel, onCreate, form } = this.props;
      const { getFieldDecorator } = form;
      return (
        <Modal visible={visible} title="Create a course" okText="Create" onCancel={onCancel} onOk={onCreate}>
          <Form layout="vertical">
            <Form.Item label="Course name">
              {getFieldDecorator('name', {
                rules: [{ required: true, message: 'Please input a course name with at least 4 characters', min: 4 }],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Course period">
              {getFieldDecorator('period', {
                rules: [{ required: true, message: 'Please input a course period', min: 1 }],
              })(<Input />)}
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
                  <Tooltip
                    title="Cloning a course will copy all assignments (including rubrics) and course settings
                     from the old course into your new course. All other information (including rosters) won't
                      be copied."
                  >
                    <Icon type="info-circle" />
                  </Tooltip>
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

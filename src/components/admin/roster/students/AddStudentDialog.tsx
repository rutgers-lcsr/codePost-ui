/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Form, Input, message, Modal, Select } from 'antd';

/* codePost imports */
import CPButton from '../../../../components/core/CPButton';

import { SectionType } from '../../../../infrastructure/section';

/**********************************************************************************************************************/

interface IProps {
  sections: SectionType[];
  students: string[];
  addStudent: (student: string, section?: SectionType) => Promise<void>;
  willEmailUser: boolean;
}

interface IState {
  modalVisible: boolean;
  saving: boolean;
}

class AddStudentDialog extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    modalVisible: false,
    saving: false,
  };

  private formRef = React.createRef();

  public toggleDialog = () => {
    const { modalVisible } = this.state;
    this.setState({
      modalVisible: !modalVisible,
    });

    // clear form fields when modal is dismissed
    const formRefCast: any = this.formRef; // FIXME: figure out how to type this
    if (formRefCast) {
      const form = formRefCast.props.form;
      form.resetFields();
    }
  };

  public handleCreate = () => {
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.validateFields((err: any, values: any) => {
      if (err) {
        return;
      }

      // show saving animation in modal ok button
      this.setState({ saving: true }, () => {
        const section = this.props.sections.find((el) => {
          return el.id === values.section;
        });
        this.props.addStudent(values.email, section).then(() => {
          // notify user via message
          message.success(`You added ${values.email} as a student.`);

          // clear form and reset fields
          this.setState({ saving: false });
          this.toggleDialog();
          form.resetFields();
        });
      });
    });
  };

  public saveFormRef = (formRef: any) => {
    this.formRef = formRef;
  };

  public render() {
    return (
      <div>
        <CPButton onClick={this.toggleDialog} cpType="primary" icon="user-add">
          Add student
        </CPButton>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.modalVisible}
          onCancel={this.toggleDialog}
          onCreate={this.handleCreate}
          sections={this.props.sections}
          saving={this.state.saving}
          emailUser={this.props.willEmailUser}
          students={this.props.students}
        />
      </div>
    );
  }
}

interface ISubProps {
  form: any; // FIXME: figure out how to type this
  visible: boolean;
  onCreate: () => void;
  onCancel: () => void;
  sections: SectionType[];
  students: string[];
  saving: boolean;
  emailUser: boolean;
}

const CollectionCreateForm: any = Form.create({ name: 'form_in_modal' })(
  class extends React.Component<ISubProps, {}> {
    // FIXME: figure out how to type these arguments
    public handleConfirmEmail = (rule: any, value: any, callback: any) => {
      // Test 1: is value a valid email?
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        callback('This isn`t a valid email address');
      }

      // Test 2: does email correspond to an existing student?
      if (this.props.students.includes(value)) {
        callback('A student with this email address is already a member of this course.');
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
          title="Add a student"
          okText="Create"
          onCancel={onCancel}
          onOk={onCreate}
          confirmLoading={this.props.saving}
        >
          <Form layout="vertical">
            <Form.Item
              label="Email"
              extra={
                <div>
                  Based on your course settings, this student {this.props.emailUser ? <b>will</b> : <b>won't</b>} be
                  emailed when they are added to your course.
                </div>
              }
            >
              {getFieldDecorator('email', {
                validateFirst: true, // only show one validation message at a time (even if multiple apply)
                validate: [
                  {
                    trigger: 'onBlur', // by default, validation rules show onChange, which is annoying
                    rules: [
                      // override default message for "required" validation rule
                      { required: true, message: 'Please input an email address' },
                      { validator: this.handleConfirmEmail },
                    ],
                  },
                ],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Section" extra={"Leave blank to leave the student's section unassigned."}>
              {getFieldDecorator('section', {
                rules: [{ required: false }],
              })(
                <Select allowClear={true}>
                  {this.props.sections.map((section) => {
                    return (
                      <Select.Option key={section.id} value={section.id}>
                        {section.name}
                      </Select.Option>
                    );
                  })}
                </Select>,
              )}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  },
);

export default AddStudentDialog;

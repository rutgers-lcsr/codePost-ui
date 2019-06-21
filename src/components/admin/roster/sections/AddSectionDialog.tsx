/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Form, Input, message, Modal } from 'antd';

/* codePost imports */
import CPButton from '../../../../components/core/CPButton';

import { SectionType } from '../../../../infrastructure/section';

/**********************************************************************************************************************/

interface IProps {
  sections: SectionType[];
  addSection: (sectionName: string) => Promise<void>;
}

interface IState {
  modalVisible: boolean;
  saving: boolean;
}

class AddSectionDialog extends React.Component<IProps, {}> {
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
        this.props.addSection(values.section).then(() => {
          // notify user via message
          message.success(`Added section ${values.section}.`);

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
        <CPButton onClick={this.toggleDialog} cpType="primary" icon="plus-circle">
          Add section
        </CPButton>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.modalVisible}
          onCancel={this.toggleDialog}
          onCreate={this.handleCreate}
          sections={this.props.sections}
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
  saving: boolean;
}

const CollectionCreateForm: any = Form.create({ name: 'form_in_modal' })(
  class extends React.Component<ISubProps, {}> {
    // FIXME: figure out how to type these arguments
    public handleConfirmSection = (rule: any, value: any, callback: any) => {
      // Test 1: does name correspond to an existing section?
      if (
        this.props.sections.some((el) => {
          return el.name === value;
        })
      ) {
        callback('A section with this name already exists within this course.');
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
          title="Add a section"
          okText="Create"
          onCancel={onCancel}
          onOk={onCreate}
          confirmLoading={this.props.saving}
        >
          <Form layout="vertical">
            <Form.Item label="Section name">
              {getFieldDecorator('section', {
                validateFirst: true, // only show one validation message at a time (even if multiple apply)
                validate: [
                  {
                    trigger: 'onBlur', // by default, validation rules show onChange, which is annoying
                    rules: [
                      // override default message for "required" validation rule
                      { required: true, message: 'Please input a name for the new section' },
                      { validator: this.handleConfirmSection },
                    ],
                  },
                ],
              })(<Input />)}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  },
);

export default AddSectionDialog;

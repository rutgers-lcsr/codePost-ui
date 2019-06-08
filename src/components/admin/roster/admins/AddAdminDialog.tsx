/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Form, Input, message, Modal } from 'antd';

/* codePost imports */
import CPButton from '../../../../components/core/CPButton';

/**********************************************************************************************************************/

interface IProps {
  admins: string[];
  addAdmin: (email: string) => Promise<void>;
}

interface IState {
  modalVisible: boolean;
  loading: boolean;
}

class AddAdminDialog extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    modalVisible: false,
    loading: false,
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

      this.setState({ loading: true }, () => {
        this.props.addAdmin(values.email).then(() => {
          this.setState({ loading: false });
          this.toggleDialog();
          message.success(`You added ${values.email} as an admin.`);
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
          Add admin
        </CPButton>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.modalVisible}
          onCancel={this.toggleDialog}
          onCreate={this.handleCreate}
          admins={this.props.admins}
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
  admins: string[];
  loading: boolean;
}

const CollectionCreateForm: any = Form.create({ name: 'form_in_modal' })(
  class extends React.Component<ISubProps, {}> {
    public handleConfirmEmail = (rule: any, value: any, callback: any) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        callback('This isn`t a valid email address');
      }

      if (this.props.admins.includes(value)) {
        callback('An admin with this email address is already a member of this course.');
      }

      callback();
    };

    public render() {
      const { visible, onCancel, onCreate, form } = this.props;
      const { getFieldDecorator } = form;
      return (
        <Modal
          visible={visible}
          title="Add an admin"
          okText="Create"
          onCancel={onCancel}
          onOk={onCreate}
          confirmLoading={this.props.loading}
        >
          <Form layout="vertical">
            <Form.Item label="Email">
              {getFieldDecorator('email', {
                validateFirst: true,
                validate: [
                  {
                    trigger: 'onBlur',
                    rules: [
                      { required: true, message: 'Please input an email address' },
                      { validator: this.handleConfirmEmail },
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

export default AddAdminDialog;

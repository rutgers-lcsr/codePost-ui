/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Form, Input, InputNumber, Modal } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/* codePost imports */
import CPButton from '../../../../components/core/CPButton';

import { AssignmentType } from '../../../../infrastructure/assignment';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<AssignmentType>;
}

interface IState {
  dialogVisible: boolean;
}

class NewAssignmentDialog extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    dialogVisible: false,
  };

  private formRef: React.RefObject<FormComponentProps> = React.createRef();

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
    });
  };

  public handleCreate = () => {
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.validateFields((err: any, values: any) => {
      if (err) {
        return;
      }

      this.createNewAssignment(values.name, values.points);
      form.resetFields();
      this.setState({ dialogVisible: false });
    });
  };

  public createNewAssignment = (name: string, points: number) => {
    this.props.createAssignment(name, points);
    this.toggleDialog();
  };

  public saveFormRef = (formRef: any) => {
    this.formRef = formRef;
  };

  public render() {
    return (
      <div>
        <CPButton onClick={this.toggleDialog} cpType="primary" icon="plus-circle">
          Add assignment
        </CPButton>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.dialogVisible}
          onCancel={this.toggleDialog}
          onCreate={this.handleCreate}
        />
      </div>
    );
  }
}

interface IFormProps extends FormComponentProps {
  visible: boolean;
  onCreate: () => void;
  onCancel: () => void;
}

// FIXME: figure out how to type output of Form.create HOC
const CollectionCreateForm: any = Form.create({ name: 'form_in_modal' })(
  class extends React.Component<IFormProps, {}> {
    public render() {
      const { visible, onCancel, onCreate, form } = this.props;
      const { getFieldDecorator } = form;
      return (
        <Modal visible={visible} title="Create an assignment" okText="Create" onCancel={onCancel} onOk={onCreate}>
          <Form layout="vertical">
            <Form.Item label="Name">
              {getFieldDecorator('name', {
                rules: [
                  { required: true, message: 'Please input an assignment name with at least 4 characters', min: 4 },
                ],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Points">
              {getFieldDecorator('points', {
                rules: [{ required: true }],
              })(<InputNumber min={0} />)}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  },
);

export default NewAssignmentDialog;

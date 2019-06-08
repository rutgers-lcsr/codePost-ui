/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Form, Input, InputNumber, message, Modal, Switch } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/* codePost imports */
import { AssignmentPatchType, AssignmentType } from '../../../../infrastructure/assignment';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  onSave: (assignment: AssignmentPatchType) => Promise<void>;
  currentAssignment: AssignmentType;
}

class AssignmentSettingsDialog extends React.Component<IProps, {}> {
  private formRef: React.RefObject<FormComponentProps> = React.createRef();

  public updateSettings = (name: string, points: number, anonymousGrading: boolean, hideGrades: boolean) => {
    const { currentAssignment } = this.props;
    const payload = {
      id: currentAssignment.id,
      name,
      points,
      anonymousGrading,
      hideGrades,
    };

    this.props.onSave(payload).then(() => {
      message.success('Assignment settings updated!');
      this.props.onCancel();
    });
  };

  public saveFormRef = (formRef: React.RefObject<FormComponentProps>) => {
    this.formRef = formRef;
  };

  public handleCreate = () => {
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }

      this.updateSettings(values.name, values.points, values.anonymousGrading, values.hideGrades);
      form.resetFields();
    });
  };

  public render() {
    if (!this.props.isVisible) {
      return <div />;
    }

    return (
      <CollectionCreateForm
        wrappedComponentRef={this.saveFormRef}
        visible={true}
        onSave={this.handleCreate}
        onCancel={this.props.onCancel}
        assignment={this.props.currentAssignment}
      />
    );
  }
}

/***********************************************************************************/
/* Form component
/***********************************************************************************/

interface IFormProps extends FormComponentProps {
  visible: boolean;
  onSave: () => void;
  onCancel: () => void;
  assignment: AssignmentType;
}

interface IFormValues {
  name: string;
  points: number;
  anonymousGrading: boolean;
  hideGrades: boolean;
}

// FIXME: figure out how to type output of Form.create HOC
const CollectionCreateForm: any = Form.create()(
  class extends React.Component<IFormProps, {}> {
    public render() {
      const { visible, onCancel, onSave, form } = this.props;
      const { getFieldDecorator } = form;
      return (
        <Modal visible={visible} title="Update assignment settings" okText="Save" onCancel={onCancel} onOk={onSave}>
          <Form layout="horizontal" hideRequiredMark={true}>
            <Form.Item label="Name" extra="Must be unique within this course.">
              {getFieldDecorator('name', {
                initialValue: this.props.assignment.name,
                rules: [{ required: true }],
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Points" extra="Total points possible for this assignment.">
              {getFieldDecorator('points', {
                initialValue: this.props.assignment.points,
                rules: [{ required: true }],
              })(<InputNumber min={0} />)}
            </Form.Item>
            <Form.Item
              label="Anonymous Grading Mode"
              extra={
                <div>
                  When enabled, graders will not be able to see student emails associated with submissions. For more
                  info, see <a href="https://help.codepost.io">our docs</a>.
                </div>
              }
            >
              {getFieldDecorator('anonymous-grading-mode', {
                initialValue: this.props.assignment.anonymousGrading,
              })(<Switch />)}
            </Form.Item>
            <Form.Item
              label="Hide grades from students"
              extra=" When enabled, students won't be able to view the grades associated with their submissions."
            >
              {getFieldDecorator('hide-grades-from-students', {
                initialValue: this.props.assignment.hideGrades,
              })(<Switch />)}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  },
);

export default AssignmentSettingsDialog;

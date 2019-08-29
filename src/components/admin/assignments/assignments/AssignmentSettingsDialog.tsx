/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Form, Input, InputNumber, message, Modal, Radio, Switch } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/* codePost imports */
import { AssignmentPatchType, AssignmentType } from '../../../../infrastructure/assignment';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  onSave: (assignment: AssignmentPatchType) => Promise<void>;
  currentAssignment: AssignmentType;
  assignments: AssignmentType[];
}

class AssignmentSettingsDialog extends React.Component<IProps, {}> {
  private formRef: React.RefObject<FormComponentProps> = React.createRef();

  public updateSettings = (values: IFormValues) => {
    const { currentAssignment } = this.props;
    const payload = {
      id: currentAssignment.id,
      name: values.name,
      points: values.points,
      anonymousGrading: values.anonymousGrading,
      hideGrades: values.hideGrades,
      commentFeedback: values.commentFeedback,
      allowRegradeRequests: values.studentResponse === 'allowRegradeRequests',
      allowQuestions: values.studentResponse === 'allowQuestions',
    };

    this.props.onSave(payload).then(() => {
      message.success('Assignment settings updated!');
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

      this.updateSettings(values);
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
        assignments={this.props.assignments}
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
  assignments: AssignmentType[];
}

interface IFormValues {
  name: string;
  points: number;
  anonymousGrading: boolean;
  hideGrades: boolean;
  commentFeedback: boolean;
  studentResponse: string;
}

// FIXME: figure out how to type output of Form.create HOC
const CollectionCreateForm: any = Form.create()(
  class extends React.Component<IFormProps, {}> {
    public validateName = (rule: any, value: string, callback: any) => {
      if (
        value !== this.props.assignment.name &&
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
      const { visible, onCancel, onSave, form } = this.props;
      const { getFieldDecorator } = form;
      return (
        <Modal visible={visible} title="Update assignment settings" okText="Save" onCancel={onCancel} onOk={onSave}>
          <Form layout="horizontal" hideRequiredMark={true}>
            <Form.Item label="Name" extra="Must be unique within this course.">
              {getFieldDecorator('name', {
                initialValue: this.props.assignment.name,
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
              })(<Input />)}
            </Form.Item>
            <Form.Item label="Points" extra="Total points possible for this assignment.">
              {getFieldDecorator('points', {
                initialValue: this.props.assignment.points,
                rules: [
                  { required: true, message: 'Please specify a point value' },
                  { validator: this.validatePoints },
                ],
              })(<InputNumber min={0} />)}
            </Form.Item>
            <Form.Item
              label="Anonymous Grading Mode"
              extra={
                <div>
                  When enabled, graders will not be able to see student emails associated with submissions. For more
                  info, see{' '}
                  <a href="https://help.codepost.io/en/articles/3164756-how-to-enable-anonymous-grading-mode">
                    our docs
                  </a>
                  .
                </div>
              }
            >
              {getFieldDecorator('anonymousGrading', {
                initialValue: this.props.assignment.anonymousGrading,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
            <Form.Item
              label="Student feedback enabled"
              extra={<div>When enabled, students will be able to leave feedback on applied rubric comments.</div>}
            >
              {getFieldDecorator('commentFeedback', {
                initialValue: this.props.assignment.commentFeedback,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
            <Form.Item
              label="Hide grades from students"
              extra=" When enabled, students won't be able to view the grades associated with their submissions."
            >
              {getFieldDecorator('hideGrades', {
                initialValue: this.props.assignment.hideGrades,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
            <Form.Item
              label="Allow Student Questions and Regrades"
              extra=" When enabled, students can submit a question on their graded submission."
            >
              {getFieldDecorator('studentResponse', {
                initialValue: this.props.assignment.allowRegradeRequests
                  ? 'allowRegradeRequests'
                  : this.props.assignment.allowQuestions
                  ? 'allowQuestions'
                  : 'noQuestions',
              })(
                <Radio.Group>
                  <Radio style={{ display: 'block' }} value="noQuestions">
                    No response allowed
                  </Radio>
                  <Radio style={{ display: 'block' }} value="allowQuestions">
                    Questions allowed
                  </Radio>
                  <Radio style={{ display: 'block' }} value="allowRegradeRequests">
                    Questions and Regrade requests allowed
                  </Radio>
                </Radio.Group>,
              )}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  },
);

export default AssignmentSettingsDialog;

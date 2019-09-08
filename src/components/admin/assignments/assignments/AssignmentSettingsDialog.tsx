/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { DatePicker, Form, Input, InputNumber, message, Modal, Switch, Tag } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

import moment from 'moment';

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
      allowStudentUpload: values.allowStudentUpload,
      uploadDueDate: values.uploadDueDate,
      liveFeedbackMode: values.liveFeedbackMode,
      additiveGrading: values.additiveGrading,
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
  allowStudentUpload: boolean;
  uploadDueDate: string;
  liveFeedbackMode: boolean;
  additiveGrading: boolean;
}

interface IFormState {
  studentUploadEnabled: boolean;
}

// FIXME: figure out how to type output of Form.create HOC
const CollectionCreateForm: any = Form.create()(
  class extends React.Component<IFormProps, IFormState> {
    public constructor(props: IFormProps) {
      super(props);
      this.state = {
        studentUploadEnabled: this.props.assignment.allowStudentUpload,
      };
    }

    public handleStudentUploadCheck = (checked: boolean) => {
      this.setState({ studentUploadEnabled: checked });
    };

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
            <Form.Item
              label="Name"
              extra="Must be unique within this course."
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 15 }}
            >
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
            <Form.Item
              label="Points"
              extra="Total points possible for this assignment."
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 15 }}
            >
              {getFieldDecorator('points', {
                initialValue: this.props.assignment.points,
                rules: [
                  { required: true, message: 'Please specify a point value' },
                  { validator: this.validatePoints },
                ],
              })(<InputNumber min={0} />)}
            </Form.Item>
            <Form.Item
              label="Anonymous Grading"
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
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 15 }}
            >
              {getFieldDecorator('anonymousGrading', {
                initialValue: this.props.assignment.anonymousGrading,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
            <Form.Item
              label="Student feedback"
              extra={<div>When enabled, students will be able to leave feedback on applied rubric comments.</div>}
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 15 }}
            >
              {getFieldDecorator('commentFeedback', {
                initialValue: this.props.assignment.commentFeedback,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
            <Form.Item
              label="Hide grades"
              extra=" When enabled, students won't be able to view the grades associated with their submissions."
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 15 }}
            >
              {getFieldDecorator('hideGrades', {
                initialValue: this.props.assignment.hideGrades,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
            <Form.Item
              label="Allow student upload"
              extra={
                <div>
                  <Tag>NEW</Tag>When enabled, students can upload submissions before the given due date.
                </div>
              }
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 15 }}
            >
              {getFieldDecorator('allowStudentUpload', {
                initialValue: this.props.assignment.allowStudentUpload,
                valuePropName: 'checked',
              })(<Switch onClick={this.handleStudentUploadCheck} />)}
            </Form.Item>
            <Form.Item
              label="Due Date"
              extra="Due date for student uploads"
              labelCol={{ span: 9 }}
              wrapperCol={{ span: 12 }}
            >
              {getFieldDecorator('uploadDueDate', {
                initialValue: this.props.assignment.uploadDueDate ? moment(this.props.assignment.uploadDueDate) : null,
                valuePropName: 'value',
                rules: [
                  {
                    required: this.state.studentUploadEnabled,
                    message: 'Due date is required if student upload is enabed.',
                  },
                ],
              })(<DatePicker showTime placeholder="Select Time" disabled={!this.state.studentUploadEnabled} />)}
            </Form.Item>
            <Form.Item
              label="Live feedback mode"
              extra={
                <div>
                  <Tag>NEW</Tag> Students can see their feedback and comments without the submission being finalized or
                  published.\ Ideal for office hours or ungraded feedback.
                </div>
              }
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 15 }}
            >
              {getFieldDecorator('liveFeedbackMode', {
                initialValue: this.props.assignment.liveFeedbackMode,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
            <Form.Item
              label="Additive grading"
              extra={
                <div>
                  <Tag>NEW</Tag> Start submission scores at 0 instead of at an assignment's point value.
                </div>
              }
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 15 }}
            >
              {getFieldDecorator('additiveGrading', {
                initialValue: this.props.assignment.additiveGrading,
                valuePropName: 'checked',
              })(<Switch />)}
            </Form.Item>
          </Form>
        </Modal>
      );
    }
  },
);

export default AssignmentSettingsDialog;

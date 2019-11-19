/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { DatePicker, Form, Input, InputNumber, message, Modal, Switch, Tabs, Tag } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

import moment from 'moment-timezone';

/* codePost imports */
import { AssignmentPatchType, AssignmentType } from '../../../../infrastructure/assignment';

import UploadFileTemplates from './UploadFileTemplates';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  onSave: (assignment: AssignmentPatchType) => Promise<void>;
  currentAssignment: AssignmentType;
  assignments: AssignmentType[];
  timezone: string;
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
      collaborativeRubricMode: values.collaborativeRubricMode,
      hideGradersFromStudents: values.hideGradersFromStudents,
      hideGrades: values.hideGrades,
      commentFeedback: values.commentFeedback,
      allowRegradeRequests: values.allowRegradeRequests,
      regradeDeadline: values.regradeDeadline,
      allowStudentUpload: values.allowStudentUpload,
      uploadDueDate: values.uploadDueDate,
      liveFeedbackMode: values.liveFeedbackMode,
      additiveGrading: values.additiveGrading,
      forcedRubricMode: values.forcedRubricMode,
      templateMode: values.templateMode,
      showFrequentlyUsedRubricComments: values.showFrequentlyUsedRubricComments,
      allowLateUploads: values.allowLateUploads,
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
        timezone={this.props.timezone}
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
  timezone: string;
}

interface IFormValues {
  name: string;
  points: number;
  anonymousGrading: boolean;
  collaborativeRubricMode: boolean;
  hideGradersFromStudents: boolean;
  hideGrades: boolean;
  commentFeedback: boolean;
  allowRegradeRequests: boolean;
  regradeDeadline: string | null;
  allowStudentUpload: boolean;
  uploadDueDate: string;
  liveFeedbackMode: boolean;
  additiveGrading: boolean;
  forcedRubricMode: boolean;
  templateMode: boolean;
  showFrequentlyUsedRubricComments: boolean;
  allowLateUploads: boolean;
}

interface IFormState {
  studentUploadEnabled: boolean;
  templateModeEnabled: boolean;
  regradesEnabled: boolean;
}

// FIXME: figure out how to type output of Form.create HOC
const CollectionCreateForm: any = Form.create()(
  class extends React.Component<IFormProps, IFormState> {
    public constructor(props: IFormProps) {
      super(props);
      this.state = {
        studentUploadEnabled: this.props.assignment.allowStudentUpload,
        templateModeEnabled: this.props.assignment.templateMode,
        regradesEnabled: this.props.assignment.allowRegradeRequests,
      };
    }

    public handleStudentUploadCheck = (checked: boolean) => {
      this.setState({ studentUploadEnabled: checked });
    };

    public handleTemplateModeCheck = (checked: boolean) => {
      this.setState({ templateModeEnabled: checked });
    };

    public handleRegradeCheck = (checked: boolean) => {
      this.setState({ regradesEnabled: checked });
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
      if (parseFloat(value) < 0) {
        callback('Points must be non-negative.');
      }

      // Call callback with no arguments to signal that value passed validation
      callback();
    };

    public render() {
      const { visible, onCancel, onSave, form } = this.props;
      const { getFieldDecorator } = form;
      return (
        <Modal
          visible={visible}
          title="Update assignment settings"
          okText="Save"
          onCancel={onCancel}
          onOk={onSave}
          width={'45%'}
        >
          <Form layout="horizontal" hideRequiredMark={true}>
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane tab="General" key="1">
                <Form.Item
                  label="Name"
                  extra="Must be unique within this course."
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
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
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('points', {
                    initialValue: this.props.assignment.points,
                    rules: [
                      { required: true, message: 'Please specify a point value' },
                      { validator: this.validatePoints },
                    ],
                  })(<InputNumber min={0} />)}
                </Form.Item>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Submission" key="2">
                <Form.Item
                  label="Allow student upload"
                  extra={
                    <div>
                      <Tag>NEW</Tag>When enabled, students can upload submissions before the given due date.
                    </div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('allowStudentUpload', {
                    initialValue: this.props.assignment.allowStudentUpload,
                    valuePropName: 'checked',
                  })(<Switch onClick={this.handleStudentUploadCheck} />)}
                </Form.Item>
                <Form.Item
                  label="Due Date"
                  extra="Due date for student uploads"
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('uploadDueDate', {
                    initialValue: this.props.assignment.uploadDueDate
                      ? moment(this.props.assignment.uploadDueDate).tz(this.props.timezone)
                      : null,
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
                      <Tag>NEW</Tag> Students can see their feedback and comments without the submission being finalized
                      or published. Ideal for office hours or ungraded feedback.
                    </div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('liveFeedbackMode', {
                    initialValue: this.props.assignment.liveFeedbackMode,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
                <Form.Item
                  label="Allow late submissions"
                  extra={
                    <div>
                      <Tag>NEW</Tag> When enabled, students will be allowed to submit after this assignment's due date
                      has passed.
                    </div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('allowLateUploads', {
                    initialValue: this.props.assignment.allowLateUploads,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Grading" key="3">
                <Form.Item
                  label="Anonymous grading"
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
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('anonymousGrading', {
                    initialValue: this.props.assignment.anonymousGrading,
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
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('additiveGrading', {
                    initialValue: this.props.assignment.additiveGrading,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
                <Form.Item
                  label="Rubric-only mode"
                  extra={
                    <div>
                      <Tag>NEW</Tag> Require graders to link all submission comments to a Rubric Comment.
                    </div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 15 }}
                >
                  {getFieldDecorator('forcedRubricMode', {
                    initialValue: this.props.assignment.forcedRubricMode,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
                <Form.Item
                  label="Collaborative rubric"
                  extra={
                    <div>
                      When enabled, graders will be able to edit this assignment's rubric from the code console. Graders
                      will have full permission to create, modify and delete rubric items.
                    </div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('collaborativeRubricMode', {
                    initialValue: this.props.assignment.collaborativeRubricMode,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
                <Form.Item
                  label="Include file templates"
                  extra={
                    <div>
                      <Tag>NEW</Tag> Use file templates to help speed up grading by de-emphasizing template-provided
                      versus student-written code. Template names must match submission file names.
                    </div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('templateMode', {
                    initialValue: this.props.assignment.templateMode,
                    valuePropName: 'checked',
                  })(<Switch onClick={this.handleTemplateModeCheck} />)}
                </Form.Item>
                {this.state.templateModeEnabled ? (
                  <div style={{ paddingLeft: '25%' }}>
                    <UploadFileTemplates assignment={this.props.assignment} />
                  </div>
                ) : null}
                <Form.Item
                  label="Freq. rubric comments"
                  extra={
                    <div>
                      When enabled, an assignment's 10 most frequently applied rubric comments will be shown within the
                      code console to make them easily accessible.
                    </div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('showFrequentlyUsedRubricComments', {
                    initialValue: this.props.assignment.showFrequentlyUsedRubricComments,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Publishing" key="4">
                <Form.Item
                  label="Hide graders"
                  extra={
                    <div>When enabled, students will not be able to see the grader associated with a submission.</div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('hideGradersFromStudents', {
                    initialValue: this.props.assignment.hideGradersFromStudents,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
                <Form.Item
                  label="Student feedback"
                  extra={<div>When enabled, students will be able to leave feedback on applied rubric comments.</div>}
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('commentFeedback', {
                    initialValue: this.props.assignment.commentFeedback,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
                <Form.Item
                  label="Hide grades"
                  extra=" When enabled, students won't be able to view the grades associated with their submissions."
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('hideGrades', {
                    initialValue: this.props.assignment.hideGrades,
                    valuePropName: 'checked',
                  })(<Switch />)}
                </Form.Item>
                <Form.Item
                  label="Regrade requests"
                  extra=" When enabled, students can submit a question on their graded submission and request a regrade."
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('allowRegradeRequests', {
                    initialValue: this.props.assignment.allowRegradeRequests,
                    valuePropName: 'checked',
                  })(<Switch onClick={this.handleRegradeCheck} />)}
                </Form.Item>
                <Form.Item
                  label="Deadline"
                  extra="Optional deadline for students to submit regrade requests"
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('regradeDeadline', {
                    initialValue: this.props.assignment.regradeDeadline
                      ? moment(this.props.assignment.regradeDeadline).tz(this.props.timezone)
                      : null,
                    valuePropName: 'value',
                  })(<DatePicker showTime placeholder="Select Time" disabled={!this.state.regradesEnabled} />)}
                </Form.Item>
              </Tabs.TabPane>
            </Tabs>
          </Form>
        </Modal>
      );
    }
  },
);

export default AssignmentSettingsDialog;

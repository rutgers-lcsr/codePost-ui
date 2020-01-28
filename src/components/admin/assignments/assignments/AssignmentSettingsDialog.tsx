/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, DatePicker, Form, Input, InputNumber, message, Modal, Switch, Tabs, Tag, Transfer, Table } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/* other library imports */
import moment from 'moment-timezone';

/* codePost imports */
import { AssignmentType, FileTemplateType } from '../../../../infrastructure/types';
import { AssignmentPatchType } from '../../../../infrastructure/assignment';
import { FileTemplate } from '../../../../infrastructure/fileTemplate';

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

interface IState {
  fileTemplates: FileTemplateType[];
}

class AssignmentSettingsDialog extends React.Component<IProps, IState> {
  private formRef: React.RefObject<FormComponentProps> = React.createRef();

  public constructor(props: IProps) {
    super(props);
    this.state = {
      fileTemplates: [],
    };
  }

  public componentDidMount() {
    this.loadTemplates();
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.isVisible === false && this.props.isVisible === true) {
      this.loadTemplates();
    }
  }

  public loadTemplates = () => {
    const promises = this.props.currentAssignment.fileTemplates.map((el) => FileTemplate.read(el));
    Promise.all(promises).then((fileTemplates) => this.setState({ fileTemplates }));
  };

  public updateSettings = (values: IFormValues) => {
    const { currentAssignment } = this.props;

    let templateMode = false;
    if (this.state.fileTemplates !== undefined && this.state.fileTemplates.length > 0) {
      const filtered = this.state.fileTemplates.filter((template: FileTemplateType) => {
        return template.code !== '';
      });
      if (filtered.length > 0) {
        templateMode = true;
      }
    }

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
      templateMode,
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

  public handleCreate = (fileTemplates: FileTemplateType[]) => {
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }

      for (const ft of fileTemplates) {
        if (ft.id > 0) {
          FileTemplate.update(ft);
        } else {
          FileTemplate.create(ft);
        }
      }

      for (const ft of this.state.fileTemplates) {
        if (!fileTemplates.some((el) => el.id === ft.id)) {
          FileTemplate.delete(ft.id);
        }
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
        initialTemplateFiles={this.state.fileTemplates}
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
  onSave: (fileTemplates: FileTemplateType[]) => void;
  onCancel: () => void;
  assignment: AssignmentType;
  assignments: AssignmentType[];
  initialTemplateFiles: FileTemplateType[];
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
  templates: FileTemplateType[];
  newTemplate: string;
  selectedTemplates: string[];
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
        templates: props.initialTemplateFiles,
        newTemplate: '',
        selectedTemplates: [],
      };
    }

    public componentDidUpdate(oldProps: IFormProps) {
      if (oldProps.initialTemplateFiles !== this.props.initialTemplateFiles) {
        this.setState({ templates: this.props.initialTemplateFiles });
      }
    }

    /****************************************************************************************/
    /* Template file handling
    /****************************************************************************************/

    public templateColumns = [
      {
        title: 'File',
        dataIndex: 'name',
        key: 'file',
      },
      {
        title: 'Template code',
        dataIndex: 'template',
        key: 'template',
        align: 'center' as const,
      },
    ];

    public changeTemplateText = (e: any) => {
      this.setState({ newTemplate: e.target.value });
    };

    public addTemplate = () => {
      this.setState((oldState: IFormState) => {
        return {
          templates: [
            ...oldState.templates,
            {
              code: '',
              extension: oldState.newTemplate.split('.')[1],
              name: oldState.newTemplate,
              assignment: this.props.assignment.id,
              path: '',
              required: false,
              id: -1 * oldState.templates.length,
            },
          ],
        };
      });
    };

    public switchTemplates = (nextTargetKeys: string[], direction: string, moveKeys: string[]) => {
      const targetRequired = direction === 'right' ? true : false;
      this.setState((oldState: IFormState) => {
        return {
          templates: oldState.templates.map((template) =>
            !moveKeys.includes(template.id.toString()) ? template : { ...template, required: targetRequired },
          ),
          selectedTemplates: [],
        };
      });
    };

    public deleteTemplates = () => {
      this.setState((oldState: IFormState) => {
        return {
          templates: oldState.templates.filter((el) => !oldState.selectedTemplates.includes(el.id.toString())),
          selectedTemplates: [],
        };
      });
    };

    public setSelectedTemplates = (sourceSelectedKeys: string[], targetSelectedKeys: string[]) => {
      this.setState({ selectedTemplates: [...sourceSelectedKeys, ...targetSelectedKeys] });
    };

    public updateTemplateCode = (id: number, newCode: string) => {
      this.setState((oldState: IFormState) => {
        const old = oldState.templates.find((el) => el.id === id);
        const templates = [...oldState.templates.filter((el) => el.id !== id), { ...old!, code: newCode }];
        return {
          templates,
        };
      });
    };

    /****************************************************************************************/

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
          onOk={onSave.bind({}, this.state.templates)}
          width={'45%'}
          maskClosable={false}
        >
          <Form
            layout="horizontal"
            hideRequiredMark={true}
            style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}
          >
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
                  extra={
                    <span>
                      Due date for student uploads. Your course's timezone is <b>{this.props.timezone}.</b>
                    </span>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('uploadDueDate', {
                    initialValue: this.props.assignment.uploadDueDate
                      ? moment(this.props.assignment.uploadDueDate).tz(this.props.timezone)
                      : moment()
                          .tz(this.props.timezone)
                          .endOf('day'),
                    valuePropName: 'value',
                    rules: [
                      {
                        required: this.state.studentUploadEnabled,
                        message: 'Due date is required if student upload is enabed.',
                      },
                    ],
                  })(<DatePicker showTime placeholder="Select Time" disabled={!this.state.studentUploadEnabled} />)}
                </Form.Item>
                <Form.Item label="Submission files" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
                  <Transfer
                    dataSource={this.state.templates.map((el) => {
                      return { ...el, key: el.id.toString(), title: el.name };
                    })}
                    targetKeys={this.state.templates.filter((el) => el.required).map((el) => el.id.toString())}
                    onSelectChange={this.setSelectedTemplates}
                    selectedKeys={this.state.selectedTemplates}
                    titles={['Optional', 'Required']}
                    render={(item: any) => item.title}
                    footer={() => (
                      <Button size="small" style={{ float: 'right', margin: 5 }} onClick={this.deleteTemplates}>
                        delete
                      </Button>
                    )}
                    onChange={this.switchTemplates}
                  />
                  <Input onChange={this.changeTemplateText} placeholder="file name" style={{ width: '72%' }} />
                  <Button onClick={this.addTemplate}>Add</Button>
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
                  })(<Switch disabled={!form.getFieldValue('allowStudentUpload')} />)}
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
                  label="File template code"
                  extra={
                    <div>
                      Use file templates to help speed up grading by de-emphasizing template-provided versus
                      student-written code. Template names must match submission file names.
                    </div>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  <Table
                    columns={this.templateColumns}
                    dataSource={this.state.templates
                      .sort((a, b) => a.id - b.id)
                      .map((el) => {
                        return {
                          name: el.name,
                          template: (
                            <UploadFileTemplates
                              fileName={el.name}
                              isReplacement={el.code.length > 0}
                              updateTemplate={this.updateTemplateCode.bind({}, el.id)}
                            />
                          ),
                          key: el.id.toString(),
                        };
                      })}
                    pagination={false}
                  />
                </Form.Item>
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
                  extra={
                    <span>
                      Optional deadline for students to submit regrade requests. Your course's timezone is{' '}
                      <b>{this.props.timezone}.</b>
                    </span>
                  }
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  {getFieldDecorator('regradeDeadline', {
                    initialValue: this.props.assignment.regradeDeadline
                      ? moment(this.props.assignment.regradeDeadline).tz(this.props.timezone)
                      : moment().tz(this.props.timezone),
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

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  FormInstance,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
  Table,
  Tabs,
  Tag,
  Transfer,
} from 'antd';

/* other library imports */
import moment from 'moment-timezone';

/* codePost imports */
import { AssignmentPatchType } from '../../../../infrastructure/assignment';
import { FileTemplate } from '../../../../infrastructure/fileTemplate';
import { AssignmentType, FileTemplateType, SectionType } from '../../../../infrastructure/types';
import InputNumberMultiple from '../../settings/InputNumberMultiple';

import UploadFileTemplates from './UploadFileTemplates';

import ReactMarkdown from 'react-markdown';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  onSave: (assignment: AssignmentPatchType) => Promise<void>;
  currentAssignment: AssignmentType;
  assignments: AssignmentType[];
  timezone: string;
  sections: SectionType[];
}

const AssignmentSettingsDialog: React.FC<IProps> = (props) => {
  const [fileTemplates, setFileTemplates] = React.useState<FileTemplateType[]>([]);
  const [form] = Form.useForm();

  const loadTemplates = () => {
    const promises = props.currentAssignment.fileTemplates.map((el) => FileTemplate.read(el));
    Promise.all(promises).then((templates) => setFileTemplates(templates));
  };

  React.useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (props.isVisible) {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isVisible]);

  const updateSettings = (values: IFormValues) => {
    const { currentAssignment } = props;

    let templateMode = false;
    if (fileTemplates !== undefined && fileTemplates.length > 0) {
      const filtered = fileTemplates.filter((template: FileTemplateType) => {
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
      allowStudentUploadWithPartners: values.allowStudentUploadWithPartners,
      uploadDueDate: values.uploadDueDate,
      liveFeedbackMode: values.liveFeedbackMode,
      additiveGrading: values.additiveGrading,
      forcedRubricMode: values.forcedRubricMode,
      templateMode,
      showFrequentlyUsedRubricComments: values.showFrequentlyUsedRubricComments,
      allowLateUploads: values.allowLateUploads,
      explanation: values.explanation,
      hideFrom: values.hideFrom,
      lateDeductions: values.lateDeductions,
    };

    props.onSave(payload).then(() => {
      message.success('Assignment settings updated!');
      props.onCancel();
    });
  };

  const handleCreate = (templates: FileTemplateType[]) => {
    form
      .validateFields()
      .then(async (values: IFormValues) => {
        const fileTemplatePromises: Promise<FileTemplateType | void>[] = [];
        for (const ft of templates) {
          if (ft.id > 0) {
            fileTemplatePromises.push(FileTemplate.update(ft));
          } else {
            fileTemplatePromises.push(FileTemplate.create(ft));
          }
        }

        for (const ft of fileTemplates) {
          if (!templates.some((el) => el.id === ft.id)) {
            fileTemplatePromises.push(FileTemplate.delete(ft));
          }
        }

        // Block assignment update on file templates update so the file templates field is updated on
        // Assignment.patch
        await Promise.all(fileTemplatePromises);

        updateSettings(values);
      })
      .catch((err: unknown) => {
        // Form validation failed
        console.error('Form validation error:', err);
      });
  };

  if (!props.isVisible) {
    return <div />;
  }

  return (
    <CollectionCreateForm
      form={form}
      visible={true}
      onSave={handleCreate}
      onCancel={props.onCancel}
      assignment={props.currentAssignment}
      assignments={props.assignments}
      initialTemplateFiles={fileTemplates}
      timezone={props.timezone}
      sections={props.sections}
    />
  );
};

/***********************************************************************************/
/* Form component
/***********************************************************************************/

interface IFormProps {
  form: FormInstance;
  visible: boolean;
  onCancel: () => void;
  onSave: (templates: FileTemplateType[]) => void;
  assignment: AssignmentType;
  assignments: AssignmentType[];
  initialTemplateFiles: FileTemplateType[];
  timezone: string;
  sections: SectionType[];
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
  allowStudentUploadWithPartners: boolean;
  uploadDueDate: string;
  liveFeedbackMode: boolean;
  additiveGrading: boolean;
  forcedRubricMode: boolean;
  templateMode: boolean;
  showFrequentlyUsedRubricComments: boolean;
  allowLateUploads: boolean;
  explanation: string;
  hideFrom: string[];
  lateDeductions: number[];
}

const CollectionCreateForm: React.FC<IFormProps> = (props) => {
  const { form, visible, onCancel, onSave, assignment, assignments, initialTemplateFiles, timezone, sections } = props;

  const [studentUploadEnabled, setStudentUploadEnabled] = React.useState(assignment.allowStudentUpload);
  const [regradesEnabled, setRegradesEnabled] = React.useState(assignment.allowRegradeRequests);
  const [templates, setTemplates] = React.useState<FileTemplateType[]>(initialTemplateFiles);
  const [newTemplate, setNewTemplate] = React.useState('');
  const [selectedTemplates, setSelectedTemplates] = React.useState<string[]>([]);
  const [explanationPreview, setExplanationPreview] = React.useState(false);
  const [explanation, setExplanation] = React.useState(assignment.explanation);

  React.useEffect(() => {
    setTemplates(initialTemplateFiles);
  }, [initialTemplateFiles]);

  /****************************************************************************************/
  /* Template file handling
  /****************************************************************************************/

  const templateColumns = [
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

  const changeTemplateText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTemplate(e.target.value);
  };

  const addTemplate = () => {
    const extension = newTemplate.split('.').length > 1 ? newTemplate.split('.')[1] : 'txt';
    setTemplates([
      ...templates,
      {
        code: '',
        extension,
        name: newTemplate,
        assignment: assignment.id,
        path: '',
        required: false,
        id: -1 * templates.length,
      },
    ]);
    setNewTemplate('');
  };

  const switchTemplates = (_nextTargetKeys: React.Key[], direction: string, moveKeys: React.Key[]) => {
    const targetRequired = direction === 'right' ? true : false;
    setTemplates(
      templates.map((template) =>
        !moveKeys.map((k) => k.toString()).includes(template.id.toString())
          ? template
          : { ...template, required: targetRequired },
      ),
    );
    setSelectedTemplates([]);
  };

  const deleteTemplates = () => {
    setTemplates(templates.filter((el) => !selectedTemplates.includes(el.id.toString())));
    setSelectedTemplates([]);
  };

  const setSelectedTemplatesCallback = (sourceSelectedKeys: React.Key[], targetSelectedKeys: React.Key[]) => {
    setSelectedTemplates([
      ...sourceSelectedKeys.map((k) => k.toString()),
      ...targetSelectedKeys.map((k) => k.toString()),
    ]);
  };

  const updateTemplateCode = (id: number, newCode: string) => {
    const old = templates.find((el) => el.id === id);
    const updatedTemplates = [...templates.filter((el) => el.id !== id), { ...old!, code: newCode }];
    setTemplates(updatedTemplates);
  };

  /****************************************************************************************/

  const handleStudentUploadCheck = (checked: boolean) => {
    setStudentUploadEnabled(checked);
  };

  const handleRegradeCheck = (checked: boolean) => {
    setRegradesEnabled(checked);
  };

  const validateName = (_rule: unknown, value: string) => {
    if (
      value !== assignment.name &&
      assignments.some((el) => {
        return el.name === value;
      })
    ) {
      return Promise.reject('An assignment with this name already exists in this course.');
    }
    return Promise.resolve();
  };

  const validatePoints = (_rule: unknown, value: number) => {
    // Test 1: are the points a non-negative integer? Note that we could prevent
    // offending values from being input into this field using the precision prop
    // of InputNumber, but it's nicer to alert the user explicitly if they
    // try to enter a disallowed value.
    if (parseFloat(String(value)) < 0) {
      return Promise.reject('Points must be non-negative.');
    }
    return Promise.resolve();
  };

  const tabPaneStyle = { maxHeight: 'calc(100vh - 350px)', overflow: 'auto' };

  return (
    <Modal
      open={visible}
      title="Update assignment settings"
      okText="Save"
      onCancel={onCancel}
      onOk={() => onSave(templates)}
      width={'80%'}
      style={{ maxWidth: 1000 }}
      maskClosable={false}
    >
      <Form form={form} layout="horizontal" hideRequiredMark={true}>
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="General" key="1" style={tabPaneStyle}>
            <Form.Item
              name="name"
              label="Name"
              extra="Must be unique within this course."
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.name}
              rules={[
                {
                  required: true,
                  message: 'Please input an assignment name with at least 4 characters',
                  min: 4,
                },
                {
                  message: 'Assignment name cannot exceed 32 characters',
                  max: 32,
                },
                { validator: validateName },
              ]}
            >
              <Input style={{ maxWidth: 300 }} />
            </Form.Item>
            <Form.Item
              name="points"
              label="Points"
              extra="Total points possible for this assignment."
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.points}
              rules={[{ required: true, message: 'Please specify a point value' }, { validator: validatePoints }]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item
              name="explanation"
              label="Explanation"
              extra={
                <div>
                  Description of the assignment, visible to students. Preview:{' '}
                  <Checkbox checked={explanationPreview} onChange={() => setExplanationPreview(!explanationPreview)} />
                </div>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={explanation}
            >
              {explanationPreview ? (
                <ReactMarkdown>{explanation}</ReactMarkdown>
              ) : (
                <Input.TextArea placeholder="Type text or Markdown" onChange={(e) => setExplanation(e.target.value)} />
              )}
            </Form.Item>
            {sections.length > 0 ? (
              <Form.Item
                name="hideFrom"
                label="Hide from"
                extra="Sections from which to hide this assignment."
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 16 }}
                initialValue={assignment.hideFrom}
              >
                <Select mode="multiple">
                  {sections.map((section: SectionType) => (
                    <Select.Option key={section.id} value={section.id}>
                      {section.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            ) : null}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Submission" key="2" style={tabPaneStyle}>
            <Form.Item
              name="allowStudentUpload"
              label="Allow student upload"
              extra={<div>When enabled, students can upload submissions before the given due date.</div>}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.allowStudentUpload}
              valuePropName="checked"
            >
              <Switch onClick={handleStudentUploadCheck} />
            </Form.Item>
            <Form.Item
              name="allowStudentUploadWithPartners"
              label="Allow partners"
              extra={<div>Allow students to submit in groups of their choosing.</div>}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.allowStudentUploadWithPartners}
              valuePropName="checked"
            >
              <Switch disabled={!form.getFieldValue('allowStudentUpload')} />
            </Form.Item>
            <Form.Item
              name="uploadDueDate"
              label="Due Date"
              extra={
                <span>
                  Due date for student uploads. Your course's timezone is <b>{timezone}.</b>
                </span>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={
                assignment.uploadDueDate
                  ? moment(assignment.uploadDueDate).tz(timezone)
                  : moment().tz(timezone).endOf('day')
              }
              valuePropName="value"
              rules={[
                {
                  required: studentUploadEnabled,
                  message: 'Due date is required if student upload is enabed.',
                },
              ]}
            >
              <DatePicker showTime placeholder="Select Time" disabled={!studentUploadEnabled} />
            </Form.Item>
            <Form.Item label="Submission files" labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
              <Transfer
                dataSource={templates.map((el: FileTemplateType) => {
                  return { ...el, key: el.id.toString(), title: el.name };
                })}
                targetKeys={templates.filter((el: FileTemplateType) => el.required).map((el) => el.id.toString())}
                onSelectChange={setSelectedTemplatesCallback}
                selectedKeys={selectedTemplates}
                titles={['Optional', 'Required']}
                render={(item: FileTemplateType & { title: string }) => item.title}
                footer={() => (
                  <Button size="small" style={{ float: 'right', margin: 5 }} onClick={deleteTemplates}>
                    delete
                  </Button>
                )}
                onChange={switchTemplates}
                locale={{
                  notFoundContent: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<div style={{ fontWeight: 500 }}>Add a file in the input below.</div>}
                    />
                  ),
                }}
              />
              <Input
                onChange={changeTemplateText}
                value={newTemplate}
                placeholder="file name"
                style={{ width: '72%' }}
              />
              <Button onClick={addTemplate}>Add</Button>
            </Form.Item>
            <Form.Item
              name="allowLateUploads"
              label="Allow late submissions"
              extra={
                <div>When enabled, students will be allowed to submit after this assignment's due date has passed.</div>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.allowLateUploads}
              valuePropName="checked"
            >
              <Switch disabled={!form.getFieldValue('allowStudentUpload')} />
            </Form.Item>
            <Form.Item
              name="lateDeductions"
              label="Late deductions"
              extra={
                <div>
                  <Tag>NEW</Tag>Automatically deduct points for each day late.{' '}
                  {form.getFieldValue('lateDeductions') && form.getFieldValue('lateDeductions').length > 1 && (
                    <span>
                      <b>Note</b>: late day deductions are not cumulative.
                    </span>
                  )}
                </div>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.lateDeductions}
            >
              <InputNumberMultiple value={[]} onChange={() => {}} emptyMessage="Add a late deduction" />
            </Form.Item>
            <Form.Item
              name="liveFeedbackMode"
              label="Live feedback mode"
              extra={
                <div>
                  Students can see their feedback and comments without the submission being finalized or published.
                  Ideal for office hours or ungraded feedback.
                </div>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.liveFeedbackMode}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Grading" key="3" style={tabPaneStyle}>
            <Form.Item
              name="anonymousGrading"
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
              initialValue={assignment.anonymousGrading}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="additiveGrading"
              label="Additive grading"
              extra={<div>Start submission scores at 0 instead of at an assignment's point value.</div>}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.additiveGrading}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="forcedRubricMode"
              label="Rubric-only mode"
              extra={<div>Require graders to link all submission comments to a Rubric Comment.</div>}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 15 }}
              initialValue={assignment.forcedRubricMode}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="collaborativeRubricMode"
              label="Collaborative rubric"
              extra={
                <div>
                  When enabled, graders will be able to edit this assignment's rubric from the code console. Graders
                  will have full permission to create, modify and delete rubric items.
                </div>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.collaborativeRubricMode}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="File template code"
              extra={
                <div>
                  Use file templates to help speed up grading by de-emphasizing template-provided versus student-written
                  code. Template files names must match a file added as a "Submission File".
                  <br />
                </div>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
            >
              <Table
                columns={templateColumns}
                dataSource={templates
                  .sort((a: FileTemplateType, b: FileTemplateType) => a.id - b.id)
                  .map((el: FileTemplateType) => {
                    return {
                      name: el.name,
                      template: (
                        <UploadFileTemplates
                          fileName={el.name}
                          isReplacement={el.code.length > 0}
                          updateTemplate={(newCode: string) => updateTemplateCode(el.id, newCode)}
                        />
                      ),
                      key: el.id.toString(),
                    };
                  })}
                pagination={false}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div style={{ fontWeight: 500 }}>
                          No files. In order to upload template code, the file must first be added as an Optional or
                          Required <b>Submission File</b> in the <b>Submission tab</b>.
                        </div>
                      }
                    />
                  ),
                }}
              />
            </Form.Item>
            <Form.Item
              name="showFrequentlyUsedRubricComments"
              label="Freq. rubric comments"
              extra={
                <div>
                  When enabled, an assignment's 10 most frequently applied rubric comments will be shown within the code
                  console to make them easily accessible.
                </div>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.showFrequentlyUsedRubricComments}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Publishing" key="4" style={tabPaneStyle}>
            <Form.Item
              name="hideGradersFromStudents"
              label="Hide graders"
              extra={<div>When enabled, students will not be able to see the grader associated with a submission.</div>}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.hideGradersFromStudents}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="commentFeedback"
              label="Student feedback"
              extra={<div>When enabled, students will be able to leave feedback on applied rubric comments.</div>}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.commentFeedback}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="hideGrades"
              label="Hide grades"
              extra=" When enabled, students won't be able to view the grades associated with their submissions."
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.hideGrades}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="allowRegradeRequests"
              label="Regrade requests"
              extra=" When enabled, students can submit a question on their graded submission and request a regrade."
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={assignment.allowRegradeRequests}
              valuePropName="checked"
            >
              <Switch onClick={handleRegradeCheck} />
            </Form.Item>
            <Form.Item
              name="regradeDeadline"
              label="Deadline"
              extra={
                <span>
                  Optional deadline for students to submit regrade requests. Your course's timezone is{' '}
                  <b>{timezone}.</b>
                </span>
              }
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
              initialValue={
                assignment.regradeDeadline ? moment(assignment.regradeDeadline).tz(timezone) : moment().tz(timezone)
              }
              valuePropName="value"
            >
              <DatePicker showTime placeholder="Select Time" disabled={!regradesEnabled} />
            </Form.Item>
          </Tabs.TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default AssignmentSettingsDialog;

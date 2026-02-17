/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import {
  Checkbox,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
  Tabs,
  Tag,
} from 'antd';

/* other library imports */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
import { Section } from '../../../../api-client';
import { Assignment } from '../../../../types/common';
import InputNumberMultiple from '../../settings/InputNumberMultiple';

import ReactMarkdown from 'react-markdown';
import AssignmentDataSetsForm from './AssignmentDataSetsForm';
import AssignmentFilesForm from './AssignmentFilesForm';
import { EnvironmentShellWidget } from './EnvironmentShellWidget';
import { assignmentFilesApi, assignmentsApi } from '../../../../api-client/clients';
import { AssignmentDataSetType, AssignmentFileType } from '../../../../types/models';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  onSave: (assignment: Partial<Assignment> & { id: number }) => Promise<void>;
  currentAssignment: Assignment;
  assignments: Assignment[];
  timezone: string;
  sections: Section[];
}

const AssignmentSettingsDialog: React.FC<IProps> = (props) => {
  const [assignmentFiles, setAssignmentFiles] = React.useState<AssignmentFileType[]>([]);
  const [assignmentDatasets, setAssignmentDatasets] = React.useState<AssignmentDataSetType[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [form] = Form.useForm<IFormValues>();

  const loadFiles = () => {
    setIsLoading(true);
    const filesList = props.currentAssignment.files ?? [];
    const promises = filesList.map((el) => {
      if (typeof el === 'number') {
        return assignmentFilesApi.retrieve({ id: el });
      }
      return Promise.resolve(el);
    });
    Promise.all(promises)
      .then((files) => setAssignmentFiles(files))
      .finally(() => setIsLoading(false));
  };

  const loadDatasets = () => {
    assignmentsApi
      .datasetsList({ id: props.currentAssignment.id })
      .then((datasets) => setAssignmentDatasets(datasets))
      .catch((error) => {
        console.error('Failed to load datasets:', error);
        message.error('Failed to load datasets');
      });
  };

  React.useEffect(() => {
    loadFiles();
    loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (props.isVisible) {
      loadFiles();
      loadDatasets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isVisible]);

  const updateSettings = async (values: IFormValues) => {
    const { currentAssignment } = props;

    let templateMode = false;
    if (assignmentFiles !== undefined && assignmentFiles.length > 0) {
      const filtered = assignmentFiles.filter((file: AssignmentFileType) => {
        return file.data !== '';
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
      commentFeedback: values.commentFeedback,
      allowRegradeRequests: values.allowRegradeRequests,
      allowStudentUpload: values.allowStudentUpload,
      allowStudentUploadWithPartners: values.allowStudentUploadWithPartners,
      uploadDueDate:
        values.allowStudentUpload && values.uploadDueDate
          ? dayjs.tz(values.uploadDueDate.format('YYYY-MM-DD HH:mm:ss'), props.timezone).utc().format()
          : null,
      regradeDeadline:
        values.allowRegradeRequests && values.regradeDeadline
          ? dayjs.tz(values.regradeDeadline.format('YYYY-MM-DD HH:mm:ss'), props.timezone).utc().format()
          : null,
      maxLateDays: values.maxLateDays,
      liveFeedbackMode: values.liveFeedbackMode,
      additiveGrading: values.additiveGrading,
      forcedRubricMode: values.forcedRubricMode,
      templateMode,
      showFrequentlyUsedRubricComments: values.showFrequentlyUsedRubricComments,
      allowLateUploads: values.allowLateUploads,
      explanation: values.explanation,
      hideFrom: values.hideFrom,
      lateDeductions: values.lateDeductions,
      studentsCanSeeGraders: values.studentsCanSeeGraders,
      gradersCanEditSubmissions: values.gradersCanEditSubmissions,
      aiSystemPrompt: values.aiSystemPrompt || '',
      runTestsOnSubmit: values.runTestsOnSubmit,
      testsAffectGrade: values.testsAffectGrade,
    };

    await props.onSave(payload);
    message.success('Assignment settings updated successfully!');
    props.onCancel();
  };

  const handleCreate = async (templates: AssignmentFileType[]) => {
    try {
      // We must merge getFieldsValue(true) to ensure we capture values from unmounted tabs (like Submission)
      // which validateFields() would otherwise omit.
      const allValues = form.getFieldsValue(true);
      const validatedValues = await form.validateFields();
      const values = { ...allValues, ...validatedValues };

      setIsLoading(true);

      const fileTemplatePromises: Promise<AssignmentFileType | void>[] = [];
      for (const ft of templates) {
        if (ft.id > 0) {
          // Check if file actually changed to avoid triggering AutoDetectEnvironment
          const original = assignmentFiles.find((f) => f.id === ft.id);
          const hasChanged =
            !original ||
            original.name !== ft.name ||
            original.extension !== ft.extension ||
            original.path !== ft.path ||
            (original as any).data !== (ft as any).data ||
            (original as any).description !== (ft as any).description ||
            (original as any).required !== (ft as any).required;

          if (hasChanged) {
            fileTemplatePromises.push(
              assignmentFilesApi
                .partialUpdate({
                  id: ft.id,
                  patchedAssignmentFile: ft as any,
                })
                .then((res: any) => res as unknown as AssignmentFileType),
            );
          }
        } else {
          // Prototype: Use Generated API Client for creation
          fileTemplatePromises.push(
            assignmentFilesApi
              .create({
                assignmentFile: {
                  name: ft.name,
                  assignment: ft.assignment,
                  extension: ft.extension,
                  path: ft.path,
                  required: ft.required,
                  description: ft.description || '',
                  data: (ft as any).data,
                  hidden: (ft as any).hidden,
                },
              })
              .then((res) => res as unknown as AssignmentFileType),
          );
        }
      }

      for (const ft of assignmentFiles) {
        if (!templates.some((el) => el.id === ft.id)) {
          fileTemplatePromises.push(assignmentFilesApi.destroy({ id: ft.id }));
        }
      }

      // Block assignment update on file templates update so the file templates field is updated on
      // Assignment.patch
      await Promise.all(fileTemplatePromises);

      await updateSettings(values);
    } catch (err: unknown) {
      // Form validation failed
      console.error('Form validation error:', err);
      message.error('Please fix the validation errors before saving.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!props.isVisible) {
    return null;
  }

  const handleCancel = () => {
    form.resetFields();
    props.onCancel();
  };

  return (
    <CollectionCreateForm
      form={form}
      visible={true}
      isLoading={isLoading}
      onSave={handleCreate}
      onCancel={handleCancel}
      assignment={props.currentAssignment}
      assignments={props.assignments}
      initialAssignmentFiles={assignmentFiles}
      datasets={assignmentDatasets}
      onDatasetsChange={loadDatasets}
      timezone={props.timezone}
      sections={props.sections}
    />
  );
};

/***********************************************************************************/
/* Form component
/***********************************************************************************/

interface IFormProps {
  form: FormInstance<IFormValues>;
  visible: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onSave: (templates: AssignmentFileType[]) => void;
  assignment: Assignment;
  assignments: Assignment[];
  initialAssignmentFiles: AssignmentFileType[];
  datasets: AssignmentDataSetType[];
  onDatasetsChange: () => void;
  timezone: string;
  sections: Section[];
}

interface IFormValues {
  name: string;
  points: number;
  anonymousGrading: boolean;
  collaborativeRubricMode: boolean;

  studentsCanSeeGraders: boolean | null;
  commentFeedback: boolean;
  allowRegradeRequests: boolean;
  regradeDeadline: any;
  allowStudentUpload: boolean;
  allowStudentUploadWithPartners: boolean;
  uploadDueDate: any;
  maxLateDays: number;
  liveFeedbackMode: boolean;
  additiveGrading: boolean;
  forcedRubricMode: boolean;
  templateMode: boolean;
  showFrequentlyUsedRubricComments: boolean;
  allowLateUploads: boolean;
  explanation: string;
  hideFrom: number[];
  lateDeductions: number[];
  aiSystemPrompt: string;
  gradersCanEditSubmissions: boolean;
  runTestsOnSubmit: boolean;
  testsAffectGrade: boolean;
}

const CollectionCreateForm: React.FC<IFormProps> = (props) => {
  const {
    form,
    visible,
    isLoading,
    onCancel,
    onSave,
    assignment,
    assignments,
    initialAssignmentFiles,
    datasets,
    onDatasetsChange,
    timezone,
    sections,
  } = props;

  const [templates, setTemplates] = React.useState<AssignmentFileType[]>(initialAssignmentFiles);
  const [explanationPreview, setExplanationPreview] = React.useState(false);
  const [explanation, setExplanation] = React.useState(assignment.explanation);
  const hasAssignmentFiles = templates.length > 0;
  const environmentId = assignment.environment ?? null;

  // Watch form field values for conditional rendering
  const studentUploadEnabled = Form.useWatch('allowStudentUpload', form);
  const lateUploadEnabled = Form.useWatch('allowLateUploads', form);
  const regradesEnabled = Form.useWatch('allowRegradeRequests', form);

  // Sync state when assignment changes or modal opens
  React.useEffect(() => {
    if (visible) {
      setExplanation(assignment.explanation);
      setExplanationPreview(false);

      form.setFieldsValue({
        name: assignment.name,
        points: assignment.points,
        anonymousGrading: assignment.anonymousGrading,
        collaborativeRubricMode: assignment.collaborativeRubricMode,

        studentsCanSeeGraders: assignment.studentsCanSeeGraders,
        gradersCanEditSubmissions: assignment.gradersCanEditSubmissions,
        runTestsOnSubmit: assignment.runTestsOnSubmit ?? true,
        testsAffectGrade: assignment.testsAffectGrade ?? true,
        commentFeedback: assignment.commentFeedback,
        allowRegradeRequests: assignment.allowRegradeRequests,
        allowStudentUpload: assignment.allowStudentUpload,
        allowStudentUploadWithPartners: assignment.allowStudentUploadWithPartners,
        maxLateDays: assignment.maxLateDays ?? 2,
        liveFeedbackMode: assignment.liveFeedbackMode,
        additiveGrading: assignment.additiveGrading,
        forcedRubricMode: assignment.forcedRubricMode,
        templateMode: assignment.templateMode,
        showFrequentlyUsedRubricComments: assignment.showFrequentlyUsedRubricComments,
        allowLateUploads: assignment.allowLateUploads,
        explanation: assignment.explanation,
        hideFrom: assignment.hideFrom,
        lateDeductions: assignment.lateDeductions || [],

        // Date fields handling
        // Wall Clock Shift (Day.js Modern Usage):
        // 1. Get the time in the COURSE timezone using dayjs.tz
        // 2. Format it as a string (YYYY-MM-DD HH:mm:ss) to strip timezone data.
        // 3. Create a LOCAL dayjs object from that string.
        uploadDueDate: assignment.uploadDueDate
          ? dayjs(dayjs(assignment.uploadDueDate).tz(timezone).format('YYYY-MM-DD HH:mm:ss'))
          : dayjs(dayjs().tz(timezone).endOf('day').format('YYYY-MM-DD HH:mm:ss')),
        regradeDeadline: assignment.regradeDeadline
          ? dayjs(dayjs(assignment.regradeDeadline).tz(timezone).format('YYYY-MM-DD HH:mm:ss'))
          : dayjs(dayjs().tz(timezone).format('YYYY-MM-DD HH:mm:ss')),
      });
    }
  }, [visible, assignment, form, timezone]);

  React.useEffect(() => {
    setTemplates(initialAssignmentFiles);
  }, [initialAssignmentFiles]);

  /****************************************************************************************/

  const handleStudentUploadChange = (checked: boolean) => {
    // Reset dependent fields when disabling
    if (!checked) {
      form.setFieldsValue({
        allowStudentUploadWithPartners: false,
        allowLateUploads: false,
        lateDeductions: [],
      });
    }
  };

  const handleAllowLateUploadsChange = (checked: boolean) => {
    // Reset late deductions when disabling
    if (!checked) {
      form.setFieldsValue({
        lateDeductions: [],
      });
    }
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

  const tabPaneStyle = { maxHeight: 'calc(100vh - 200px)', overflow: 'auto' };

  return (
    <Modal
      open={visible}
      title="Update assignment settings"
      okText="Save"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => onSave(templates)}
      confirmLoading={isLoading}
      width="90%"
      style={{ maxWidth: 1200, top: 20 }}
      maskClosable={false}
      destroyOnHidden
    >
      <Form form={form} layout="horizontal" requiredMark={false} colon={false} scrollToFirstError>
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              label: 'General',
              key: 'general',
              children: (
                <div style={tabPaneStyle}>
                  <Form.Item
                    name="name"
                    label="Name"
                    extra="Must be unique within this course."
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
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
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
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
                        <Checkbox
                          checked={explanationPreview}
                          onChange={() => setExplanationPreview(!explanationPreview)}
                        />
                      </div>
                    }
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    initialValue={explanation}
                  >
                    {explanationPreview ? (
                      <ReactMarkdown>{explanation}</ReactMarkdown>
                    ) : (
                      <Input.TextArea
                        placeholder="Type text or Markdown"
                        onChange={(e) => setExplanation(e.target.value)}
                        rows={6}
                      />
                    )}
                  </Form.Item>
                  {sections.length > 0 ? (
                    <Form.Item
                      name="hideFrom"
                      label="Hide from"
                      extra="Sections from which to hide this assignment."
                      labelCol={{ span: 4 }}
                      wrapperCol={{ span: 20 }}
                      initialValue={assignment.hideFrom}
                    >
                      <Select mode="multiple">
                        {sections.map((section: Section) => (
                          <Select.Option key={section.id} value={section.id}>
                            {section.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  ) : null}
                </div>
              ),
            },
            {
              label: 'Resources',
              key: 'resources',
              children: (
                <div style={tabPaneStyle}>
                  <Tabs
                    defaultActiveKey="files"
                    items={[
                      {
                        label: 'Files',
                        key: 'files',
                        children: (
                          <Form.Item extra="Starter files that students will download, complete, and submit back for grading. Also used for figuring out the environment to run student code.">
                            <AssignmentFilesForm
                              value={templates}
                              onChange={setTemplates}
                              assignmentId={assignment.id}
                            />
                          </Form.Item>
                        ),
                      },
                      {
                        label: 'Datasets',
                        key: 'datasets',
                        children: (
                          <AssignmentDataSetsForm
                            assignmentId={assignment.id}
                            datasets={datasets}
                            onDatasetsChange={onDatasetsChange}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              label: 'Environment',
              key: 'environment',
              children: (
                <div style={tabPaneStyle}>
                  <EnvironmentShellWidget environmentId={environmentId} hasAssignmentFiles={hasAssignmentFiles} />
                </div>
              ),
            },
            {
              label: 'Submission',
              key: 'submission',
              children: (
                <div style={tabPaneStyle}>
                  <Form.Item
                    name="allowStudentUpload"
                    label="Allow student upload"
                    extra={<div>When enabled, students can upload submissions before the given due date.</div>}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.allowStudentUpload}
                    valuePropName="checked"
                  >
                    <Switch onChange={handleStudentUploadChange} />
                  </Form.Item>
                  {studentUploadEnabled && (
                    <>
                      <Form.Item
                        name="uploadDueDate"
                        label="Due Date"
                        extra={
                          <span>
                            Due date for student uploads. Your course's timezone is <b>{timezone}.</b>
                          </span>
                        }
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        initialValue={
                          assignment.uploadDueDate
                            ? dayjs(dayjs(assignment.uploadDueDate).tz(timezone).format('YYYY-MM-DD HH:mm:ss'))
                            : dayjs(dayjs().tz(timezone).endOf('day').format('YYYY-MM-DD HH:mm:ss'))
                        }
                        rules={[
                          {
                            required: studentUploadEnabled,
                            message: 'Due date is required if student upload is enabled.',
                          },
                        ]}
                      >
                        <DatePicker
                          showTime
                          format="YYYY-MM-DD HH:mm:ss"
                          placeholder="Select Time"
                          disabled={!studentUploadEnabled}
                          inputReadOnly
                        />
                      </Form.Item>

                      <Form.Item
                        name="allowStudentUploadWithPartners"
                        label="Allow partners"
                        extra={<div>Allow students to submit in groups of their choosing.</div>}
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        initialValue={assignment.allowStudentUploadWithPartners}
                        valuePropName="checked"
                      >
                        <Switch disabled={!studentUploadEnabled} />
                      </Form.Item>

                      <div style={{ marginTop: 24, marginBottom: 24, borderTop: '1px solid #f0f0f0' }} />
                      <h3>Late Policy</h3>

                      <Form.Item
                        name="allowLateUploads"
                        label="Allow late submissions"
                        extra={
                          <div>
                            When enabled, students will be allowed to submit after this assignment's due date has
                            passed.
                          </div>
                        }
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        initialValue={assignment.allowLateUploads}
                        valuePropName="checked"
                      >
                        <Switch disabled={!studentUploadEnabled} onChange={handleAllowLateUploadsChange} />
                      </Form.Item>

                      <Form.Item
                        name="maxLateDays"
                        label="Max late days"
                        extra={
                          <div>
                            The maximum number of late days to continue to accept submissions for this assignment.
                          </div>
                        }
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        initialValue={assignment.maxLateDays ?? 2}
                      >
                        <InputNumber min={0} max={365} disabled={!studentUploadEnabled} />
                      </Form.Item>

                      <Form.Item
                        name="lateDeductions"
                        label="Late deductions"
                        extra={
                          <div>
                            <Tag color="blue">NEW</Tag>Automatically deduct points for each day late.{' '}
                            {form.getFieldValue('lateDeductions') &&
                              form.getFieldValue('lateDeductions').length > 1 && (
                                <span>
                                  <b>Note</b>: late day deductions are not cumulative.
                                </span>
                              )}
                          </div>
                        }
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        initialValue={assignment.lateDeductions || []}
                      >
                        <InputNumberMultiple
                          disabled={!studentUploadEnabled || !lateUploadEnabled}
                          value={form.getFieldValue('lateDeductions') || []}
                          onChange={(value: number[]) => form.setFieldsValue({ lateDeductions: value })}
                          emptyMessage="Add a late deduction"
                        />
                      </Form.Item>

                      <div style={{ marginTop: 24, marginBottom: 24, borderTop: '1px solid #f0f0f0' }} />
                      <h3>Feedback Config</h3>

                      <Form.Item
                        name="liveFeedbackMode"
                        label="Live feedback mode"
                        extra={
                          <div>
                            Students can see their feedback and comments without the submission being finalized or
                            published. Ideal for office hours or ungraded feedback.
                          </div>
                        }
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        initialValue={assignment.liveFeedbackMode}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </>
                  )}
                </div>
              ),
            },
            {
              label: 'Grading',
              key: 'grading',
              children: (
                <div style={tabPaneStyle}>
                  <Form.Item
                    name="additiveGrading"
                    label="Additive grading"
                    extra={<div>Start submission scores at 0 instead of at an assignment's point value.</div>}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
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
                    wrapperCol={{ span: 18 }}
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
                        When enabled, graders will be able to edit this assignment's rubric from the code console.
                        Graders will have full permission to create, modify and delete rubric items.
                      </div>
                    }
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.collaborativeRubricMode}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="gradersCanEditSubmissions"
                    label="Graders can edit"
                    extra={
                      <div>
                        When enabled, graders will be allowed to edit student submissions (e.g. for testing fixes).
                      </div>
                    }
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.gradersCanEditSubmissions}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="showFrequentlyUsedRubricComments"
                    label="Freq. rubric comments"
                    extra={
                      <div>
                        When enabled, an assignment's 10 most frequently applied rubric comments will be shown within
                        the code console to make them easily accessible.
                      </div>
                    }
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.showFrequentlyUsedRubricComments}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <div style={{ marginTop: 24, marginBottom: 24, borderTop: '1px solid #f0f0f0' }} />
                  <h3>Autograder Settings</h3>
                  <Form.Item
                    name="runTestsOnSubmit"
                    label="Run on submit"
                    extra={
                      <div>
                        When enabled, the autograder will automatically run tests against student submissions when they
                        are turned in.
                      </div>
                    }
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.runTestsOnSubmit ?? true}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="testsAffectGrade"
                    label="Tests affect grade"
                    extra={
                      <div>
                        When enabled, the results of autograder tests will count towards the submission's final grade.
                        Disable this if you only want to use tests for feedback.
                      </div>
                    }
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.testsAffectGrade ?? true}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <div style={{ marginTop: 24, marginBottom: 24, borderTop: '1px solid #f0f0f0' }} />
                  <h3>Anonymous Grading</h3>
                  <Form.Item
                    name="anonymousGrading"
                    label="Anonymous grading"
                    extra={
                      <div>
                        When enabled, graders will not be able to see student emails associated with submissions. For
                        more info, see <a href="/docs/features#anonymous-grading">our docs</a>.
                      </div>
                    }
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.anonymousGrading}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </div>
              ),
            },
            {
              label: 'Publishing',
              key: 'publishing',
              children: (
                <div style={tabPaneStyle}>
                  <Form.Item
                    name="studentsCanSeeGraders"
                    label="Show graders"
                    extra={
                      <div>
                        When enabled, students will see the grader who graded their submission. Overrides course
                        default.
                      </div>
                    }
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.studentsCanSeeGraders}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name="commentFeedback"
                    label="Student feedback"
                    extra={<div>When enabled, students will be able to leave feedback on applied rubric comments.</div>}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.commentFeedback}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <div style={{ marginTop: 24, marginBottom: 24, borderTop: '1px solid #f0f0f0' }} />
                  <h3>Regrade Requests</h3>

                  <Form.Item
                    name="allowRegradeRequests"
                    label="Regrade requests"
                    extra=" When enabled, students can submit a question on their graded submission and request a regrade."
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValue={assignment.allowRegradeRequests}
                    valuePropName="checked"
                  >
                    <Switch />
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
                    wrapperCol={{ span: 18 }}
                    initialValue={
                      assignment.regradeDeadline
                        ? dayjs(dayjs(assignment.regradeDeadline).tz(timezone).format('YYYY-MM-DD HH:mm:ss'))
                        : dayjs(dayjs().tz(timezone).endOf('day').format('YYYY-MM-DD HH:mm:ss'))
                    }
                    valuePropName="value"
                  >
                    <DatePicker showTime placeholder="Select Time" disabled={!regradesEnabled} inputReadOnly />
                  </Form.Item>
                </div>
              ),
            },
            {
              label: 'AI',
              key: 'ai',
              children: (
                <div style={tabPaneStyle}>
                  <h3>AI Comment Generation</h3>
                  <Form.Item
                    name="aiSystemPrompt"
                    label="System Prompt"
                    extra={
                      <div>
                        <p>
                          Customize instructions for AI comment generation.{' '}
                          <b>
                            Variables marked (auto) are added to the User Prompt if omitted. Variables marked (manual)
                            MUST be included in your custom System Prompt to be available to the AI.
                          </b>
                        </p>
                        <ul style={{ fontSize: '12px', paddingLeft: '20px', margin: '8px 0' }}>
                          <li>
                            <code>{'{assignment_name}'}</code> - Name of the assignment
                          </li>
                          <li>
                            <code>{'{file_name}'}</code> - Name of the file being reviewed
                          </li>
                          <li>
                            <code>{'{rubric_context}'}</code> - Selected rubric item details (auto)
                          </li>
                          <li>
                            <code>{'{selected_content}'}</code> - The specific code block selected (auto)
                          </li>
                          <li>
                            <code>{'{grader_draft}'}</code> - Current draft text by grader (auto)
                          </li>
                          <li>
                            <code>{'{file_content}'}</code> - Full content of the current opened file <b>(auto)</b>
                          </li>
                          <li>
                            <code>{'{all_files}'}</code> - Content of all files in submission <b>(manual)</b>
                          </li>
                        </ul>
                        <p>Leave blank to use the course default.</p>
                      </div>
                    }
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    initialValue={assignment.aiSystemPrompt || ''}
                  >
                    <Input.TextArea
                      placeholder={`You are an AI assistant helping grade student code submissions.
Your task is to generate clear, constructive feedback for students.

Guidelines:
- Be specific about what the issue is
- Explain why it matters
- Suggest how to fix it when appropriate
- Be encouraging but honest
- Keep comments concise (1-3 sentences)

Context:
- Assignment: {assignment_name}
- File: {file_name}
- File Content:
  {file_content}`}
                      rows={20}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Form.Item>
                </div>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
};

export default AssignmentSettingsDialog;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useState, useEffect } from 'react';
import { Modal, Steps, Button, Radio, Card, Select, message, Alert } from 'antd';
import { RobotOutlined, CodeOutlined, FileTextOutlined } from '@ant-design/icons';
import { assignmentsApi } from '../../../../../../api-client/clients';
import { AssignmentFileType } from '../../../../../../types/models';
import { getCourseAISettings } from '../../../../../../utils/aiService';
import { useAssignmentCapabilities } from '../../../../../../stores/usePermissionsStore';

import { RubricCategory, RubricComment } from '../../../../../../api-client';

const { Option } = Select;

interface IProps {
  open: boolean;
  onCancel: () => void;
  onCreate: (values: { fileName: string; testCode: string; type: string; rubricItem?: number }) => void;
  language: string;
  contextFiles: AssignmentFileType[];
  assignmentId: number;
  courseId?: number;
  rubricCategories?: RubricCategory[];
  rubricComments?: Record<number, RubricComment[]>;
  initialFileName?: string;
}

export const TestCreateModal = (props: IProps) => {
  const [currentStep, setCurrentStep] = useState(props.initialFileName ? 1 : 0);
  const [fileName, setFileName] = useState(props.initialFileName || '');
  const [creationMethod, setCreationMethod] = useState<'manual' | 'template' | 'ai'>('manual');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [selectedContextFile, setSelectedContextFile] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const assignCaps = useAssignmentCapabilities(props.assignmentId);
  const capCanGenerateTests = assignCaps.generate_ai_test_cases !== false;

  // Editor State
  const [manualCode, setManualCode] = useState('');

  // Sync props to state when modal opens
  useEffect(() => {
    if (props.open) {
      if (props.initialFileName) {
        setFileName(props.initialFileName);
        setCurrentStep(1);
      } else {
        setFileName('');
        setCurrentStep(0);
      }
      setCreationMethod('manual');
      setManualCode('');
      setSelectedRubricCategory(undefined);
      setSelectedRubricItem(undefined);

      // Auto-select context file if it matches initialFileName
      if (props.initialFileName && props.contextFiles) {
        const match = props.contextFiles.find((f) => f.name === props.initialFileName);
        if (match) setSelectedContextFile(match.id);
      } else {
        setSelectedContextFile(undefined);
      }
    }
  }, [props.open, props.initialFileName, props.contextFiles]);

  useEffect(() => {
    let isMounted = true;

    const loadAiSettings = async () => {
      try {
        let courseId = props.courseId;

        if (!courseId) {
          const assignment = await assignmentsApi.retrieve({ id: props.assignmentId });
          courseId = assignment.course;
        }

        if (!courseId) {
          if (isMounted) setAiEnabled(false);
          return;
        }

        const aiSettings = await getCourseAISettings(courseId);
        const featureStatus = (aiSettings as unknown as Record<string, unknown>).aiFeatures as
          | Record<string, boolean>
          | undefined;
        if (isMounted) setAiEnabled(Boolean(aiSettings.aiEnabled) && featureStatus?.test_generation !== false);
      } catch {
        if (isMounted) setAiEnabled(false);
      }
    };

    if (props.open) {
      loadAiSettings();
    }

    return () => {
      isMounted = false;
    };
  }, [props.open, props.assignmentId, props.courseId]);

  const [selectedRubricCategory, setSelectedRubricCategory] = useState<number | undefined>(undefined);
  const [selectedRubricItem, setSelectedRubricItem] = useState<number | undefined>(undefined);

  const handleNext = () => {
    if (currentStep === 0 && !fileName) {
      message.error('Please specify a target file.');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep === 1 && props.initialFileName) {
      // trying to go back from method step but we started here
      message.info('Target file is set by the active tab.');
      return;
    }
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = async () => {
    let code = '';

    if (creationMethod === 'manual') {
      code = manualCode;
    } else if (creationMethod === 'ai') {
      message.error('Please generate the script first.');
      return;
    }

    props.onCreate({
      fileName,
      testCode: code,
      type: 'script',
      rubricItem: selectedRubricItem,
    });
    reset();
  };

  const generateAndFinish = async () => {
    if (!aiEnabled || !capCanGenerateTests) {
      message.error('AI test generation is not enabled for this course.');
      return;
    }

    if (!selectedContextFile) {
      message.error('Please select a context file to generate from.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await assignmentsApi.generateTestCreate({
        id: props.assignmentId,
        assignmentGenerateTest: {
          targetFilename: fileName,
          contextFileId: selectedContextFile,
          language: props.language,
        },
      });

      if (result.script) {
        props.onCreate({
          fileName,
          testCode: result.script,
          type: 'script',
          rubricItem: selectedRubricItem,
        });
        reset();
      } else {
        message.error('No script returned from AI.');
      }
    } catch {
      message.error('Failed to generate script.');
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setCurrentStep(props.initialFileName ? 1 : 0);
    setFileName(props.initialFileName || '');
    setCreationMethod('manual');
    setManualCode('');
    setIsGenerating(false);
    setSelectedRubricCategory(undefined);
    setSelectedRubricItem(undefined);
    props.onCancel();
  };

  const renderFileStep = () => (
    <div style={{ padding: '20px 0' }}>
      <p>
        <strong>Step 1:</strong> Which file do you want to test?
      </p>
      <div style={{ marginBottom: 8 }}>
        <p style={{ marginBottom: 4, color: '#666' }}>Select from assignment files or type a custom name:</p>
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="e.g. main.py"
          value={fileName ? [fileName] : []}
          onChange={(values) => setFileName(values[values.length - 1] || '')}
        >
          {props.contextFiles.map((f) => (
            <Option key={f.name} value={f.name}>
              {f.name}
            </Option>
          ))}
        </Select>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
        Enter the filename exactly as students are expected to submit it.
      </div>
    </div>
  );

  const renderMethodStep = () => (
    <div style={{ padding: '20px 0' }}>
      <p>
        <strong>Step 2:</strong> How would you like to verify this file?
      </p>
      <Radio.Group style={{ width: '100%' }} value={creationMethod} onChange={(e) => setCreationMethod(e.target.value)}>
        <div style={{ display: 'flex', gap: 15, flexDirection: 'column' }}>
          <Card
            hoverable
            className={creationMethod === 'manual' ? 'ant-card-bordered-primary' : ''}
            onClick={() => setCreationMethod('manual')}
          >
            <Radio value="manual">
              <div style={{ marginLeft: 8 }}>
                <strong>Empty Script</strong>
                <div style={{ color: '#666' }}>Start with a blank slate.</div>
              </div>
            </Radio>
          </Card>

          {aiEnabled && capCanGenerateTests && (
            <Card
              hoverable
              className={creationMethod === 'ai' ? 'ant-card-bordered-primary' : ''}
              onClick={() => setCreationMethod('ai')}
            >
              <Radio value="ai">
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                  <RobotOutlined style={{ fontSize: 20, marginRight: 10, color: '#1890ff' }} />
                  <div>
                    <strong>Generate with AI</strong>
                    <div style={{ color: '#666' }}>Create a test based on a solution file or spec.</div>
                  </div>
                </div>
              </Radio>
            </Card>
          )}
        </div>
      </Radio.Group>

      {creationMethod === 'ai' && (
        <div style={{ marginTop: 20, padding: 15, background: '#f9f9f9', borderRadius: 8 }}>
          <p style={{ marginBottom: 5 }}>Select Context File (Solution/Spec):</p>
          <Select
            style={{ width: '100%' }}
            placeholder="Select a file..."
            onChange={setSelectedContextFile}
            value={selectedContextFile}
          >
            {props.contextFiles.map((f) => (
              <Option key={f.id} value={f.id}>
                {f.name}
              </Option>
            ))}
          </Select>
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 10 }}
            title="AI will analyze this file to generate appropriate test cases."
          />
        </div>
      )}

      {creationMethod === 'manual' && (
        <div style={{ marginTop: 20 }}>
          <Alert
            title="Empty Script"
            description="A new empty test script will be created. You can edit the code after creation."
            type="info"
            showIcon
          />
        </div>
      )}
    </div>
  );

  const renderRubricStep = () => (
    <div style={{ padding: '20px 0' }}>
      <p>
        <strong>Step 3:</strong> (Optional) Link to Rubric Item
      </p>
      <Alert
        type="info"
        showIcon
        title="Linking a rubric item allows the autograder to automatically deduct points from that specific category if the test fails."
        style={{ marginBottom: 20 }}
      />

      <p style={{ marginBottom: 5 }}>Rubric Category:</p>
      <Select
        style={{ width: '100%', marginBottom: 15 }}
        placeholder="Select Category"
        value={selectedRubricCategory}
        onChange={(val) => {
          setSelectedRubricCategory(val);
          setSelectedRubricItem(undefined);
        }}
      >
        {props.rubricCategories?.map((cat) => (
          <Option key={cat.id} value={cat.id}>
            {cat.name}
          </Option>
        ))}
      </Select>

      {selectedRubricCategory && (
        <>
          <p style={{ marginBottom: 5 }}>Rubric Item:</p>
          <Select
            style={{ width: '100%' }}
            placeholder="Select Item"
            value={selectedRubricItem}
            onChange={setSelectedRubricItem}
          >
            {props.rubricComments &&
              props.rubricComments[selectedRubricCategory]?.map((comment) => (
                <Option key={comment.id} value={comment.id}>
                  {comment.pointDelta} pts: {comment.text || '(No Text)'}
                </Option>
              ))}
          </Select>
        </>
      )}
    </div>
  );

  return (
    <Modal
      title="Create New Test"
      open={props.open}
      onCancel={reset}
      width={600}
      footer={[
        currentStep > 0 && (
          <Button key="back" onClick={handlePrev}>
            Back
          </Button>
        ),
        currentStep < 2 && (
          <Button key="next" type="primary" onClick={handleNext}>
            Next
          </Button>
        ),
        currentStep === 2 && creationMethod !== 'ai' && (
          <Button key="finish" type="primary" onClick={handleFinish}>
            Create Test
          </Button>
        ),
        currentStep === 2 && creationMethod === 'ai' && (
          <Button
            key="generate"
            type="primary"
            loading={isGenerating}
            onClick={generateAndFinish}
            icon={<RobotOutlined />}
          >
            Generate & Create
          </Button>
        ),
      ]}
    >
      <Steps
        current={currentStep}
        size="small"
        items={[
          { title: 'Target File', icon: <FileTextOutlined /> },
          { title: 'Method', icon: <CodeOutlined /> },
          { title: 'Rubric', icon: <FileTextOutlined /> },
        ]}
      />

      {currentStep === 0 && renderFileStep()}
      {currentStep === 1 && renderMethodStep()}
      {currentStep === 2 && renderRubricStep()}
    </Modal>
  );
};

/* react imports */
import React, { useState, useEffect } from 'react';

import { EditOutlined } from '@ant-design/icons';

import Form, { LegacyFormController } from '../../../../../core/legacyForm';

/* antd imports */
import { Button, Card, Col, Input, InputNumber, Radio, Row, Select, Space, Switch } from 'antd';

/* codePost object imports */
import { EnvironmentType } from '../../../../../../infrastructure/autograder/environment';

import { SubmissionInfoType, TestCaseType } from '../../../../../../infrastructure/types';

/* codePost component imports */

import { CodeWindow } from '../utils/CodeWindow';
import CodeExecutionOutput from '../../../../../code-review/code-panel/CodeExecutionOutput';

/* codePost util imports */
import { extensionsByLanguage, testTemplates } from '../utils/languageUtils';
import { getHeaders } from '../../../../../../infrastructure/generics';
import { AssignmentType } from '../../../../../../infrastructure/types';
import { AssignmentFileType } from '../../../../../../infrastructure/file';
import { TestScriptEditor } from './TestScriptEditor';

const { Option } = Select;

interface IDataset {
  id: number;
  name: string;
}

interface ITestFormItemProps {
  form: LegacyFormController;
  testCase: TestCaseType;
  saveTest: (values: any) => void;
  deleteTest: () => Promise<void>;

  log?: any;
  runTest: (values: any) => void;
  isRunning: boolean;
  language: string;
  submissions: SubmissionInfoType[];
  setTestSubject: (id: string) => void;
  activeSubmission?: SubmissionInfoType;
  env?: EnvironmentType;
  currentAssignment: AssignmentType;
  assignmentFiles?: AssignmentFileType[];
}

const TestFormItem: React.FC<ITestFormItemProps> = (props) => {
  const { testCase, form, language, currentAssignment, activeSubmission } = props;
  const { getFieldDecorator } = form;

  // Helpers


  // State
  const [commandText, setCommandText] = useState(testCase.text);
  const [testType, setTestType] = useState(testCase.type);
  const [selectedFileName, setSelectedFileName] = useState(testCase.fileName);
  const [explanation, setExplanation] = useState(testCase.explanation);


  const [testCode, setTestCode] = useState(testCase.testCode || '');
  const [datasets, setDatasets] = useState<IDataset[]>([]);

  // Check if notebook
  const isNotebook = (Array.isArray(selectedFileName) ? selectedFileName[0] || '' : selectedFileName || '').endsWith(
    '.ipynb',
  );

  // Effects
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/assignmentDataSets/by_assignment/?assignment_id=${currentAssignment.id}`,
          {
            headers: getHeaders(),
          },
        );
        if (response.ok) {
          const data = await response.json();
          setDatasets(data);
        }
      } catch (e) {
        console.error('Failed to fetch datasets', e);
      }
    };
    fetchDatasets();
  }, [currentAssignment.id]);

  // Handlers
  const onChange = (text: string) => {
    setCommandText(text);
    props.form.setFieldsValue({
      text: text,
    });
  };

  const onTypeChange = (type: string) => {
    const newType = testCase.type === type;
    const template = testTemplates[language] ? language : 'other';

    setTestType(type);
    setCommandText(newType ? testCase.text : testTemplates[template][type]);
  };

  const onTypeChangeRadio = (e: any) => {
    onTypeChange(e.target.value);
  };

  const onChangeFileName = (newName: string) => {
    setSelectedFileName(newName);
  };





  const onSave = () => {
    props.form.validateFields((err, values) => {
      if (!err) {
        props.saveTest({
          ...values,
          testType,
          explanation,
          commandText,
          testCode,
        });
      }
    });
  };

  const onRun = () => {
    props.form.validateFields((err, values) => {
      if (!err) {
        props.runTest({
          ...values,
          testType,
          explanation,
          commandText,
          testCode,
        });
      }
    });
  };

  const name = testType === 'shell' ? '.sh' : extensionsByLanguage[language];

  // Disable some test types if there is no native support

  const typesWithEditDisabled = ['file']; // Disable select
  const typesWithRunDisabled = ['file', 'external']; // Disable definitions and pseudoterminal

  const fileOptions =
    activeSubmission && activeSubmission.files && typeof activeSubmission.files[0] !== 'number'
      ? (activeSubmission.files as any[]).map((f: any) => (
        <Option key={f.name} value={f.name}>
          {f.name}
        </Option>
      ))
      : [];

  return (
    <div style={{ padding: '0px 15px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Control Bar (Top) */}
      <Card
        bordered={false}
        bodyStyle={{ padding: '12px 24px' }}
        style={{ marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
            <div style={{ flex: 1, maxWidth: 400 }}>
              {getFieldDecorator('description', {
                initialValue: testCase.description,
                rules: [{ required: true, message: 'Test name is required' }],
              })(
                <Input
                  placeholder="Test Name (e.g. Check Edge Cases)"
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    border: 'none',
                    borderBottom: '1px solid #d9d9d9',
                    borderRadius: 0,
                    paddingLeft: 0,
                  }}
                />,
              )}
            </div>

            <Radio.Group
              value={testType}
              onChange={onTypeChangeRadio}
              buttonStyle="solid"
              disabled={props.isRunning || typesWithEditDisabled.includes(testType)}
            >
              <Radio.Button value={'script'}>Custom Script (AI)</Radio.Button>
              <Radio.Button value={'shell'}>Bash Script</Radio.Button>
              <Radio.Button value={'external'}>External</Radio.Button>
            </Radio.Group>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888' }}>Visible:</span>
              {getFieldDecorator('exposed', {
                initialValue: testCase.exposed,
                valuePropName: 'checked',
              })(<Switch size="small" />)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={onSave} icon={<EditOutlined />}>
              Save
            </Button>
            <Button
              type="primary"
              onClick={onRun}
              loading={props.isRunning}
              disabled={typesWithRunDisabled.includes(testType)}
            >
              Run Now
            </Button>
            <Button danger type="text" onClick={props.deleteTest}>
              Delete
            </Button>
          </div>
        </div>
      </Card>

      <Form layout="vertical">
        <Row gutter={24}>
          {/* 2. Input Configuration (Left Panel) */}
          <Col span={12}>
            <Card
              title="Execution Environment"
              bordered={false}
              style={{ height: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={isNotebook ? 'Target Notebook' : 'Target File'}>
                    {getFieldDecorator('fileName', {
                      initialValue: testCase.fileName,
                      rules: [{ required: true, message: 'Target is required' }],
                    })(
                      <Select
                        mode="tags"
                        style={{ width: '100%' }}
                        placeholder="Select file or type..."
                        onChange={(val: string) => onChangeFileName(val)}
                      >
                        {fileOptions}
                      </Select>,
                    )}
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Dataset (Optional)">
                    {getFieldDecorator('dataSet', {
                      initialValue: testCase.dataSet,
                    })(
                      <Select
                        style={{ width: '100%' }}
                        placeholder="None (Default)"
                        allowClear
                        disabled={props.isRunning}
                      >
                        {datasets.map((d) => (
                          <Option key={d.id} value={d.id}>
                            {d.name}
                          </Option>
                        ))}
                      </Select>,
                    )}
                  </Form.Item>
                </Col>
              </Row>

              {isNotebook && (
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item label="Target Cell ID (Optional)">
                      {getFieldDecorator('targetCellId', {
                        initialValue: testCase.targetCellId,
                      })(<Input placeholder="e.g. 2 (Index) or cell-id-string" style={{ fontFamily: 'monospace' }} />)}
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        Leave empty to check aggregated output of the whole notebook.
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {(testType === 'io_cli' || testType === 'shell') && (
                <Form.Item label="Command Arguments">
                  <Input
                    value={commandText}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="e.g. -v --debug"
                    style={{ fontFamily: 'monospace' }}
                  />
                </Form.Item>
              )}

              {testType === 'script' ? (
                <div style={{ marginTop: 10 }}>
                  <Form.Item label="Test Script" style={{ marginBottom: 0 }}>
                    <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, padding: 2 }}>
                      <TestScriptEditor
                        code={testCode}
                        onChange={setTestCode}
                        language={language}
                        assignmentId={currentAssignment.id}
                        targetFileName={Array.isArray(selectedFileName) ? selectedFileName[0] : selectedFileName}
                        contextFiles={props.assignmentFiles || []}
                      />
                    </div>
                  </Form.Item>
                </div>
              ) : (
                <Form.Item label="Command / Attributes">
                  <CodeWindow code={commandText!} name={name === undefined ? '' : name} onChange={onChange} />
                </Form.Item>
              )}
            </Card>
          </Col>

          {/* 3. Expectations & Grading (Right Panel) */}
          <Col span={12}>
            <Card
              title="Success Criteria & Grading"
              bordered={false}
              style={{ height: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
              extra={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 8, fontSize: 12, color: '#888' }}>Grading:</span>
                  <Space>
                    {getFieldDecorator('pointsPass', { initialValue: testCase.pointsPass })(
                      <InputNumber size="small" min={0} style={{ width: 60 }} placeholder="Pass" />,
                    )}
                    <span style={{ color: '#ddd' }}>/</span>
                    {getFieldDecorator('pointsFail', { initialValue: testCase.pointsFail })(
                      <InputNumber size="small" min={0} style={{ width: 60 }} placeholder="Fail" />,
                    )}
                  </Space>
                </div>
              }
            >


              <Form.Item label="Explanation for Students">
                <Input.TextArea
                  rows={3}
                  placeholder="Markdown explanation shown to students..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
                <Button type="link" size="small" style={{ padding: 0 }} onClick={onSave}>
                  Update Explanation
                </Button>
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Results */}
      {props.log && (
        <div style={{ marginTop: 24 }}>
          <CodeExecutionOutput
            executionResult={props.log}
            fileName={Array.isArray(testCase.fileName) ? testCase.fileName[0] : testCase.fileName}
          />
        </div>
      )}
    </div>
  );
};

const WrappedTestFormItem: any = Form.create()(TestFormItem);
export default WrappedTestFormItem;

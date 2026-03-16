// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import React, { useState, useEffect } from 'react';

import { EditOutlined } from '@ant-design/icons';

import Form, { LegacyFormController } from '../../../../../core/legacyForm';

/* antd imports */
import type { RadioChangeEvent } from 'antd';
import { Button, Card, Col, Input, InputNumber, Radio, Row, Select, Space, Switch } from 'antd';

/* codePost object imports */
import {
  AssignmentFileType,
  AssignmentType,
  EnvironmentType,
  RubricCommentType,
  SubmissionInfoType,
  TestCaseType,
} from '../../../../../../types/models';

/* codePost component imports */

import { CodeWindow } from '../utils/CodeWindow';
import CodeExecutionOutput from '@code-review/code-panel/CodeExecutionOutput';

/* codePost util imports */
import { extensionsByLanguage, testTemplates } from '../utils/languageUtils';
// import { getHeaders } from '../../../../../../infrastructure/generics';
import { TypeEnum } from '../../../../../../api-client';
import { assignmentsApi } from '../../../../../../api-client/clients';
import { TestScriptEditor } from './TestScriptEditor';

const { Option } = Select;

interface ITestFormItemProps {
  form: LegacyFormController;
  testCase: TestCaseType;
  saveTest: (values: Record<string, unknown>) => void;
  deleteTest: () => Promise<void>;

  log?: {
    success: boolean;
    stdout?: string;
    stderr?: string;
    error?: string;
    execution_time?: number;
    output_data?: {
      cells?: unknown[];
      stdout?: string;
      stderr?: string;
      error?: string;
      [key: string]: unknown;
    };
    cached?: boolean;
    executed_at?: string;
    executed_by?: string;
  };
  runTest: (values: Record<string, unknown>) => void;
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
  const { testCase, form, language, currentAssignment } = props;
  const { getFieldDecorator } = form;

  // Helpers

  // State

  const [rubricComments, setRubricComments] = useState<RubricCommentType[]>([]);
  const [commandText, setCommandText] = useState(testCase.text);
  const [testType, setTestType] = useState<TypeEnum>(testCase.type as TypeEnum);

  const [explanation, setExplanation] = useState(testCase.explanation);

  const [testCode, setTestCode] = useState(testCase.testCode || '');

  // Check if notebook
  // Check if notebook
  const isNotebook = false; // Derived from category in future, currently disabled for per-test override

  // Effects
  useEffect(() => {
    const fetchRubric = async () => {
      try {
        const rubricRequest = await assignmentsApi.rubricRetrieve({
          id: currentAssignment.id,
        });
        const rubric = rubricRequest as unknown as { rubricComments: RubricCommentType[] };
        setRubricComments(rubric.rubricComments);
      } catch (e) {
        console.error('Failed to fetch rubric', e);
      }
    };

    fetchRubric();
  }, [currentAssignment.id]);

  // Handlers
  const onChange = (text: string) => {
    setCommandText(text);
    props.form.setFieldsValue({
      text: text,
    });
  };

  const onTypeChange = (type: TypeEnum) => {
    const newType = testCase.type === type;
    const template = testTemplates[language] ? language : 'other';

    setTestType(type);
    setCommandText(newType ? testCase.text : testTemplates[template][type]);
  };

  const onTypeChangeRadio = (e: RadioChangeEvent) => {
    onTypeChange(e.target.value as TypeEnum);
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
                <Col span={6}>
                  <Form.Item label="Timeout (s)">
                    {getFieldDecorator('timeout', {
                      initialValue: testCase.timeout || 30,
                    })(<InputNumber min={1} max={600} style={{ width: '100%' }} placeholder="30" />)}
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
                        courseId={currentAssignment.course}
                        targetFileName={''}
                        contextFiles={props.assignmentFiles || []}
                        onRubricItemChange={(id) => props.form.setFieldsValue({ rubricItem: id })}
                        selectedRubricItem={props.form.getFieldValue('rubricItem') || testCase.rubricItem}
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
              <Form.Item
                label="Link to Rubric Item (Optional)"
                help="If set, failing this test will automatically apply this rubric deduction."
              >
                {getFieldDecorator('rubricItem', {
                  initialValue: testCase.rubricItem,
                })(
                  <Select
                    allowClear
                    placeholder="Select a rubric item"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      String(option?.props.children).toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {rubricComments.map((rc) => (
                      <Option key={rc.id} value={rc.id}>
                        {rc.text} ({rc.pointDelta > 0 ? '+' : ''}
                        {rc.pointDelta})
                      </Option>
                    ))}
                  </Select>,
                )}
              </Form.Item>

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
          <CodeExecutionOutput executionResult={props.log} fileName="output.txt" />
        </div>
      )}
    </div>
  );
};

const WrappedTestFormItem = Form.create()(TestFormItem);
export default WrappedTestFormItem;

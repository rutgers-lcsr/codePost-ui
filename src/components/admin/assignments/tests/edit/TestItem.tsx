/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* antd imports */
import { Button, Divider, Form, Input, Row, Select, Tag, message, Modal, Typography } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/* other library imports */
import { cloneDeep } from 'lodash-es';

/* codePost object imports */
import { AssignmentType, TestCaseType, SubmissionType } from '../../../../../infrastructure/types';
import { TestCase } from '../../../../../infrastructure/testCase';
import { SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { TestCaseTestResultType } from '../../../../../infrastructure/autograder/runTypes';
import { awaitTestResult } from '../testResult';

/* codePost component imports */
import { CodeWindow } from './CodeWindow';
import { PsuedoTerminal } from './PsuedoTerminal';

/* codePost util imports */
import { testTemplates, hasNativeTestSupport, extensionsByLanguage } from './languageUtils';

import { ILogType, RESULT_TYPE } from './PsuedoTerminal';

const { confirm } = Modal;
const { Option } = Select;

/**********************************************************************************************************************/

interface ITestItemProps {
  currentAssignment: AssignmentType;
  testCase: TestCaseType;
  saveTest: (test: TestCaseType) => Promise<TestCaseType>;
  deleteTest: (test: TestCaseType) => Promise<void>;
  files: SolutionFileType[];
  env?: EnvironmentType;
  submissions: SubmissionType[];
  setTestSubject: (id: string) => void;
  activeSubmission?: SubmissionType;
}

interface IFormValues {
  text: string;
  description: string;
  function: string;
  expectedOutput: string;
  input: string;
  checkReturn: string;
  fileName: string;
  testType: string;
}

export const TestItem = (props: ITestItemProps) => {
  /******************************* State Variables ****************************/
  let formRef: any = React.createRef();
  const [testOutput, setTestOutput] = useState<ILogType | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  /******************************* API / State Change Functions ****************************/
  const handleCreate = (codeString?: string) => {
    const form = formRef.props.form;
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }
      saveTest(values, codeString);
    });
  };

  const handleRun = (codeString?: string) => {
    const form = formRef.props.form;
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }
      runTest(values, codeString);
    });
  };

  const handleDelete = () => {
    confirm({
      title: (
        <span>
          Are you sure you want to delete <b>{props.testCase.description}</b>?
        </span>
      ),
      content: 'This decision cannot be reversed.',
      onOk() {
        return new Promise((resolve, reject) => {
          return resolve(props.deleteTest(props.testCase));
        }).catch(() => console.log('Oops errors!'));
      },
    });
  };

  // A testCase must be saved before it can be run. To simulate a "run without saving"
  // operation, we (1) save the test, (2) run it, (3) save it using its old values.
  const runTest = async (values: IFormValues, codeString?: string) => {
    await saveTest(values, codeString);

    if (props.testCase.id > 0) {
      setIsRunning(true);
      const payload = {
        id: props.testCase.id,
        submission: props.activeSubmission ? props.activeSubmission.id : undefined,
      };
      console.log(payload);
      const result = await TestCase.run(payload);
      awaitTestResult(result.task, callback);
    }
  };

  const callback = (result: TestCaseTestResultType) => {
    const formatted = {
      log: result.log,
      target: props.activeSubmission ? props.activeSubmission.students[0] : 'solution code',
      result: result.passed ? RESULT_TYPE.PASSED : result.isError ? RESULT_TYPE.ERROR : RESULT_TYPE.FAILED,
    };

    setTestOutput(formatted);
    setIsRunning(false);
  };

  const saveTest = async (values: IFormValues, codeString?: string) => {
    const testCaseCopy = { ...props.testCase };
    testCaseCopy.text = codeString || '';
    testCaseCopy.description = values.description;
    testCaseCopy.expectedOutput = values.expectedOutput;
    testCaseCopy.fileName = values.fileName;
    testCaseCopy.function = values.function;
    testCaseCopy.input = values.input;
    testCaseCopy.checkReturn = values.checkReturn === 'return';
    testCaseCopy.type = values.testType;
    await props.saveTest(testCaseCopy);
    message.success('Test saved');
  };

  /******************************* State Change Functions ****************************/
  const saveFormRef = (fRef: React.RefObject<FormComponentProps>) => {
    formRef = fRef;
  };

  /******************************* Return ****************************************/
  return (
    <WrappedTestFormItem
      testCase={props.testCase}
      saveTest={handleCreate}
      deleteTest={handleDelete}
      runTest={handleRun}
      files={props.files}
      wrappedComponentRef={saveFormRef}
      log={testOutput}
      isRunning={isRunning}
      language={props.env ? props.env.language : ''}
      submissions={props.submissions}
      setTestSubject={props.setTestSubject}
    />
  );
};

interface ITestFormItemProps extends FormComponentProps {
  testCase: TestCaseType;
  saveTest: () => void;
  deleteTest: () => Promise<void>;
  files: SolutionFileType[];
  log?: ILogType;
  runTest: () => void;
  isRunning: boolean;
  language: string;
  submissions: SubmissionType[];
  setTestSubject: (id: string) => void;
}

interface IState {
  commandText: string;
  testType: string;
}

class TestFormItem extends React.Component<ITestFormItemProps, IState> {
  public constructor(props: ITestFormItemProps) {
    super(props);
    this.state = {
      commandText: props.testCase.text,
      testType: props.testCase.type,
    };
  }

  /******************************* State Change Functions ****************************/
  public onChange = (text: string) => {
    this.setState({ commandText: text });
    this.props.form.setFieldsValue({
      text: text,
    });
  };

  public onChangeInput = (field: string, e: any) => {
    this.setState((prevstate) => {
      const newState: any = { ...prevstate };
      newState[field] = e.target.value;
      return newState;
    });
  };

  public onTypeChange = (type: string) => {
    const newType = this.props.testCase.type === type;
    this.setState({
      testType: type,
      commandText: newType ? this.props.testCase.text : testTemplates[this.props.language][type],
    });
    this.props.form.setFieldsValue({
      testType: type,
      commandText: newType ? this.props.testCase.text : testTemplates[this.props.language][type],
    });
  };

  public buildIOTest = (testCase: TestCaseType) => {
    const { getFieldDecorator } = this.props.form;
    const textStyle: React.CSSProperties = { whiteSpace: 'nowrap', marginRight: '4px', marginLeft: '4px' };
    const inputStyle: React.CSSProperties = { width: '200px' };

    return (
      <div className="natural-language-form" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ ...textStyle, marginLeft: undefined }}>From file</span>
        <Form.Item label="">
          {getFieldDecorator('fileName', {
            initialValue: testCase.fileName,
            rules: [
              {
                required: true,
              },
            ],
          })(
            <Select disabled={this.props.isRunning} style={inputStyle}>
              {this.props.files.map((file) => {
                return (
                  <Option key={file.id} value={file.name}>
                    {file.name}
                  </Option>
                );
              })}
            </Select>,
          )}
        </Form.Item>
        <span style={textStyle}>run</span>
        <Form.Item label="">
          {getFieldDecorator('function', {
            initialValue: testCase.function,
            rules: [
              {
                required: true,
              },
            ],
          })(<Input placeholder={'Function or Method Name'} style={inputStyle} disabled={this.props.isRunning} />)}
        </Form.Item>
        <span style={textStyle}>with arguments</span>
        <Form.Item label="">
          {getFieldDecorator('input', {
            initialValue: testCase.input,
            rules: [
              {
                required: false,
              },
            ],
          })(<Input placeholder={'Input'} disabled={this.props.isRunning} style={inputStyle} />)}
        </Form.Item>
        <span style={textStyle}>and expect the call to</span>
        <Form.Item label="">
          {getFieldDecorator('checkReturn', {
            initialValue: testCase.checkReturn ? 'return' : 'output',
            rules: [
              {
                required: true,
              },
            ],
          })(
            <Select disabled={this.props.isRunning} style={inputStyle}>
              <Option value={'return'}>Return</Option>
              <Option value={'output'}>Output</Option>
            </Select>,
          )}
        </Form.Item>
        <span style={textStyle}>the value</span>
        <Form.Item label="">
          {getFieldDecorator('expectedOutput', {
            initialValue: testCase.expectedOutput,
            rules: [
              {
                required: false,
              },
            ],
          })(<Input disabled={this.props.isRunning} style={inputStyle} />)}
          <span style={{ marginLeft: '1px' }}>.</span>
        </Form.Item>
      </div>
    );
  };

  /******************************* Render  ****************************/
  public render() {
    const { testCase, form } = this.props;
    const { getFieldDecorator } = form;

    const name = this.state.testType === 'bash' ? '.sh' : extensionsByLanguage[this.props.language];

    // Disable changing the test type if there is no native test support
    const hasNativeSupport = hasNativeTestSupport(this.props.language);

    // Get appropriate body
    let testBody;
    switch (this.state.testType) {
      case 'io':
        testBody = this.buildIOTest(testCase);
        break;
      case 'external':
        testBody = <div />;
        break;
      default:
        testBody = (
          <CodeWindow code={this.state.commandText!} name={name === undefined ? '' : name} onChange={this.onChange} />
        );
    }

    return (
      <div style={{ padding: '0 15px 15px 15px' }}>
        <Typography.Title level={3} style={{ display: 'inline' }}>
          Editing: {testCase.description}
        </Typography.Title>
        <div style={{ float: 'right' }}>
          <Button
            style={{ marginRight: 10 }}
            type="primary"
            onClick={this.props.saveTest.bind(this, this.state.commandText)}
          >
            Save
          </Button>
          <Button type="danger" onClick={this.props.deleteTest}>
            Delete
          </Button>
        </div>
        <div style={{ marginTop: '15px' }} />
        <Divider />
        <div>
          <Typography.Title level={4}>1. Details</Typography.Title>
          <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} layout="inline">
            <Row>
              <Form.Item label="Test Name">
                {getFieldDecorator('description', {
                  initialValue: testCase.description,
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(<Input disabled={this.props.isRunning} />)}
              </Form.Item>
              <Form.Item label="Test type">
                {getFieldDecorator('testType', {
                  initialValue: testCase.type,
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(
                  <Select
                    onChange={this.onTypeChange}
                    disabled={this.props.isRunning || !hasNativeSupport}
                    style={{ minWidth: 200 }}
                  >
                    <Option value={'io'}>Input / Output</Option>
                    <Option value={'bash-unit'}>Shell Script</Option>
                    <Option value={'native-unit'}>
                      Unit Test <Tag>BETA</Tag>
                    </Option>
                  </Select>,
                )}
              </Form.Item>
            </Row>
            <Divider />
            <Typography.Title level={4}>2. Definition</Typography.Title>
            {testBody}
          </Form>
          <Divider />
          <Typography.Title level={4}>3. Results</Typography.Title>
          <div>
            <PsuedoTerminal
              log={this.props.log}
              isRunning={this.props.isRunning}
              runTest={this.props.runTest.bind(this, this.state.commandText)}
              submissions={this.props.submissions}
              setTestSubject={this.props.setTestSubject}
            />
          </div>
        </div>
      </div>
    );
  }
}

const WrappedTestFormItem: any = Form.create()(TestFormItem);

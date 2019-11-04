/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Divider, Form, Input, Row, Select, Tag } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/* codePost object imports */
import { AssignmentType } from '../../../../../../../infrastructure/assignment';
import { TestCase, TestCaseType } from '../../../../../../../infrastructure/testCase';
import { SolutionFileType } from '../../../../../../../infrastructure/autograder/solutionFile';
import { EnvironmentType } from '../../../../../../../infrastructure/autograder/environment';

/* codePost component imports */
import { CodeWindow } from '../utils/CodeWindow';
import { TestResult } from '../utils/TestResult';

/* codePost util imports */
import { testTemplates, hasNativeTestSupport, extensionsByLanguage } from '../utils/languageUtils';

const { Option } = Select;

interface ITestItemProps {
  currentAssignment: AssignmentType;
  testCase: TestCaseType;
  saveTest: (test: TestCaseType) => Promise<TestCaseType>;
  files: SolutionFileType[];
  env: EnvironmentType;
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
  const [testOutput, setTestOutput] = useState('');
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
    const newTest = await props.saveTest(testCaseCopy);

    if (props.testCase.id > 0) {
      setIsRunning(true);
      const payload = { id: props.testCase.id };
      const result = await TestCase.run(payload);
      setTestOutput(JSON.stringify(result));
      setIsRunning(false);
    }
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
      files={props.files}
      wrappedComponentRef={saveFormRef}
      testOutput={testOutput}
      isRunning={isRunning}
      language={props.env.language!}
    />
  );
};

interface ITestFormItemProps extends FormComponentProps {
  testCase: TestCaseType;
  saveTest: () => void;
  files: SolutionFileType[];
  testOutput: string;
  runTest: () => void;
  isRunning: boolean;
  language: string;
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
      commandText: newType ? this.props.testCase.text : testTemplates[this.props.language][type]['initialValue'],
    });
    this.props.form.setFieldsValue({
      testType: type,
      commandText: newType ? this.props.testCase.text : testTemplates[this.props.language][type]['initialValue'],
    });
  };

  /******************************* Render  ****************************/
  public render() {
    const { testCase, form } = this.props;
    const { getFieldDecorator } = form;

    const outputJSON = this.props.testOutput ? JSON.parse(this.props.testOutput) : {};
    const name = this.state.testType == 'bash' ? '.sh' : extensionsByLanguage[this.props.language];

    // Disable changing the test type if there is no native test support
    const hasNativeSupport = hasNativeTestSupport(this.props.language);

    return (
      <div>
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
                  value={testCase.type}
                  style={{ minWidth: 200 }}
                >
                  <Option value={'io'}>I/O</Option>
                  <Option value={'bash-unit'}>Bash</Option>
                  <Option value={'native-unit'}>
                    Unit Test <Tag>BETA</Tag>
                  </Option>
                </Select>,
              )}
            </Form.Item>
          </Row>
          <Divider />
          {this.state.testType === 'io' ? (
            <div>
              <Row style={{ display: 'flex', alignItems: 'center' }}>
                From file &nbsp;
                <Form.Item label="">
                  {getFieldDecorator('fileName', {
                    initialValue: testCase.fileName,
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })(
                    <Select disabled={this.props.isRunning} style={{ minWidth: 200 }}>
                      {this.props.files.map((file) => {
                        return <Option value={file.name}>{file.name}</Option>;
                      })}
                    </Select>,
                  )}
                </Form.Item>
                &nbsp; run function &nbsp;
                <Form.Item label="">
                  {getFieldDecorator('function', {
                    initialValue: testCase.function,
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })(<Input placeholder={'Function or Method Name'} disabled={this.props.isRunning} />)}
                </Form.Item>
                &nbsp; with inputs &nbsp;
                <Form.Item label="">
                  {getFieldDecorator('input', {
                    initialValue: testCase.input,
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })(<Input placeholder={'Input'} disabled={this.props.isRunning} />)}
                </Form.Item>
                &nbsp; , &nbsp;
              </Row>
              <Row style={{ display: 'flex', alignItems: 'center' }}>
                Should &nbsp;
                <Form.Item label="">
                  {getFieldDecorator('checkReturn', {
                    initialValue: testCase.checkReturn ? 'return' : 'output',
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })(
                    <Select
                      disabled={this.props.isRunning}
                      value={testCase.checkReturn ? 'return' : 'output'}
                      style={{ minWidth: 200 }}
                    >
                      <Option value={'return'}>Return</Option>
                      <Option value={'output'}>Output</Option>
                    </Select>,
                  )}
                </Form.Item>
                &nbsp; the value &nbsp;
                <Form.Item label="">
                  {getFieldDecorator('expectedOutput', {
                    initialValue: testCase.expectedOutput,
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })(<Input disabled={this.props.isRunning} />)}
                </Form.Item>
                &nbsp; . &nbsp;
              </Row>
            </div>
          ) : (
            <CodeWindow code={this.state.commandText!} name={name} onChange={this.onChange} />
          )}
        </Form>
        <div>
          <Row style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={this.props.saveTest.bind(this, this.state.commandText)}
              disabled={this.props.isRunning}
              style={{ marginRight: 10 }}
              type="primary"
            >
              {this.props.testCase.id > 0 ? 'Save and Run' : 'Save'}
            </Button>
          </Row>
          {this.props.testOutput && <TestResult log={outputJSON.log} passed={outputJSON.passed} />}
        </div>
      </div>
    );
  }
}

const WrappedTestFormItem: any = Form.create()(TestFormItem);

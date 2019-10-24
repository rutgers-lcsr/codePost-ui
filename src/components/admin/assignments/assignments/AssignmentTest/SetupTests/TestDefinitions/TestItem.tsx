/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Form, Input, Row, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/* codePost object imports */
import { AssignmentType } from '../../../../../../../infrastructure/assignment';
import { TestCase, TestCaseType } from '../../../../../../../infrastructure/testCase';
import { SolutionFileType } from '../../../../../../../infrastructure/solutionFile';

/* codePost component imports */
import { CodeWindow } from './utils/CodeWindow';
import { TestResult } from './utils/TestResult';

/* codePost util imports */
import { getLanguage, testTemplates } from './languageUtils';

const { Option } = Select;

interface ITestItemProps {
  currentAssignment: AssignmentType;
  testCase: TestCaseType;
  saveTest: (test: TestCaseType) => Promise<TestCaseType>;
  files: SolutionFileType[];
}

interface IFormValues {
  text: string;
  name: string;
  expectedOutput: string;
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
    testCaseCopy.text = codeString || values.text;
    testCaseCopy.name = values.name;
    testCaseCopy.expectedOutput = values.expectedOutput;
    testCaseCopy.fileName = values.fileName;
    testCaseCopy.type = values.testType;
    const newTest = await props.saveTest(testCaseCopy);

    if (props.testCase.id > 0) {
      setIsRunning(true);
      const payload = { id: props.testCase.id, files: props.files };
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
      language={getLanguage(props.currentAssignment.testLanguage!)}
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

  public onChangeInput = (e: any) => {
    this.setState({ commandText: e.target.value });
    this.props.form.setFieldsValue({
      text: e.target.value,
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
    const commandTextPlaceholder = testTemplates[this.props.language][this.state.testType]['placeholder'];
    const extension =
      this.state.testType == 'bash'
        ? 'sh'
        : this.props.language == 'python'
        ? 'py'
        : this.props.language == 'java'
        ? 'java'
        : 'txt';

    return (
      <div>
        <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} layout="inline">
          <Row>
            <Form.Item label="Test Name">
              {getFieldDecorator('name', {
                initialValue: testCase.name,
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
                  disabled={this.props.isRunning}
                  value={testCase.type}
                  style={{ minWidth: 200 }}
                >
                  <Option value={'functional'}>Functional Test</Option>
                  <Option value={'unit'}>Unit Test</Option>
                  <Option value={'bash'}>Bash Test</Option>
                </Select>,
              )}
            </Form.Item>
            {this.state.testType === 'functional' ? (
              <div>
                <Form.Item label="File to test">
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
                <Form.Item label="Command">
                  {getFieldDecorator('text', {
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })(
                    <Input
                      onChange={this.onChangeInput}
                      placeholder={commandTextPlaceholder}
                      disabled={this.props.isRunning}
                    />,
                  )}
                </Form.Item>
                <Form.Item label="Output">
                  {getFieldDecorator('expectedOutput', {
                    initialValue: testCase.expectedOutput,
                    rules: [
                      {
                        required: true,
                      },
                    ],
                  })(<Input disabled={this.props.isRunning} />)}
                </Form.Item>
              </div>
            ) : (
              <CodeWindow code={this.state.commandText!} extension={extension} onChange={this.onChange} />
            )}
          </Row>
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

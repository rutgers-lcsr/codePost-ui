import React, { useEffect, useState } from 'react';

import { AssignmentType } from '../../../../../../../infrastructure/assignment';

import { TestCase, TestCaseType } from '../../../../../../../infrastructure/testCase';

import { SolutionFileType } from '../../../../../../../infrastructure/solutionFile';

import { Button, Form, Icon, Input, Row, Select } from 'antd';

import { FormComponentProps } from 'antd/lib/form';

import { CodeWindow } from './CodeWindow';

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
  let formRef: any = React.createRef();

  const [testOutput, setTestOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

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
    console.log(values);
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

  const saveFormRef = (fRef: React.RefObject<FormComponentProps>) => {
    formRef = fRef;
  };

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
    console.log(stringTemplates[this.props.language]);
    this.setState({
      testType: type,
      commandText: newType ? this.props.testCase.text : stringTemplates[this.props.language][type]['initialValue'],
    });
    this.props.form.setFieldsValue({
      testType: type,
      commandText: newType ? this.props.testCase.text : stringTemplates[this.props.language][type]['initialValue'],
    });
  };

  public render() {
    const { testCase, form } = this.props;
    const { getFieldDecorator } = form;

    console.log(this.props.language);

    const outputJSON = this.props.testOutput ? JSON.parse(this.props.testOutput) : {};
    const errorLogs = outputJSON.log && outputJSON.log.split('\n').join('\n');
    const commandTextPlaceholder = stringTemplates[this.props.language][this.state.testType]['placeholder'];
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
          {this.props.testOutput && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {outputJSON.log && (
                <Input.TextArea
                  value={outputJSON.log}
                  autosize={{ minRows: 4, maxRows: 8 }}
                  style={{ marginTop: 15 }}
                />
              )}
              {outputJSON.passed ? (
                <div style={{ color: '#24be85', fontSize: 20, marginTop: 15 }}>
                  <Icon type="check-circle" /> Passed
                </div>
              ) : (
                <div style={{ color: 'red', fontSize: 20, marginTop: 15 }}>
                  <Icon type="exclamation-circle" /> Failed
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const getLanguage = (languageChoice: string) => {
  return languageMap[languageChoice];
};

const languageMap: { [language: string]: string } = {
  'python-3.7': 'python',
  'python-2.7': 'python',
  java: 'java',
};

const bashTemplate = '';
const stringTemplates: { [language: string]: { [type: string]: { [attr: string]: string } } } = {
  python: {
    functional: {
      placeholder: 'FunctionName(Arg1, Arg2, ...)',
      initialValue: '',
    },
    unit: {
      placeholder: '',
      initialValue: `
# Uncomment the following line if you want to import methods
# from files import <insert student's fileName here>

def TestCase():
  # TestCase must return a TestOutput Object
  # TestObject is initialized
  a = 1
  if (a > 0):
    return TestOutput(passed=True, logs="Test passed.")
  else:
    return TestOutput(passed=False, logs="Test failed.")`,
    },
    bash: { placeholder: '', initialValue: '' },
  },
  java: {
    functional: { placeholder: 'FunctionName(Arg1, Arg2, ..)', initialValue: '' },
    unit: {
      placeholder: '',
      initialValue: `

public static TestOutput TestCase() {
  int a = 1;
  if (a > 0){
    TestOutput passed = new TestOutput(true, "good job");
      return passed;
  }
  else {
    TestOutput failed = new TestOutput(false, "base job");
    return failed;
  }
};`,
    },
    bash: { placeholder: '', initialValue: '' },
  },
};

export const WrappedTestFormItem: any = Form.create()(TestFormItem);

import React, { useEffect, useState } from 'react';

import { Assignment, AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';

import { TestCase, TestCaseType } from '../../../../../infrastructure/testCase';

import { SolutionFileType } from '../../../../../infrastructure/solutionFile';

import { Button, Collapse, Form, Icon, Input, Row, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

const { Option } = Select;
const { Panel } = Collapse;

interface IProps {
  currentAssignment: AssignmentType;
  files: SolutionFileType[];
}

const getTestCases = async (assignment: AssignmentType) => {
  const testPromises = assignment.testCases.map((id) => {
    return TestCase.read(id);
  });
  return await Promise.all(testPromises);
};

export const TestPanel = (props: IProps) => {
  const [testCases, setTestCases] = useState<TestCaseType[]>([]);
  const [newTestCounter, setNewTestCounter] = useState(-1);

  useEffect(() => {
    const fetchData = async () => {
      const tests = await getTestCases(props.currentAssignment);
      setTestCases(tests);
    };
    fetchData();
  }, [props.currentAssignment]);

  const saveTest = async (testcase: TestCaseType) => {
    let newTest;
    if (testcase.id < 0) {
      newTest = await TestCase.create(testcase);
    } else {
      newTest = await TestCase.update(testcase);
    }
    const filteredTests = testCases.filter((tc) => {
      return tc.id != testcase.id;
    });
    setTestCases([...filteredTests, newTest]);

    return newTest;
  };

  const addTest = () => {
    const dummyTestCase = {
      id: newTestCounter,
      name: '',
      expectedOutput: '',
      pointsPass: 0,
      pointsFail: 0,
      language: 'python',
      type: 'io',
      text: '',
      assignment: props.currentAssignment.id,
      sortKey: 0,
      fileName: '',
    };
    setNewTestCounter(newTestCounter - 1);
    setTestCases([...testCases, dummyTestCase]);
  };

  const testItems = (
    <Collapse>
      {TestCase.sort(testCases).map((testCase) => {
        return (
          <Panel header={testCase.name} key={testCase.id}>
            <TestItem testCase={testCase} saveTest={saveTest} files={props.files} />
          </Panel>
        );
      })}
    </Collapse>
  );

  return (
    <div>
      {testItems}
      <Button onClick={addTest}>Add Test</Button>
    </div>
  );
};

interface ITestItemProps {
  testCase: TestCaseType;
  saveTest: (test: TestCaseType) => Promise<TestCaseType>;
  files: SolutionFileType[];
}

interface IFormValues {
  text: string;
  name: string;
  expectedOutput: string;
  fileName: string;
}

export const TestItem = (props: ITestItemProps) => {
  let formRef: any = React.createRef();

  const [testOutput, setTestOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleCreate = () => {
    const form = formRef.props.form;
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }
      saveTest(values);
    });
  };

  const saveTest = async (values: IFormValues) => {
    const testCaseCopy = { ...props.testCase };
    testCaseCopy.text = values.text;
    testCaseCopy.name = values.name;
    testCaseCopy.expectedOutput = values.expectedOutput;
    testCaseCopy.fileName = values.fileName;
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
}

class TestFormItem extends React.Component<ITestFormItemProps, {}> {
  public render() {
    const { testCase, form } = this.props;
    const { getFieldDecorator } = form;

    const outputJSON = this.props.testOutput ? JSON.parse(this.props.testOutput) : {};
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
                    message: 'Please input a name with at least 4 characters',
                    min: 4,
                  },
                ],
              })(<Input disabled={this.props.isRunning} />)}
            </Form.Item>
            <Form.Item label="File to test">
              {getFieldDecorator('fileName', {
                initialValue: testCase.fileName,
                rules: [
                  {
                    required: true,
                  },
                ],
              })(
                <Select disabled={this.props.isRunning} defaultValue={testCase.fileName} style={{ minWidth: 200 }}>
                  {this.props.files.map((file) => {
                    return <Option value={file.name}>{file.name}</Option>;
                  })}
                </Select>,
              )}
            </Form.Item>
            <Form.Item label="Command">
              {getFieldDecorator('text', {
                initialValue: testCase.text,
                rules: [
                  {
                    required: true,
                  },
                ],
              })(<Input disabled={this.props.isRunning} />)}
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
          </Row>
        </Form>
        <div>
          <Row style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={this.props.saveTest}
              disabled={this.props.isRunning}
              style={{ marginRight: 10 }}
              type="primary"
            >
              {this.props.testCase.id > 0 ? 'Save and Run' : 'Save'}
            </Button>
          </Row>
          {this.props.testOutput ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {outputJSON.log ? (
                <Input.TextArea
                  value={outputJSON.log}
                  autosize={{ minRows: 4, maxRows: 8 }}
                  style={{ marginTop: 15 }}
                />
              ) : (
                <div />
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
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }
}

const WrappedTestFormItem: any = Form.create()(TestFormItem);
//     <div>
//   {props.testCase.name}
//   {props.testCase.text}
//   {props.testCase.expectedOutput}
//   {props.testCase.pointsPass}
//   {props.testCase.pointsFail}
//   {props.testCase.pointsPass}
//   {props.testCase.language}
//   {props.testCase.type}
// </div>

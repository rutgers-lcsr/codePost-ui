/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Button, Divider, Form, Input, Select, Tag, message, Modal, Typography, Switch, InputNumber } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/* codePost object imports */
import { AssignmentType, TestCaseType, SubmissionType } from '../../../../../../infrastructure/types';
import { TestCase } from '../../../../../../infrastructure/testCase';
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { EnvironmentType } from '../../../../../../infrastructure/autograder/environment';
import { TestEditorResultType, BasicTestResultType } from '../../../../../../infrastructure/autograder/runTypes';
import { awaitTestResult } from '../../testResult';

/* codePost component imports */
import { CodeWindow } from '../utils/CodeWindow';
import { PsuedoTerminal } from './PsuedoTerminal';
import ExplanationModal from '../../../../assignments/rubric/ExplanationModal';

/* codePost util imports */
import { testTemplates, hasNativeTestSupport, extensionsByLanguage } from '../utils/languageUtils';

import CPTooltip from '../../../../../core/CPTooltip';

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
  updateTestStatus: (testID: number, status: number) => void;
}

interface IFormValues {
  text: string;
  description: string;
  function: string;
  expectedOutput: string;
  input: string;
  checkReturn: string;
  fileName: string;
  exposed: boolean;
  pointsPass: number;
  pointsFail: number;
}

export const TestItem = (props: ITestItemProps) => {
  /******************************* State Variables ****************************/
  let formRef: any = React.createRef();
  const [testOutput, setTestOutput] = useState<ILogType | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [methodsByFile, setMethodsByFile] = useState<{ [name: string]: string[] }>({});

  useEffect(() => {
    getMethodNames();
  }, [props.files]);

  /******************************* API / State Change Functions ****************************/
  const getMethodNames = () => {
    // FIXME: temporary hack to get method names.
    // We should use a library like Antlr4 to do this instead of writing our own parser
    if (props.env && props.env.language === 'java') {
      props.files.forEach((f) => {
        const code = f.code.split('\n');
        const methodNames: String[] = [];
        code.forEach((line) => {
          if (line.match(/(public|protected|private|static|\s) +[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{?|[^;])/)) {
            const tokens = line.split('(')[0].split(' ');
            methodNames.push(tokens[tokens.length - 1]);
          }
        });
        setMethodsByFile((prevState) => {
          const newState: any = { ...prevState };
          newState[f.name] = methodNames;
          return newState;
        });
      });
    }
  };

  const handleCreate = (testType: string, explanation: string, codeString?: string) => {
    const form = formRef.props.form;
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }
      saveTest(values, testType, explanation, codeString);
    });
  };

  const handleRun = (testType: string, explanation: string, codeString?: string) => {
    const form = formRef.props.form;
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }
      runTest(values, testType, explanation, codeString);
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
  const runTest = async (values: IFormValues, testType: string, explanation: string, codeString?: string) => {
    await saveTest(values, testType, explanation, codeString);

    if (props.testCase.id > 0) {
      if (!props.activeSubmission && props.files.length === 0) {
        confirm({
          title: 'Empty Solution code',
          content: "You haven't uploaded any solution code. Do you still want to run this test?",
          async onOk() {
            setIsRunning(true);
            const result = await TestCase.run(
              props.testCase.id,
              props.activeSubmission ? { submission: props.activeSubmission.id.toString() } : {},
            );
            awaitTestResult(result.task, callback);
          },
        });
      } else {
        setIsRunning(true);
        const result = await TestCase.run(
          props.testCase.id,
          props.activeSubmission ? { submission: props.activeSubmission.id.toString() } : {},
        );
        awaitTestResult(result.task, callback);
      }
    }
  };

  const callback = (response: TestEditorResultType) => {
    const result: BasicTestResultType = response.results[0];

    const formatted = {
      log: `${response.logs}\n${result.logs}`,
      target: props.activeSubmission ? props.activeSubmission.students[0] : 'solution code',
      result: result.passed ? RESULT_TYPE.PASSED : result.isError ? RESULT_TYPE.ERROR : RESULT_TYPE.FAILED,
      testCaseName: props.testCase.description,
    };

    // FIXME: mutating state
    if (!props.activeSubmission) {
      props.updateTestStatus(props.testCase.id, formatted.result);
    }

    setTestOutput(formatted);
    setIsRunning(false);
  };

  const saveTest = async (values: IFormValues, testType: string, explanation: string, codeString?: string) => {
    const testCaseCopy = { ...props.testCase };
    testCaseCopy.text = codeString || '';
    testCaseCopy.description = values.description;
    testCaseCopy.expectedOutput = values.expectedOutput;
    testCaseCopy.fileName = values.fileName;
    testCaseCopy.function = values.function;
    testCaseCopy.input = values.input;
    testCaseCopy.checkReturn = values.checkReturn === 'return';
    testCaseCopy.type = testType;
    testCaseCopy.exposed = values.exposed;
    testCaseCopy.pointsPass = values.pointsPass;
    testCaseCopy.pointsFail = values.pointsFail;
    testCaseCopy.explanation = explanation;

    // Warn user if they are modifying an instantiated SubmissionTest in a way that
    // will propagate to instances.
    const execute = async () => {
      await props.saveTest(testCaseCopy);
      message.success('Test saved');
    };
    if (props.testCase.instances.length > 0) {
      const prop_fields: Array<keyof TestCaseType> = ['pointsPass', 'pointsFail'];
      if (prop_fields.some((el) => testCaseCopy[el] !== props.testCase[el])) {
        confirm({
          title: <span>Are you sure you want to modify this TestCase? You have already run it on submissions.</span>,
          content: 'This decision cannot be reversed.',
          onOk() {
            return new Promise((resolve, reject) => {
              return resolve(execute());
            }).catch(() => console.log('Oops errors!'));
          },
        });
      } else {
        execute();
      }
    } else {
      execute();
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
      deleteTest={handleDelete}
      runTest={handleRun}
      files={props.files}
      wrappedComponentRef={saveFormRef}
      log={testOutput}
      isRunning={isRunning}
      language={props.env ? props.env.language : ''}
      submissions={props.submissions}
      setTestSubject={props.setTestSubject}
      methodsByFile={methodsByFile}
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
  methodsByFile: { [name: string]: string[] };
}

interface IState {
  commandText: string;
  testType: string;
  selectedFileName: string;
  showExplanation: boolean;
  explanation: string;
}

class TestFormItem extends React.Component<ITestFormItemProps, IState> {
  public constructor(props: ITestFormItemProps) {
    super(props);
    this.state = {
      commandText: props.testCase.text,
      testType: props.testCase.type,
      selectedFileName: props.testCase.fileName,
      showExplanation: false,
      explanation: props.testCase.explanation,
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
  };

  public onChangeFileName = (newName: string) => {
    this.setState({ selectedFileName: newName });
  };

  public buildIOBasic = (testCase: TestCaseType) => {
    const { getFieldDecorator } = this.props.form;
    const textStyle: React.CSSProperties = { whiteSpace: 'nowrap', marginRight: '4px', marginLeft: '4px' };
    const inputStyle: React.CSSProperties = { width: '200px' };

    const functionOptions =
      this.props.methodsByFile && this.props.methodsByFile[this.state.selectedFileName]
        ? this.props.methodsByFile[this.state.selectedFileName].map((name: string) => {
            return (
              <Option key={name} value={name}>
                {name}
              </Option>
            );
          })
        : [];
    return (
      <div className="natural-language-form" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ ...textStyle, marginLeft: undefined }}>From</span>
        <Select disabled={this.props.isRunning} value={'io'} onChange={this.onTypeChange} style={inputStyle}>
          <Option key={'file'} value={'io'}>
            File
          </Option>
          <Option key={'cli'} value={'io_cli'}>
            Command Line
          </Option>
        </Select>
        <span style={textStyle}>with name</span>
        <Form.Item label="">
          {getFieldDecorator('fileName', {
            initialValue: testCase.fileName,
            rules: [
              {
                required: true,
              },
            ],
          })(
            <Select disabled={this.props.isRunning} onChange={this.onChangeFileName} style={inputStyle}>
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
        <span style={textStyle}>, &nbsp; </span>
        <span style={textStyle}>run</span>
        {this.props.methodsByFile && this.props.methodsByFile[this.state.selectedFileName] ? (
          <Form.Item label="">
            {getFieldDecorator('function', {
              initialValue: testCase.function,
              rules: [
                {
                  required: true,
                },
              ],
            })(<Select style={inputStyle}>{functionOptions}</Select>)}
          </Form.Item>
        ) : (
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
        )}
        <span style={textStyle}>with arguments</span>
        <Form.Item label="">
          {getFieldDecorator('input', {
            initialValue: testCase.input,
            rules: [
              {
                required: false,
              },
            ],
          })(
            <Input.TextArea placeholder={'Input'} disabled={this.props.isRunning} style={inputStyle} autosize={true} />,
          )}
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
          })(<Input.TextArea disabled={this.props.isRunning} style={inputStyle} autosize={true} />)}
          <span style={{ marginLeft: '1px' }}>.</span>
        </Form.Item>
      </div>
    );
  };

  public buildIOCL = (testCase: TestCaseType) => {
    const { getFieldDecorator } = this.props.form;
    const textStyle: React.CSSProperties = { whiteSpace: 'nowrap', marginRight: '4px', marginLeft: '4px' };
    const inputStyle: React.CSSProperties = { width: '200px' };

    return (
      <div className="natural-language-form" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ ...textStyle, marginLeft: undefined }}>From</span>
        <Select disabled={this.props.isRunning} value={'io_cli'} onChange={this.onTypeChange} style={inputStyle}>
          <Option key={'file'} value={'io'}>
            File
          </Option>
          <Option key={'cli'} value={'io_cli'}>
            Command Line
          </Option>
        </Select>
        <span style={textStyle}>run the command</span>
        <Input
          placeholder={'Command'}
          style={inputStyle}
          value={this.state.commandText}
          onChange={(e) => this.onChange(e.target.value)}
          disabled={this.props.isRunning}
        />
        <span style={textStyle}>and expect the call to output the value</span>
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
    const typesWithEditDisabled = ['file', 'external'];

    // Get appropriate body
    let testBody;
    switch (this.state.testType) {
      case 'io':
        testBody = this.buildIOBasic(testCase);
        break;
      case 'io_cli':
        testBody = this.buildIOCL(testCase);
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
            onClick={this.props.saveTest.bind(
              this,
              this.state.testType,
              this.state.explanation,
              this.state.commandText,
            )}
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
          <Form layout="inline">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
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
              <div style={{ alignItems: 'center' }}>
                Test Type: &nbsp;
                <Select
                  onChange={this.onTypeChange}
                  disabled={
                    this.props.isRunning || !hasNativeSupport || typesWithEditDisabled.includes(this.state.testType)
                  }
                  style={{ width: 200 }}
                  value={
                    this.state.testType === 'io_cli'
                      ? 'io'
                      : this.state.testType === 'file'
                      ? 'File defined'
                      : this.state.testType
                  }
                >
                  <Option value={'io'}>Input / Output </Option>
                  <Option value={'shell'}>Shell Script </Option>
                  <Option value={'unit'}>Unit Test</Option>
                </Select>
                &nbsp;
                <CPTooltip
                  hideThisOnHideTips={true}
                  title={
                    <span>
                      To learn more, check out our guide to writing{' '}
                      {this.state.testType === 'io' || this.state.testType === 'io_cli' ? (
                        <a href="http://help.codepost.io/en/articles/3567215-writing-tests-i-o-tests" target="_blank">
                          I/O tests.
                        </a>
                      ) : this.state.testType === 'shell' ? (
                        <a
                          href="http://help.codepost.io/en/articles/3550423-writing-tests-shell-and-unit-tests"
                          target="_blank"
                        >
                          Shell tests.
                        </a>
                      ) : this.state.testType === 'unit' ? (
                        <a
                          href="http://help.codepost.io/en/articles/3550423-writing-tests-shell-and-unit-tests"
                          target="_blank"
                        >
                          Unit tests.
                        </a>
                      ) : this.state.testType === 'file' ? (
                        <a href="http://help.codepost.io/en/articles/3553024-writing-tests-file-mode" target="_blank">
                          tests in file mode.
                        </a>
                      ) : (
                        <a
                          href="http://help.codepost.io/en/articles/3550395-creating-tests-for-the-codepost-autograder"
                          target="_blank"
                        >
                          tests.
                        </a>
                      )}
                    </span>
                  }
                  infoIcon={true}
                />
              </div>{' '}
              &nbsp; &nbsp;
              <Form.Item
                label={
                  <span>
                    Exposed{' '}
                    <CPTooltip
                      hideThisOnHideTips={true}
                      title="If student upload is turned on, exposed tests will be run when students upload their submission."
                      infoIcon={true}
                    />
                  </span>
                }
              >
                {getFieldDecorator('exposed', {
                  initialValue: testCase.exposed,
                  valuePropName: 'checked',
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(<Switch disabled={this.props.isRunning} />)}
              </Form.Item>
              &nbsp; &nbsp;
              <Form.Item label="Points on Pass">
                {getFieldDecorator('pointsPass', {
                  initialValue: testCase.pointsPass,
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(<InputNumber />)}
              </Form.Item>
              <Form.Item label="Points on Fail">
                {getFieldDecorator('pointsFail', {
                  initialValue: testCase.pointsFail,
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(<InputNumber />)}
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Explanation{' '}
                    <CPTooltip
                      hideThisOnHideTips={true}
                      title="An explanation that should be shown to students to explain the tests. This will be shown in the test summary students see in the code console."
                      infoIcon={true}
                    />
                  </span>
                }
              >
                <Button icon="edit" onClick={() => this.setState({ showExplanation: true })} />
                {this.state.showExplanation ? (
                  <ExplanationModal
                    title={testCase.description}
                    startText={this.state.explanation}
                    onCancel={() => this.setState({ showExplanation: false })}
                    onSave={(draft?: string) => {
                      draft
                        ? this.setState({ explanation: draft, showExplanation: false })
                        : this.setState({ explanation: '', showExplanation: false });
                    }}
                  />
                ) : null}
              </Form.Item>
            </div>
            <Divider />
            {!typesWithEditDisabled.includes(this.state.testType) && (
              <div>
                <Typography.Title level={4}>2. Definition</Typography.Title>
                {testBody}
              </div>
            )}
          </Form>
          {!typesWithEditDisabled.includes(this.state.testType) && (
            <div>
              <Divider />
              <Typography.Title level={4}>3. Results</Typography.Title>
              <div>
                <PsuedoTerminal
                  log={this.props.log}
                  isRunning={this.props.isRunning}
                  runTest={this.props.runTest.bind(
                    this,
                    this.state.testType,
                    this.state.explanation,
                    this.state.commandText,
                  )}
                  submissions={this.props.submissions}
                  setTestSubject={this.props.setTestSubject}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

const WrappedTestFormItem: any = Form.create()(TestFormItem);

/* react imports */
import React from 'react';

import { EditOutlined } from '@ant-design/icons';

import { Form } from '@ant-design/compatible';

/* antd imports */
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import {
  Button,
  Collapse,
  Divider,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';

/* codePost object imports */
import { EnvironmentType } from '../../../../../../infrastructure/autograder/environment';
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { SubmissionInfoType, TestCaseType } from '../../../../../../infrastructure/types';

/* codePost component imports */
import ExplanationModal from '../../../../assignments/rubric/ExplanationModal';
import { CodeWindow } from '../utils/CodeWindow';
import { PseudoTerminal } from './PseudoTerminal';
import { TemplateSelector } from './TemplateSelector';

/* codePost util imports */
import { commandLineExamples, extensionsByLanguage, hasNativeTestSupport, testTemplates } from '../utils/languageUtils';

import CPTooltip from '../../../../../core/CPTooltip';

import { ILogType } from './PseudoTerminal';

const { Option } = Select;

interface ITestFormItemProps extends FormComponentProps {
  testCase: TestCaseType;
  saveTest: (
    testType: string,
    explanation: string,
    checkReturn: boolean,
    outputType: string,
    codeString?: string,
  ) => void;
  deleteTest: () => Promise<void>;
  files: SolutionFileType[];
  log?: ILogType;
  runTest: (
    testType: string,
    explanation: string,
    checkReturn: boolean,
    outputType: string,
    codeString?: string,
  ) => void;
  isRunning: boolean;
  language: string;
  submissions: SubmissionInfoType[];
  setTestSubject: (id: string) => void;
  activeSubmission?: SubmissionInfoType;
  methodsByFile: { [name: string]: string[] };
  env?: EnvironmentType;
  hasInstanceMethods: boolean;
}

interface IState {
  commandText: string;
  testType: string;
  selectedFileName: string;
  showExplanation: boolean;
  explanation: string;
  checkReturn: boolean;
  outputType: 'constant' | 'flex' | 'regexp' | 'file';
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
      checkReturn: props.testCase.checkReturn,
      outputType: this.getOutputFromTestCase(props.testCase),
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
    const template = testTemplates[this.props.language] ? this.props.language : 'other';

    this.setState({
      testType: type,
      commandText: newType ? this.props.testCase.text : testTemplates[template][type],
    });
  };

  public onReturnChange = (e: any) => {
    this.setState({
      checkReturn: e.target.value === 'return' ? true : false,
    });
  };

  public onTypeChangeRadio = (e: any) => {
    this.onTypeChange(e.target.value);
  };

  public onChangeFileName = (newName: string) => {
    this.setState({ selectedFileName: newName });
  };

  public onChangeOutputType = (val: string) => {
    this.setState({ outputType: val as 'constant' | 'flex' | 'regexp' | 'file' });
  };

  /******************************* API Change Functions ****************************/
  public onSave = () => {
    this.props.saveTest(
      this.state.testType,
      this.state.explanation,
      this.state.checkReturn,
      this.state.outputType,
      this.state.commandText,
    );
  };

  public onRun = () => {
    this.props.runTest(
      this.state.testType,
      this.state.explanation,
      this.state.checkReturn,
      this.state.outputType,
      this.state.commandText,
    );
  };

  /***********************************************************************************/
  /* Helpers
  /***********************************************************************************/

  public getOutputFromTestCase = (testCase: TestCaseType) => {
    if (testCase.outputIsRegexp) {
      return 'regexp';
    } else if (testCase.outputIsFile) {
      return 'file';
    } else if (testCase.isFlexible) {
      return 'flex';
    } else {
      return 'constant';
    }
  };

  /******************************* Render helper functions ****************************/
  public getPseudoCode = () => {
    const missingArgStyle = { color: '#BBBBBB', fontWeight: 300, fontStyle: 'italic' };
    const filledArgStyle = { color: 'grey', fontWeight: 600 };
    const passStyle = { color: '#24be85', opacity: 0.7, fontWeight: 500 };
    const failStyle = { color: 'red', opacity: 0.4, fontWeight: 500 };
    if (this.state.testType === 'io') {
      let file = this.props.form.getFieldValue('fileName') || 'file';
      const input = this.props.form.getFieldValue('input') || 'input';
      const func = this.props.form.getFieldValue('function') || 'function';

      let output;
      switch (this.state.outputType) {
        case 'constant':
          output = this.props.form.getFieldValue('expectedOutput') || 'output';
          break;
        case 'flex':
          output = this.props.form.getFieldValue('expectedOutput') || 'output';
          break;
        case 'regexp':
          output = this.props.form.getFieldValue('expectedOutput') || 'output';
          break;
        case 'file':
          output = `cat ${this.props.form.getFieldValue('expectedOutput') || 'outputFile'}`;
          break;
      }

      const enclosingStartBrace = this.state.checkReturn ? '' : 'print(';
      const enclosingEndBrace = this.state.checkReturn ? '' : ')';

      if (file.indexOf('.') > 0) {
        file = file.substring(0, file.indexOf('.'));
      }

      return (
        <div style={{ color: '#8f8f8f', fontWeight: 500, fontSize: 14 }}>
          <span>If </span>
          <span>{enclosingStartBrace}</span>
          <span style={this.props.form.getFieldValue('fileName') ? filledArgStyle : missingArgStyle}>{file}</span>
          <span>.</span>
          <span style={this.props.form.getFieldValue('function') ? filledArgStyle : missingArgStyle}>{func}</span>
          <span>(</span>
          <span style={this.props.form.getFieldValue('input') ? filledArgStyle : missingArgStyle}>{input}</span>
          <span>)</span>
          <span>{enclosingEndBrace}</span>
          <span> == </span>
          <span style={this.props.form.getFieldValue('expectedOutput') ? filledArgStyle : missingArgStyle}>
            {output}
          </span>
          <span> then </span>
          <span style={passStyle}> Pass </span>
          <span> else </span>
          <span style={failStyle}> Fail </span>
        </div>
      );
    }
    if (this.state.testType === 'io_cli') {
      const command = this.state.commandText || 'command';
      const output =
        this.state.outputType === 'file'
          ? `cat ${this.props.form.getFieldValue('expectedOutput') || 'outputFile'}`
          : this.props.form.getFieldValue('expectedOutput') || 'output';

      return (
        <div style={{ color: '#707070', fontWeight: 500, fontSize: 14 }}>
          <span>If </span>
          <span>(</span>
          <span style={this.state.commandText ? filledArgStyle : missingArgStyle}>{command}</span>
          <span>)</span>
          <span> == </span>
          <span style={this.props.form.getFieldValue('expectedOutput') ? filledArgStyle : missingArgStyle}>
            {output}
          </span>
          <span> then </span>
          <span style={passStyle}> Pass </span>
          <span> else </span>
          <span style={failStyle}> Fail </span>
        </div>
      );
    }
    return '';
  };

  public buildIOBasic = (testCase: TestCaseType) => {
    const { getFieldDecorator } = this.props.form;
    const textStyle: React.CSSProperties = {
      whiteSpace: 'nowrap',
      marginRight: '4px',
      marginLeft: '4px',
      fontWeight: 600,
      color: 'grey',
    };
    const radioGroupStyle: React.CSSProperties = { display: 'flex', margin: 10 };

    const radioButtonStyle: React.CSSProperties = {
      fontSize: 12,
      wordBreak: 'break-word',
      textAlign: 'center',
      height: 40,
      padding: '4px 5px',
      width: 75,
      maxWidth: 75,
    };

    const inputStyle: React.CSSProperties = { width: '200px', margin: '0px 5px' };

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

    // Selector to choose whether an output is a file or a string
    const outputTypeSelect = (
      <Select
        defaultValue={this.getOutputFromTestCase(this.props.testCase)}
        disabled={this.props.isRunning}
        onChange={this.onChangeOutputType}
        style={{ width: 150 }}
      >
        <Select.Option value={'constant'}>Constant (strict)</Select.Option>
        <Select.Option value={'flex'}>
          Constant (flex) <CPTooltip infoIcon={true} title="Ignores whitespace, case, and newlines." />
        </Select.Option>
        <Select.Option value={'regexp'}>Regexp</Select.Option>
        <Select.Option value={'file'}>File</Select.Option>
      </Select>
    );

    return (
      <div className="natural-language-form" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
          <span style={{ ...textStyle, marginLeft: undefined }}>From</span>
          <Radio.Group
            disabled={this.props.isRunning}
            value={'io'}
            onChange={this.onTypeChangeRadio}
            buttonStyle="solid"
            style={radioGroupStyle}
          >
            <Radio.Button key={'file'} value={'io'} style={{ ...radioButtonStyle }}>
              file
            </Radio.Button>
            <Radio.Button
              key={'cli'}
              value={'io_cli'}
              className={'testitem__radio-inactive'}
              style={{ ...radioButtonStyle, lineHeight: '15px' }}
            >
              command line
            </Radio.Button>
          </Radio.Group>
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
              this.props.files.length > 0 ? (
                <Select
                  disabled={this.props.isRunning}
                  placeholder="filename"
                  onChange={this.onChangeFileName}
                  style={inputStyle}
                >
                  {this.props.files.map((file) => {
                    return (
                      <Option key={file.id} value={file.name}>
                        {file.name}
                      </Option>
                    );
                  })}
                </Select>
              ) : (
                <Input
                  onChange={(e: any) => this.onChangeFileName(e.target.value)}
                  style={inputStyle}
                  placeholder="filename"
                />
              ),
            )}
          </Form.Item>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            flexWrap: 'wrap',
            marginTop: 10,
            marginLeft: 20,
          }}
        >
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
              })(
                <Select
                  disabled={this.props.isRunning}
                  style={inputStyle}
                  popupRender={(menu) => {
                    return this.props.hasInstanceMethods ? (
                      <div>
                        <div style={{ padding: '4px 8px' }}>
                          <em>Static methods only</em>
                          &nbsp;
                          <CPTooltip
                            infoIcon={true}
                            title="To test a non-static method, select 'Unit Test' next to 'Test Type'."
                          />
                        </div>
                        <Divider style={{ margin: '4px 0' }} />
                        {menu}
                      </div>
                    ) : (
                      menu
                    );
                  }}
                >
                  {functionOptions}
                </Select>,
              )}
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
              })(<Input placeholder={'function / method'} style={inputStyle} disabled={this.props.isRunning} />)}
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
              <Input.TextArea
                placeholder={'Input'}
                disabled={this.props.isRunning}
                style={{ minWidth: 240, marginLeft: 5 }}
                autoSize={true}
              />,
            )}
          </Form.Item>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            flexWrap: 'wrap',
            marginTop: 15,
            marginLeft: 40,
          }}
        >
          <span style={{ ...textStyle, marginTop: 5 }}>and expect the call to</span>
          <Radio.Group
            disabled={this.props.isRunning}
            value={this.state.checkReturn ? 'return' : 'output'}
            onChange={this.onReturnChange}
            buttonStyle="solid"
            style={{ padding: '7px 5px 0px 5px' }}
          >
            <Radio.Button
              key={'return'}
              className={!this.state.checkReturn ? 'testitem__radio-inactive' : ''}
              value={'return'}
              style={{ fontSize: 13 }}
            >
              return
            </Radio.Button>
            <Radio.Button
              key={'output'}
              className={this.state.checkReturn ? 'testitem__radio-inactive' : ''}
              value={'output'}
              style={{ fontSize: 13 }}
            >
              print
            </Radio.Button>
          </Radio.Group>
          <span style={{ ...textStyle, marginTop: 5 }}>the value</span>
          <Form.Item label="">
            {getFieldDecorator('expectedOutput', {
              initialValue: testCase.expectedOutput,
              rules: [
                {
                  required: false,
                },
              ],
            })(
              <Input
                addonBefore={outputTypeSelect}
                disabled={this.props.isRunning}
                style={{ minWidth: 250, marginLeft: 5 }}
                placeholder={'output'}
              />,
            )}
            <span style={{ marginLeft: '1px' }}>.</span>
          </Form.Item>
        </div>
      </div>
    );
  };

  public buildIOCL = (testCase: TestCaseType) => {
    const { getFieldDecorator } = this.props.form;
    const textStyle: React.CSSProperties = {
      whiteSpace: 'nowrap',
      marginRight: '4px',
      marginLeft: '4px',
      fontWeight: 600,
      color: 'grey',
    };
    const radioGroupStyle: React.CSSProperties = { display: 'flex', margin: 10 };
    const radioButtonStyle: React.CSSProperties = {
      fontSize: 12,
      wordBreak: 'break-word',
      textAlign: 'center',
      height: 40,
      padding: '4px 5px',
      width: 75,
      maxWidth: 75,
    };
    const inputStyle: React.CSSProperties = { minWidth: '200px', margin: '0px 5px' };
    const placeholder: string = commandLineExamples[this.props.language] || 'echo HelloWorld';

    // Disable button to switch to file if there is no native test support
    const hasNativeSupport = hasNativeTestSupport(this.props.language);

    // Selector to choose whether an output is a file or a string
    const outputTypeSelect = (
      <Select
        defaultValue={this.getOutputFromTestCase(this.props.testCase)}
        disabled={this.props.isRunning}
        onChange={this.onChangeOutputType}
        style={{ width: 150 }}
      >
        <Select.Option value={'constant'}>Constant (strict)</Select.Option>
        <Select.Option value={'flex'}>
          Constant (flex) <CPTooltip infoIcon={true} title="Ignores whitespace, case, and newlines." />
        </Select.Option>
        <Select.Option value={'regexp'}>Regexp</Select.Option>
        <Select.Option value={'file'}>File</Select.Option>
      </Select>
    );

    return (
      <div className="natural-language-form" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
          <span style={{ ...textStyle, marginLeft: undefined }}>From</span>
          <Radio.Group value={'io_cli'} onChange={this.onTypeChangeRadio} buttonStyle="solid" style={radioGroupStyle}>
            {/* Disable file button if language doesn't have native support */}
            {hasNativeSupport && (
              <Radio.Button
                key={'file'}
                className={'testitem__radio-inactive'}
                value={'io'}
                style={{ ...radioButtonStyle }}
              >
                file
              </Radio.Button>
            )}
            <Radio.Button
              key={'cli'}
              value={'io_cli'}
              disabled={!hasNativeSupport}
              style={{ ...radioButtonStyle, color: hasNativeSupport ? 'white' : 'black', lineHeight: '15px' }}
            >
              command line
            </Radio.Button>
          </Radio.Group>
          <span style={textStyle}>run the command</span>
          <Input.TextArea
            placeholder={placeholder}
            style={{ ...inputStyle, width: 250 }}
            value={this.state.commandText}
            onChange={(e) => this.onChange(e.target.value)}
            disabled={this.props.isRunning}
            autoSize={true}
          />
        </div>
        <div
          style={{
            marginLeft: 20,
            display: 'flex',
            alignItems: 'center',
            marginTop: 10,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <span style={textStyle}>and expect the call to print the value equal to </span>
          <Form.Item label="">
            {getFieldDecorator('expectedOutput', {
              initialValue: testCase.expectedOutput,
              rules: [
                {
                  required: false,
                },
              ],
            })(
              <Input
                addonBefore={outputTypeSelect}
                placeholder={this.state.outputType === 'file' ? 'helloOutput.txt' : 'Hello World!'}
                disabled={this.props.isRunning}
                style={{ ...inputStyle, minWidth: 300 }}
              />,
            )}
            <span style={{ marginLeft: '1px' }}>.</span>
          </Form.Item>
        </div>
      </div>
    );
  };

  /******************************* Render  ****************************/
  public render() {
    const { testCase, form } = this.props;
    const { getFieldDecorator } = form;

    const name = this.state.testType === 'shell' ? '.sh' : extensionsByLanguage[this.props.language];

    // Disable some test types if there is no native support
    const hasNativeSupport = hasNativeTestSupport(this.props.language);
    const typesWithEditDisabled = ['file']; // Disable select
    const typesWithRunDisabled = ['file', 'external']; // Disable definitions and pseudoterminal

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

    const pseudocode = this.getPseudoCode();
    return (
      <div style={{ padding: '0px 15px' }}>
        <div style={{ paddingBottom: 25, display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Title level={3} style={{ display: 'flex', alignItems: 'center' }}>
            Editing: {testCase.description}&nbsp;&nbsp;
            {this.props.testCase.exposed && (
              <Tooltip title="Test result shown to student upon submit">
                <Tag>Exposed</Tag>
              </Tooltip>
            )}
          </Typography.Title>
          <div>
            <Button style={{ marginRight: 10 }} type="primary" onClick={this.onSave}>
              Save
            </Button>
            <Button danger onClick={this.props.deleteTest}>
              Delete
            </Button>
          </div>
        </div>
        <div>
          <Typography.Title level={4}>1. Details</Typography.Title>
          <Form layout="inline">
            <div style={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap' }}>
              <Row style={{ padding: '0px 16px' }}>
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
                <Form.Item label="Test Type">
                  <Select
                    onChange={this.onTypeChange}
                    disabled={this.props.isRunning || typesWithEditDisabled.includes(this.state.testType)}
                    style={{ width: 200 }}
                    value={
                      this.state.testType === 'io_cli' && hasNativeSupport
                        ? 'io'
                        : this.state.testType === 'file'
                          ? 'File defined'
                          : this.state.testType
                    }
                  >
                    {/* If the language doesn't have native support, remove io_file and unit test options*/}
                    <Option value={hasNativeSupport ? 'io' : 'io_cli'}>Input / Output </Option>
                    {hasNativeSupport && <Option value={'unit'}>{`Unit Test (${this.props.language})`}</Option>}
                    <Option value={'shell'}>Unit Test (Bash)</Option>
                    <Option value={'external'}>External</Option>
                  </Select>
                  &nbsp;
                  <CPTooltip
                    hideThisOnHideTips={true}
                    title={
                      <span>
                        {this.state.testType === 'io' || this.state.testType === 'io_cli' ? (
                          <span>
                            I/O tests are basic equivalence tests comparing the output of a student's command with the
                            expected output. To learn more, check out our guide to writing{' '}
                            <a
                              href="http://help.codepost.io/en/articles/3567215-writing-tests-i-o-tests"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              I/O tests.
                            </a>
                          </span>
                        ) : this.state.testType === 'shell' ? (
                          <span>
                            Shell tests are bash script unit tests. To learn more, check out our guide to writing{' '}
                            <a
                              href="http://help.codepost.io/en/articles/3550423-writing-tests-shell-and-unit-tests"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Shell tests.
                            </a>
                          </span>
                        ) : this.state.testType === 'unit' ? (
                          <span>
                            Unit tests are modular functions/classes written in the environment native language.
                            Currently only java and python are supported. To learn more, check out our guide to writing{' '}
                            <a
                              href="http://help.codepost.io/en/articles/3550423-writing-tests-shell-and-unit-tests"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Unit tests.
                            </a>
                          </span>
                        ) : this.state.testType === 'file' ? (
                          <span>
                            File defined tests are created from running the scripts in file mode. You can edit certain
                            attributes of these tests (points, explanations), but there is no unique code block that
                            maps to each test, unlike tests created from the test editor (I/O, shell, unit).
                            <a
                              href="http://help.codepost.io/en/articles/3553024-writing-tests-file-mode"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              tests in file mode.
                            </a>
                          </span>
                        ) : this.state.testType === 'external' ? (
                          <span>
                            External tests designate tests whose results can only be set via the API. If you run your
                            test scripts locally and want to set the results with the codePost api, you'll use external
                            tests.
                          </span>
                        ) : (
                          <span>
                            To learn more, check out our guide to writing{' '}
                            <a
                              href="http://help.codepost.io/en/articles/3550395-creating-tests-for-the-codepost-autograder"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              tests.
                            </a>
                          </span>
                        )}
                      </span>
                    }
                    infoIcon={true}
                  />
                </Form.Item>
              </Row>
              <Row>
                <Collapse bordered={false} style={{ width: '100%' }}>
                  <Collapse.Panel key="1" header="More options" style={{ border: 0, backgroundColor: '#f5f5f7' }}>
                    <div>
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
                        <Button icon={<EditOutlined />} onClick={() => this.setState({ showExplanation: true })} />
                        {this.state.showExplanation ? (
                          <ExplanationModal
                            title={testCase.description}
                            startText={this.state.explanation}
                            onCancel={() => this.setState({ showExplanation: false })}
                            onSave={(draft?: string) => {
                              draft
                                ? this.setState({ explanation: draft, showExplanation: false }, () => {
                                    this.onSave();
                                  })
                                : this.setState({ explanation: '', showExplanation: false }, () => {
                                    this.onSave();
                                  });
                            }}
                          />
                        ) : null}
                      </Form.Item>
                    </div>
                  </Collapse.Panel>
                </Collapse>
              </Row>
            </div>
            <Divider style={{ marginTop: 12 }} />
            {!typesWithRunDisabled.includes(this.state.testType) && (
              <div className="tests__edit-definition">
                <Typography.Title level={4}>
                  2. Definition{' '}
                  {this.state.testType === 'shell' ? (
                    <TemplateSelector
                      populateDefinition={(code: string) => {
                        this.setState({ commandText: code });
                      }}
                      language={this.props.language}
                    />
                  ) : null}
                </Typography.Title>
                {testBody}
              </div>
            )}

            {pseudocode && (
              <div>
                <br />
                <br />
                <div
                  className="display-flex"
                  style={{ backgroundColor: '#f5f5f7', padding: '10px 20px', letterSpacing: '0.8px' }}
                >
                  <b style={{ fontWeight: 600 }}>Test pseudocode:</b> &nbsp; &nbsp;{this.getPseudoCode()}
                </div>
              </div>
            )}
          </Form>
          {!typesWithRunDisabled.includes(this.state.testType) && (
            <div>
              <Divider />
              <Typography.Title level={4}>3. Results</Typography.Title>
              <div>
                <PseudoTerminal
                  log={this.props.log}
                  isRunning={this.props.isRunning}
                  runTest={this.onRun}
                  submissions={this.props.submissions}
                  setTestSubject={this.props.setTestSubject}
                  activeSubmission={this.props.activeSubmission}
                  env={this.props.env}
                  resizable={true}
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
export default WrappedTestFormItem;

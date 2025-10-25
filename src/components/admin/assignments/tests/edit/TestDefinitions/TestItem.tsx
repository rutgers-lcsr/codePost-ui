/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { message, Modal } from 'antd';

/* codePost object imports */
import { AssignmentType, TestCaseType, SubmissionInfoType } from '../../../../../../infrastructure/types';
import { TestCase } from '../../../../../../infrastructure/testCase';
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { EnvironmentType } from '../../../../../../infrastructure/autograder/environment';
import { TestEditorResultType, BasicTestResultType } from '../../../../../../infrastructure/autograder/runTypes';
import { awaitTestResult } from '../../autograderPollingUtils';

/* codePost util imports */

import { ILogType, RESULT_TYPE } from './PseudoTerminal';

import WrappedTestFormItem from './TestFormItem';

const { confirm } = Modal;

/**********************************************************************************************************************/

interface ITestItemProps {
  currentAssignment: AssignmentType;
  testCase: TestCaseType;
  saveTest: (test: TestCaseType) => Promise<TestCaseType>;
  handleDelete: (test: TestCaseType) => void;
  files: SolutionFileType[];
  env?: EnvironmentType;
  submissions: SubmissionInfoType[];
  setTestSubject: (id: string) => void;
  activeSubmission?: SubmissionInfoType;
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
  let formRef = React.createRef<any>();
  const [testOutput, setTestOutput] = useState<ILogType | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [hasInstanceMethods, setHasInstanceMethods] = useState(false);
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

        const instanceMethods = code.filter((line) =>
          line.match(/(public|protected|private|static|\s) +[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{?|[^;])/),
        );

        code.forEach((line) => {
          if (line.match(/(public|protected|private|\s)?static +[\w\<\>\[\]]+\s+(\w+) *\([^\)]*\) *(\{?|[^;])/)) {
            const tokens = line.split('(')[0].trim().split(' ');
            methodNames.push(tokens[tokens.length - 1]);
          }
        });

        setMethodsByFile((prevState) => {
          const newState: any = { ...prevState };
          newState[f.name] = methodNames;
          return newState;
        });

        setHasInstanceMethods(instanceMethods.length > methodNames.length);
      });
    }
  };

  const handleCreate = (
    testType: string,
    explanation: string,
    checkReturn: boolean,
    outputType: string,
    codeString?: string,
  ) => {
    const form = formRef.current?.props.form;
    if (!form) {
      return;
    }
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }
      saveTest(values, testType, explanation, checkReturn, outputType, codeString);
    });
  };

  const handleRun = (
    testType: string,
    explanation: string,
    checkReturn: boolean,
    outputType: string,
    codeString?: string,
  ) => {
    const form = formRef.current?.props.form;
    if (!form) {
      return;
    }
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }
      runTest(values, testType, explanation, checkReturn, outputType, codeString);
    });
  };

  // A testCase must be saved before it can be run. To simulate a "run without saving"
  // operation, we (1) save the test, (2) run it, (3) save it using its old values.
  const runTest = async (
    values: IFormValues,
    testType: string,
    explanation: string,
    checkReturn: boolean,
    outputType: string,
    codeString?: string,
  ) => {
    const updatedTest = await saveTest(values, testType, explanation, checkReturn, outputType, codeString);

    if (updatedTest && updatedTest.id > 0) {
      if (!props.activeSubmission && props.files.length === 0) {
        confirm({
          title: 'Empty Solution code',
          content: "You haven't uploaded any solution code. Do you still want to run this test?",
          async onOk() {
            setIsRunning(true);
            let payload: any = {
              id: updatedTest.id,
            };
            if (props.activeSubmission) {
              payload = {
                id: updatedTest.id,
                submission: props.activeSubmission.id.toString(),
              };
            }
            const result = await TestCase.run(payload);
            awaitTestResult(result.task, callback.bind({}, updatedTest));
          },
        });
      } else {
        setIsRunning(true);
        let payload: any = {
          id: updatedTest.id,
        };
        if (props.activeSubmission) {
          payload = {
            id: updatedTest.id,
            submission: props.activeSubmission.id.toString(),
          };
        }
        const result = await TestCase.run(payload);

        awaitTestResult(result.task, callback.bind({}, updatedTest));
      }
    }
  };

  const callback = (testCase: TestCaseType, response: TestEditorResultType) => {
    const result: BasicTestResultType = response.results[0];

    const formatted = {
      log: (
        <span>
          <span style={{ color: '#678CAB' }}>{response.logs}</span>
          {`\n${result.logs}`}
        </span>
      ),
      target: props.activeSubmission ? props.activeSubmission.students[0] : 'solution code',
      result: result.passed ? RESULT_TYPE.PASSED : result.isError ? RESULT_TYPE.ERROR : RESULT_TYPE.FAILED,
      testCaseName: testCase.description,
    };

    if (!props.activeSubmission) {
      props.updateTestStatus(testCase.id, formatted.result);
    }

    setTestOutput(formatted);
    setIsRunning(false);
  };

  const saveTest = async (
    values: IFormValues,
    testType: string,
    explanation: string,
    checkReturn: boolean,
    outputType: string,
    codeString?: string,
  ) => {
    const testCaseCopy = { ...props.testCase };
    testCaseCopy.text = codeString || '';
    testCaseCopy.description = values.description;
    testCaseCopy.expectedOutput = values.expectedOutput;
    testCaseCopy.fileName = values.fileName;
    testCaseCopy.function = values.function;
    testCaseCopy.input = values.input;
    testCaseCopy.checkReturn = checkReturn;
    testCaseCopy.type = testType;
    testCaseCopy.exposed = values.exposed;
    testCaseCopy.pointsPass = values.pointsPass;
    testCaseCopy.pointsFail = values.pointsFail;
    testCaseCopy.explanation = explanation;

    testCaseCopy.outputIsFile = outputType === 'file';
    testCaseCopy.isFlexible = outputType === 'flex';
    testCaseCopy.outputIsRegexp = outputType === 'regexp';

    // Warn user if they are modifying an instantiated SubmissionTest in a way that
    // will propagate to instances.
    const execute = async () => {
      const test = await props.saveTest(testCaseCopy);
      message.success('Test saved');
      return test;
    };
    if (props.testCase.instances.length > 0) {
      const prop_fields: Array<keyof TestCaseType> = ['pointsPass', 'pointsFail'];
      if (prop_fields.some((el) => testCaseCopy[el] !== props.testCase[el])) {
        confirm({
          title: <span>Are you sure you want to modify this TestCase? You have already run it on submissions.</span>,
          content: 'This decision cannot be reversed.',
          async onOk() {
            return await execute();
          },
        });
      } else {
        return await execute();
      }
    } else {
      return await execute();
    }
  };

  /******************************* State Change Functions ****************************/
  const saveFormRef = (fRef: React.RefObject<any>) => {
    formRef = fRef;
  };

  /******************************* Return ****************************************/
  return (
    <WrappedTestFormItem
      env={props.env}
      testCase={props.testCase}
      saveTest={handleCreate}
      deleteTest={props.handleDelete.bind({}, props.testCase)}
      runTest={handleRun}
      files={props.files}
      wrappedComponentRef={saveFormRef}
      log={testOutput}
      isRunning={isRunning}
      language={props.env ? props.env.language : ''}
      submissions={props.submissions}
      setTestSubject={props.setTestSubject}
      activeSubmission={props.activeSubmission}
      methodsByFile={methodsByFile}
      hasInstanceMethods={hasInstanceMethods}
    />
  );
};

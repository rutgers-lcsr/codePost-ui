/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useState } from 'react';

/* antd imports */
import { message, Modal } from 'antd';

/* codePost object imports */
import { AssignmentType, TestCaseType, SubmissionInfoType } from '../../../../../../infrastructure/types';
import { TestCase } from '../../../../../../infrastructure/testCase';

import { EnvironmentType } from '../../../../../../infrastructure/autograder/environment';
/* codePost util imports */

import WrappedTestFormItem from './TestFormItem';

const { confirm } = Modal;

/**********************************************************************************************************************/

interface ITestItemProps {
  currentAssignment: AssignmentType;
  testCase: TestCaseType;
  saveTest: (test: TestCaseType) => Promise<TestCaseType>;
  handleDelete: (test: TestCaseType) => void;

  env?: EnvironmentType;
  submissions: SubmissionInfoType[];
  setTestSubject: (id: string) => void;
  activeSubmission?: SubmissionInfoType;
  updateTestStatus: (testID: number, status: number) => void;
  assignmentFiles?: any[]; // Using any to avoid importing AssignmentFile type just for pass-through if lazy
}

// Extends expected form fields + state fields from TestFormItem
interface IFullTestValues {
  description: string;
  testType: string;
  explanation: string;
  commandText: string;
  fileName: string;
  exposed: boolean;

  pointsPass: number;
  pointsFail: number;
  dataSet: number;
  // Legacy fields removed

  targetCellId?: number | string;
  testCode?: string;
}

export const TestItem = (props: ITestItemProps) => {
  /******************************* State Variables ****************************/
  const [testOutput, setTestOutput] = useState<any | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  const mapValuesToTestCase = (values: IFullTestValues): TestCaseType => {
    const testCaseCopy = { ...props.testCase };
    testCaseCopy.text = values.commandText || '';
    testCaseCopy.description = values.description;
    testCaseCopy.fileName = values.fileName;
    testCaseCopy.type = values.testType;
    testCaseCopy.exposed = values.exposed;
    testCaseCopy.pointsPass = values.pointsPass;
    testCaseCopy.pointsFail = values.pointsFail;
    testCaseCopy.explanation = values.explanation;
    testCaseCopy.dataSet = values.dataSet || null;
    testCaseCopy.targetCellId = (values.targetCellId as any) || null;
    testCaseCopy.testCode = values.testCode || '';
    testCaseCopy.testCode = values.testCode || '';

    return testCaseCopy;
  };

  const handleCreate = (values: IFullTestValues) => {
    saveTest(values);
  };

  const handleRun = async (values: IFullTestValues) => {
    runTest(values);
  };

  // Logic to actually save via API
  const saveTest = async (values: IFullTestValues) => {
    const testCaseToSave = mapValuesToTestCase(values);

    const execute = async () => {
      const test = await props.saveTest(testCaseToSave);
      message.success('Test saved');
      return test;
    };

    // Warn if modifying existing instances
    if (props.testCase.instances.length > 0) {
      const prop_fields: Array<keyof TestCaseType> = ['pointsPass', 'pointsFail'];
      if (prop_fields.some((el) => testCaseToSave[el] !== props.testCase[el])) {
        // We wrap confirm in a promise to await it (generic confirm doesn't return promise directly usually)
        return new Promise<TestCaseType | undefined>((resolve) => {
          confirm({
            title: <span>Are you sure you want to modify this TestCase? You have already run it on submissions.</span>,
            content: 'This decision cannot be reversed.',
            onOk: async () => {
              const res = await execute();
              resolve(res);
            },
            onCancel: () => {
              resolve(undefined);
            },
          });
        });
      } else {
        return await execute();
      }
    } else {
      return await execute();
    }
  };

  const runTest = async (values: IFullTestValues) => {
    // 1. Save (or simulate save? Legacy saved first)
    const updatedTest = await saveTest(values);

    if (updatedTest && updatedTest.id > 0) {
      setIsRunning(true);
      const payload: any = {
        testId: updatedTest.id,
        submissionId: props.activeSubmission ? props.activeSubmission.id.toString() : '0',
      };

      if (!props.activeSubmission) {
        message.error('Please select a student submission to run tests.');
        setIsRunning(false);
        return;
      }

      try {
        const result = await TestCase.runV2(payload);

        const formatted = {
          success: result.passed,
          stdout: result.output_data?.stdout || result.logs,
          stderr: result.output_data?.stderr,
          error: result.isError ? result.logs : undefined,
          output_data: result.output_data,
          cached: result.cached,
          execution_time: result.execution_time,
        };

        setTestOutput(formatted);
        setIsRunning(false);
      } catch (e) {
        message.error('Failed to run test');
        setIsRunning(false);
      }
    }
  };

  /******************************* Return ****************************************/
  return (
    <WrappedTestFormItem
      env={props.env}
      testCase={props.testCase}
      saveTest={handleCreate}
      deleteTest={props.handleDelete.bind({}, props.testCase)}
      runTest={handleRun}
      // wrappedComponentRef={saveFormRef} // No longer needed as we don't access form via ref
      log={testOutput}
      isRunning={isRunning}
      language={props.env ? props.env.language : ''}
      submissions={props.submissions}
      setTestSubject={props.setTestSubject}
      activeSubmission={props.activeSubmission}
      currentAssignment={props.currentAssignment}
      assignmentFiles={props.assignmentFiles}
    />
  );
};

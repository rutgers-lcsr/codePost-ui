// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useState } from 'react';

/* antd imports */
import { message, Modal } from 'antd';

/* codePost object imports */
import { TypeEnum } from '../../../../../../api-client';
import { autograderApi } from '../../../../../../api-client/clients';
import {
  AssignmentFileType,
  AssignmentType,
  EnvironmentType,
  SubmissionInfoType,
  TestCaseType,
} from '../../../../../../types/models';
/* codePost util imports */

import WrappedTestFormItem from './TestFormItem';
import { useTaskPolling } from '../../../../../../hooks/useTaskPolling';

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
  assignmentFiles?: AssignmentFileType[];
}

// Extends expected form fields + state fields from TestFormItem
interface IFullTestValues {
  description: string;
  testType: TypeEnum;
  explanation: string;
  commandText: string;
  exposed: boolean;
  pointsPass: number;
  pointsFail: number;

  // Legacy fields removed

  targetCellId?: number | string;
  testCode?: string;
}

export const TestItem = (props: ITestItemProps) => {
  // This might be deprecated, I dont think its currently being used

  // TODO: investigate and remove if so (also remove related imports)
  /******************************* State Variables ****************************/
  const [testOutput, setTestOutput] = useState<unknown>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  const mapValuesToTestCase = (values: IFullTestValues): TestCaseType => {
    const testCaseCopy = { ...props.testCase };
    testCaseCopy.text = values.commandText || '';
    testCaseCopy.description = values.description;
    testCaseCopy.type = values.testType;
    testCaseCopy.exposed = values.exposed;
    testCaseCopy.pointsPass = values.pointsPass;
    testCaseCopy.pointsFail = values.pointsFail;
    testCaseCopy.explanation = values.explanation;
    testCaseCopy.explanation = values.explanation;
    testCaseCopy.targetCellId = (values.targetCellId as number | null) || null;
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

  // Extract polling logic since we can't easily use the hook inside a callback without refactoring the whole component structure significantly
  // or checking if we can use the hook at top level.
  // We can use the hook at top level!
  const { pollTask } = useTaskPolling();

  const runTest = async (values: IFullTestValues) => {
    // 1. Save (or simulate save? Legacy saved first)
    const updatedTest = await saveTest(values);

    if (updatedTest && updatedTest.id > 0) {
      setIsRunning(true);
      if (!props.activeSubmission) {
        message.error('Please select a student submission to run tests.');
        setIsRunning(false);
        return;
      }

      try {
        const response = await autograderApi.v2RunCreate({
          testExecutionRequest: {
            testId: updatedTest.id,
            submissionId: props.activeSubmission.id,
          },
        });

        // The response is now AsyncTaskResponse
        const taskId =
          (response as unknown as { taskId?: string; task_id?: string }).taskId ||
          (response as unknown as { task_id?: string }).task_id;

        if (!taskId) {
          throw new Error('No task ID returned from server');
        }

        const runResult = await pollTask(taskId);

        // result.result contains the actual test result data
        const result = runResult.result as unknown;
        const success = runResult.success as boolean;

        const resultData = result ?? {};
        const formatted = {
          success: success,
          stdout: (resultData as { stdout?: string; logs?: string }).stdout ?? (resultData as { logs?: string }).logs,
          stderr: (resultData as { stderr?: string }).stderr,
          error: runResult.error ?? (resultData as { error?: string }).error,
          output_data: resultData,
          cached: (resultData as { cached?: boolean }).cached,
          execution_time: (resultData as { execution_time?: number }).execution_time,
        };

        setTestOutput(formatted);
        setIsRunning(false);
      } catch (e) {
        message.error('Failed to run test');
        setIsRunning(false);
        console.error(e);
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

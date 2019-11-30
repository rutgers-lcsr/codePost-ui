/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Layout, Typography } from 'antd';

/* codePost object imports */
import { BasicTestResultType, TestEditorResultType } from '../../../../../infrastructure/autograder/runTypes';
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { SubmissionType } from '../../../../../infrastructure/submission';
import { SourceFile, SourceFileType } from '../../../../../infrastructure/autograder/sourceFile';
import { TestCaseType } from '../../../../../infrastructure/testCase';
import { TestCategoryType } from '../../../../../infrastructure/types';

/* codePost interface imports */
import { IBasicFile } from './TestDefinitions';
import { TestCasesByCategory } from '../../../../core/testFetchUtils';
import { FILE_TYPE } from './TestingSetup';

/* codePost component imports */
import FileTag from './TestDefinitions/FileTag';

import { CodeWindow } from './utils/CodeWindow';
import { TestsChangeModal } from './TestDefinitions/TestsChangeModal';
import { PsuedoTerminal, ILogType, RESULT_TYPE } from './TestDefinitions/PsuedoTerminal';

/* codePost util imports */
import { awaitTestResult } from '../testResult';

/**********************************************************************************************************************/
interface IProps {
  // submission
  submissions: SubmissionType[];
  activeSubmission: SubmissionType | undefined;
  setTestSubject: (id: string) => void;

  // files
  currentFile?: IBasicFile;
  sourceFiles: SourceFileType[];
  updateFile: (type: FILE_TYPE, id: number, newCode: string) => Promise<void>;

  // environment
  env?: EnvironmentType;
  updateEnv: (env: EnvironmentType) => void;

  // tests
  casesByCategory: TestCasesByCategory;
  categories: TestCategoryType[];
  addCategory: (name: string) => Promise<TestCategoryType>;
  deleteCategory: (id: number) => Promise<void>;
  addTest: (language: string | null, category: number, sourceFile?: boolean, name?: string) => Promise<void>;
  deleteTest: (testCase: TestCaseType) => Promise<void>;
  setResults: (results: BasicTestResultType[]) => void;
  saveTest: (test: TestCaseType) => Promise<TestCaseType>;
}

const { Content } = Layout;

export const SourceEditor = (props: IProps) => {
  /************************** State variables  ****************************/
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  // The new code of the edited sourceFile
  const [newCode, setNewCode] = useState('');
  const [fileToRun, setFileToRun] = useState('main.sh');
  const [logs, setLogs] = useState<ILogType[]>([]);

  /************************** API functions ****************************/
  const runTest = async () => {
    if (props.env) {
      setRunning(true);
      let result: any;
      if (fileToRun === 'main.sh') {
        // Run all tests
        result = await Environment.run(
          props.env.id,
          props.activeSubmission ? { submission: props.activeSubmission.id.toString() } : {},
        );
      } else {
        const found = props.sourceFiles.find((el) => el.name === fileToRun);
        if (found !== undefined) {
          result = await SourceFile.run(
            found.id,
            props.activeSubmission
              ? {
                  submission: props.activeSubmission.id.toString(),
                }
              : {},
          );
        }
      }
      awaitTestResult(result.task, callback);
    }
  };

  // On confirm of tests change, update the sourcefile
  const onConfirm = () => {
    if (props.currentFile) {
      props.updateFile(FILE_TYPE.SOURCEFILE, props.currentFile.id, newCode);
    }
  };

  /************************** State change Functions ****************************/
  useEffect(() => {
    // open modal when new code of current file is saved, only if the newCode isn't being set to empty
    newCode && setSaving(true);
  }, [newCode]);

  // callback called when run is complete
  const callback = (response: TestEditorResultType) => {
    props.setResults(response.results);
    setRunning(false);
    if (props.env && props.env.dumpMode && props.activeSubmission) {
      // Refresh submission files after dump
      props.setTestSubject(props.activeSubmission.id.toString());
    }

    const formatted = {
      log: response.logs,
      target: props.activeSubmission ? props.activeSubmission.students[0] : 'solution code',
      result: RESULT_TYPE.NONE,
      testCaseName: '',
    };

    const logs = response.results.map((el) => {
      const testCase = props.casesByCategory[el.testCategory].find((testCase) => testCase.id === el.testCase)!;
      const status = el.isError ? RESULT_TYPE.ERROR : el.passed ? RESULT_TYPE.PASSED : RESULT_TYPE.FAILED;

      if (!props.activeSubmission) {
        testCase.lastSolutionRun = status;
        props.saveTest(testCase);
      }

      return {
        log: el.logs,
        target: props.activeSubmission ? props.activeSubmission.students[0] : 'solution code',
        result: status,
        testCaseName: testCase.description,
      };
    });

    setLogs([formatted, ...logs]);
  };

  const onSourceFileSave = (code: string) => {
    if (props.currentFile) {
      setNewCode(code);
    }
    return Promise.resolve();
  };

  /************************** Return ****************************/
  const content = props.currentFile && (
    <div>
      <CodeWindow
        code={props.currentFile.code}
        name={props.currentFile.name}
        onSave={
          props.currentFile.type === FILE_TYPE.SOURCEFILE
            ? onSourceFileSave
            : props.currentFile.canSave
            ? props.updateFile.bind({}, props.currentFile.type, props.currentFile.id)
            : undefined
        }
        height={'350px'}
      />
      <PsuedoTerminal
        log={logs}
        isRunning={running}
        runTest={runTest}
        submissions={props.submissions}
        setTestSubject={props.setTestSubject}
        files={props.sourceFiles.map((el) => el.name)}
        defaultFile="main.sh"
        updateFile={setFileToRun}
      />
    </div>
  );
  const title = props.currentFile && (
    <div style={{ padding: '12px 20px 8px 25px', display: 'flex' }}>
      <Typography.Title level={4} style={{ opacity: 0.6, marginBottom: 0 }}>
        {props.currentFile.name}
      </Typography.Title>
      &nbsp; &nbsp; &nbsp;
      <FileTag type={props.currentFile.type} small={false} />
    </div>
  );

  return (
    <Layout>
      <Content style={{ paddingLeft: 5 }}>
        {title}
        {content}
      </Content>
      <TestsChangeModal
        checkChanges={saving}
        currentFile={props.currentFile!}
        currentFileCode={newCode}
        sourceFiles={props.sourceFiles}
        categories={props.categories}
        casesByCategory={props.casesByCategory}
        onCancel={setSaving.bind({}, false)}
        onConfirm={onConfirm}
        addCategory={props.addCategory}
        deleteCategory={props.deleteCategory}
        addTest={props.addTest}
        deleteTest={props.deleteTest}
      />
    </Layout>
  );
};

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect, useState } from 'react';

/* library imports */
import { Layout, Typography } from 'antd';

/* codePost object imports */
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { TestEditorResultType } from '../../../../../infrastructure/autograder/runTypes';
import { SourceFile, SourceFileType } from '../../../../../infrastructure/autograder/sourceFile';
import { SubmissionInfoType } from '../../../../../infrastructure/submission';
import { TestCaseType } from '../../../../../infrastructure/testCase';
import { TestCategoryType } from '../../../../../infrastructure/types';

/* codePost interface imports */
import { TestCasesByCategory } from '../../../../core/testFetchUtils';
import { IBasicFile } from './TestDefinitions';
import { FILE_TYPE } from './TestingSetup';

/* codePost component imports */
import FileTag from './TestDefinitions/FileTag';

import { ILogType, PseudoTerminal } from './TestDefinitions/PseudoTerminal';
import { TestsChangeModal } from './TestDefinitions/TestsChangeModal';
import { CodeWindow } from './utils/CodeWindow';

/* codePost util imports */
import { awaitTestResult } from '../autograderPollingUtils';

/**********************************************************************************************************************/
interface IProps {
  // submission
  submissions: SubmissionInfoType[];
  activeSubmission: SubmissionInfoType | undefined;
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
  parseResults: (response: TestEditorResultType) => Promise<ILogType[]>;
  saveTest: (test: TestCaseType) => Promise<TestCaseType>;
  updateTestStatus: (testID: number, status: number) => void;
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
        let payload: any = { id: props.env.id };
        if (props.activeSubmission) {
          payload = { ...payload, submission: props.activeSubmission.id, simulate: true };
        }

        result = await Environment.run(payload);
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
    if (newCode && props.env && !props.env.testParsing) {
      onConfirm();
    } else {
      newCode && setSaving(true);
    }
  }, [newCode]);

  // callback called when run is complete
  const callback = async (response: TestEditorResultType) => {
    const newLogs = await props.parseResults(response);
    setRunning(false);
    setLogs(newLogs);
  };

  const onSourceFileSave = (code: string) => {
    if (props.currentFile) {
      setNewCode(code);
    }
    return Promise.resolve();
  };

  /************************** Return ****************************/
  const noPreviewString =
    props.currentFile && props.currentFile.code.startsWith('data:application/octet-stream;base64')
      ? 'No Preview Available'
      : undefined;

  const content = props.currentFile && (
    <div>
      <CodeWindow
        code={noPreviewString || props.currentFile.code}
        name={props.currentFile.name}
        onSave={
          props.currentFile.type === FILE_TYPE.SOURCEFILE
            ? onSourceFileSave
            : props.currentFile.canSave && !noPreviewString
              ? props.updateFile.bind({}, props.currentFile.type, props.currentFile.id)
              : undefined
        }
        height={'350px'}
      />
      <PseudoTerminal
        log={logs}
        isRunning={running}
        runTest={runTest}
        submissions={props.submissions}
        setTestSubject={props.setTestSubject}
        files={props.sourceFiles.map((el) => el.name)}
        defaultFile="main.sh"
        updateFile={setFileToRun}
        env={props.env}
        resizable={true}
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

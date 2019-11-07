/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports  */
import { Button, Layout, Divider, Spin } from 'antd';

/* codePost object imports  */
import { TestCategoryType, TestCategory } from '../../../../../../../infrastructure/testCategory';
import { SolutionFileType } from '../../../../../../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../../../../../../infrastructure/submission';
import { FileType } from '../../../../../../../infrastructure/file';
import { HelperFileType } from '../../../../../../../infrastructure/autograder/helperFile';
import { BashFile, BashFileType } from '../../../../../../../infrastructure/autograder/bashFile';
import { TestCaseType } from '../../../../../../../infrastructure/testCase';

/* codePost other imports  */
import { CodeIDE } from './CodeIDE';
import { SubmissionPicker } from '../utils/SubmissionPicker';
import { TestResult } from '../utils/TestResult';

import { fetchOrCreateBashFile } from '../../testFetchUtils';

const { Sider } = Layout;

interface ProModeProps {
  currentCategory: TestCategoryType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionType[];
  replaceCategory: (newCategory: TestCategoryType) => void;
  testCases: TestCaseType[];
}

export const ProMode = (props: ProModeProps) => {
  const [currentFiles, setCurrentFiles] = useState<(SolutionFileType | FileType)[]>(props.solutions);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [submission, setSubmission] = useState<SubmissionType | undefined>(undefined);
  const [bash, setBash] = useState<BashFileType | undefined>();
  const [running, setRunning] = useState(false);

  /******************************** Set up ****************************/
  useEffect(() => {
    const fetchData = async () => {
      const bashFile = await fetchOrCreateBashFile(props.currentCategory);
      if (!props.currentCategory.bashFile) {
        const updatedCategory = { ...props.currentCategory };
        updatedCategory.bashFile = bashFile.id;
        props.replaceCategory(updatedCategory);
      }
      setBash(bashFile);
    };
    fetchData();
  }, [props.currentCategory.id]);
  /******************************** API Functions ****************************/
  // Not updating anything in the database, only local state
  const onSubmissionFileSave = (fileIndex: number, newCode: string) => {
    const newFile = { ...currentFiles[fileIndex] };
    newFile.code = newCode;
    const newFiles = [...currentFiles];
    newFiles.splice(fileIndex, 1, newFile);
    setCurrentFiles(newFiles);
    return Promise.resolve();
  };

  const onBashSave = async (index: number, newCode: string) => {
    if (bash) {
      const payload = { id: bash.id, code: newCode };
      const newBash = await BashFile.update(payload);
      setBash(newBash);
    }
  };
  /************************** State Change Functions ****************************/
  const runTest = async () => {
    setRunning(true);
    const result = await TestCategory.run({
      id: props.currentCategory.id,
      submission: submission ? submission.id : null,
    });
    setOutputs(result);
    setRunning(false);
  };

  const setCodeFiles = (files: SolutionFileType[] | FileType[], submission: SubmissionType | undefined) => {
    setCurrentFiles(files);
    setSubmission(submission);
  };

  /************************** Return helpers ****************************/
  if (!bash) {
    return <Spin />;
  }

  const bashGroup = {
    files: [{ name: 'main.sh', ...bash, canSave: true }],
    onSave: onBashSave,
    isDisabled: false,
  };

  const helperFiles = props.helpers.map((file) => {
    return { name: file.name, title: <div>{file.name} (Helper)</div>, code: file.code, canSave: false };
  });

  const submissionFiles = currentFiles.map((file) => {
    return { name: file.name, code: file.code, canSave: true };
  });

  const fileGroup = {
    subMenuTitle: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        files ({submission ? submission.students : 'Solution Code'})&nbsp;
        <SubmissionPicker solutionFiles={props.solutions} submissions={props.submissions} setFiles={setCodeFiles} />
      </div>
    ),
    files: [...helperFiles, ...submissionFiles],
    isDisabled: true,
    onSave: onSubmissionFileSave,
  };

  const testCases =
    outputs.length > 0
      ? outputs.map((t) => {
          return <TestCaseItem description={t.description} passed={t.passed} logs={t.log} isError={t.isError} />;
        })
      : props.testCases.map((t) => {
          return <TestCaseItem description={t.description} />;
        });

  /************************** Return  ****************************/
  return (
    <Layout>
      <CodeIDE groups={[bashGroup, fileGroup]} />
      <Sider
        theme="light"
        style={{
          borderLeft: '1px #f9f9f9 solid',
        }}
        width={200}
      >
        <div style={{ padding: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button onClick={runTest} loading={running}>
            Run main.sh
          </Button>
          <Divider style={{ marginTop: 15, marginBottom: 15, width: 175 }} />
          {testCases}
        </div>
      </Sider>
    </Layout>
  );
};

interface ITestCaseItemProps {
  description: string;
  passed?: boolean;
  isError?: boolean;
  logs?: string;
}

const TestCaseItem = (props: ITestCaseItemProps) => {
  return (
    <div
      style={{
        margin: 5,
        padding: 5,
        borderRadius: 3,
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 6px 0px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%',
      }}
    >
      <div style={{ marginRight: 10, fontSize: 16, fontWeight: 500, color: 'grey' }}>{props.description}</div>
      {props.passed !== undefined && (
        <TestResult log={props.logs || null} passed={props.passed} isError={props.isError || false} iconMode={true} />
      )}
    </div>
  );
};

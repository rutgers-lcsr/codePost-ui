/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Button, Checkbox, Divider, Icon, Input, Layout, Select, Typography } from 'antd';

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
import CPTooltip from '../../../../core/CPTooltip';
import FileTag from './TestDefinitions/FileTag';

import { CodeWindow } from './utils/CodeWindow';
import { TestsChangeModal } from './TestDefinitions/TestsChangeModal';

/* codePost util imports */
import { awaitTestResult } from '../testResult';
import { openSubmission } from '../../../other/AdminUtils';

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
}

const { Header, Content } = Layout;

export const SourceEditor = (props: IProps) => {
  /************************** State variables Functions ****************************/
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  // The new code of the edited sourceFile
  const [newCode, setNewCode] = useState('');
  const [fileToRun, setFileToRun] = useState(0);

  /************************** API Functions ****************************/
  const runTest = async () => {
    if (fileToRun) {
      setRunning(true);
      const result: any = await SourceFile.run({
        id: fileToRun,
        submission: props.activeSubmission ? props.activeSubmission.id : null,
      });
      awaitTestResult(result.task, callback);
    }
  };

  // On confirm of tests change, update the sourcefile
  const onConfirm = () => {
    if (props.currentFile) {
      props.updateFile(FILE_TYPE.SOURCEFILE, props.currentFile.id, newCode);
    }
  };

  // update environment with dump mode
  const updateEnv = async (e: any) => {
    if (props.env) {
      const payload = {
        id: props.env.id,
        dumpMode: e.target.checked,
      };
      const newEnv = await Environment.update(payload);
      props.updateEnv(newEnv);
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
  };

  const onSourceFileSave = (code: string) => {
    if (props.currentFile) {
      setNewCode(code);
    }
    return Promise.resolve();
  };

  const onFileChange = (id: string) => {
    setFileToRun(parseInt(id, 10));
  };

  /************************** Return ****************************/
  const runSelect = (
    <Input.Group compact style={{ width: 'fit-content' }}>
      <Button type="primary" style={{ height: '24px', fontSize: '12px' }} loading={running} onClick={runTest}>
        Run
      </Button>
      <Select
        onChange={onFileChange}
        style={{ height: '25px', minWidth: '150px', fontSize: '12px' }}
        size="small"
        showSearch
        filterOption={(input, option: any) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
      >
        {props.sourceFiles.map((f, i) => (
          <Select.Option key={f.id} value={f.id} style={{ fontSize: 12 }}>
            {f.name}
          </Select.Option>
        ))}
      </Select>
    </Input.Group>
  );

  const content = props.currentFile && (
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
    />
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
      <Header
        style={{
          backgroundColor: 'white',
          height: 40,
          lineHeight: 40,
          padding: '0px 25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Select
            onChange={props.setTestSubject}
            style={{
              height: '25px',
              minWidth: '225px',
              fontSize: '12px',
            }}
            size="small"
            showSearch
            defaultValue={(props.activeSubmission && props.activeSubmission.id.toString()) || '0'}
            filterOption={(input, option: any) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {props.submissions.map((sub, i) => (
              <Select.Option key={sub.students[0]} value={sub.id} style={{ fontSize: 11 }}>
                {`${sub.students[0]}'s submission`}
              </Select.Option>
            ))}
            <Select.Option key="0" value="0" style={{ fontSize: 11 }}>
              Solution code
            </Select.Option>
          </Select>
          {props.activeSubmission && (
            <Icon
              type="code"
              style={{ fontSize: 18, marginLeft: 5 }}
              onClick={openSubmission.bind({}, props.activeSubmission.id)}
            />
          )}
        </div>
        &nbsp; &nbsp; &nbsp;
        <Checkbox style={{ minWidth: 150 }} defaultChecked={props.env && props.env.dumpMode} onChange={updateEnv}>
          Dump outputs{' '}
          <CPTooltip title="When this is checked, a TEST.txt file will be created on a student's submissionw with the raw output of the tests" />
        </Checkbox>
        {runSelect}
      </Header>
      <div style={{ padding: '0px 25px' }}>
        <Divider style={{ margin: '5px 0px 0px 0px' }} />
      </div>
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

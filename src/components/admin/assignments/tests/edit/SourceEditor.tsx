// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect, useState } from 'react';

/* library imports */
import { Button, Card, Col, Row, Space, Typography } from 'antd';

/* codePost object imports */
import { autograderApi } from '../../../../../api-client/clients';
import { TestEditorResultType } from '../../../../../types/autograder';
import { EnvironmentType, SubmissionInfoType, TestCaseType, TestCategoryType } from '../../../../../types/models';

/* codePost interface imports */
import { TestCasesByCategory } from '../../../../core/testFetchUtils';
import { FILE_TYPE } from './TestDefinitions/FileType';

interface IBasicFile {
  id: number;
  name: string;
  code: string;
  type: FILE_TYPE;
  canSave: boolean;
}

/* codePost component imports */
import FileTag from './TestDefinitions/FileTag';

import { ILogType, PseudoTerminal } from './TestDefinitions/PseudoTerminal';
import { TestsChangeModal } from './TestDefinitions/TestsChangeModal';
import { CodeWindow } from './utils/CodeWindow';

/* codePost util imports */
import { awaitTestResult } from '../autograderPollingUtils';
import { CaretRightOutlined, SaveOutlined } from '@ant-design/icons';

/**********************************************************************************************************************/
interface IProps {
  // submission
  submissions: SubmissionInfoType[];
  activeSubmission: SubmissionInfoType | undefined;
  setTestSubject: (id: string) => void;

  // files
  currentFile?: IBasicFile;
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

export const SourceEditor = (props: IProps) => {
  /************************** State variables  ****************************/
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileToRun, setFileToRun] = useState('main.sh');
  const [logs, setLogs] = useState<ILogType[]>([]);
  const [draftCode, setDraftCode] = useState(props.currentFile?.code || '');

  useEffect(() => {
    if (props.currentFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft with prop when file changes
      setDraftCode(props.currentFile.code);
    }
  }, [props.currentFile?.id, props.currentFile?.code]);

  /************************** API functions ****************************/
  const runTest = async () => {
    if (props.env) {
      setRunning(true);
      let result: any;
      if (fileToRun === 'main.sh') {
        // Run all tests
        result = await autograderApi.environmentsRunPartialUpdate({
          id: props.env.id,
          patchedEnvironmentRunRequest: {
            submission: props.activeSubmission?.id,
            simulate: true,
          },
        });
      }
      awaitTestResult(result.task, callback);
    }
  };

  // On confirm of tests change, update the sourcefile
  const onConfirm = () => {};

  // callback called when run is complete
  const callback = async (response: TestEditorResultType) => {
    const newLogs = await props.parseResults(response);
    setRunning(false);
    setLogs(newLogs);
  };

  /************************** Return ****************************/
  const noPreviewString =
    props.currentFile && props.currentFile.code.startsWith('data:application/octet-stream;base64')
      ? 'No Preview Available'
      : undefined;

  if (!props.currentFile) {
    return null;
  }

  return (
    <div style={{ padding: '0px 15px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Card */}
      <Card
        bordered={false}
        bodyStyle={{ padding: '12px 24px' }}
        style={{ marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Typography.Title level={4} style={{ marginBottom: 0 }}>
              {props.currentFile.name}
            </Typography.Title>
            <FileTag type={props.currentFile.type} small={false} />
          </div>
          <Space>
            {props.currentFile.canSave && !noPreviewString && (
              <Button
                icon={<SaveOutlined />}
                onClick={() => props.updateFile(props.currentFile!.type, props.currentFile!.id, draftCode)}
              >
                Save File
              </Button>
            )}
            <Button type="primary" icon={<CaretRightOutlined />} onClick={runTest} loading={running}>
              Run Environment
            </Button>
          </Space>
        </div>
      </Card>

      {/* Content */}
      <Row gutter={24}>
        <Col span={14}>
          <Card
            title="Source Code"
            bordered={false}
            style={{ height: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
          >
            <CodeWindow
              key={props.currentFile.id}
              code={noPreviewString || draftCode}
              name={props.currentFile.name}
              onChange={setDraftCode}
              onSave={
                props.currentFile.canSave && !noPreviewString
                  ? props.updateFile.bind({}, props.currentFile.type, props.currentFile.id)
                  : undefined
              }
              height={'500px'}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title="Terminal & Execution"
            bordered={false}
            style={{ height: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            headStyle={{ borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}
          >
            <div style={{ height: '500px' }}>
              <PseudoTerminal
                log={logs}
                isRunning={running}
                runTest={runTest}
                submissions={props.submissions}
                setTestSubject={props.setTestSubject}
                files={[]}
                defaultFile="main.sh"
                updateFile={setFileToRun}
                env={props.env}
                resizable={true}
              />
            </div>
          </Card>
        </Col>
      </Row>
      <TestsChangeModal
        checkChanges={saving}
        currentFile={props.currentFile! as any}
        currentFileCode={draftCode}
        categories={props.categories}
        casesByCategory={props.casesByCategory}
        onCancel={setSaving.bind({}, false)}
        onConfirm={onConfirm}
        addCategory={props.addCategory}
        deleteCategory={props.deleteCategory}
        addTest={props.addTest}
        deleteTest={props.deleteTest}
      />
    </div>
  );
};

/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports  */
import { Button, Layout, Divider, Menu, Spin, Typography } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports  */
import { TestCategoryType, TestCategory } from '../../../../../../../infrastructure/testCategory';
import { SolutionFileType } from '../../../../../../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../../../../../../infrastructure/submission';
import { FileType } from '../../../../../../../infrastructure/file';
import { HelperFileType } from '../../../../../../../infrastructure/autograder/helperFile';
import { BashFile, BashFileType } from '../../../../../../../infrastructure/autograder/bashFile';
import { TestCaseType } from '../../../../../../../infrastructure/testCase';

/* codePost other imports  */
import { CodeWindow } from '../utils/CodeWindow';
import { CodeSwitcher } from '../utils/CodeSwitcher';
import { TestResult } from '../utils/TestResult';

import { fetchOrCreateBashFile } from '../../testUtils';

const { Sider, Content } = Layout;
const { SubMenu } = Menu;

const { Title } = Typography;

interface ProModeProps {
  currentCategory: TestCategoryType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionType[];
  replaceCategory: (newCategory: TestCategoryType) => void;
  testCases: TestCaseType[];
}

export const ProMode = (props: ProModeProps) => {
  const [currentIndex, setIndex] = useState('bash');
  const [currentFiles, setCurrentFiles] = useState<(SolutionFileType | FileType)[]>(props.solutions);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [submission, setSubmission] = useState<SubmissionType | undefined>(undefined);
  const [bash, setBash] = useState<BashFileType | undefined>();

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
  const onSubmissionFileSave = (newCode: string) => {
    const index = parseInt(currentIndex.split('-')[1], 10);
    const newFile = { ...currentFiles[index] };
    newFile.code = newCode;
    const newFiles = [...currentFiles];
    newFiles.splice(index, 1, newFile);
    setCurrentFiles(newFiles);
    return Promise.resolve();
  };

  const onBashSave = async (newCode: string) => {
    if (bash) {
      const payload = { id: bash.id, code: newCode };
      const newBash = await BashFile.update(payload);
      setBash(newBash);
    }
  };
  /************************** State Change Functions ****************************/

  const runTest = async () => {
    const result = await TestCategory.run({
      id: props.currentCategory.id,
      submission: submission ? submission.id : null,
    });
    setOutputs(result);
  };

  const setCodeFiles = (files: SolutionFileType[] | FileType[], submission: SubmissionType | undefined) => {
    setCurrentFiles(files);
    setSubmission(submission);
  };
  /************************** State Change Functions ****************************/
  const changeIndex = (e: ClickParam) => {
    console.log(e);
    setIndex(e.key);
  };

  /************************** Return helpers ****************************/
  if (!bash) {
    return <Spin />;
  }

  let currentCode;
  let currentName;
  let currentSave;

  if (currentIndex === 'bash') {
    currentCode = bash && bash.code;
    currentName = 'main.sh';
    currentSave = onBashSave;
  } else if (currentIndex.includes('helpers-')) {
    const index = currentIndex.split('-')[1];
    currentCode = props.helpers[parseInt(index, 10)].code;
    currentName = props.helpers[parseInt(index, 10)].name;
    currentSave = undefined;
  } else {
    const index = currentIndex.split('-')[1];
    currentCode = currentFiles[parseInt(index, 10)].code;
    currentName = currentFiles[parseInt(index, 10)].name;
    currentSave = onSubmissionFileSave;
  }

  const helperMenu = (
    <SubMenu key="helpers" title={<div style={{ display: 'flex', alignItems: 'center' }}>helpers &nbsp;</div>}>
      {props.helpers.map((file, index) => {
        return (
          <Menu.Item key={`helpers-${index.toString()}`} style={{ height: 'fit-content', minHeight: 40 }}>
            <div>{file.name}</div>
          </Menu.Item>
        );
      })}
    </SubMenu>
  );

  const currentFileMenu = (
    <SubMenu
      key="files"
      disabled={true}
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          files ({submission ? submission.students : 'Solution Code'})&nbsp;
          <CodeSwitcher solutionFiles={props.solutions} submissions={props.submissions} setFiles={setCodeFiles} />
        </div>
      }
    >
      {currentFiles.map((file, index) => {
        return (
          <Menu.Item key={`files-${index.toString()}`} style={{ height: 'fit-content', minHeight: 40 }}>
            <div>{file.name}</div>
          </Menu.Item>
        );
      })}
    </SubMenu>
  );

  const testCases =
    outputs.length > 0
      ? outputs.map((t) => {
          return <TestCaseItem description={t.description} passed={t.passed} logs={t.log} />;
        })
      : props.testCases.map((t) => {
          return <TestCaseItem description={t.description} />;
        });

  /************************** Return  ****************************/
  return (
    <div
      id="Autograder"
      style={{
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 15px 0px',
        padding: '15px 5px',
        margin: 5,
        width: '95%',
        overflow: 'auto',
        minHeight: 'fit-content',
      }}
    >
      <Layout style={{ maxHeight: 450 }}>
        <Sider theme="light" width={240}>
          <Menu
            selectedKeys={[currentIndex]}
            defaultOpenKeys={['helpers', 'files']}
            mode="inline"
            onClick={changeIndex}
          >
            <Menu.Item key={'bash'} style={{ height: 'fit-content', minHeight: 40 }}>
              <div>{'Main.sh'}</div>
            </Menu.Item>
            {helperMenu}
            {currentFileMenu}
          </Menu>
        </Sider>
        <Content style={{ maxHeight: '70vh', overflow: 'auto', fontSize: 12, marginLeft: 5 }}>
          {currentFiles && <CodeWindow code={currentCode} name={currentName} onSave={currentSave} />}
        </Content>
        <Sider
          theme="light"
          style={{
            borderLeft: '1px #f9f9f9 solid',
          }}
          width={200}
        >
          <div style={{ padding: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button onClick={runTest}>Run main.sh</Button>
            <Divider style={{ marginTop: 15, marginBottom: 15, width: 175 }} />
            {testCases}
          </div>
        </Sider>
      </Layout>
    </div>
  );
};

interface ITestCaseItemProps {
  description: string;
  passed?: boolean;
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
      {props.passed !== undefined && <TestResult log={props.logs || null} passed={props.passed} iconMode={true} />}
    </div>
  );
};

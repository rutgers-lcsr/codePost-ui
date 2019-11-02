/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports  */
import { Button, Layout, Menu, Spin } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports  */
import { TestCategoryType, TestCategory } from '../../../../../../../infrastructure/testCategory';
import { SolutionFileType } from '../../../../../../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../../../../../../infrastructure/submission';
import { FileType } from '../../../../../../../infrastructure/file';
import { HelperFile, HelperFileType } from '../../../../../../../infrastructure/autograder/helperFile';
import { BashFile, BashFileType } from '../../../../../../../infrastructure/autograder/bashFile';

/* codePost other imports  */
import { CodeWindow } from '../utils/CodeWindow';
import { CodeUploader } from '../utils/CodeUploader';
import { CodeSwitcher } from '../utils/CodeSwitcher';
import { TestResult } from '../utils/TestResult';

import { fetchHelperFiles, fetchOrCreateBashFile } from '../../testUtils';

const { Sider, Content } = Layout;
const { SubMenu } = Menu;

interface ProModeProps {
  currentCategory: TestCategoryType;
  solutions: SolutionFileType[];
  addFile: (name: string, code: string) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  updateFile: (id: number, newCode: string) => Promise<void>;
  submissions: SubmissionType[];
  replaceCategory: (newCategory: TestCategoryType) => void;
}

export const ProMode = (props: ProModeProps) => {
  const [currentIndex, setIndex] = useState('bash');
  const [currentFiles, setCurrentFiles] = useState<(SolutionFileType | FileType)[]>(props.solutions);
  const [output, setOutput] = useState('');
  const [helpers, setHelpers] = useState<HelperFileType[]>([]);
  const [bash, setBash] = useState<BashFileType | undefined>();

  /******************************** Set up ****************************/
  useEffect(() => {
    const fetchData = async () => {
      const helperFiles = await fetchHelperFiles(props.currentCategory);
      setHelpers(helperFiles);

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
    const newFiles = currentFiles.splice(index, 1, newFile);
    setCurrentFiles(newFiles);
    return Promise.resolve();
  };

  const onHelperSave = async (newCode: string) => {
    const index = currentIndex.split('-')[1];
    const payload = { id: props.solutions[parseInt(index, 10)].id, code: newCode };
    const newHelper = await HelperFile.update(payload);
    const oldHelpers = helpers.filter((f) => {
      return f.id !== newHelper.id;
    });
    setHelpers([...oldHelpers, newHelper]);
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
    const result = await TestCategory.run({ id: props.currentCategory.id });
    setOutput(JSON.stringify(result));
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

  const outputJSON = output ? JSON.parse(output) : {};
  let currentCode;
  let currentName;
  let currentSave;

  if (currentIndex === 'bash') {
    currentCode = bash && bash.code;
    currentName = 'main.sh';
    currentSave = onBashSave;
  } else if (currentIndex.includes('helpers-')) {
    const index = currentIndex.split('-')[1];
    currentCode = helpers[parseInt(index, 10)].code;
    currentName = helpers[parseInt(index, 10)].name;
    currentSave = onHelperSave;
  } else {
    const index = currentIndex.split('-')[1];
    currentCode = currentFiles[parseInt(index, 10)].code;
    currentName = currentFiles[parseInt(index, 10)].name;
    currentSave = onSubmissionFileSave;
  }

  const helperMenu = (
    <SubMenu
      key="helpers"
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          helpers &nbsp;
          <CodeUploader files={helpers} addFile={props.addFile} deleteFile={props.deleteFile} icon={true} />
        </div>
      }
    >
      {helpers.map((file, index) => {
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
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          files &nbsp;
          <CodeSwitcher solutionFiles={props.solutions} submissions={props.submissions} setFiles={setCurrentFiles} />
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
        <Sider theme="light">
          <Menu selectedKeys={[currentIndex]} openKeys={['helpers', 'files']} mode="inline" onClick={changeIndex}>
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
          style={{ borderLeft: '1px #f9f9f9 solid', padding: 5, display: 'flex', flexDirection: 'column' }}
        >
          <Button style={{ float: 'right' }} onClick={runTest}>
            Run main.sh
          </Button>
          {output && <TestResult log={outputJSON.log} passed={outputJSON.passed} />}
        </Sider>
      </Layout>
    </div>
  );
};

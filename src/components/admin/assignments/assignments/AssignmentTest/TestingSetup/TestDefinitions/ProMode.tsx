/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports  */
import { Button, Layout, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports  */
import { TestCategoryType, TestCategory } from '../../../../../../../infrastructure/testCategory';
import { SolutionFileType } from '../../../../../../../infrastructure/solutionFile';
import { SubmissionType } from '../../../../../../../infrastructure/submission';
import { FileType } from '../../../../../../../infrastructure/file';

/* codePost other imports  */
import { CodeWindow } from '../utils/CodeWindow';
import { CodeUploader } from '../utils/CodeUploader';
import { CodeSwitcher } from '../utils/CodeSwitcher';
import { TestResult } from '../utils/TestResult';

const { Sider, Content } = Layout;
const { SubMenu } = Menu;

interface ProModeProps {
  currentCategory: TestCategoryType;
  files: SolutionFileType[];
  addFile: (file: any) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  updateFile: (id: number, newCode: string) => Promise<void>;
  updateCategory: (id: number, newBash: string) => Promise<void>;
  submissions: SubmissionType[];
}

const separateFiles = (files: SolutionFileType[], thisCategory: TestCategoryType) => {
  const helpers: SolutionFileType[] = [];
  const solutionFiles: SolutionFileType[] = [];

  files.forEach((f) => {
    if (!f.testCategory) {
      solutionFiles.push(f);
    } else if (f.testCategory === thisCategory.id) {
      helpers.push(f);
    }
  });

  return [helpers, solutionFiles];
};

export const ProMode = (props: ProModeProps) => {
  const [currentIndex, setIndex] = useState('bash');
  const [currentFiles, setCurrentFiles] = useState<(SolutionFileType | FileType)[]>([]);
  const [output, setOutput] = useState('');
  const [solutions, setSolutions] = useState<SolutionFileType[]>([]);
  const [helpers, setHelpers] = useState<SolutionFileType[]>([]);

  /******************************** Set up ****************************/
  useEffect(() => {
    const [solutionFiles, helperFiles] = separateFiles(props.files, props.currentCategory);
    setSolutions(solutionFiles);
    setHelpers(helperFiles);
    setCurrentFiles(solutionFiles);
  }, [props.files, props.currentCategory.id]);
  /******************************** API Functions ****************************/
  const onSave = (newCode: string) => {
    const index = currentIndex.split('-')[1];
    return props.updateFile(props.files[parseInt(index, 10)].id, newCode);
  };

  const updateBash = (newBash: string) => {
    return props.updateCategory(props.currentCategory.id, newBash);
  };

  const runTest = async () => {
    const result = await TestCategory.run({ id: props.currentCategory.id });
    setOutput(JSON.stringify(result));
  };
  /************************** State Change Functions ****************************/
  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };

  /************************** Return helpers ****************************/
  const outputJSON = output ? JSON.parse(output) : {};
  let currentFile;
  let currentExtension;
  let currentSave;

  if (currentIndex === 'bash') {
    currentFile = props.currentCategory.bashFile;
    currentExtension = 'sh';
    currentSave = updateBash!;
  } else if (currentIndex.includes('helpers-')) {
    const index = currentIndex.split('-')[1];
    currentFile = helpers[parseInt(index, 10)].code;
    currentExtension = helpers[parseInt(index, 10)].extension;
    currentSave = onSave;
  } else {
    const index = currentIndex.split('-')[1];
    currentFile = currentFiles[parseInt(index, 10)].code;
    currentExtension = currentFiles[parseInt(index, 10)].extension;
    currentSave = (str: string) => {
      return Promise.resolve();
    };
  }

  const helperMenu = (
    <SubMenu
      key="helpers"
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          helpers &nbsp;
          <CodeUploader files={props.files} addFile={props.addFile} deleteFile={props.deleteFile} icon={true} />
        </div>
      }
    >
      {props.files.map((file, index) => {
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
          <CodeSwitcher solutionFiles={props.files} submissions={props.submissions} setFiles={setCurrentFiles} />
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
          {props.files.length > 0 && (
            <CodeWindow code={currentFile} extension={currentExtension} onSave={currentSave} />
          )}
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

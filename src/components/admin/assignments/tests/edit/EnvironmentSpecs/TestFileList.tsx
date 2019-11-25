/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* library imports  */
import { Layout, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports  */
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../../infrastructure/autograder/helperFile';

/* codePost component imports  */
import { CodeWindow } from '../utils/CodeWindow';
import { TestFileUploader } from './TestFileUploader';

/**********************************************************************************************************************/

const { Sider, Content } = Layout;

interface IProps {
  files: SolutionFileType[] | HelperFileType[];
  addFile: (name: string, code: string) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  updateFile: (id: number, newCode: string) => Promise<void>;
  height?: number;
  title: string;
}

export const TestFileList = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [currentIndex, setIndex] = useState('0');

  /******************************** API Functions ****************************/
  const onSave = (newCode: string) => {
    return props.updateFile(props.files[parseInt(currentIndex, 10)].id, newCode);
  };

  /************************** State Change Functions ****************************/
  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };
  const menuItems = props.files.map((file, index) => {
    return (
      <Menu.Item key={index.toString()} style={{ height: 'fit-content', minHeight: 40 }}>
        <div>{file.name}</div>
      </Menu.Item>
    );
  });
  /***************************** Return ****************************************/
  if (props.files.length === 0) {
    return (
      <TestFileUploader title={props.title} files={props.files} addFile={props.addFile} deleteFile={props.deleteFile} />
    );
  } else {
    return (
      <div>
        <Layout style={{ height: props.height ? props.height : 650 }}>
          <Sider theme="light">
            <Menu selectedKeys={[currentIndex]} openKeys={['helpers']} mode="inline" onClick={changeIndex}>
              {menuItems}
            </Menu>
            <TestFileUploader
              files={props.files}
              addFile={props.addFile}
              deleteFile={props.deleteFile}
              title={props.title}
            />
          </Sider>
          <Content style={{ maxHeight: '70vh', overflow: 'auto', fontSize: 12 }}>
            {props.files.length === 0 ? (
              <div />
            ) : (
              <div style={{ position: 'relative', marginLeft: 5 }}>
                <CodeWindow
                  code={props.files[parseInt(currentIndex, 10)].code}
                  name={props.files[parseInt(currentIndex, 10)].name}
                  onSave={onSave}
                />
              </div>
            )}
          </Content>
        </Layout>
      </div>
    );
  }
};

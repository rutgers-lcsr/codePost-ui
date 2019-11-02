/* react imports */
import React, { useState } from 'react';

/* library imports  */
import { Layout, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports  */
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';

/* codePost other imports  */
import { CodeWindow } from './utils/CodeWindow';
import { CodeUploader } from './utils/CodeUploader';

const { Sider, Content } = Layout;

interface IProps {
  files: SolutionFileType[];
  addFile: (name: string, code: string) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  updateFile: (id: number, newCode: string) => Promise<void>;
}

export const SolutionCode = (props: IProps) => {
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
  return (
    <div>
      <Layout style={{ maxHeight: 450 }}>
        <Sider theme="light">
          <Menu selectedKeys={[currentIndex]} openKeys={['helpers']} mode="inline" onClick={changeIndex}>
            {menuItems}
          </Menu>
          <CodeUploader files={props.files} addFile={props.addFile} deleteFile={props.deleteFile} />
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
};

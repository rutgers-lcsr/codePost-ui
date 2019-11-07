import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import { CodeWindow } from '../utils/CodeWindow';

const { SubMenu } = Menu;
const { Sider, Content } = Layout;

interface BasicFile {
  code: string;
  name: string;
  title?: React.ReactElement;
  canSave: boolean;
}

interface FileGroup {
  subMenuTitle?: React.ReactNode;
  files: BasicFile[];
  onSave?: (index: number, code: string) => Promise<void>;
  isDisabled: boolean;
}

interface IProps {
  groups: FileGroup[];
}

export const CodeIDE = (props: IProps) => {
  const [index, setIndex] = useState('0-0');

  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };

  const groupElems = props.groups.map((group, groupIndex) => {
    const items = group.files.map((file, fileIndex) => {
      return (
        <Menu.Item key={`${groupIndex}-${fileIndex}`} style={{ height: 'fit-content', minHeight: 40 }}>
          <div>{file.title || file.name}</div>
        </Menu.Item>
      );
    });
    if (!group.subMenuTitle) {
      return items;
    }

    return (
      <SubMenu key={`${groupIndex}`} disabled={group.isDisabled} title={group.subMenuTitle}>
        {items}
      </SubMenu>
    );
  });

  const currentGroupIndex = parseInt(index.split('-')[0], 10);
  const currentFileIndex = parseInt(index.split('-')[1], 10);

  const currentGroup = props.groups[currentGroupIndex];
  const currentFile = currentGroup.files[currentFileIndex];

  const defaultOpenKeys = props.groups.map((group, groupIndex) => {
    return group.subMenuTitle ? groupIndex.toString() : '';
  });

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
      <Layout style={{ height: 650 }}>
        <Sider theme="light" width={240}>
          <Menu selectedKeys={[index]} defaultOpenKeys={defaultOpenKeys} mode="inline" onClick={changeIndex}>
            {groupElems}
          </Menu>
        </Sider>
        <Content style={{ fontSize: 12, marginLeft: 5 }}>
          <CodeWindow
            code={currentFile.code}
            name={currentFile.name}
            onSave={
              currentFile.canSave && currentGroup.onSave ? currentGroup.onSave.bind({}, currentFileIndex) : undefined
            }
          />
        </Content>
      </Layout>
    </div>
  );
};

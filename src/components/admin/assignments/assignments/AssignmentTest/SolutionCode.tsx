/* react imports */
import React, { useEffect, useState } from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Layout, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import { AssignmentType } from '../../../../../infrastructure/assignment';

import { File } from '../../../../../infrastructure/file';

import { SolutionFileType } from '../../../../../infrastructure/solutionFile';

const { Sider, Content } = Layout;

interface IProps {
  assignment: AssignmentType;
  files: SolutionFileType[];
}

export const SolutionCode = (props: IProps) => {
  const [currentIndex, setIndex] = useState('0');

  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };

  return (
    <div>
      <Layout>
        <Sider theme="light">
          <Menu selectedKeys={[currentIndex]} mode="inline" onClick={changeIndex}>
            {props.files.map((file, index) => {
              const pathName = `${file.path ? `${file.path}/` : ''}`;
              return (
                <Menu.Item key={index.toString()} style={{ height: 'fit-content', minHeight: 40 }}>
                  <div style={{ lineHeight: pathName ? 1.5 : 3, marginTop: 4 }}>
                    <div style={{ fontSize: 10, fontStyle: 'italic', whiteSpace: 'normal' }}>{pathName}</div>
                    <div>{file.name}</div>
                  </div>
                </Menu.Item>
              );
            })}
          </Menu>
        </Sider>
        <Content style={{ maxHeight: '70vh', overflow: 'auto' }}>
          <SyntaxHighlighter
            language={File.language2(props.files[parseInt(currentIndex, 10)].extension)}
            style={googlecode}
            showLineNumbers={true}
            wrapLines={true}
          >
            {props.files[parseInt(currentIndex, 10)].code}
          </SyntaxHighlighter>
        </Content>
      </Layout>
    </div>
  );
};

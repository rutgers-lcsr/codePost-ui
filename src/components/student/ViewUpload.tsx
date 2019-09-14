/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Button, Layout, Menu, Modal, Spin } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import { AssignmentStudent, AssignmentType } from '../../infrastructure/assignment';
import { File } from '../../infrastructure/file';

const { Sider, Content } = Layout;

interface IProps {
  isVisible: boolean;
  assignment?: AssignmentType;
  onCancel: () => void;
}

function ViewUpload(props: IProps) {
  const [currentIndex, setIndex] = useState('0');
  const [files, setFiles] = useState<any[]>([]);
  const [loadComplete, setLoadComplete] = useState(false);

  const fetchUpload = async () => {
    if (props.assignment) {
      const data = await AssignmentStudent.readStudentUpload(props.assignment.id);
      setFiles(data.files);
      setLoadComplete(true);
    } else {
      // Reset state variables if passed an undefined submission
      setFiles([]);
      setIndex('0');
      setLoadComplete(true);
    }
  };

  useEffect(() => {
    fetchUpload();
  }, [props.assignment]);

  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };

  const cancel = (
    <Button key="back" onClick={props.onCancel}>
      Cancel
    </Button>
  );

  return (
    <Modal visible={props.isVisible} title="Submitted Files" onCancel={props.onCancel} footer={[cancel]} width={1100}>
      {!loadComplete ? (
        <Spin />
      ) : files.length === 0 ? (
        <div>No files for this submission</div>
      ) : (
        <div>
          <Layout>
            <Sider theme="light">
              <Menu selectedKeys={[currentIndex]} mode="inline" onClick={changeIndex}>
                {files.map((file, index) => {
                  return <Menu.Item key={index.toString()}>{file.name}</Menu.Item>;
                })}
              </Menu>
            </Sider>
            <Content style={{ maxHeight: '70vh', overflow: 'auto' }}>
              <SyntaxHighlighter
                language={File.language(files[parseInt(currentIndex, 10)])}
                style={googlecode}
                showLineNumbers={true}
                wrapLines={true}
              >
                {files[parseInt(currentIndex, 10)].code}
              </SyntaxHighlighter>
            </Content>
          </Layout>
        </div>
      )}
    </Modal>
  );
}

export default ViewUpload;

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { Button, Layout, Menu, Modal, Spin } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import { AssignmentStudent, AssignmentStudentType } from '../../infrastructure/assignment';
import { File } from '../../infrastructure/file';

import ReactMarkdown from 'react-markdown';

const { Sider, Content } = Layout;

interface IProps {
  isVisible: boolean;
  assignment?: AssignmentStudentType;
  onCancel: () => void;
}

function ViewUpload(props: IProps) {
  const [currentIndex, setIndex] = useState('0');
  const [files, setFiles] = useState<any[]>([]);
  const [loadComplete, setLoadComplete] = useState(false);

  const fetchUpload = async () => {
    if (props.assignment && props.isVisible) {
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
    // Should implement useCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.assignment, props.isVisible]);

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
              {File.codeType(files[parseInt(currentIndex, 10)]) === 'image' ? (
                <ReactMarkdown>{'![](' + files[parseInt(currentIndex, 10)].code + ')'}</ReactMarkdown>
              ) : (
                <SyntaxHighlighter
                  language={File.language(files[parseInt(currentIndex, 10)])}
                  style={googlecode}
                  showLineNumbers={true}
                  wrapLines={true}
                >
                  {files[parseInt(currentIndex, 10)].code}
                </SyntaxHighlighter>
              )}
            </Content>
          </Layout>
        </div>
      )}
    </Modal>
  );
}

export default ViewUpload;

import { Button, Modal, Tabs } from 'antd';

import { FileTemplateType } from '../../infrastructure/types';

import Editor from '@monaco-editor/react';

interface IProps {
  // files: FileType[] | FileTemplateType[];
  files: FileTemplateType[];
  visible: boolean;
  toggleVisible: () => void;
}

const FileExplorer = (props: IProps) => {
  return (
    <Modal
      open={props.visible}
      closable={true}
      width={'90%'}
      onCancel={props.toggleVisible}
      footer={[
        <Button key="close" onClick={props.toggleVisible}>
          Close
        </Button>,
      ]}
    >
      <div id="file-explorer">
        <Tabs defaultActiveKey="1" tabPosition="left">
          {props.files.map((file: FileTemplateType) => {
            return (
              <Tabs.TabPane tab={file.name} key={`file-${file.id}`}>
                {/* <CodeMirror
                  key={`codeMirror-${file.id}`}
                  value={file.code}
                  options={{
                    lineNumbers: true,
                    lineWrapping: true,
                    mode: 'txt',
                    theme: 'neo',
                    styleActiveLine: { nonEmpty: true },
                    readOnly: true,
                  }}
                /> */}
                <Editor
                  height="80vh"
                  defaultValue={file.code}
                  theme="vs-dark"
                  options={{ readOnly: true, minimap: { enabled: false } }}
                />
              </Tabs.TabPane>
            );
          })}
        </Tabs>
      </div>
    </Modal>
  );
};

export default FileExplorer;

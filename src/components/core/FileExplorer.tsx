import { Button, Modal, Tabs } from 'antd';

import { FileTemplateType } from '../../infrastructure/types';

import { UnControlled as CodeMirror } from 'react-codemirror2';

interface IProps {
  // files: FileType[] | FileTemplateType[];
  files: FileTemplateType[];
  visible: boolean;
  toggleVisible: () => void;
}

const FileExplorer = (props: IProps) => {
  return (
    <Modal
      visible={props.visible}
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
                <CodeMirror
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

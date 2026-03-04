// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Button, Modal, Tabs } from 'antd';

import { AssignmentFileType } from '../../types/models';

import Editor from '@monaco-editor/react';

interface IProps {
  // files: FileType[] | FileTemplateType[];
  files: AssignmentFileType[];
  open: boolean;
  toggleVisible: () => void;
}

const FileExplorer = (props: IProps) => {
  return (
    <Modal
      open={props.open}
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
        <Tabs
          defaultActiveKey="1"
          tabPosition="left"
          items={props.files.map((file: AssignmentFileType) => ({
            key: `file-${file.id}`,
            label: file.name,
            children: (
              <Editor
                height="80vh"
                defaultValue={file.data ?? ''}
                theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false } }}
              />
            ),
          }))}
        />
      </div>
    </Modal>
  );
};

export default FileExplorer;

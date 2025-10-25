import React from 'react';

import { Button, Modal, Tabs } from 'antd';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';

/* codePost imports */

interface IRegradeInstructionsModalProps {
  visible: boolean;
  instructions: string;
  cancel: any;
  save: any;
}

const RegradeInstructionsModal = (props: IRegradeInstructionsModalProps) => {
  const [instructions, setInstructions] = React.useState(props.instructions);

  const onChange = (value: string | undefined) => {
    setInstructions(value || '');
  };

  const onSave = () => {
    props.save(instructions);
  };

  const cancelButton = (
    <Button type="default" onClick={props.cancel}>
      Cancel
    </Button>
  );

  const saveButton = (
    <Button type="primary" onClick={onSave}>
      Save
    </Button>
  );

  return (
    <Modal
      onCancel={props.cancel}
      open={props.visible}
      title="Student Instructions for Regrade Requests"
      footer={[cancelButton, saveButton]}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane key="1" tab="Write">
          <Editor
            height="500px"
            language="markdown"
            value={instructions}
            onChange={onChange}
            options={{
              minimap: { enabled: false },
            }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="2" tab="Preview">
          <ReactMarkdown>{instructions}</ReactMarkdown>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default RegradeInstructionsModal;

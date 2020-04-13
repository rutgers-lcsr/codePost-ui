import React from 'react';

import { Button, Input, Modal, Tabs } from 'antd';
import ReactMarkdown from 'react-markdown';

/* codePost imports */

interface IRegradeInstructionsModalProps {
  visible: boolean;
  instructions: string;
  cancel: any;
  save: any;
}

const RegradeInstructionsModal = (props: IRegradeInstructionsModalProps) => {
  const [instructions, setInstructions] = React.useState(props.instructions);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstructions(event.target.value);
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
      visible={props.visible}
      title="Student Instructions for Regrade Requests"
      footer={[cancelButton, saveButton]}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane key="1" tab="Write">
          <Input.TextArea value={instructions} onChange={onChange} autoSize={{ minRows: 10, maxRows: 16 }} />
        </Tabs.TabPane>
        <Tabs.TabPane key="2" tab="Preview">
          <ReactMarkdown>{instructions}</ReactMarkdown>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default RegradeInstructionsModal;

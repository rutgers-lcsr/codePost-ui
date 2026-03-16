// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';

import { Button, Modal, Tabs } from 'antd';
import ReactMarkdown from 'react-markdown';
import Editor from '@monaco-editor/react';

/* codePost imports */

interface IRegradeInstructionsModalProps {
  open: boolean;
  instructions: string;
  cancel: () => void;
  save: (instructions: string) => void;
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
      open={props.open}
      title="Student Instructions for Regrade Requests"
      footer={[cancelButton, saveButton]}
    >
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Write',
            children: (
              <Editor
                height="500px"
                language="markdown"
                value={instructions}
                onChange={onChange}
                options={{
                  minimap: { enabled: false },
                }}
              />
            ),
          },
          {
            key: '2',
            label: 'Preview',
            children: <ReactMarkdown>{instructions}</ReactMarkdown>,
          },
        ]}
      />
    </Modal>
  );
};

export default RegradeInstructionsModal;

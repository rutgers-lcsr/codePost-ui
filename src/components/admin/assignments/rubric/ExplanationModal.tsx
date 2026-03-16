// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { Modal, Input, Tabs } from 'antd';

import ReactMarkdown from 'react-markdown';

interface IProps {
  title: string;
  startText: string;
  onCancel: () => void;
  onSave: (draft?: string) => void;
  extra?: React.ReactElement;
}

const ExplanationModal = (props: IProps) => {
  const [draft, setDraft] = React.useState(props.startText);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
  };

  const onSave = () => {
    props.onSave(draft);
  };

  return (
    <Modal open={true} okText="Save" title={props.title} onCancel={props.onCancel} onOk={onSave}>
      {props.extra}
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Edit',
            children: (
              <Input.TextArea
                defaultValue={draft}
                onChange={onChange}
                placeholder="Use this space to write an explanation for students (Markdown)"
                autoSize={{ minRows: 10, maxRows: 12 }}
              />
            ),
          },
          {
            key: '2',
            label: 'Preview',
            children: <ReactMarkdown>{draft}</ReactMarkdown>,
          },
        ]}
      />
    </Modal>
  );
};

export default ExplanationModal;

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

  const onChange = (event: any) => {
    setDraft(event.target.value);
  };

  const onSave = () => {
    props.onSave(draft);
  };

  return (
    <Modal open={true} okText="Save" title={props.title} onCancel={props.onCancel} onOk={onSave}>
      {props.extra}
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane key="1" tab="Edit">
          <Input.TextArea
            defaultValue={draft}
            onChange={onChange}
            placeholder="Use this space to write an explanation for students (Markdown)"
            autoSize={{ minRows: 10, maxRows: 12 }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="2" tab="Preview">
          <ReactMarkdown>{draft}</ReactMarkdown>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default ExplanationModal;

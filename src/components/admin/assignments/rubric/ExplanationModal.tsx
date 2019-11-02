import * as React from 'react';

import { Modal, Input, Tabs } from 'antd';

import { RubricCommentType } from '../../../../infrastructure/rubricComment';

import ReactMarkdown from 'react-markdown';

interface IProps {
  rubricComment: RubricCommentType;
  onCancel: () => void;
}

const ExplanationModal = (props: IProps) => {
  const [draft, setDraft] = React.useState(props.rubricComment.explanation);

  const onChange = (event: any) => {
    setDraft(event.target.value);
  };

  return (
    <Modal visible={true} okText="Save" title={props.rubricComment.text} onCancel={props.onCancel}>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane key="1" tab="Edit">
          <Input.TextArea defaultValue={draft} onChange={onChange} />
        </Tabs.TabPane>
        <Tabs.TabPane key="2" tab="Preview">
          <ReactMarkdown>{draft}</ReactMarkdown>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default ExplanationModal;

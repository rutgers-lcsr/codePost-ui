// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import React from 'react';

/* ant imports */
import { Input, Modal, Select } from 'antd';

/* codePost imports */
import { rubricCommentsApi } from '../../../api-client/clients';
import { RubricCategory } from '../../../api-client';

export interface IProps {
  initialText: string;
  initialPointDelta: number;
  rubricCategories: RubricCategory[];
  open: boolean;
  onCancel: () => void;
}

const CommentToRubric = (props: IProps) => {
  const [text, setText] = React.useState(props.initialText);
  const [category, setCategory] = React.useState<undefined | number>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);

  const makeRubricComment = async () => {
    setIsLoading(true);
    await rubricCommentsApi.create({
      rubricComment: {
        text,
        category: category!,
        pointDelta: props.initialPointDelta,
        explanation: '',
        instructionText: '',
        sortKey: 0,
        templateTextOn: false,
      },
    });
    setIsLoading(false);
    props.onCancel();
  };

  const onChange = (e: number) => {
    setCategory(e);
  };

  return (
    <Modal
      open={props.open}
      title="Create a rubric comment"
      onCancel={props.onCancel}
      onOk={makeRubricComment}
      okButtonProps={{ disabled: category === undefined, loading: isLoading }}
    >
      <Input.TextArea
        defaultValue={props.initialText}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
      />
      <br />
      <br />
      Category:{' '}
      <Select style={{ width: '300px' }} onChange={onChange}>
        {props.rubricCategories.map((el) => (
          <Select.Option key={el.id} value={el.id}>
            {el.name}
          </Select.Option>
        ))}
      </Select>
    </Modal>
  );
};

export default CommentToRubric;

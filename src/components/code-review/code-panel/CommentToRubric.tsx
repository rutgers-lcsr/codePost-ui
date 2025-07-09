/* react imports */
import React from 'react';

/* ant imports */
import { Modal, Input, Select } from 'antd';

/* codePost imports */
import { RubricCategoryType } from '../../../infrastructure/types';
import { RubricComment } from '../../../infrastructure/rubricComment';

export interface IProps {
  initialText: string;
  initialPointDelta: number;
  rubricCategories: RubricCategoryType[];
  visible: boolean;
  onCancel: () => void;
}

const CommentToRubric = (props: IProps) => {
  const [text, setText] = React.useState(props.initialText);
  const [category, setCategory] = React.useState<undefined | number>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);

  const makeRubricComment = async () => {
    setIsLoading(true);
    await RubricComment.create({
      id: -1,
      text,
      category: category!,
      pointDelta: props.initialPointDelta,
    });
    setIsLoading(false);
    props.onCancel();
  };

  const onChange = (e: any) => {
    setCategory(e);
  };

  return (
    <Modal
      visible={props.visible}
      title="Create a rubric comment"
      onCancel={props.onCancel}
      onOk={makeRubricComment}
      okButtonProps={{ disabled: category === undefined, loading: isLoading }}
    >
      <Input.TextArea defaultValue={props.initialText} onChange={(e: any) => setText(e.target.value)} />
      <br />
      <br />
      Category:{' '}
      <Select style={{ width: '300px' }} onChange={onChange}>
        {props.rubricCategories.map((el) => (
          <Select.Option value={el.id}>{el.name}</Select.Option>
        ))}
      </Select>
    </Modal>
  );
};

export default CommentToRubric;

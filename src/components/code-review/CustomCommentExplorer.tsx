/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Button, Modal, Table, Select, Divider } from 'antd';

/* codepost imports */
import { AssignmentType, CommentType, RubricCommentType, SubmissionType } from '../../infrastructure/types';
import { Assignment } from '../../infrastructure/assignment';
import { CommentIO } from '../../infrastructure/comment';

/**********************************************************************************************************************/

interface IProps {
  user: string;
  isAdmin: boolean;
  graders: string[];
  assignment: AssignmentType;
  rubricComments: RubricCommentType[];
  visible: boolean;
  onCancel: () => void;
}

const CustomCommentExplorer = (props: IProps) => {
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [grader, setGrader] = React.useState(props.isAdmin ? '' : props.user);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [activeRubricComment, setActiveRubricComment] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  const updateComments = () => {
    if (props.isAdmin) {
      Assignment.readComments(props.assignment.id).then((newComments) => {
        setComments(newComments);
        setLoading(false);
      });
    } else {
      Assignment.readComments(props.assignment.id, { author: props.user }).then((newComments) => {
        setComments(newComments);
        setLoading(false);
      });
    }
  };

  // load comments
  React.useEffect(() => {
    updateComments();
  }, []);

  // create table
  const columns = [
    {
      title: 'Grader',
      dataIndex: 'grader',
      key: 'grader',
      sorter: (a: any, b: any) => a.grader.localeCompare(b.grader),
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
    },
  ];

  const data = comments
    .filter((c) => !c.rubricComment && (grader === '' || grader === c.author))
    .map((c) => {
      return {
        grader: c.author,
        text: c.text,
        key: c.id,
      };
    });

  // handle selection
  const rowSelection = {
    onChange: (selectedRowKeys: any[]) => {
      setSelected(selectedRowKeys);
    },
    selectedRowKeys: selected,
  };

  // update comments
  const onApply = () => {
    setLoading(true);
    const promises = selected.map((id) => {
      return CommentIO.update({ id: parseInt(id), rubricComment: parseInt(activeRubricComment) });
    });

    Promise.all(promises).then(() => {
      updateComments();
      setSelected([]);
    });
  };

  // close and clear
  const onCancel = () => {
    props.onCancel();
    setSelected([]);
    setActiveRubricComment('');
  };

  return (
    <Modal
      onCancel={onCancel}
      visible={props.visible}
      width={900}
      title="Custom comment explorer"
      footer={[<Button onClick={onCancel}>Close</Button>]}
    >
      {props.isAdmin && (
        <div>
          Grader:{' '}
          <Select style={{ width: 200 }} onChange={setGrader} defaultValue={grader} disabled={loading}>
            {props.graders.map((el) => (
              <Select.Option value={el}>{el}</Select.Option>
            ))}
          </Select>
          <br />
          <br />
        </div>
      )}
      Rubric comment:{' '}
      <Select style={{ width: 600 }} onChange={setActiveRubricComment}>
        {props.rubricComments.map((el) => (
          <Select.Option value={el.id}>{el.text}</Select.Option>
        ))}
      </Select>
      &nbsp;
      <Button
        disabled={selected.length === 0 || activeRubricComment === '' || loading}
        type="primary"
        onClick={onApply}
        loading={loading}
      >
        Apply
      </Button>
      <Divider />
      <Table
        dataSource={data}
        columns={columns}
        rowSelection={rowSelection}
        pagination={data.length < 10 ? false : undefined}
        loading={loading}
      />
    </Modal>
  );
};

export default CustomCommentExplorer;

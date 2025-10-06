/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Button, Divider, Input, Modal, Select, Table } from 'antd';

/* codepost imports */
import { Assignment } from '../../infrastructure/assignment';
import { CommentIO } from '../../infrastructure/comment';
import { File } from '../../infrastructure/file';
import { AssignmentType, CommentType, RubricCategoryType, RubricCommentType } from '../../infrastructure/types';

/**********************************************************************************************************************/

interface IProps {
  user: string;
  isAdmin: boolean;
  graders: string[];
  assignment: AssignmentType;
  rubricComments: RubricCommentType[];
  rubricCategories: RubricCategoryType[];
  visible: boolean;
  onCancel: () => void;
}

const CustomCommentExplorer = (props: IProps) => {
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [grader, setGrader] = React.useState(props.isAdmin ? '' : props.user);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [activeRubricComment, setActiveRubricComment] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');

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
      sorter: (a: any, b: any) => a.text.localeCompare(b.text),
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      align: 'center' as const,
    },
  ];

  const data = comments
    .filter((c) => !c.rubricComment && (grader === '' || grader === c.author))
    .filter((c) => (searchText === '' ? true : c.text && c.text.toUpperCase().includes(searchText.toUpperCase())))
    .map((c) => {
      return {
        grader: c.author,
        text: c.text,
        key: c.id,
        link: (
          <Button
            onClick={async () => {
              const file = await File.read(c.file);
              const link = `/code/${file.submission}/?comment=${c.id}`;
              window.open(link, '_blank');
            }}
          >
            Goto
          </Button>
        ),
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
      open={props.visible}
      width={900}
      title="Custom comment explorer"
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
      ]}
    >
      {props.isAdmin && (
        <div>
          Grader:{' '}
          <Select style={{ width: 200 }} onChange={setGrader} defaultValue={grader} disabled={loading}>
            {props.graders.map((el) => (
              <Select.Option key={el} value={el}>
                {el}
              </Select.Option>
            ))}
          </Select>
          <br />
          <br />
        </div>
      )}
      Rubric comment:{' '}
      <Select style={{ width: 600 }} onSelect={(_, b) => setActiveRubricComment(b.key as string)} showSearch={true}>
        {props.rubricComments.map((el) => (
          <Select.Option value={el.text} key={el.id}>
            [{props.rubricCategories.find((cat) => cat.id === el.category)!.name}] {el.text}
          </Select.Option>
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
      <Input.Search onChange={(e: any) => setSearchText(e.target.value)} placeholder="Search for comment text" />
      <br />
      <br />
      <Table
        dataSource={data}
        columns={columns}
        rowSelection={rowSelection}
        pagination={
          data.length < 10
            ? false
            : {
                showSizeChanger: true,
                pageSizeOptions: ['10', '50', '100'],
              }
        }
        loading={loading}
      />
    </Modal>
  );
};

export default CustomCommentExplorer;

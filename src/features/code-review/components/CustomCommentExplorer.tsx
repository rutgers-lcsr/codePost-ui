// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Button, Divider, Input, Modal, Select, Table } from 'antd';

/* codepost imports */
import { assignmentsApi, commentsApi, filesApi } from '../../../api-client/clients';
import { CommentType } from '../../../utils/comments';
import { AssignmentType, RubricCategoryType, RubricCommentType } from '../../../types/models';
import { useCourseCapabilities } from '../../../stores/usePermissionsStore';

/**********************************************************************************************************************/

interface IProps {
  user: string;
  isAdmin: boolean;
  graders: string[];
  assignment: AssignmentType;
  rubricComments: RubricCommentType[];
  rubricCategories: RubricCategoryType[];
  open: boolean;
  onCancel: () => void;
}

interface CommentRow {
  grader: string;
  text: string;
  key: number;
  link: React.ReactNode;
}

const CustomCommentExplorer = (props: IProps) => {
  const courseCaps = useCourseCapabilities(props.assignment.course);
  const canViewAllGraders = !!courseCaps.view_roster;
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [grader, setGrader] = React.useState(canViewAllGraders ? '' : props.user);
  const [selected, setSelected] = React.useState<React.Key[]>([]);
  const [activeRubricComment, setActiveRubricComment] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');

  const updateComments = React.useCallback(() => {
    assignmentsApi
      .commentsList({ id: props.assignment.id })
      .then((newComments) => {
        setComments(newComments as CommentType[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [props.assignment.id]);

  // load comments
  React.useEffect(() => {
    updateComments();
  }, [updateComments]);

  // create table
  const columns = [
    {
      title: 'Grader',
      dataIndex: 'grader',
      key: 'grader',
      sorter: (a: CommentRow, b: CommentRow) => a.grader.localeCompare(b.grader),
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
      sorter: (a: CommentRow, b: CommentRow) => a.text.localeCompare(b.text),
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      align: 'center' as const,
    },
  ];

  const data: CommentRow[] = comments
    .filter((c) => !c.rubricComment && (grader === '' || grader === c.author))
    .filter((c) => (searchText === '' ? true : c.text && c.text.toUpperCase().includes(searchText.toUpperCase())))
    .map((c) => {
      return {
        grader: c.author ?? '',
        text: c.text ?? '',
        key: c.id,
        link: (
          <Button
            onClick={async () => {
              const file = await filesApi.retrieve({ id: c.file });
              const submissionId = (file as { submission?: number }).submission;
              const link = `/code/${submissionId}/?comment=${c.id}`;
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
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelected(selectedRowKeys);
    },
    selectedRowKeys: selected,
  };

  // update comments
  const onApply = () => {
    setLoading(true);
    const promises = selected.map((id) => {
      return commentsApi.partialUpdate({
        id: parseInt(String(id)),
        patchedComment: { rubricComment: parseInt(activeRubricComment) },
      });
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
      open={props.open}
      width={900}
      title="Custom comment explorer"
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>,
      ]}
    >
      {canViewAllGraders && (
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
      <Input.Search
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
        placeholder="Search for comment text"
      />
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

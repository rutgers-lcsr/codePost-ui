// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { EyeOutlined, PushpinFilled, PushpinOutlined, UserOutlined } from '@ant-design/icons';

import { Badge, Button, Modal, Space, Table, Tag, Typography } from 'antd';

import { openSubmission } from '../../other/AdminUtils';

import { RubricComment } from '../../../../api-client';
import { commentsApi, rubricCommentsApi, submissionFilesApi, submissionsApi } from '../../../../api-client/clients';
import { CommentType, SubmissionInfoType } from '../../../../types/models';
import { RubricCommentInstanceList } from '../../../../types/rubric';

import CPTooltip from '../../../../components/core/CPTooltip';

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const COLUMN_ALIGNMENT: 'center' | 'right' | 'left' = 'center';

// Design Constants
const HEADER_BG = '#fafafa';
const CUSTOM_TEXT_COLOR = '#52c41a';
const MODAL_WIDTH = 900;

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

interface IProps {
  rubricComment: RubricComment;
  closeCommentExplorer: () => void;
  isVisible: boolean;
  submissions: SubmissionInfoType[];
}

interface CommentToSubMap {
  [commentID: number]: {
    submission: number;
    fileName: string;
    students: string[];
  };
}

/**********************************************************************************************************************/
/* Helper Functions
/**********************************************************************************************************************/

const readComments = async (rubricComment: RubricComment): Promise<CommentType[]> => {
  const response = await rubricCommentsApi.retrieve({ id: rubricComment.id });
  // Cast to custom type or use generated type if available
  const linkedComments = response as unknown as RubricCommentInstanceList;

  return Promise.all(linkedComments.comments.map((id) => commentsApi.retrieve({ id })));
};

const getSubmissions = async (comments: CommentType[]): Promise<CommentToSubMap> => {
  const data = await Promise.all(
    comments.map(async (comm) => {
      try {
        const fileID = comm.file;
        const file = await submissionFilesApi.retrieve({ id: fileID });
        if (!file) return null;

        const sub = await submissionsApi.retrieve({ id: file.submission });
        if (!sub) return null;

        return [comm.id, file.name, file.submission, sub.students || []];
      } catch (error) {
        console.error(`Error reading file/submission for comment ${comm.id}:`, error);
        return null;
      }
    }),
  );

  const commentToSubMap: CommentToSubMap = {};
  data.forEach((el) => {
    if (el === null) return;
    commentToSubMap[el[0] as number] = {
      fileName: el[1] as string,
      submission: el[2] as number,
      students: el[3] as string[],
    };
  });
  return commentToSubMap;
};

/**********************************************************************************************************************/
/* Component
/**********************************************************************************************************************/

const RubricCommentExplorer: React.FC<IProps> = ({ rubricComment, closeCommentExplorer, isVisible }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentToSubMap, setCommentToSubMap] = useState<CommentToSubMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState after async API fetch
    setIsLoading(true);
    readComments(rubricComment)
      .then((comments) => {
        console.log('Loaded comments for rubric comment explorer:', comments);
        return getSubmissions(comments).then((map) => {
          setComments(comments);
          setCommentToSubMap(map);
          setIsLoading(false);
        });
      })
      .catch((error) => {
        console.error('Error loading rubric comment instances:', error);
        setIsLoading(false);
      });
  }, [rubricComment, isVisible]);

  const handleOpenSubmission = useCallback((submissionId: number) => {
    openSubmission(submissionId);
  }, []);

  // Enhanced column definitions with better styling
  const columns = useMemo(
    () => [
      {
        title: <span style={{ fontWeight: 600 }}>Students</span>,
        dataIndex: 'students',
        key: 'students',
        render: (students: string) => (
          <Space>
            <UserOutlined style={{ color: '#8c8c8c' }} />
            <span>{students || 'Unknown'}</span>
          </Space>
        ),
      },
      {
        title: <span style={{ fontWeight: 600 }}>File</span>,
        dataIndex: 'file',
        key: 'file',
        align: COLUMN_ALIGNMENT,
        render: (fileName: string) => (
          <Tag color="blue" style={{ fontFamily: 'monospace' }}>
            {fileName}
          </Tag>
        ),
      },
      {
        title: <span style={{ fontWeight: 600 }}>Author</span>,
        dataIndex: 'author',
        key: 'author',
        align: COLUMN_ALIGNMENT,
        render: (author: string) => <span style={{ color: '#595959' }}>{author || 'N/A'}</span>,
      },
      {
        title: <span style={{ fontWeight: 600 }}>Custom Text</span>,
        dataIndex: 'text',
        key: 'text',
        align: COLUMN_ALIGNMENT,
      },
      {
        title: <span style={{ fontWeight: 600 }}>Action</span>,
        dataIndex: 'open',
        key: 'open',
        align: COLUMN_ALIGNMENT,
        width: 100,
      },
    ],
    [],
  );

  // Build table data with enhanced styling
  const data = useMemo(
    () =>
      comments
        .map((comment) => {
          const subInfo = commentToSubMap[comment.id];
          if (!subInfo) return null;

          return {
            key: comment.id,
            students: subInfo.students.join(', '),
            file: subInfo.fileName,
            author: comment.author,
            text:
              !comment.text || comment.text.length === 0 ? (
                <CPTooltip title="No custom text (using rubric comment text)">
                  <PushpinOutlined style={{ fontSize: '16px', color: '#bfbfbf' }} />
                </CPTooltip>
              ) : (
                <CPTooltip title={comment.text}>
                  <Badge dot color={CUSTOM_TEXT_COLOR}>
                    <PushpinFilled style={{ fontSize: '16px', color: CUSTOM_TEXT_COLOR }} />
                  </Badge>
                </CPTooltip>
              ),
            open: (
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handleOpenSubmission(subInfo.submission)}
                size="small"
              >
                View
              </Button>
            ),
          };
        })
        .filter(Boolean),
    [comments, commentToSubMap, handleOpenSubmission],
  );

  // Enhanced modal header
  const headerStyle = useMemo(
    () => ({
      background: HEADER_BG,
      padding: '16px 24px',
      borderBottom: '1px solid #f0f0f0',
      marginBottom: '16px',
    }),
    [],
  );

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      open={true}
      title={<div style={{ fontSize: '18px', fontWeight: 600 }}>Rubric Comment Instances</div>}
      width={MODAL_WIDTH}
      onCancel={closeCommentExplorer}
      footer={[
        <div key="footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8c8c8c' }}>
            {comments.length} instance{comments.length !== 1 ? 's' : ''} found
          </span>
          <Button type="primary" onClick={closeCommentExplorer}>
            Close
          </Button>
        </div>,
      ]}
    >
      <div style={headerStyle}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <span style={{ color: '#8c8c8c', fontSize: '13px' }}>Rubric Comment Text:</span>
          <Typography.Text code style={{ fontSize: '14px', padding: '4px 8px', background: '#f5f5f5' }}>
            {rubricComment.text}
          </Typography.Text>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        loading={isLoading}
        bordered
        size="middle"
        locale={{
          emptyText: 'No comment instances found. This rubric comment has not been used yet.',
        }}
      />
    </Modal>
  );
};

export default RubricCommentExplorer;

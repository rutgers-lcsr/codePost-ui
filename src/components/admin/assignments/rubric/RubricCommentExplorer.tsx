/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Icon, Modal, Table, Typography } from 'antd';

/* codePost imports */
import { openSubmission } from '../../other/AdminUtils';

import { CommentIO, CommentType } from '../../../../infrastructure/comment';
import { File, FileType } from '../../../../infrastructure/file';
import { RubricCommentType, RubricComment } from '../../../../infrastructure/rubricComment';
import { Submission, SubmissionInfoType } from '../../../../infrastructure/submission';

import CPTooltip from '../../../../components/core/CPTooltip';

/**********************************************************************************************************************/

interface IProps {
  rubricComment: RubricCommentType;
  closeCommentExplorer: () => void;
  isVisible: boolean;
  submissions: SubmissionInfoType[];
}

interface IState {
  comments: CommentType[];
  commentToSubMap: {
    [commentID: number]: {
      submission: number;
      fileName: string;
      students: string[];
    };
  };
  isLoading: boolean;
}

class RubricCommentExplorer extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      comments: [],
      commentToSubMap: {},
      isLoading: true,
    };
  }

  public componentDidMount() {
    this.readComments(this.props.rubricComment).then((comments) => {
      this.getSubs(comments).then((map) => {
        this.setState({
          comments,
          commentToSubMap: map,
          isLoading: false,
        });
      });
    });
  }

  public readComments = async (rubricComment: RubricCommentType) => {
    const linkedComments = await RubricComment.readCommmentList(rubricComment.id);
    return Promise.all(
      linkedComments.comments.map((id) => {
        return CommentIO.read(id);
      }),
    ).then((comments) => {
      return comments;
    });
  };

  public getSubs = (comments: CommentType[]) => {
    return Promise.all(
      comments.map((comm) => {
        const fileID = comm.file;
        return File.read(fileID).then(async (file: FileType) => {
          const sub = await Submission.read(file.submission);
          return [comm.id, file.name, file.submission, sub ? sub.students : []];
        });
      }),
    ).then((data) => {
      const commentToSubMap: any = {};
      data.forEach((el) => {
        commentToSubMap[el[0] as number] = {
          fileName: el[1],
          submission: el[2],
          students: el[3],
        };
      });
      return commentToSubMap;
    });
  };

  public render() {
    const { isVisible, closeCommentExplorer } = this.props;

    if (!isVisible) {
      return <div />;
    }

    const aligner: 'center' | 'right' | 'left' = 'center';
    const columns = [
      {
        title: 'Students',
        dataIndex: 'students',
        key: 'students',
      },
      {
        title: 'File',
        dataIndex: 'file',
        key: 'file',
        align: aligner,
      },
      {
        title: 'Author',
        dataIndex: 'author',
        key: 'author',
        align: aligner,
      },
      {
        title: 'Text',
        dataIndex: 'text',
        key: 'text',
        align: aligner,
      },
      {
        title: 'Open',
        dataIndex: 'open',
        key: 'open',
        align: aligner,
      },
    ];

    const commentToSubMap = this.state.commentToSubMap;
    const data = this.state.comments.map((comment) => {
      return {
        students: commentToSubMap[comment.id].students.join(', '),
        file: commentToSubMap[comment.id].fileName,
        author: comment.author,
        text:
          comment.text === null || comment.text.length === 0 ? (
            <Icon type="pushpin" />
          ) : (
            <CPTooltip title={comment.text}>
              <Icon type="pushpin" theme="filled" />
            </CPTooltip>
          ),
        open: <Icon type="code" onClick={openSubmission.bind(this, commentToSubMap[comment.id].submission)} />,
      };
    });

    const content = (
      <div>
        <span>
          Comment: <Typography.Text code>{this.props.rubricComment.text}</Typography.Text>
        </span>
        <br />
        <br />
        <Table columns={columns} dataSource={data} pagination={false} loading={this.state.isLoading} />
      </div>
    );

    return (
      <Modal
        visible={true}
        title={'Rubric Comment Explorer'}
        width={800}
        onCancel={closeCommentExplorer}
        footer={[
          <Button key="close" onClick={closeCommentExplorer}>
            Close
          </Button>,
        ]}
      >
        {content}
      </Modal>
    );
  }
}

export default RubricCommentExplorer;

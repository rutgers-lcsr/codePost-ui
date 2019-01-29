import * as React from 'react';
import {
  Button,
  DataTable,
  DialogContainer,
  LinearProgress,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
} from 'react-md';

import { openSubmission } from './../AdminUtils';

import { CommentIO, CommentType } from '../../../infrastructure/comment';
import { File, FileType } from '../../../infrastructure/file';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

interface IProps {
  rubricComment: RubricCommentType | undefined;
  closeCommentExplorer: () => void;
  isVisible: boolean;
}

interface IState {
  comments: CommentType[];
  commentToSubMap: { [commentID: number]: { submission: number; fileName: string } };
}

class RubricCommentExplorer extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    comments: [],
    commentToSubMap: {},
  };

  public componentDidUpdate(prevProps: IProps) {
    if (!prevProps.rubricComment && this.props.rubricComment) {
      this.readComments();
    }
    if (prevProps.rubricComment && !this.props.rubricComment) {
      this.setState({
        comments: [],
        commentToSubMap: {},
      });
    }
  }

  public readComments = () => {
    if (!this.props.rubricComment) {
      return;
    }
    const linkedComments = this.props.rubricComment.comments;
    Promise.all(
      linkedComments.map((id) => {
        return CommentIO.read(id);
      }),
    ).then((comments) => {
      console.log(comments);
      this.setState({ comments }, () => this.getSubs());
    });
  };

  public getSubs = () => {
    const { comments } = this.state;
    console.log(comments);
    if (!comments) {
      return;
    }

    Promise.all(
      comments.map((comm) => {
        const fileID = comm.file;
        return File.read(fileID).then((file: FileType) => {
          return [comm.id, file.name, file.submission];
        });
      }),
    ).then((data) => {
      console.log(data);
      const commentToSubMap = {};
      data.forEach((commSubTuple) => {
        commentToSubMap[commSubTuple[0]] = { fileName: commSubTuple[1], submission: commSubTuple[2] };
      });
      this.setState({ commentToSubMap });
      console.log(commentToSubMap);
    });
  };

  public renderRows = () => {
    const { comments, commentToSubMap } = this.state;

    return comments.map((comm) => {
      const submissionID = commentToSubMap[comm.id].submission;
      const fileName = commentToSubMap[comm.id].fileName;
      return (
        <TableRow key={comm.id} onClick={openSubmission.bind(this.props, submissionID)}>
          <TableColumn>{submissionID}</TableColumn>
          <TableColumn>{fileName}</TableColumn>
          <TableColumn>{comm.author}</TableColumn>
          <TableColumn>{comm.text}</TableColumn>
        </TableRow>
      );
    });
  };

  public render() {
    const { isVisible, rubricComment, closeCommentExplorer } = this.props;

    if (!rubricComment || !isVisible) {
      return <div />;
    }

    const content =
      Object.keys(this.state.commentToSubMap).length === 0 || !this.state.comments ? (
        <LinearProgress id="circle" className="progressCircle" />
      ) : (
        <div>
          <DataTable key="rubricCommentExplorer" className="DataTable--RubricCommentExplorer" plain={true}>
            <TableHeader>
              <TableRow selectable={false}>
                <TableColumn key="submissionID">Submission ID</TableColumn>
                <TableColumn key="fileName">File Name</TableColumn>
                <TableColumn key="author">Comment Author</TableColumn>
                <TableColumn key="text">Additional comment text</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>{this.renderRows()}</TableBody>
          </DataTable>
        </div>
      );

    return (
      <DialogContainer
        id="rubricCommentExplorer"
        className="RubricCommentExplorer"
        visible={true}
        title={
          <div className="RubricCommentExplorer__title-container">
            <div>{`Usage of Rubric Comment - ${rubricComment.text}`}</div>
            <Button
              raised
              onClick={closeCommentExplorer}
              primary={false}
              flat={true}
              icon={true}
              forceIconFontSize={true}
              forceIconSize={24}
              className="RubricCommentExplorer__close"
            >
              clear
            </Button>
          </div>
        }
        onHide={closeCommentExplorer}
        modal={true}
        focusOnMount={false}
      >
        {content}
      </DialogContainer>
    );
  }
}

export default RubricCommentExplorer;

import * as React from 'react';

import CommentList from './CommentList';

import CodePanelUtils from './CodePanelUtils';
import MarkdownContainer from './MarkdownContainer';

import { ICommentToRubricCommentMap } from '../../types/common';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';
import { SubmissionType } from '../../infrastructure/submission';

interface IMarkdownCodeProps {
  submission: SubmissionType;
  file: FileType;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  // giving a partial comment breaks the IComment type constraint, could make some fields optional?
  addComment: (comment: any, file: FileType) => boolean;
  commentCounter: number;
  updateCommentCounter: () => void;

  activeCommentId?: number;
  changeActive: (id: number | number) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => boolean;
  updateSubmissionGrade: () => void;
  unsavedComments: number[];
  markdown: string;
}

class MarkdownCode extends React.Component<IMarkdownCodeProps, {}> {
  public render() {
    const {
      file,
      readOnly,
      comments,
      changeActive,
      rubricComments,
      activeCommentId,
      deleteComment,
      updateComment,
    } = this.props;

    const boxHeight = document.getElementById(`syntax-highlighter-${file.id}`)
      ? document.getElementById(`syntax-highlighter-${file.id}`)!.getBoundingClientRect().height
      : this.props.markdown.split('\n').length * 24;

    const commentPanelStyle = {
      height: `${boxHeight}px`,
    };

    CodePanelUtils.updateCommentPanelHeight(boxHeight);

    return (
      <div id="scroll-container" className="grade__main-container__right-panel__scroll-container">
        <div className="grade__main-container__tab-content">
          <div className="grade__main-container__tab-content__code-panel">
            <MarkdownContainer
              comments={this.props.comments}
              addComment={this.props.addComment}
              file={this.props.file}
              markdown={this.props.markdown}
              commentCounter={this.props.commentCounter}
              updateCommentCounter={this.props.updateCommentCounter}
            />
          </div>
          <div
            id={`comment-panel-${this.props.file.id}`}
            className="grade__main-container__tab-content__comment-panel"
            style={commentPanelStyle}
          >
            <CommentList
              file={file}
              readOnly={readOnly}
              comments={comments}
              rubricComments={rubricComments}
              activeCommentId={activeCommentId}
              changeActive={changeActive}
              deleteComment={deleteComment}
              updateComment={updateComment}
              updateSubmissionGrade={this.props.updateSubmissionGrade}
              unsavedComments={this.props.unsavedComments}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default MarkdownCode;

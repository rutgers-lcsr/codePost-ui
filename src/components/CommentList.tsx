import * as React from 'react';

import Comment from './Comment';

import { CommentType } from '../infrastructure/comment';
import { FileType } from '../infrastructure/file';

import CodePanelUtils from '../CodePanelUtils';

import { ICommentToRubricCommentMap, ICSSStyleObject } from '../types/common';

interface IProps {
  file: FileType;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  activeCommentId?: number;
  changeActive: (id: number | number) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType) => void;
  updateSubmissionGrade: () => void;
}

interface IState {
  scrollTop: number;
}

interface IBlock {
  startAt: number;
  endAt: number;
}

class CommentList extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    scrollTop: 0,
  };

  public componentDidMount() {
    document.getElementById('scroll-container')!.addEventListener('scroll', this.handleScroll);
  }

  // Update the height of the commentPanel box if there are comments sitting outside of it
  // If we don't do this, then the scrolling gets messed up
  public handleScroll = () => {
    if (document.getElementById('commentPanel')) {
      const currentHeight = document.getElementById('commentPanel')!.getBoundingClientRect().height;

      let newHeight = currentHeight;
      const commentElements = document.getElementsByClassName('comment');
      // tslint:disable-next-line
      for (let i = 0; i < commentElements.length; i++) {
        const elem = document.getElementById(commentElements[i].id)!;
        newHeight = Math.max(currentHeight, +elem.style.top!.slice(0, -2) + elem.getBoundingClientRect().height + 30);
      }
      document.getElementById('commentPanel')!.style.setProperty('height', `${newHeight}px`);
    }
  };

  public getCommentNodes = (comments: CommentType[]) => {
    const { activeCommentId, changeActive, deleteComment, file, readOnly, updateComment, rubricComments } = this.props;
    // Store estimated pixel ranges of comment blocks to help with stacking
    const blocks: IBlock[] = [];

    return comments.map((comment: CommentType) => {
      // Figure out where to place comment vertically
      // Placement model:
      //    - Make comment position absolute
      //    - Set upper margin at <startLine> em down from top

      let pixelsPerLine = 18; // estimate until the lines are rendered
      if (document.getElementById('line-0')) {
        pixelsPerLine = document.getElementById('line-0')!.getBoundingClientRect().height;
      }
      let startAt = comment.startLine * pixelsPerLine - this.state.scrollTop;

      // If a comment starts in the range of another block, then push it down until it fits
      // Don't need to check for trailing comments because already sorting by startLine
      for (const block of blocks) {
        if (startAt >= block.startAt && startAt < block.endAt) {
          startAt = block.endAt;
        }
      }

      let heightOfComment = 80; // estimate until the elements are rendered
      if (document.getElementById(`comment-${comment.id}`)) {
        heightOfComment = document.getElementById(`comment-${comment.id}`)!.getBoundingClientRect().height;
      }

      heightOfComment = heightOfComment + 10; // padding

      const newBlock: IBlock = {
        startAt,
        endAt: startAt + heightOfComment,
      };
      blocks.push(newBlock);

      blocks.sort((a: IBlock, b: IBlock) => {
        return a.startAt - b.startAt;
      });

      const zindex = 100000 - startAt;
      const style: ICSSStyleObject = {
        top: `${startAt}px`,
        zIndex: zindex.toString(),
      };

      const isActive = activeCommentId === comment.id;

      return (
        <Comment
          key={comment.id}
          comment={comment}
          rubricComment={rubricComments[comment.id]}
          style={style}
          readOnly={readOnly}
          file={file}
          active={isActive}
          changeActive={changeActive}
          deleteComment={deleteComment}
          updateComment={updateComment}
          updateSubmissionGrade={this.props.updateSubmissionGrade}
        />
      );
    });
  };

  public render() {
    // Sort comments by startLine to help with stacking
    const comments = CodePanelUtils.sortComments(this.props.comments);
    const commentNodes = this.getCommentNodes(comments);

    return <div className="code__comments">{commentNodes}</div>;
  }
}

export default CommentList;

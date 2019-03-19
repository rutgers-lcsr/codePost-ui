import * as React from 'react';

import Comment from './Comment';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';

import CodePanelUtils from './CodePanelUtils';

import { ICommentToRubricCommentMap, ICSSStyleObject } from '../../types/common';

export interface ICommentListProps {
  file: FileType;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  activeCommentId?: number;
  changeActive: (id: number | number) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => boolean;
  updateSubmissionGrade: () => void;
  unsavedComments: number[];
}

interface ICommentListState {
  placeholder: number;
  isMounted: boolean;
}

interface IBlock {
  startAt: number;
  endAt: number;
}

class CommentList extends React.Component<ICommentListProps, ICommentListState> {
  public state: Readonly<ICommentListState> = {
    placeholder: 0,
    isMounted: false,
  };

  public componentDidMount() {
    this.setState({ isMounted: true });
    window.addEventListener('resize', this.rerender.bind(this)); // When window is resized
    window.addEventListener('click', this.waitToRerender.bind(this)); // When window is clicked

    // When code is scrolled
    if (document.getElementById('scroll-container')) {
      document.getElementById('scroll-container')!.addEventListener('scroll', this.rerender.bind(this));
    }

    document.addEventListener('scroll', this.rerender.bind(this)); // When document is scrolled

    if (document.getElementById(`code-underlay-pre-${this.props.file.id}`)) {
      document
        .getElementById(`code-underlay-pre-${this.props.file.id}`)!
        .addEventListener('scroll', this.updateHighlightScroll.bind(this)); // When underlying code is scrolled
    }
  }

  public componentWillUnmount() {
    this.setState({ isMounted: false });
    window.removeEventListener('resize', this.rerender.bind(this));
    window.removeEventListener('click', this.waitToRerender.bind(this));
    document.getElementById('scroll-container')!.removeEventListener('scroll', this.rerender.bind(this));
    document.removeEventListener('scroll', this.rerender.bind(this));
    document
      .getElementById(`code-underlay-pre-${this.props.file.id}`)!
      .removeEventListener('scroll', this.updateHighlightScroll.bind(this));
  }

  public waitToRerender = () => {
    window.setTimeout(this.rerender.bind(this), 100);
  };

  public rerender = () => {
    if (this.state.isMounted) {
      this.setState({ placeholder: 0 });
      CodePanelUtils.updateCommentPanelHeight();
    }
  };

  public updateHighlightScroll = () => {
    const syntaxHighlighter = document
      .getElementById(`syntax-highlighter-${this.props.file.id}`)!
      .getElementsByTagName('pre')[0];
    syntaxHighlighter.scrollLeft = document.getElementById(`code-underlay-pre-${this.props.file.id}`)!.scrollLeft;
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
      let startAt = comment.startLine * pixelsPerLine;

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
          unsavedComments={this.props.unsavedComments}
        />
      );
    });
  };

  public render() {
    const commentNodes = this.getCommentNodes(this.props.comments);

    return <div className="code__comments">{commentNodes}</div>;
  }
}

export default CommentList;

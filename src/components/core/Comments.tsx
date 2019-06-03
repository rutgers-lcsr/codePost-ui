import * as React from 'react';

import CPComment from './CPComment';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';

// import CodePanelUtils from './CodePanelUtils';

import { ICommentToRubricCommentMap } from '../../types/common';

export interface ICommentsProps {
  // file: FileType;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  // activeCommentId?: number;
  // changeActive: (id: number | number) => void;
  // deleteComment: (comment: CommentType, file: FileType) => void;
  // updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => boolean;
  // updateSubmissionGrade: () => void;
  // unsavedComments: number[];

  file: FileType;
  activeCommentID?: number;
  changeActive: (id: number | undefined) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => boolean;
  updateSubmissionGrade: () => void;

  unsavedComments: number[];
  saveComment: any;
}

interface ICommentPlacement {
  commentID: number;
  placement: number;
}

interface ICommentsState {
  recentlyActivatedComment: boolean;
  placements: ICommentPlacement[];
}

interface IBlock {
  startAt: number;
  endAt: number;
}

class Comments extends React.Component<ICommentsProps, ICommentsState> {
  public wrapperRef: any;
  public constructor(props: ICommentsProps) {
    super(props);

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

    this.state = {
      recentlyActivatedComment: false,
      placements: this.props.comments.map((comment: CommentType, index: number) => {
        return { commentID: comment.id, placement: comment.startLine * 18 };
      }),
    };
  }
  // public state: Readonly<ICommentsState> = {
  //   recentlyActivatedComment: false,
  //   placements: this.props.comments.map((comment: CommentType, index: number) => {
  //     return { commentID: comment.id, placement: comment.startLine * 18 };
  //   }),
  // };

  public setWrapperRef = (node: any) => {
    this.wrapperRef = node;
  };

  public handleClickOutside = (event: any) => {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      // this.props.changeActive(undefined);
      console.log('clicked outside');
    }
  };

  public componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  public componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  public changeActive = (id: number | undefined) => {
    if (id && id !== this.props.activeCommentID) {
      this.setState({ recentlyActivatedComment: true });
    }

    this.props.changeActive(id);
  };

  public calculateCommentPlacements = (comments: CommentType[]): ICommentPlacement[] => {
    console.log('!! Calculating Placements !!');
    const blocks: IBlock[] = [];

    return comments.map((comment: CommentType) => {
      // Figure out where to place comment vertically
      // Placement model:
      //    - Make comment position absolute
      //    - Set upper margin at <startLine> em down from top

      let pixelsPerLine = 20; // estimate until the lines are rendered
      const lineElement = document.getElementById('line-0');
      if (lineElement) {
        pixelsPerLine = lineElement.getBoundingClientRect().height;
      }

      const arrowDisplacement = 32;

      // containerDifference =
      //    code-panel--code::padding-top
      //     +
      //    code-container::padding-top
      const containerDifference = 28 + 25;

      let startAt = comment.startLine * pixelsPerLine - arrowDisplacement + containerDifference;

      // Find position of markdown block elements
      const blockElement: HTMLElement | null = document.querySelector(`[index-number="${comment.startLine}"]`);
      if (blockElement) {
        startAt = blockElement.offsetTop;
      }

      // If a comment starts in the range of another block, then push it down until it fits
      // Don't need to check for trailing comments because already sorting by startLine
      for (const block of blocks) {
        if (startAt >= block.startAt && startAt < block.endAt) {
          startAt = block.endAt;
        }
      }

      // const isActive = activeCommentId === comment.id;
      let heightOfComment = 80; // estimate until the elements are rendered
      const commentElement = document.getElementById(`comment-${comment.id}`);
      // console.log(`looking for comment ${comment.id} - ${commentElement ? 'found' : 'not found'}`);
      if (commentElement) {
        heightOfComment = commentElement.clientHeight;

        if (this.state.recentlyActivatedComment && comment.id === this.props.activeCommentID) {
          // console.log('------->>>>>>');
          // heightOfComment = heightOfComment - 18;
          this.setState({ recentlyActivatedComment: false });
        }
        // console.log(
        //   commentElement,
        //   commentElement.clientHeight,
        //   commentElement.scrollHeight,
        //   commentElement.offsetHeight,
        //   commentElement.getBoundingClientRect().height,
        // );
        // console.log(comment.id, heightOfComment);
        // const textArea = commentElement.getElementsByTagName('textarea')[0];

        // if (textArea && textArea.getBoundingClientRect().height < 42) {
        //   heightOfComment += 33;
        // }
      } else {
        console.error('just in case');
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

      // const zindex = 100000 - startAt;
      // const style: ICSSStyleObject = {
      //   top: `${startAt}px`,
      //   zIndex: zindex.toString(),
      // };

      return { commentID: comment.id, placement: startAt };
    });
  };

  public setCommentPlacements = () => {
    const placements = this.calculateCommentPlacements(this.props.comments);

    const lastPlacement = placements[placements.length - 1];
    const commentElement = document.getElementById(`comment-${lastPlacement.commentID}`);
    let heightOfComment = 80;
    if (commentElement) {
      heightOfComment = commentElement.clientHeight;
    }

    const lowestCommentBottom = lastPlacement.placement + heightOfComment + 10;

    const lineHeight = 20;
    const codeHeight = this.props.file.code.split('\n').length * lineHeight;

    // 25, 28 = padding on top of code
    // 90 = intercom padding
    const commentsHeight = Math.max(codeHeight + 25 + 28 + 90, lowestCommentBottom);
    const comments = document.getElementById('comments');
    if (comments) {
      comments.style.setProperty('height', `${commentsHeight}px`);
    }

    console.table(placements);
    // // tslint:disable-next-line
    // debugger;
    this.setState({ placements });
  };

  public render() {
    const commentNodes = this.props.comments.map((comment: CommentType, index: number) => {
      const commentPlacement = this.state.placements.find((value: ICommentPlacement) => {
        return value.commentID === comment.id;
      });

      const placement = commentPlacement ? commentPlacement.placement : 0;

      const commentType = this.props.readOnly
        ? 'readonly'
        : comment.id === this.props.activeCommentID
        ? 'active'
        : 'inactive';

      const rubricComment = this.props.rubricComments.hasOwnProperty(comment.id)
        ? this.props.rubricComments[comment.id]
        : undefined;

      // console.log('rubricComment before comment', rubricComment);
      // console.log('rub', rubricComment);

      console.log('unsaved comments', this.props.unsavedComments);
      const isUnsaved = this.props.unsavedComments.includes(comment.id);

      return (
        <CPComment
          key={index}
          commentType={commentType}
          comment={comment}
          rubricComment={rubricComment}
          setCommentPlacements={this.setCommentPlacements}
          placement={placement}
          file={this.props.file}
          changeActive={this.changeActive}
          deleteComment={this.props.deleteComment}
          updateComment={this.props.updateComment}
          updateSubmissionGrade={this.props.updateSubmissionGrade}
          isUnsaved={isUnsaved}
          saveComment={this.props.saveComment}
        />
      );
    });
    return (
      <div id="comments" style={{ position: 'relative' }} className="comments" ref={this.setWrapperRef}>
        {commentNodes}
      </div>
    );
  }
}

export default Comments;

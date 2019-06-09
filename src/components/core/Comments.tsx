import * as React from 'react';

import CPComment from './CPComment';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';

import { ICommentToRubricCommentMap } from '../../types/common';

import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

import * as Animation from '../../infrastructure/animation';

export interface ICommentsProps extends IWithWindowWatcherProps {
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;

  file: FileType;
  activeCommentID?: number;
  changeActive: (id: number | undefined) => void;
  saveComment: any;
  deleteComment: (comment: CommentType) => void;

  addUnsaved: any;
  removeUnsaved: any;
  removeRubricComment: any;
}

interface ICommentPlacement {
  commentID: number;
  placement: number;
}

interface ICommentsState {
  placements: ICommentPlacement[];
}

interface IBlock {
  startAt: number;
  endAt: number;
}

const pixelsPerLine = (): number => {
  let lineHeight = 20; // estimate until the lines are rendered
  const lineElement = document.getElementById('line-0');
  if (lineElement) {
    lineHeight = lineElement.getBoundingClientRect().height;
  }
  return lineHeight;
};

class Comments extends React.Component<ICommentsProps, ICommentsState> {
  public nextFrameActionId: number;
  public wrapperRef: any;
  public constructor(props: ICommentsProps) {
    super(props);

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

    this.state = {
      placements: this.props.comments.map((comment: CommentType, index: number) => {
        return { commentID: comment.id, placement: comment.startLine * 18 };
      }),
    };
  }

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

    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    if (zoomIn !== null && zoomOut !== null) {
      zoomIn.addEventListener('click', this.placeCommentsOnNextFrame);
      zoomOut.addEventListener('click', this.placeCommentsOnNextFrame);
    }
  }

  public componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);

    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    if (zoomIn !== null && zoomOut !== null) {
      zoomIn.removeEventListener('click', this.placeCommentsOnNextFrame);
      zoomOut.removeEventListener('click', this.placeCommentsOnNextFrame);
    }
  }

  public componentDidUpdate(prevProps: ICommentsProps) {
    if (this.props.windowWidth !== prevProps.windowWidth || this.props.windowHeight !== prevProps.windowHeight) {
      this.placeCommentsOnNextFrame();
    }
  }

  public placeCommentsOnNextFrame = () => {
    if (this.nextFrameActionId) {
      Animation.clearNextFrameAction(this.nextFrameActionId);
    }
    this.nextFrameActionId = Animation.onNextFrame(this.setCommentPlacements);
  };

  public changeActive = (id: number | undefined) => {
    this.props.changeActive(id);
  };

  public calculateCommentPlacements = (comments: CommentType[]): ICommentPlacement[] => {
    console.log('!! Calculating Placements !!');
    const blocks: IBlock[] = [];

    return comments.map((comment: CommentType) => {
      const lineHeight = pixelsPerLine();

      const arrowDisplacement = 32;

      // containerDifference =
      //    code-panel--code::padding-top
      //     +
      //    code-container::padding-top
      const containerDifference = 28 + 25;

      let startAt = comment.startLine * lineHeight - arrowDisplacement + containerDifference;

      // MISSING
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

      let heightOfComment = 80; // estimate until the elements are rendered
      const commentElement = document.getElementById(`comment-${comment.id}`);
      // console.log(`looking for comment ${comment.id} - ${commentElement ? 'found' : 'not found'}`);
      if (commentElement) {
        heightOfComment = commentElement.clientHeight;
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

      return { commentID: comment.id, placement: startAt };
    });
  };

  public setBottomOfCommentBox = (lastPlacement: ICommentPlacement) => {
    const lineHeight = pixelsPerLine();
    const codeHeight = this.props.file.code.split('\n').length * lineHeight;

    let lowestCommentBottom = 0;
    if (lastPlacement) {
      const commentElement = document.getElementById(`comment-${lastPlacement.commentID}`);
      let heightOfComment = 80;
      if (commentElement) {
        heightOfComment = commentElement.clientHeight;
      }

      lowestCommentBottom = lastPlacement.placement + heightOfComment + 10;
    }

    // 25, 28 = padding on top of code
    // 90 = intercom padding
    const commentsHeight = Math.max(codeHeight + 25 + 28 + 90, lowestCommentBottom);
    const comments = document.getElementById('comments');
    if (comments) {
      comments.style.setProperty('height', `${commentsHeight}px`);
    }
  };

  public setCommentPlacements = () => {
    const placements = this.calculateCommentPlacements(this.props.comments);

    this.setBottomOfCommentBox(placements[placements.length - 1]);

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

      return (
        <CPComment
          key={comment.id}
          commentType={commentType}
          comment={comment}
          rubricComment={rubricComment}
          placement={placement}
          changeActive={this.changeActive}
          onSave={this.props.saveComment}
          onDelete={this.props.deleteComment}
          addUnsaved={this.props.addUnsaved}
          removeUnsaved={this.props.removeUnsaved}
          setCommentPlacements={this.placeCommentsOnNextFrame}
          removeRubricComment={this.props.removeRubricComment}
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

export default withWindowWatcher(Comments);

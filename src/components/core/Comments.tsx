import * as React from 'react';

import CPComment from './CPComment';
import Layout from './LayoutUtils';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';

import { ICommentToRubricCommentMap } from '../../types/common';

import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

import * as Animation from '../../infrastructure/animation';

import themeVars from '../../styles/abstracts/_theme.js';

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

type BlockType = {
  startAt: number;
  endAt: number;
};

class Comments extends React.Component<ICommentsProps, ICommentsState> {
  public static getCommentType = (readOnly: boolean, commentID: number, activeCommentID?: number) => {
    return readOnly ? 'readonly' : commentID === activeCommentID ? 'active' : 'inactive';
  };

  public nextFrameActionId: number;
  public wrapperRef: any;

  public constructor(props: ICommentsProps) {
    super(props);

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

    this.state = {
      placements: this.props.comments.map((comment: CommentType, index: number) => {
        return { commentID: comment.id, placement: comment.startLine * themeVars.grade.codeLineHeight };
      }),
    };
  }

  public setWrapperRef = (node: any) => {
    this.wrapperRef = node;
  };

  public handleClickOutside = (event: any) => {
    const rubricMenu = document.getElementById('cp-rubric-menu');
    if (
      this.wrapperRef &&
      !this.wrapperRef.contains(event.target) &&
      rubricMenu !== null &&
      !rubricMenu.contains(event.target)
    ) {
      this.props.changeActive(undefined);
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
    const blocks: BlockType[] = [];

    return comments.map((comment: CommentType) => {
      const lineHeight = Layout.pixelsPerLine();

      const containerDifference = themeVars.grade.codeContainer.paddingTop + themeVars.grade.codeContainer.marginTop;

      let startAt = comment.startLine * lineHeight - themeVars.grade.arrowDisplacement + containerDifference;

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

      const blockHeight = Layout.commentHeight(comment.id) + themeVars.grade.commentSpacing;

      const newBlock: BlockType = {
        startAt,
        endAt: startAt + blockHeight,
      };
      blocks.push(newBlock);

      blocks.sort((a: BlockType, b: BlockType) => {
        return a.startAt - b.startAt;
      });

      return { commentID: comment.id, placement: startAt };
    });
  };

  public setBottomOfCommentBox = (lastPlacement: ICommentPlacement) => {
    const codeHeight = Layout.codeHeight(this.props.file.code);

    let lowestCommentBottom = 0;
    if (lastPlacement) {
      const lastBlockHeight = Layout.commentHeight(lastPlacement.commentID) + themeVars.grade.commentSpacing;

      lowestCommentBottom = lastPlacement.placement + lastBlockHeight;
    }

    const commentsHeight =
      codeHeight +
      themeVars.grade.codeContainer.paddingTop +
      themeVars.grade.codeContainer.paddingBottom +
      themeVars.grade.codeContainer.marginTop +
      themeVars.grade.codeContainer.marginBottom;

    const commentsMaxHeight = Math.max(commentsHeight, lowestCommentBottom);

    const comments = document.getElementById('comments');
    if (comments) {
      comments.style.setProperty('height', `${commentsMaxHeight}px`);
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

      const commentType = Comments.getCommentType(this.props.readOnly, comment.id, this.props.activeCommentID);

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

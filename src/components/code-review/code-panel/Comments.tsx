import * as React from 'react';

import Comment from './Comment';

import CodePanelSizing from './CodePanelSizing';

import { CommentType } from '../../../infrastructure/comment';
import { FileType } from '../../../infrastructure/file';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { ICommentToRubricCommentMap } from '../../../types/common';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import * as Animation from '../../../infrastructure/animation';

import themeVars from '../../../styles/abstracts/_theme.js';

interface ICommentsCoreProps extends IWithWindowWatcherProps {
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  file: FileType;
}

interface ICommentsEditProps {
  readOnly: boolean;
  activeCommentID?: number;
  changeActive: (id: number | undefined) => void;
  saveComment: any;
  deleteComment: (comment: CommentType) => void;

  addUnsaved: any;
  removeUnsaved: any;
  removeRubricComment: any;

  oldCommentIDs: any;
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

class Comments extends React.Component<ICommentsCoreProps & ICommentsEditProps, ICommentsState> {
  public static getCommentType = (readOnly: boolean, commentID: number, activeCommentID?: number) => {
    return readOnly ? 'readonly' : commentID === activeCommentID ? 'active' : 'inactive';
  };

  public nextFrameActionId: number;
  public wrapperRef: any;

  public constructor(props: ICommentsCoreProps & ICommentsEditProps) {
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
    const rubricMenu = document.getElementById('rubric-menu');
    if (
      !this.props.readOnly &&
      this.wrapperRef &&
      !this.wrapperRef.contains(event.target) &&
      rubricMenu !== null &&
      !rubricMenu.contains(event.target)
    ) {
      this.props.changeActive(undefined);
    }
  };

  // Handle ESC key
  public handleKeyPress = (e: KeyboardEvent) => {
    if (e.keyCode === 27) {
      this.props.changeActive(undefined);
    }
  };

  public componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('keydown', this.handleKeyPress);

    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    if (zoomIn !== null && zoomOut !== null) {
      zoomIn.addEventListener('click', this.placeCommentsOnNextFrame);
      zoomOut.addEventListener('click', this.placeCommentsOnNextFrame);
    }

    const grow = document.getElementById('grow');
    const shrink = document.getElementById('shrink');
    if (grow !== null && shrink !== null) {
      grow.addEventListener('click', this.manualWait);
      shrink.addEventListener('click', this.manualWait);
    }
  }

  // FIXME: This forces comments with 'expand' to stack correctly
  //          The downside is that it now looks choppy
  //          The correct way to do this is to figure out how to
  //          order the animation frames.
  public manualWait = async () => {
    await Animation.wait(5);
    this.placeCommentsOnNextFrame();
  };

  public componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleKeyPress);

    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    if (zoomIn !== null && zoomOut !== null) {
      zoomIn.removeEventListener('click', this.placeCommentsOnNextFrame);
      zoomOut.removeEventListener('click', this.placeCommentsOnNextFrame);
    }

    const grow = document.getElementById('grow');
    const shrink = document.getElementById('shrink');
    if (grow !== null && shrink !== null) {
      grow.removeEventListener('click', this.manualWait);
      shrink.removeEventListener('click', this.manualWait);
    }
  }

  public componentDidUpdate(prevProps: ICommentsCoreProps & ICommentsEditProps) {
    if (this.props.windowwidth !== prevProps.windowwidth || this.props.windowheight !== prevProps.windowheight) {
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
      const lineHeight = CodePanelSizing.pixelsPerLine();

      const containerDifference = themeVars.grade.codeContainer.paddingTop + themeVars.grade.codeContainer.marginTop;

      let startAt = comment.startLine * lineHeight - themeVars.grade.arrowDisplacement + containerDifference;

      // MISSING
      // Find position of markdown block elements
      const blockElement: HTMLElement | null = document.querySelector(`[index-number="${comment.startLine}"]`);
      if (blockElement) {
        startAt = blockElement.offsetTop + 20; // 20 = aesthetic padding from top of block element
      }

      // If a comment starts in the range of another block, then push it down until it fits
      // Don't need to check for trailing comments because already sorting by startLine
      for (const block of blocks) {
        if (startAt >= block.startAt && startAt < block.endAt) {
          startAt = block.endAt;
        }
      }

      const blockHeight = CodePanelSizing.commentHeight(comment.id) + themeVars.grade.commentSpacing;

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
    const codeHeight = CodePanelSizing.codeHeight(this.props.file.code);

    let lowestCommentBottom = 0;
    if (lastPlacement) {
      const lastBlockHeight = CodePanelSizing.commentHeight(lastPlacement.commentID) + themeVars.grade.commentSpacing;

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

      const key = this.props.oldCommentIDs.hasOwnProperty(comment.id)
        ? this.props.oldCommentIDs[comment.id]
        : comment.id;

      return (
        <Comment
          key={key}
          commentType={commentType}
          comment={comment}
          file={this.props.file}
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

const makeReadOnly = (Component: React.ComponentType<ICommentsCoreProps & ICommentsEditProps>) => {
  return class WrappedComponent extends React.Component<ICommentsCoreProps, {}> {
    public readOnly = true;
    public activeCommentID = undefined;

    public saveComment = (comment: any) => {
      return;
    };

    public changeActive = (id: number) => {
      return;
    };

    public deleteComment = (comment: CommentType) => {
      return;
    };

    public addUnsaved = (commentID: number) => {
      return;
    };

    public removeUnsaved = (commentID: number) => {
      return;
    };

    public removeRubricComment = (comment: CommentType, rubricComment: RubricCommentType) => {
      return;
    };

    public render() {
      return (
        <Component
          {...this.props as ICommentsCoreProps}
          readOnly={this.readOnly}
          activeCommentID={this.activeCommentID}
          changeActive={this.changeActive}
          saveComment={this.saveComment}
          deleteComment={this.deleteComment}
          addUnsaved={this.addUnsaved}
          removeUnsaved={this.removeUnsaved}
          removeRubricComment={this.removeRubricComment}
          oldCommentIDs={{}}
        />
      );
    }
  };
};

export const GradeComments = withWindowWatcher(Comments);
export const StudentComments = withWindowWatcher(makeReadOnly(Comments));

export default withWindowWatcher(Comments);

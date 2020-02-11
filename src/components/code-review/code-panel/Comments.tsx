import * as React from 'react';

import Comment from './Comment';

import CodePanelSizing from './CodePanelSizing';

import { CommentType } from '../../../infrastructure/comment';

import { File, FileType } from '../../../infrastructure/file';

import { RubricCategoryType } from '../../../infrastructure/rubricCategory';

import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { ICommentToRubricCommentMap } from '../../../types/common';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import * as Animation from '../../../infrastructure/animation';

import themeVars from '../../../styles/abstracts/_theme.js';

import { CodeConsoleDimensionsType } from './LayoutResizer';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { CURSOR_DOMAIN } from '../CodeConsole';
import { findBlockElement, getPDFStartPlacement } from './BlockUtils.tsx';

interface ICommentsCoreProps extends IWithWindowWatcherProps {
  additiveGrading: boolean;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  file: FileType;
  fileIDs: number[];
  verticalOffset: number;
  dimensions: CodeConsoleDimensionsType;
  isStudent: boolean;
  updateFeedback: (commentID: number, feedback: number) => void;
  studentFeedbackOn: boolean;
  hideAuthor: boolean;
  rubricCategories: RubricCategoryType[];
  scrollToCommentID?: number;
}

interface ICommentsEditProps {
  readOnly: boolean;

  activeCommentID?: number;
  changeActive: (id: number | undefined) => void;
  saveComment: (comment: CommentType) => void;
  deleteComment: (comment: CommentType) => void;

  removeRubricComment: (comment: CommentType, rubricComment: RubricCommentType) => void;

  forcedRubricMode: boolean;

  oldCommentIDs: { [currentID: number]: number };

  showCursor: CURSOR_DOMAIN;
  showExplanations: boolean;
}

interface ICommentPlacement {
  commentID: number;
  placement: number;
}

interface ICommentsState {
  placements: ICommentPlacement[];
  cursor: number;
  fileScrollPositions: { [fileID: number]: number };
}

type BlockType = {
  startAt: number;
  endAt: number;
};

class Comments extends React.Component<ICommentsCoreProps & ICommentsEditProps, ICommentsState> {
  public static getCommentType = (readOnly: boolean, commentID: number, activeCommentID?: number) => {
    return readOnly ? 'readonly' : commentID === activeCommentID ? 'active' : 'inactive';
  };

  // @ts-ignore
  public nextFrameActionId: number;
  public wrapperRef: any;

  public constructor(props: ICommentsCoreProps & ICommentsEditProps) {
    super(props);

    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

    this.state = {
      placements: this.props.comments.map((comment: CommentType, index: number) => {
        const placement =
          File.codeType(props.file) === 'pdf'
            ? getPDFStartPlacement(comment)
            : comment.startLine * themeVars.grade.codeLineHeight;
        return {
          commentID: comment.id,
          placement,
        };
      }),
      cursor: 0,
      fileScrollPositions: this.props.fileIDs.reduce((scrollPositions: { [fid: number]: number }, fileID: number) => {
        return { ...scrollPositions, [fileID]: 0 };
      }, {}),
    };
  }

  public setWrapperRef = (node: any) => {
    this.wrapperRef = node;
  };

  public handleClickOutside = (event: any) => {
    const safeAreaIDs = ['rubric-menu-container'];
    const safeAreas = safeAreaIDs.map((id) => document.getElementById(id));
    if (!this.props.readOnly && this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      if (!safeAreas.some((area) => area !== null && area.contains(event.target))) {
        this.props.changeActive(undefined);
      }
    }
  };

  // Handle ESC key
  public handleKeyPress = (e: KeyboardEvent) => {
    if (e.keyCode === 27) {
      this.props.changeActive(undefined);
    }
  };

  public jumpToComment = async (commentID: number) => {
    await Animation.wait(1);

    const codeScrollArea = document.getElementById('code-scroll-area');
    if (codeScrollArea !== null) {
      const commentPlacement = this.state.placements.find((value: ICommentPlacement) => {
        return value.commentID === commentID;
      });

      if (commentPlacement !== undefined) {
        this.setState({
          fileScrollPositions: {
            ...this.state.fileScrollPositions,
            [this.props.file.id]: commentPlacement.placement,
          },
        });
        codeScrollArea.scrollTop = commentPlacement.placement;
      }
    }
  };

  public componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('keydown', this.handleCursor);
    document.addEventListener('keydown', this.handleKeyPress);

    if (this.props.scrollToCommentID !== undefined) {
      this.jumpToComment(this.props.scrollToCommentID);
    }

    // FIXME: This is a hack to trigger comment placements to reload after a PDF has loaded.
    // The PDF can take some time to load, and if the placement isn't triggered the comments will stay on top
    // Passing in refs to the <Comments /> and triggering comment placement from <CodeConent /> doesn't work because
    // of a typescript issue with being unable to use react.forwardRef(), which we need to do because each <Comments />
    // object is wrapped in a HOC with withWindowWatcher.
    document.addEventListener('pdf-loaded', this.setCommentPlacements);
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
    document.removeEventListener('keydown', this.handleCursor);
    document.removeEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('loaded', this.setCommentPlacements);
  }

  public handleCursor = async (e: any) => {
    if (this.props.showCursor === CURSOR_DOMAIN.COMMENTS) {
      if (e.key === 'ArrowDown') {
        this.setState({ cursor: Math.min(this.props.comments.length - 1, this.state.cursor + 1) });
      } else if (e.key === 'ArrowUp') {
        this.setState({ cursor: Math.max(0, this.state.cursor - 1) });
      }
    }
  };

  public getSnapshotBeforeUpdate(prevProps: ICommentsCoreProps & ICommentsEditProps, prevState: ICommentsState) {
    const codeScrollArea = document.getElementById('code-scroll-area');
    if (codeScrollArea !== null) {
      if (prevProps.file.id === this.props.file.id) {
        return codeScrollArea.scrollTop;
      } else {
        this.setState({
          fileScrollPositions: { ...this.state.fileScrollPositions, [prevProps.file.id]: codeScrollArea.scrollTop },
        });
        return this.state.fileScrollPositions[this.props.file.id];
      }
    }

    return null;
  }

  // FIXME: Reimplement rage scroll for updated scrolling behavior.
  public scrollFromComments = () => {
    const comments = document.getElementById('code-panel--comments');
    if (comments !== null) {
      // Rage scroll!
      // Reset the scroll height in case new stuff has been rendered that the
      // user is trying to get to
      if (comments.offsetHeight + comments.scrollTop >= comments.scrollHeight) {
        this.placeCommentsOnNextFrame();
      }
    }
  };

  public componentDidUpdate = async (
    prevProps: ICommentsCoreProps & ICommentsEditProps,
    prevState: ICommentsState,
    snapshot: any,
  ) => {
    if (snapshot !== null) {
      const codeScrollArea = document.getElementById('code-scroll-area');
      if (codeScrollArea !== null) {
        codeScrollArea.scrollTop = snapshot;
      }
    }

    if (this.props.windowwidth !== prevProps.windowwidth || this.props.windowheight !== prevProps.windowheight) {
      this.placeCommentsOnNextFrame();
    }

    if (this.props.file.id !== prevProps.file.id) {
      this.manualWait();
    }

    if (this.props.verticalOffset !== prevProps.verticalOffset) {
      this.placeCommentsOnNextFrame();
    }

    if (this.props.dimensions.commentsWidth !== prevProps.dimensions.commentsWidth) {
      this.placeCommentsOnNextFrame();
    }
  };

  public placeCommentsOnNextFrame = () => {
    if (this.nextFrameActionId) {
      Animation.clearNextFrameAction(this.nextFrameActionId);
    }
    this.nextFrameActionId = Animation.onNextFrame(this.setCommentPlacements);
  };

  public changeActive = (id: number | undefined) => {
    if (id === undefined) {
      const deactivatedCommentIndex = this.props.comments.findIndex((comment: CommentType) => {
        return comment.id === this.props.activeCommentID;
      });
      this.setState({ cursor: deactivatedCommentIndex });
    }
    this.props.changeActive(id);
  };

  public calculateCommentPlacements = (comments: CommentType[]): ICommentPlacement[] => {
    const blocks: BlockType[] = [];

    return comments.map((comment: CommentType) => {
      const lineHeight = CodePanelSizing.pixelsPerLine();

      const containerDifference = themeVars.grade.codeContainer.paddingTop + themeVars.grade.codeContainer.marginTop;

      let startAt =
        File.codeType(this.props.file) === 'pdf'
          ? getPDFStartPlacement(comment)
          : comment.startLine * lineHeight -
            themeVars.grade.arrowDisplacement +
            containerDifference -
            this.props.verticalOffset;

      // Find position of markdown block elements
      const blockElement: HTMLElement | null = findBlockElement(this.props.file, comment.startLine);

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
      // const intercomHeight = 60;
      // lowestCommentBottom = lastPlacement.placement + lastBlockHeight + intercomHeight;
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

    // console.table(placements);
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

      const cursored = this.props.showCursor === CURSOR_DOMAIN.COMMENTS && this.state.cursor === index;

      return (
        <Comment
          key={key}
          isStudent={this.props.isStudent}
          showExplanations={this.props.showExplanations}
          commentType={commentType}
          comment={comment}
          file={this.props.file}
          rubricComment={rubricComment}
          placement={placement}
          changeActive={this.changeActive}
          onSave={this.props.saveComment}
          onDelete={this.props.deleteComment}
          setCommentPlacements={this.placeCommentsOnNextFrame}
          removeRubricComment={this.props.removeRubricComment}
          updateFeedback={this.props.updateFeedback.bind(this, comment.id)}
          studentFeedbackOn={this.props.studentFeedbackOn}
          hideAuthor={this.props.hideAuthor}
          additiveGrading={this.props.additiveGrading}
          forcedRubricMode={this.props.forcedRubricMode}
          rubricCategories={this.props.rubricCategories}
          cursored={cursored}
        />
      );
    });

    const highlightMessage =
      !this.props.readOnly && this.props.comments.length === 0 ? (
        <div
          style={{
            top: '40vh',
            maxWidth: 250,
            textAlign: 'center',
            whiteSpace: 'normal',
            position: 'absolute',
            left: 35,
            color: this.context.consoleTheme.text,
          }}
        >
          Highlight some code to leave a comment.
        </div>
      ) : (
        <div />
      );
    return (
      <div id="comments" style={{ position: 'relative' }} className="comments" ref={this.setWrapperRef}>
        {highlightMessage}
        {commentNodes}
      </div>
    );
  }
}
Comments.contextType = ConsoleThemeContext;

const makeReadOnly = (Component: React.ComponentType<ICommentsCoreProps & ICommentsEditProps>) => {
  return class WrappedComponent extends React.Component<ICommentsCoreProps, {}> {
    public readOnly = true;
    public activeCommentID = undefined;

    public saveComment = (comment: any) => {
      return;
    };

    public changeActive = (id: number | undefined) => {
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
          {...(this.props as ICommentsCoreProps)}
          readOnly={this.readOnly}
          activeCommentID={this.activeCommentID}
          changeActive={this.changeActive}
          saveComment={this.saveComment}
          deleteComment={this.deleteComment}
          removeRubricComment={this.removeRubricComment}
          forcedRubricMode={false}
          oldCommentIDs={{}}
          showCursor={CURSOR_DOMAIN.CODE_HIDDEN}
          showExplanations={false}
        />
      );
    }
  };
};

export const GradeComments = withWindowWatcher(Comments);
export const StudentComments = withWindowWatcher(makeReadOnly(Comments));

export default withWindowWatcher(Comments);

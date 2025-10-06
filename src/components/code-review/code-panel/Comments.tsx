import * as React from 'react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import Comment from './Comment';

import { CommentType } from '../../../infrastructure/comment';

import { FileType } from '../../../infrastructure/file';

import { RubricCategoryType } from '../../../infrastructure/rubricCategory';

import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { ICommentToRubricCommentMap } from '../../../types/common';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import * as Animation from '../../../infrastructure/animation';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { CURSOR_DOMAIN } from '../CodeConsoleEnums';

interface ICommentsCoreProps extends IWithWindowWatcherProps {
  additiveGrading: boolean;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  file: FileType;
  fileIDs: number[];
  verticalOffset: number;
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

// Static helper function moved outside component
const getCommentType = (readOnly: boolean, commentID: number, activeCommentID?: number) => {
  return readOnly ? 'readonly' : commentID === activeCommentID ? 'active' : 'inactive';
};

const Comments: React.FC<ICommentsCoreProps & ICommentsEditProps> = (props) => {
  const context = useContext(ConsoleThemeContext);

  // Simplified: No absolute positioning, just sequential rendering
  // const [placements, setPlacements] = useState<ICommentPlacement[]>([]);
  const [cursor, setCursor] = useState<number>(0);
  const [fileScrollPositions, setFileScrollPositions] = useState<{ [fileID: number]: number }>(() =>
    props.fileIDs.reduce((scrollPositions: { [fid: number]: number }, fileID: number) => {
      return { ...scrollPositions, [fileID]: 0 };
    }, {}),
  );

  // Refs
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevPropsRef = useRef<ICommentsCoreProps & ICommentsEditProps>(props);

  // Disabled: Calculate comment placements
  /* const calculateCommentPlacements = useCallback(
    (comments: CommentType[]): ICommentPlacement[] => {
      const blocks: BlockType[] = [];

      return comments.map((comment: CommentType) => {
        const lineHeight = CodePanelSizing.pixelsPerLine();

        let startAt: number;

        if (File.codeType(props.file) === 'pdf') {
          startAt = getPDFStartPlacement(comment);
        } else {
          // Find position of markdown block elements first
          const blockElement = findBlockElement(props.file, comment.startLine);

          if (blockElement) {
            // Get the position relative to the code container
            const codeContainer = document.getElementById('code-container');
            if (codeContainer) {
              const blockRect = (blockElement as HTMLElement).getBoundingClientRect();
              const containerRect = codeContainer.getBoundingClientRect();
              startAt = blockRect.top - containerRect.top + codeContainer.scrollTop;
            } else {
              // Fallback to offsetTop if container not found
              startAt = (blockElement as HTMLElement).offsetTop;
            }
          } else {
            // Try to get the actual line element position
            const lineElement = document.getElementById(`line-${comment.startLine}`);

            console.log('Looking for line element:', {
              commentId: comment.id,
              startLine: comment.startLine,
              elementId: `line-${comment.startLine}`,
              found: !!lineElement,
            });

            if (lineElement) {
              // Use offsetTop which is relative to the positioned parent
              startAt = lineElement.offsetTop;

              console.log('Line element position:', {
                commentId: comment.id,
                offsetTop: lineElement.offsetTop,
                offsetParent: lineElement.offsetParent?.id,
              });
            } else {
              // Fallback: Standard calculation for regular code lines
              startAt = comment.startLine * lineHeight + themeVars.grade.codeContainer.paddingTop;

              console.log('Using fallback calculation:', {
                commentId: comment.id,
                startLine: comment.startLine,
                lineHeight,
                paddingTop: themeVars.grade.codeContainer.paddingTop,
                calculatedStartAt: startAt,
              });
            }
          }
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
    },
    [props.file],
  ); */

  // Disabled: Set bottom of comment box
  /* const setBottomOfCommentBox = useCallback(
    (lastPlacement: ICommentPlacement) => {
      const codeHeight = CodePanelSizing.codeHeight(props.file.code);

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
    },
    [props.file.code],
  ); */

  // No longer using absolute positioning - just provide stub functions
  const placeCommentsOnNextFrame = useCallback(() => {
    // No-op: comments are now rendered sequentially
  }, []);

  const setCommentPlacementsStable = useCallback(() => {
    // No-op: comments are now rendered sequentially
  }, []);

  // Jump to comment
  const jumpToComment = useCallback(async (commentID: number) => {
    await Animation.wait(100);

    // Scroll only the comments container, not the entire page
    const commentElement = document.getElementById(`comment-${commentID}`);
    const commentsContainer = document.getElementById('code-panel--comments');

    if (commentElement && commentsContainer) {
      // Prevent any scroll on the body/document
      document.body.style.overflow = 'hidden';

      // Get the comment's position within the scrollable container
      const commentOffsetTop = commentElement.offsetTop;

      // Scroll only the comments container using scrollTop (more reliable than scrollTo)
      const targetScroll = commentOffsetTop - 20; // 20px padding from top

      // Use smooth scrolling
      commentsContainer.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });

      // Re-enable body scroll after a delay
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 1000);
    }
  }, []);

  // Manual wait for PDF loading
  const manualWait = useCallback(async () => {
    await Animation.wait(5);
    placeCommentsOnNextFrame();
  }, [placeCommentsOnNextFrame]);

  // Change active comment
  const changeActive = useCallback(
    (id: number | undefined) => {
      if (id === undefined) {
        const deactivatedCommentIndex = props.comments.findIndex((comment: CommentType) => {
          return comment.id === props.activeCommentID;
        });
        setCursor(deactivatedCommentIndex);
      }
      props.changeActive(id);
    },
    [props],
  );

  // Event handlers
  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const safeAreaIDs = ['rubric-menu-container'];
      const safeAreaClassnames = ['ant-popover-inner'];
      const safeAreasFromIDs = safeAreaIDs.map((id) => document.getElementById(id));
      const safeAreasFromClassnames = safeAreaClassnames
        .map((className: string) => Array.from(document.getElementsByClassName(className)))
        .flat();
      // @ts-expect-error - Safe areas can be null or Element types
      const safeAreas = safeAreasFromIDs.concat(safeAreasFromClassnames);
      if (!props.readOnly && wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!safeAreas.some((area: Element | null) => area !== null && area.contains(event.target as Node))) {
          props.changeActive(undefined);
        }
      }
    },
    [props],
  );

  // Handle ESC key
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.keyCode === 27) {
        props.changeActive(undefined);
      }
    },
    [props],
  );

  // Handle cursor navigation
  const handleCursor = useCallback(
    async (e: KeyboardEvent) => {
      if (props.showCursor === CURSOR_DOMAIN.COMMENTS) {
        if (e.key === 'ArrowDown') {
          setCursor((prev) => Math.min(props.comments.length - 1, prev + 1));
        } else if (e.key === 'ArrowUp') {
          setCursor((prev) => Math.max(0, prev - 1));
        }
      }
    },
    [props.showCursor, props.comments.length],
  );

  // Handle scroll position restoration (replacement for getSnapshotBeforeUpdate)
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    const codeScrollArea = document.getElementById('code-scroll-area');

    if (codeScrollArea !== null && prevProps) {
      if (prevProps.file.id !== props.file.id) {
        // Save scroll position for previous file
        setFileScrollPositions((prev) => ({
          ...prev,
          [prevProps.file.id]: codeScrollArea.scrollTop,
        }));
        // Restore scroll position for current file (default to 0 for new files)
        codeScrollArea.scrollTop = fileScrollPositions[props.file.id] || 0;
      }
    }
  }, [props.file.id, fileScrollPositions, props.file]);

  // Update prevPropsRef on every render
  useEffect(() => {
    prevPropsRef.current = props;
  });

  // Disabled: Update placements when comments change (to avoid rendering with placement: 0)
  // useEffect(() => {
  //   const newPlacements = calculateCommentPlacements(props.comments);
  //   setPlacements(newPlacements);
  //   setBottomOfCommentBox(newPlacements[newPlacements.length - 1]);
  // }, [props.comments, calculateCommentPlacements, setBottomOfCommentBox]);

  // Component did mount
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleCursor);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('pdf-loaded', setCommentPlacementsStable);

    if (props.scrollToCommentID !== undefined) {
      jumpToComment(props.scrollToCommentID);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleCursor);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('pdf-loaded', setCommentPlacementsStable);
    };
  }, [
    handleClickOutside,
    handleCursor,
    handleKeyPress,
    setCommentPlacementsStable,
    props.scrollToCommentID,
    jumpToComment,
  ]);

  // Component did update - handle window resize
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    if (props.windowwidth !== prevProps.windowwidth || props.windowheight !== prevProps.windowheight) {
      placeCommentsOnNextFrame();
    }
  }, [props.windowwidth, props.windowheight, placeCommentsOnNextFrame]);

  // Component did update - handle file change
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    if (props.file.id !== prevProps.file.id) {
      manualWait();
    }
  }, [props.file.id, manualWait]);

  // Component did update - handle vertical offset change
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    if (props.verticalOffset !== prevProps.verticalOffset) {
      placeCommentsOnNextFrame();
    }
  }, [props.verticalOffset, placeCommentsOnNextFrame]);

  // Component did update - handle new comments
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    if (prevProps.comments.length < props.comments.length) {
      const newComment = props.comments.find((comment: CommentType) => {
        return comment.id < 0;
      });
      if (newComment !== undefined) {
        // Jump to the new comment after a short delay
        setTimeout(() => {
          jumpToComment(newComment.id);
        }, 500);
      }
    }
  }, [props.comments, jumpToComment]);

  // Render
  const commentNodes = props.comments.map((comment: CommentType, index: number) => {
    // No absolute positioning - comments render sequentially
    const placement = 0; // Not used anymore

    const commentType = getCommentType(props.readOnly, comment.id, props.activeCommentID);

    const rubricComment = Object.prototype.hasOwnProperty.call(props.rubricComments, comment.id)
      ? props.rubricComments[comment.id]
      : undefined;

    const key = Object.prototype.hasOwnProperty.call(props.oldCommentIDs, comment.id)
      ? props.oldCommentIDs[comment.id]
      : comment.id;

    const cursored = props.showCursor === CURSOR_DOMAIN.COMMENTS && cursor === index;

    return (
      <Comment
        key={key}
        isStudent={props.isStudent}
        showExplanations={props.showExplanations}
        commentType={commentType}
        comment={comment}
        file={props.file}
        rubricComment={rubricComment}
        placement={placement}
        changeActive={changeActive}
        onSave={props.saveComment}
        onDelete={props.deleteComment}
        setCommentPlacements={placeCommentsOnNextFrame}
        removeRubricComment={props.removeRubricComment}
        updateFeedback={props.updateFeedback.bind(null, comment.id)}
        studentFeedbackOn={props.studentFeedbackOn}
        hideAuthor={props.hideAuthor}
        additiveGrading={props.additiveGrading}
        forcedRubricMode={props.forcedRubricMode}
        rubricCategories={props.rubricCategories}
        cursored={cursored}
        isSpotlit={comment.id === props.scrollToCommentID}
      />
    );
  });

  const highlightMessage =
    !props.readOnly && props.comments.length === 0 ? (
      <div
        style={{
          top: '40vh',
          maxWidth: 250,
          textAlign: 'center',
          whiteSpace: 'normal',
          position: 'absolute',
          left: 35,
          color: context.consoleTheme.text,
        }}
      >
        Highlight some code to leave a comment.
      </div>
    ) : (
      <div />
    );

  return (
    <div
      id="comments"
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      className="comments"
      ref={wrapperRef}
    >
      {highlightMessage}
      {commentNodes}
    </div>
  );
};

const makeReadOnly = (Component: React.ComponentType<ICommentsCoreProps & ICommentsEditProps>) => {
  return class WrappedComponent extends React.Component<ICommentsCoreProps, Record<string, never>> {
    public readOnly = true;
    public activeCommentID = undefined;

    public saveComment = () => {
      return;
    };

    public changeActive = () => {
      return;
    };

    public deleteComment = () => {
      return;
    };

    public addUnsaved = () => {
      return;
    };

    public removeUnsaved = () => {
      return;
    };

    public removeRubricComment = () => {
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

const CommentsWithWindowWatcher = withWindowWatcher(Comments);

export const GradeComments = withWindowWatcher(Comments);
export const StudentComments = withWindowWatcher(makeReadOnly(Comments));

export default CommentsWithWindowWatcher;

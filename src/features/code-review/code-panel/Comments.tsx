// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import Comment from './Comment';
import SuggestedComment from './SuggestedComment';
import { useHoveredCommentId } from './CommentHighlightContext';

import { BulbOutlined, LoadingOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { CommentType, RubricCategoryType, RubricCommentType, SuggestedCommentType } from '../../../types/models';
import type { RubricComment } from '../../../api-client';
import { CommentIO } from '../../../utils/comments';

import type { FileType } from '../../../utils/file';

import { ICommentToRubricCommentMap } from '../../../types/common';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../../components/core/withWindowWatcher';

import * as Animation from '../../../utils/animation';

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
  allRubricComments?: RubricComment[];
  scrollToCommentID?: number;
  onScrolledToComment?: () => void;
  aiEnabled?: boolean; // Whether AI comment generation is available for this course
  suggestedComments?: SuggestedCommentType[];
  onAcceptSuggestion?: (suggestion: SuggestedCommentType) => Promise<void>;
  onRejectSuggestion?: (suggestion: SuggestedCommentType) => Promise<void>;
  onGenerateFileSuggestions?: () => Promise<void>;
  isGeneratingFileSuggestions?: boolean;
  /** Metadata for tracking experiment/variant on suggestions */
  suggestionsMeta?: {
    promptVariantId?: number;
    experimentId?: number;
    isCustomContext?: boolean;
  };
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

  onPin?: (data: {
    text: string;
    pointDelta: number | null;
    rubricComment: number | null;
    sourceComment: number;
    startLine?: number;
  }) => void;
  forcedUpdates?: { [id: number]: number };
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
  const onScrolledToCommentRef = useRef(props.onScrolledToComment);
  onScrolledToCommentRef.current = props.onScrolledToComment;

  const hoveredCommentId = useHoveredCommentId();

  // Re-render when PDF pages finish rendering so the vertical sort map is picked up
  const [pdfSortVersion, setPdfSortVersion] = useState(0);
  useEffect(() => {
    const handler = () => setPdfSortVersion((v) => v + 1);
    document.addEventListener('pdf-loaded', handler);
    return () => document.removeEventListener('pdf-loaded', handler);
  }, []);

  // No longer using absolute positioning - just provide stub functions
  const placeCommentsOnNextFrame = useCallback(() => {
    // No-op: comments are now rendered sequentially
  }, []);

  const setCommentPlacementsStable = useCallback(() => {
    // No-op: comments are now rendered sequentially
  }, []);

  // Track scroll requests so we can cancel stale ones
  const scrollRequestRef = useRef(0);

  /**
   * Check whether a comment element is already visible within the comments sidebar.
   * Returns true when the element's bounding rect is fully within the container's viewport.
   */
  const isCommentVisible = useCallback((commentEl: HTMLElement, containerEl: HTMLElement): boolean => {
    const commentRect = commentEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    // Use a small margin so partially clipped elements still trigger a scroll
    const margin = 10;
    return commentRect.top >= containerRect.top + margin && commentRect.bottom <= containerRect.bottom - margin;
  }, []);

  // Jump to comment
  const jumpToComment = useCallback(
    (commentID: number) => {
      // Increment request counter so any previously queued scroll becomes stale
      const requestId = ++scrollRequestRef.current;

      requestAnimationFrame(() => {
        // Bail if a newer request superseded this one
        if (requestId !== scrollRequestRef.current) return;

        const commentElement = document.getElementById(`comment-${commentID}`);
        const commentsContainer = document.getElementById('code-panel--comments');

        if (commentElement && commentsContainer) {
          // Skip the scroll if the comment is already fully visible
          if (isCommentVisible(commentElement, commentsContainer)) return;

          const commentOffsetTop = commentElement.offsetTop;
          const targetScroll = commentOffsetTop - 50; // 50px padding from top

          commentsContainer.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        }
      });
    },
    [isCommentVisible],
  );

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
      const safeAreaIDs = ['rubric-menu-container', 'code-panel'];
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
    const prevFileId = prevProps?.file.id ?? -1;
    const currentFileId = props.file.id ?? -1;

    if (codeScrollArea !== null && prevProps) {
      if (prevFileId !== currentFileId) {
        // Save scroll position for previous file
        // save scroll position on file change
        setFileScrollPositions((prev) => ({
          ...prev,
          [prevFileId]: codeScrollArea.scrollTop,
        }));
        // Restore scroll position for current file (default to 0 for new files)
        codeScrollArea.scrollTop = fileScrollPositions[currentFileId] || 0;
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
      setTimeout(() => onScrolledToCommentRef.current?.(), 1000);
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

  // Handle scroll on hover — jumpToComment already guards against scrolling to
  // an already-visible comment, and the highlight side debounces hover intent.
  useEffect(() => {
    if (hoveredCommentId !== null) {
      jumpToComment(hoveredCommentId);
    }
  }, [hoveredCommentId, jumpToComment]);

  // Build a unified, line-sorted list of comment and suggestion nodes
  type RenderItem =
    | { type: 'comment'; comment: CommentType; index: number }
    | { type: 'suggestion'; suggestion: SuggestedCommentType };

  const renderItems: RenderItem[] = [];

  props.comments.forEach((comment, index) => {
    renderItems.push({ type: 'comment', comment, index });
  });

  if (props.suggestedComments && props.onAcceptSuggestion && props.onRejectSuggestion) {
    props.suggestedComments.forEach((suggestion) => {
      renderItems.push({ type: 'suggestion', suggestion });
    });
  }

  // Sort by startLine so suggestions appear inline next to the code they reference.
  // Use CommentIO.compare for comments so same-page PDF comments sort by visual
  // position (region vs text-offset interleaving). pdfSortVersion ensures this
  // re-runs after the PDF text layer renders and the vertical map is populated.
  void pdfSortVersion; // dependency used by React's render cycle
  renderItems.sort((a, b) => {
    const lineA = a.type === 'comment' ? (a.comment.startLine ?? 0) : (a.suggestion.startLine ?? 0);
    const lineB = b.type === 'comment' ? (b.comment.startLine ?? 0) : (b.suggestion.startLine ?? 0);
    if (lineA !== lineB) return lineA - lineB;
    // Comments before suggestions on the same line
    if (a.type !== b.type) return a.type === 'comment' ? -1 : 1;
    // Both are comments on the same line — use full comparator (vertical position)
    if (a.type === 'comment' && b.type === 'comment') return CommentIO.compare(a.comment, b.comment);
    return 0;
  });

  const allNodes = renderItems.map((item) => {
    if (item.type === 'suggestion') {
      return (
        <SuggestedComment
          key={`suggestion-${item.suggestion.id}`}
          suggestion={item.suggestion}
          file={props.file}
          onAccept={props.onAcceptSuggestion!}
          onReject={props.onRejectSuggestion!}
          rubricCategories={props.rubricCategories}
          allRubricComments={props.allRubricComments}
          promptVariantId={props.suggestionsMeta?.promptVariantId}
          experimentId={props.suggestionsMeta?.experimentId}
          isCustomContext={props.suggestionsMeta?.isCustomContext}
        />
      );
    }

    const { comment, index } = item;
    const placement = 0;
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
        aiEnabled={props.aiEnabled}
        onPin={props.onPin}
        forceUpdate={props.forcedUpdates ? props.forcedUpdates[comment.id] : undefined}
      />
    );
  });

  const handleGenerateClick = async () => {
    if (!props.onGenerateFileSuggestions) return;
    try {
      await props.onGenerateFileSuggestions();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to generate AI suggestions for this file.');
    }
  };

  const generateButton =
    props.aiEnabled && props.onGenerateFileSuggestions && !props.readOnly ? (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0 4px',
        }}
      >
        <button
          onClick={handleGenerateClick}
          disabled={props.isGeneratingFileSuggestions}
          aria-label="Generate suggestions for this file"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 500,
            color: context.consoleTheme.commentAuthor,
            background: 'transparent',
            border: `1px dashed ${context.consoleTheme.commentTitleBorder}`,
            borderRadius: 6,
            cursor: props.isGeneratingFileSuggestions ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: props.isGeneratingFileSuggestions ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!props.isGeneratingFileSuggestions) {
              e.currentTarget.style.color = context.consoleTheme.text;
              e.currentTarget.style.borderColor = context.consoleTheme.text;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = context.consoleTheme.commentAuthor;
            e.currentTarget.style.borderColor = context.consoleTheme.commentTitleBorder;
          }}
        >
          {props.isGeneratingFileSuggestions ? (
            <LoadingOutlined style={{ fontSize: 13 }} />
          ) : (
            <BulbOutlined style={{ fontSize: 13 }} />
          )}
          {props.isGeneratingFileSuggestions ? 'Generating…' : 'Generate Suggestions'}
        </button>
      </div>
    ) : null;

  const hasSuggestions = (props.suggestedComments?.length ?? 0) > 0;
  const highlightMessage =
    !props.readOnly && props.comments.length === 0 && !hasSuggestions ? (
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
      {allNodes}
      {generateButton}
    </div>
  );
};

const makeReadOnly = (Component: React.ComponentType<ICommentsCoreProps & ICommentsEditProps>) => {
  return (props: ICommentsCoreProps) => {
    const readOnly = true;
    const activeCommentID = undefined;

    const saveComment = () => {
      return;
    };

    const changeActive = () => {
      return;
    };

    const deleteComment = () => {
      return;
    };

    const removeRubricComment = () => {
      return;
    };

    return (
      <Component
        {...props}
        readOnly={readOnly}
        activeCommentID={activeCommentID}
        changeActive={changeActive}
        saveComment={saveComment}
        deleteComment={deleteComment}
        removeRubricComment={removeRubricComment}
        forcedRubricMode={false}
        oldCommentIDs={{}}
        showCursor={CURSOR_DOMAIN.CODE_HIDDEN}
        showExplanations={false}
        onPin={undefined}
        forcedUpdates={undefined}
      />
    );
  };
};

const CommentsWithWindowWatcher = withWindowWatcher(Comments);

export const GradeComments = withWindowWatcher(Comments);
export const StudentComments = withWindowWatcher(makeReadOnly(Comments));

export default CommentsWithWindowWatcher;

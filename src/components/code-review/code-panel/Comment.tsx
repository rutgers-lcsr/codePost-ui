/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

/* antd imports */

// We ignore eslint since Popover never explicitly used. We just use the classNames
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CheckOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import { Card, Input, message, Popover } from 'antd';

/* codePost imports */
import { hostname } from '../../../serviceWorker';

import CPButton from '../../core/CPButton';
import CPFlex from '../../core/CPFlex';
import CPPointInput from '../../core/CPPointInput';
import CPTooltip from '../../core/CPTooltip';

import { getOperatingSystem, OS } from '../../core/operatingSystem';

import { tooltips } from '../../core/tooltips';

import BlockMarkdown from '../../core/BlockMarkdown';

import Badge from '../../core/Badge';

import { CommentType, UiComment } from '../../../infrastructure/comment';
import { File, FileType } from '../../../infrastructure/file';
import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import CodePanelHighlighting from './CodePanelHighlighting';

import { wait } from '../../../infrastructure/animation';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { findBlockElement } from './BlockUtils.tsx';

import CommentToRubric from './CommentToRubric';

/**********************************************************************************************************************/

export type UICommentType = 'readonly' | 'active' | 'inactive';

export type CommentStatus = 'edited' | 'saved' | 'idle' | 'error';

const { TextArea } = Input;

/* Compare two rubricComments using a minimal number of comparisons
 * This function defines what rubricComment equality means from the perspective of a comment.
 * For example, we shouldn't need to save a comment just because its rubricComment.comments
 * field changed (e.g. because the rubric comment was applied by another comment somewhere else).
 */
const cheapEqRubricComments = (rc1: RubricCommentType | undefined, rc2: RubricCommentType | undefined) => {
  // Returns true if references match OR if both rc1 and rc2 are undefined
  if (rc1 === rc2) {
    return true;
  }

  // At this point, if this returns, only one of rc1 and rc2 are undefined
  if (rc1 === undefined || rc2 === undefined) {
    return false;
  }

  // Now, we know neither rc1 nor rc2 is undefined, so we can go ahead and compare meaningful properties
  if (rc1.text !== rc2.text) {
    return false;
  }

  if (rc1.pointDelta !== rc2.pointDelta) {
    return false;
  }

  if (rc1.category !== rc2.category) {
    return false;
  }

  return true;
};

const isEmpty = (text: null | string, pointDelta: number, rubricComment: RubricCommentType | undefined) => {
  return (!text || text.length === 0) && pointDelta === 0 && rubricComment === undefined;
};

interface ICommentProps {
  additiveGrading: boolean;
  commentType: UICommentType;
  comment: CommentType;
  file: FileType;
  rubricComment?: RubricCommentType;
  rubricCategories: RubricCategoryType[];

  isStudent: boolean;
  showExplanations: boolean;

  placement: number;

  changeActive: (id: number | undefined) => void;
  onSave: (comment: CommentType) => void;
  onDelete: (comment: CommentType) => void;
  removeRubricComment: (comment: CommentType, rubricComment: RubricCommentType) => void;

  setCommentPlacements: () => void;

  updateFeedback: (feedback: number) => void;
  studentFeedbackOn: boolean;

  hideAuthor: boolean;
  forcedRubricMode: boolean;

  cursored: boolean;
  isSpotlit?: boolean;
}

/**
 * Comment Component
 *
 * Displays and manages individual code comments with point values and text feedback.
 *
 * Key behaviors:
 * - Local state (text, points) is maintained for responsive editing without parent re-renders
 * - State syncs with props only when not actively editing (status !== 'edited')
 * - Saves occur on:
 *   1. Clicking the save button (checkmark)
 *   2. Pressing Shift+Enter
 *   3. Deactivating the comment (clicking away) if there are unsaved changes
 * - Empty comments are automatically deleted when deactivated
 *
 * Point representation:
 * - Internal storage: positive = penalty, negative = bonus
 * - Display: CPPointInput handles sign conversion via toggle (red/green)
 */
const Comment: React.FC<ICommentProps> = (props) => {
  const consoleTheme = useContext(ConsoleThemeContext);
  const prevPropsRef = useRef<ICommentProps>();

  // Destructure callback functions to use in dependency arrays (prevents entire props object being a dependency)
  const { setCommentPlacements, changeActive, removeRubricComment, updateFeedback } = props;

  // Store setCommentPlacements in a ref to avoid it triggering useEffect re-runs
  const setCommentPlacementsRef = useRef(setCommentPlacements);
  useEffect(() => {
    setCommentPlacementsRef.current = setCommentPlacements;
  }, [setCommentPlacements]);

  /**********************************************************************************************************************/
  /* State Initialization
  /**********************************************************************************************************************/
  const initState = useCallback(() => {
    const text: string = props.comment.text ? props.comment.text : '';
    const points: number = UiComment.points(props.comment, props.rubricComment);
    const status: CommentStatus = text === '' && points === 0 && props.rubricComment === undefined ? 'edited' : 'idle';
    return { text, points, status };
  }, [props.comment, props.rubricComment]);

  const [status, setStatus] = useState<CommentStatus>(() => initState().status);
  const [text, setText] = useState<string>(() => initState().text);
  const [points, setPoints] = useState<number>(() => initState().points);
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [hasHover, setHasHover] = useState(false);
  const [makeRubric, setMakeRubric] = useState(false);

  /**********************************************************************************************************************/
  /* Helper Functions
  /**********************************************************************************************************************/

  const roundDownToNearestMultiple = (n: number, m: number) => {
    return Math.floor(n / m) * m;
  };

  const roundUpToNearestMultiple = (n: number, m: number) => {
    return Math.ceil(n / m) * m;
  };

  /**********************************************************************************************************************/
  /* Status Management
  /**********************************************************************************************************************/

  const edited = useCallback(() => {
    setStatus('edited');
  }, []);

  const idle = useCallback(() => {
    setStatus('idle');
  }, []);

  const fadeSavedState = useCallback(async () => {
    setStatus('saved');
    await wait(1000);
    setStatus('idle');
  }, []);

  const highlightRelatedComment = useCallback(() => {
    CodePanelHighlighting.brightenHighlight(props.comment.id);

    const blockElement = findBlockElement(props.file, props.comment.startLine) as HTMLElement | null;

    if (blockElement) {
      blockElement.className = `markdown-block markdown-block--focused ${
        props.commentType === 'readonly' ? 'readonly' : 'active'
      }`;
      blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [props.comment.id, props.comment.startLine, props.file, props.commentType]);

  const unhighlightRelatedComment = useCallback(() => {
    CodePanelHighlighting.darkenHighlight(props.comment.id);

    const blockElement = findBlockElement(props.file, props.comment.startLine) as HTMLElement | null;

    if (blockElement) {
      blockElement.className = `markdown-block markdown-block--commented ${
        props.commentType === 'readonly' ? 'readonly' : 'active'
      }`;
    }
  }, [props.comment.id, props.comment.startLine, props.file, props.commentType]);

  /**
   * Saves the comment with current local state (text and points).
   * Called when:
   * - User clicks the save button
   * - User presses Shift+Enter
   * - Comment is deactivated with unsaved changes
   */
  const save = useCallback(
    async (hexVal?: string) => {
      unhighlightRelatedComment();

      const comment = {
        ...props.comment,
        text: text,
        pointDelta: props.rubricComment ? null : points,
        rubricComment: props.rubricComment ? props.rubricComment.id : null,
        color: hexVal ? hexVal : props.comment.color,
      };

      try {
        await props.onSave(comment);
        fadeSavedState();
        setCommentPlacementsRef.current();
      } catch (error) {
        message.error(`Error saving comment: ${JSON.stringify(error)}`);
      }
    },
    [text, points, props, unhighlightRelatedComment, fadeSavedState],
  );

  const deleteComment = useCallback(
    async (e: React.MouseEvent | KeyboardEvent) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        await props.onDelete(props.comment);
        setCommentPlacementsRef.current();
      } catch (error) {
        message.error(`Error deleting comment: ${JSON.stringify(error)}`);
      }
    },
    [props],
  );

  /**********************************************************************************************************************/
  /* Comment Activation/Deactivation
  /**********************************************************************************************************************/

  const activate = useCallback(() => {
    changeActive(props.comment.id);
  }, [props.comment.id, changeActive]);

  const deactivate = useCallback(() => {
    changeActive(undefined);
  }, [changeActive]);

  /**********************************************************************************************************************/
  /* Rubric Comment Handlers
  /**********************************************************************************************************************/

  const removeRubricCommentHandler = useCallback(() => {
    if (props.rubricComment) {
      edited();

      if (props.forcedRubricMode) {
        setText('');
      }

      removeRubricComment(props.comment, props.rubricComment);
      setCommentPlacementsRef.current();
    }
  }, [props.rubricComment, props.forcedRubricMode, props.comment, edited, removeRubricComment]);

  /**********************************************************************************************************************/
  /* Point Input Handlers
  /**********************************************************************************************************************/

  const onChangePointInput = useCallback(
    (value: string | number) => {
      const parsed = parseFloat(value.toString());
      /**
       * CPPointInput handles sign conversion based on its toggle state (positive/negative).
       * The value received here already has the correct sign, so we use it directly.
       */
      const newPoints = isNaN(parsed) ? points : parsed;

      if (newPoints !== UiComment.points(props.comment, props.rubricComment)) {
        edited();
      } else {
        idle();
      }
      setPoints(newPoints);
    },
    [points, props.comment, props.rubricComment, edited, idle],
  );

  /**
   * Handles the plus button in the point input (decreases penalty or increases bonus).
   * Note: In the internal representation, more positive = more penalty.
   * So "plus" from the user's perspective means subtract 0.5 from internal value.
   */
  const onPlus = useCallback(() => {
    const newPoints = roundDownToNearestMultiple(points, 0.5) - 0.5;

    if (newPoints !== UiComment.points(props.comment, props.rubricComment)) {
      edited();
    } else {
      idle();
    }
    setPoints(newPoints);
  }, [points, props.comment, props.rubricComment, edited, idle]);

  /**
   * Handles the minus button in the point input (increases penalty or decreases bonus).
   * Note: In the internal representation, more positive = more penalty.
   * So "minus" from the user's perspective means add 0.5 to internal value.
   */
  const onMinus = useCallback(() => {
    const newPoints = roundUpToNearestMultiple(points, 0.5) + 0.5;

    if (newPoints !== UiComment.points(props.comment, props.rubricComment)) {
      edited();
    } else {
      idle();
    }
    setPoints(newPoints);
  }, [points, props.comment, props.rubricComment, edited, idle]);

  /**********************************************************************************************************************/
  /* Text Input Handlers
  /**********************************************************************************************************************/

  const onChangeText = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setText(newText);
      if (newText !== props.comment.text) {
        edited();
      } else {
        idle();
      }
    },
    [props.comment.text, edited, idle],
  );

  const handleShiftEnter = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        save();
        deactivate();
      }
    },
    [save, deactivate],
  );

  const onCommentClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.textContent === 'expand') {
        e.stopPropagation();
      } else {
        activate();
      }
    },
    [activate],
  );

  const confirmDelete = useCallback(
    (e: React.MouseEvent | KeyboardEvent) => {
      deleteComment(e);
      setShowDeletePopover(false);
    },
    [deleteComment],
  );

  const confirmCancelDelete = useCallback(() => {
    setShowDeletePopover(false);
  }, []);

  const handleDeletePopoverVisibleChange = useCallback((visible: boolean) => {
    setShowDeletePopover(visible);
  }, []);

  const handleCursorHotkeys = useCallback(
    (e: KeyboardEvent) => {
      if (!props.cursored) {
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey && !showDeletePopover) {
        e.preventDefault();
        e.stopPropagation();
        if (props.commentType === 'active') {
          changeActive(undefined);
        } else {
          changeActive(props.comment.id);
        }
      }

      const os = getOperatingSystem();
      const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

      if (e.key === 'd' && triggerKey) {
        e.preventDefault();
        e.stopPropagation();

        if (!showDeletePopover) {
          setShowDeletePopover(true);
        } else {
          confirmDelete(e);
        }
      }
    },
    [props.cursored, props.commentType, props.comment.id, showDeletePopover, confirmDelete, changeActive],
  );

  const handleHotkeys = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeletePopover) {
          confirmCancelDelete();
        } else {
          changeActive(undefined);
        }
      }

      if (showDeletePopover && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        confirmDelete(e);
      }

      if (props.commentType !== 'active') {
        return;
      }

      const os = getOperatingSystem();
      const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

      if (e.key === 'd' && triggerKey) {
        e.preventDefault();
        e.stopPropagation();

        if (!showDeletePopover) {
          setShowDeletePopover(true);
        } else {
          confirmDelete(e);
        }
      }

      if (e.key === 'u' && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        removeRubricCommentHandler();
      }

      if (e.key === '[' && props.rubricComment === undefined && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        onMinus();
      } else if (e.key === ']' && props.rubricComment === undefined && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
        onPlus();
      } else if (['[', ']'].includes(e.key) && triggerKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [
      showDeletePopover,
      props.commentType,
      props.rubricComment,
      confirmCancelDelete,
      confirmDelete,
      removeRubricCommentHandler,
      onMinus,
      onPlus,
      changeActive,
    ],
  );

  const onMouseEnter = useCallback(() => {
    setHasHover(true);
    highlightRelatedComment();
  }, [highlightRelatedComment]);

  const onMouseLeave = useCallback(() => {
    setHasHover(false);
    unhighlightRelatedComment();
  }, [unhighlightRelatedComment]);

  // ComponentDidMount - setup event listeners
  useEffect(() => {
    const handleCursorHotkeysTyped = handleCursorHotkeys as unknown as EventListener;
    const handleHotkeysTyped = handleHotkeys as unknown as EventListener;

    document.addEventListener('keydown', handleCursorHotkeysTyped);
    document.addEventListener('keydown', handleHotkeysTyped);

    // Schedule placement calculation on next frame after mount
    // This allows the TextArea to render and determine its actual height
    setCommentPlacementsRef.current();

    return () => {
      document.removeEventListener('keydown', handleCursorHotkeysTyped);
      document.removeEventListener('keydown', handleHotkeysTyped);
    };
    // Empty deps means this only runs once on mount, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ComponentDidUpdate - Handle all prop changes
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    if (!prevProps) {
      prevPropsRef.current = props;
      return;
    }

    // If a rubric comment is linked, unlinked, or updated, make sure to recalculate points
    if (!cheapEqRubricComments(prevProps.rubricComment, props.rubricComment)) {
      if (props.forcedRubricMode && props.rubricComment === undefined) {
        setPoints(0);
      } else if (prevProps.rubricComment !== undefined && props.rubricComment === undefined) {
        setPoints(prevProps.rubricComment.pointDelta);
      } else {
        const commentTextArea = document.getElementById('comment-text-area');
        if (commentTextArea !== null) {
          commentTextArea.focus();
        }

        setPoints(UiComment.points(props.comment, props.rubricComment));
      }

      if (props.rubricComment) {
        if (props.rubricComment.instructionText && props.rubricComment.templateTextOn) {
          setText(props.rubricComment.instructionText);
        }
      }

      setCommentPlacementsRef.current();
    }

    if (props.commentType !== prevProps.commentType) {
      setCommentPlacementsRef.current();
    }

    /**
     * Sync local state with incoming props when not actively editing.
     * This prevents overwriting the user's input while they're typing,
     * but allows updates from the server (after save) to be reflected.
     */
    if (status !== 'edited') {
      if (prevProps.comment.text !== props.comment.text) {
        setText(props.comment.text || '');
      }

      if (!props.rubricComment && prevProps.comment.pointDelta !== props.comment.pointDelta) {
        setPoints(props.comment.pointDelta || 0);
      }
    }

    /**********************************************************************************/
    /* BEGIN: FOOBAR CONFIG
    /**********************************************************************************/
    if (props.commentType !== prevProps.commentType) {
      const makeColor = (color: string) => {
        let hexVal = '#fff';
        switch (color) {
          case 'red':
            hexVal = '#D08B79';
            break;
          case 'green':
            hexVal = '#A4D079';
            break;
          case 'purple':
            hexVal = '#ABAEEF';
            break;
        }
        save(hexVal);
      };

      const makeRubricCommentFn = () => {
        setMakeRubric(true);
      };

      if (props.commentType === 'active') {
        (window as any).setFoobarParams('color', ['red', 'green', 'purple']);
        (window as any).addToFoobar({
          label: 'Set comment color to {{color}}',
          value: 'Set comment color to ',
          kind: 'dynamic',
          child: {
            kind: 'action',
            callback: makeColor,
          },
        });
        (window as any).addToFoobar({
          label: 'Add comment to rubric',
          value: 'Add comment to rubric',
          kind: 'action',
          callback: makeRubricCommentFn,
        });
      } else {
        (window as any).removeFromFoobar('Set comment color to {{color}}');
        (window as any).removeFromFoobar('Add comment to rubric');
      }
    }
    /**********************************************************************************/
    /* END: FOOBAR CONFIG
    /**********************************************************************************/

    // If a comment is finalized, then reset the state
    if (['active', 'inactive'].includes(prevProps.commentType) && props.commentType === 'readonly') {
      const newState = initState();
      setText(newState.text);
      setPoints(newState.points);
      setStatus(newState.status);
    }

    // If the comment is a new comment, and was previously active, and if the file is the same (not switching of files), activate this comment
    if (
      prevProps.comment.id !== props.comment.id &&
      prevProps.commentType === 'active' &&
      prevProps.file.id === props.file.id
    ) {
      activate();
    }

    /**
     * Handle comment deactivation (when user clicks away).
     * - If the comment is empty, delete it (likely created by mistake)
     * - If there are unsaved edits, save them automatically
     */
    if (
      prevProps.commentType === 'active' &&
      props.commentType === 'inactive' &&
      prevProps.comment.id === props.comment.id
    ) {
      if (isEmpty(text, points, props.rubricComment)) {
        props.onDelete(props.comment);
      } else if (status === 'edited') {
        save();
      }
    }

    prevPropsRef.current = props;
  }, [props, text, points, status, initState, activate, save]);

  // Render
  const className = `cp-comment cp-comment--${props.commentType} ant-popover ant-popover-placement-rightTop`;

  const commentElements: { [key: string]: React.ReactNode } = {
    line: null,
    points: null,
    status: null,
    comment: null,
    rubricComment: null,
    rubricCommentAction: null,
    saveButton: null,
    deleteButton: null,
    author: null,
    share: null,
  };

  let onClick;
  let cursor = 'auto';
  let shadow;

  //////////////////////////////////////////////////////////////////////////////////////////
  // -------------------------- codeType ['code', 'markdown'] --------------------------- //
  //////////////////////////////////////////////////////////////////////////////////////////

  if (['markdown', 'jupyter'].includes(File.codeType(props.file))) {
    commentElements.line = (
      <span
        className="cp-label--mid-bold cp-label--italic"
        style={{ color: consoleTheme.consoleTheme.commentTitleText }}
      >
        Block {props.comment.startLine + 1}
      </span>
    );
  } else if (File.codeType(props.file) === 'pdf') {
    commentElements.line = (
      <span
        className="cp-label--mid-bold cp-label--italic"
        style={{ color: consoleTheme.consoleTheme.commentTitleText }}
      >
        Page {props.comment.startLine}
      </span>
    );
  } else {
    commentElements.line = (
      <span
        className="cp-label--mid-bold cp-label--italic"
        style={{ color: consoleTheme.consoleTheme.commentTitleText }}
      >
        Line {props.comment.startLine + 1}
      </span>
    );
  }

  const badge = <Badge count={points * -1} />;

  //////////////////////////////////////////////////////////////////////////////////////////
  // ------------------------------------- author --------------------------------------- //
  //////////////////////////////////////////////////////////////////////////////////////////

  if (props.comment.author && (!props.isStudent || !props.hideAuthor)) {
    commentElements.author = (
      <span
        className="cp-label--italic cp-label--very-small"
        style={{ color: consoleTheme.consoleTheme.commentAuthor }}
      >
        Author: {props.comment.author}
      </span>
    );
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // ------------------------------------- share ---------------------------------------- //
  //////////////////////////////////////////////////////////////////////////////////////////

  const shareComment = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const host = hostname();
    const link = `${host}/code/${props.file.submission}/?comment=${props.comment.id}`;
    const element = document.createElement('textarea');
    element.value = link;
    document.body.appendChild(element);
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
    message.info('Link copied to clipboard!');
  };

  commentElements.share = (
    <span className="comment-share">
      <CPButton
        type="secondary"
        onClick={shareComment}
        icon={<LinkOutlined />}
        style={{ cursor: 'pointer', border: '0px', backgroundColor: 'transparent', marginLeft: '-9px' }}
      />
    </span>
  );

  //////////////////////////////////////////////////////////////////////////////////////////
  // -------------------- commentStatus ['edited', 'saved', 'error'] -------------------- //
  //////////////////////////////////////////////////////////////////////////////////////////

  switch (status) {
    case 'edited':
      commentElements.status = (
        <span
          className="cp-label--small cp-label--italic"
          style={{ color: consoleTheme.consoleTheme.commentTitleText, marginLeft: '-9px' }}
        >
          {!text ? '' : 'Edited...'}
        </span>
      );
      break;
    case 'saved':
      commentElements.status = <span className="cp-label--small cp-label--italic cp-label--success">Saved!</span>;
      break;
    case 'error':
      commentElements.status = <span className="cp-label--small cp-label--italic cp-label--error">Error!</span>;
      break;
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // ------------------ commentType ['active', 'inactive', 'readonly'] ------------------ //
  //////////////////////////////////////////////////////////////////////////////////////////

  const popoverContent = (
    <CPFlex
      left={[]}
      right={[
        <CPButton cpType="secondary" size="small" style={{ width: '60px' }} onClick={confirmCancelDelete}>
          No
        </CPButton>,
        <CPButton cpType="danger" size="small" style={{ width: '60px' }} onClick={confirmDelete}>
          Yes
        </CPButton>,
      ]}
      gutterSize={14}
    />
  );

  if (props.commentType === 'active') {
    const tooltip = props.rubricComment ? tooltips.grade.comments.pointsDisabled : null;

    const shouldDisableTextArea = props.forcedRubricMode && props.rubricComment === undefined;

    const forcedRubricTooltip = shouldDisableTextArea
      ? 'You must link a Rubric Comment before writing any feedback.'
      : null;

    commentElements.points = (
      <CPTooltip title={tooltip} hideThisOnHideTips={true}>
        <div>
          <CPPointInput
            value={-points}
            size="small"
            onChange={onChangePointInput}
            disabled={props.forcedRubricMode || props.rubricComment ? true : false}
            onKeyDown={handleShiftEnter}
            defaultToPositive={props.additiveGrading}
          />
        </div>
      </CPTooltip>
    );

    commentElements.comment = (
      <CPTooltip title={forcedRubricTooltip} hideThisOnHideTips={true}>
        <TextArea
          id="comment-text-area"
          autoSize
          className="cp-comment__text-area"
          placeholder={
            props.rubricComment && !props.rubricComment.templateTextOn ? props.rubricComment.instructionText : undefined
          }
          value={text}
          onChange={onChangeText}
          onPressEnter={handleShiftEnter}
          style={{
            backgroundColor: consoleTheme.consoleTheme.commentTextArea,
            color: consoleTheme.consoleTheme.text,
          }}
          autoFocus
          disabled={shouldDisableTextArea}
          onFocus={(e) => {
            const temp_value = e.target.value;
            e.target.value = '';
            e.target.value = temp_value;
          }}
        />
      </CPTooltip>
    );

    commentElements.saveButton = (
      <CPButton
        cpType="secondary"
        icon={<CheckOutlined />}
        onClick={() => {
          save();
          deactivate();
        }}
      />
    );
    commentElements.deleteButton = isEmpty(text, points, props.rubricComment) ? (
      <CPButton cpType="danger" icon={<DeleteOutlined />} onClick={confirmDelete} />
    ) : (
      <Popover
        title="Are you sure you want to delete this comment?"
        open={showDeletePopover}
        onOpenChange={handleDeletePopoverVisibleChange}
        trigger="click"
        placement="bottomRight"
        content={popoverContent}
      >
        <CPButton cpType="danger" icon={<DeleteOutlined />} />
      </Popover>
    );

    if (props.rubricComment) {
      commentElements.rubricCommentAction = (
        <span
          style={{
            position: 'absolute',
            right: '20px',
            top: '42px',
            cursor: 'pointer',
          }}
          onClick={removeRubricCommentHandler}
        >
          X
        </span>
      );
    }

    shadow = { boxShadow: consoleTheme.consoleTheme.commentShadow };
  }

  const preventDefaultFn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (props.commentType === 'inactive') {
    commentElements.points = badge;
    commentElements.comment = (
      <div className="cp-comment__comment" style={{ color: consoleTheme.consoleTheme.text }}>
        <BlockMarkdown source={text} />
      </div>
    );
    // Only shown delete button on inactive comment when the user is hovering
    commentElements.deleteButton = hasHover ? (
      <Popover
        title="Are you sure you want to delete this comment?"
        open={showDeletePopover}
        onOpenChange={handleDeletePopoverVisibleChange}
        trigger="click"
        placement="bottomRight"
        content={popoverContent}
      >
        <CPButton cpType="danger" icon={<DeleteOutlined />} onClick={preventDefaultFn} />
      </Popover>
    ) : (
      <Popover
        title="Are you sure you want to delete this comment?"
        open={showDeletePopover}
        onOpenChange={handleDeletePopoverVisibleChange}
        trigger="click"
        placement="bottomRight"
        content={popoverContent}
      />
    );

    onClick = onCommentClick;
    cursor = 'pointer';
  }

  if (props.commentType === 'readonly') {
    commentElements.points = badge;
    commentElements.comment = (
      <div className="cp-comment__comment" style={{ color: consoleTheme.consoleTheme.text }}>
        <BlockMarkdown source={text} />
      </div>
    );
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // --------------------------------- rubricComment ------------------------------------ //
  //////////////////////////////////////////////////////////////////////////////////////////

  if (props.rubricComment) {
    let rubricCommentClassName = 'cp-comment__rubric-comment';
    let style: React.CSSProperties = {};
    if (props.rubricComment.pointDelta > 0) {
      rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--negative');
    } else if (props.rubricComment.pointDelta < 0) {
      rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--positive');
    } else {
      rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--neutral');
      style = {
        color: consoleTheme.consoleTheme.commentRubricCommentNeutral,
        borderLeft: `3px solid ${consoleTheme.consoleTheme.commentRubricCommentNeutral}`,
      };
    }

    // Note: we should always be able to find the rubricComment's category in
    // props.rubricCategories, but we're playing it safe here.
    let rubricCategoryTitle = '';
    const matchedCategory = props.rubricCategories.find((cat: RubricCategoryType) => {
      return cat.id === props.rubricComment!.category;
    });
    if (matchedCategory !== undefined) {
      rubricCategoryTitle = matchedCategory.name;
    }

    commentElements.rubricComment = (
      <div className={rubricCommentClassName} style={style}>
        <span className="cp-label--very-bold">{rubricCategoryTitle}</span>
        <BlockMarkdown
          source={
            (props.isStudent || props.showExplanations) && props.rubricComment.explanation
              ? props.rubricComment.explanation
              : props.rubricComment.text
          }
          em={!props.isStudent && props.showExplanations && props.rubricComment.explanation.length > 0}
        />
        {commentElements.rubricCommentAction}
      </div>
    );
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // --------------------------------- feedback      ------------------------------------ //
  //////////////////////////////////////////////////////////////////////////////////////////

  let feedback = null;

  if (props.isStudent && props.rubricComment && props.studentFeedbackOn) {
    const feedbackScore = props.comment.feedback;

    const handleMouseDownThumbsDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateFeedback(feedbackScore === -1 ? 0 : -1);
    };

    const handleMouseDownThumbsUp = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateFeedback(feedbackScore === 1 ? 0 : 1);
    };

    feedback = (
      <div
        style={{
          display: 'flex',
          width: '100%',
          marginTop: '0px',
        }}
      >
        <CPButton
          onMouseDown={handleMouseDownThumbsDown}
          style={{
            width: '50%',
            padding: '8px',
            cursor: 'pointer',
            backgroundColor: feedbackScore === -1 ? '#1890ff' : '#f0f0f0',
            color: feedbackScore === -1 ? 'white' : 'black',
            border: '1px solid #d9d9d9',
            borderRadius: '2px 0 0 0',
          }}
          title={feedbackScore === -1 ? 'Click to undo.' : 'I found this comment unhelpful.'}
        >
          👎
        </CPButton>
        <CPButton
          onMouseDown={handleMouseDownThumbsUp}
          style={{
            width: '50%',
            padding: '8px',
            cursor: 'pointer',
            backgroundColor: feedbackScore === 1 ? '#1890ff' : '#f0f0f0',
            color: feedbackScore === 1 ? 'white' : 'black',
            border: '1px solid #d9d9d9',
            borderLeft: 'none',
            borderRadius: '0 2px 0 0',
          }}
          title={feedbackScore === 1 ? 'Click to undo.' : 'I found this comment helpful.'}
        >
          👍
        </CPButton>
      </div>
    );
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // ---------------------------------- Components -------------------------------------- //
  //////////////////////////////////////////////////////////////////////////////////////////

  let titleLeft = [commentElements.line, commentElements.share, commentElements.status];
  // FIXME: Implement comment deep-linking and scrolling for block rendered files
  if (['markdown', 'jupyter', 'pdf'].includes(File.codeType(props.file))) {
    titleLeft = [commentElements.line, commentElements.status];
  }

  const titleRight = [commentElements.points];

  const footerLeft = [commentElements.author];

  const footerRight = [commentElements.saveButton, commentElements.deleteButton];

  // Sets zIndex explicitly to avoid style conflict when modals open on this page
  // Per: https://github.com/ant-design/ant-design/issues/6722
  const backgroundColor =
    props.cursored || props.isSpotlit
      ? 'lightblue'
      : props.comment.tags !== undefined && props.comment.tags.includes('late')
        ? '#fffbe6'
        : props.comment.color !== undefined && props.comment.color !== null
          ? props.comment.color
          : consoleTheme.consoleTheme.commentBody;

  const cardTitle = <CPFlex left={titleLeft} right={titleRight} gutterSize={14} />;

  const cardExtra =
    props.commentType === 'readonly' && props.hideAuthor ? null : (
      <CPFlex left={footerLeft} right={footerRight} gutterSize={10} style={{ minHeight: '32px' }} />
    );
  return (
    <>
      <div
        className={className}
        id={`comment-${props.comment.id}`}
        style={{
          cursor,
          position: 'relative',
          marginBottom: feedback ? '0px' : '10px',
        }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-status={status}
      >
        <Card
          title={cardTitle}
          variant="outlined"
          style={{
            backgroundColor,
            ...shadow,
          }}
          styles={{
            body: {
              padding: '12px 16px',
              backgroundColor,
            },
            header: { padding: '8px 16px', minHeight: '40px' },
            title: { fontSize: '14px', fontWeight: 500, color: consoleTheme.consoleTheme.commentTitleText },
            extra: { marginTop: '4px' },
          }}
        >
          <div className="ant-popover-arrow" style={{ borderColor: backgroundColor }} />
          {commentElements.rubricComment}
          {commentElements.comment}
          {cardExtra && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: `1px solid ${consoleTheme.consoleTheme.commentTitleBorder}`,
              }}
            >
              {cardExtra}
            </div>
          )}
        </Card>
        {feedback && <div style={{ marginBottom: '10px' }}>{feedback}</div>}

        <CommentToRubric
          initialText={text}
          initialPointDelta={points}
          visible={makeRubric}
          rubricCategories={props.rubricCategories}
          onCancel={() => setMakeRubric(false)}
        />
      </div>
    </>
  );
};

export default Comment;

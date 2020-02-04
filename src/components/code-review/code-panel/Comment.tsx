/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* antd imports */

// We ignore eslint since Popover never explicitly used. We just use the classNames
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button, Icon, Input, message, Popconfirm, Popover, Tooltip } from 'antd';

/* codePost imports */

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

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import { findBlockElement } from './BlockUtils.tsx';
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
}

interface ICommentState {
  status: CommentStatus;
  text: string;
  points: number;
  showDeletePopover: boolean;
  hasHover: boolean;
}

class Comment extends React.Component<ICommentProps, ICommentState> {
  private saveTimeout: any;

  public constructor(props: ICommentProps, context: any) {
    super(props, context);
    this.state = this.init();
  }

  public componentDidMount() {
    document.addEventListener('keydown', this.handleCursorHotkeys);
    document.addEventListener('keydown', this.handleHotkeys);
    this.props.setCommentPlacements();
  }

  public componentWillUnmount() {
    document.removeEventListener('keydown', this.handleCursorHotkeys);
    document.removeEventListener('keydown', this.handleHotkeys);
  }

  public componentDidUpdate(prevProps: ICommentProps) {
    // If a rubric comment is linked, unlinked, or updated, make sure to recalculate points
    if (!cheapEqRubricComments(prevProps.rubricComment, this.props.rubricComment)) {
      if (this.props.forcedRubricMode && this.props.rubricComment === undefined) {
        this.setState({ points: 0 });
      } else if (prevProps.rubricComment !== undefined && this.props.rubricComment === undefined) {
        this.setState({
          points: prevProps.rubricComment.pointDelta,
        });
      } else {
        const commentTextArea = document.getElementById('comment-text-area');
        if (commentTextArea !== null) {
          commentTextArea.focus();
        }

        this.setState({
          points: UiComment.points(this.props.comment, this.props.rubricComment),
        });
      }

      if (this.props.rubricComment) {
        if (this.props.rubricComment.instructionText && this.props.rubricComment.templateTextOn)
          this.setState({ text: this.props.rubricComment.instructionText });
      }

      this.props.setCommentPlacements();
      this.resetSaveTimeOut();
    }

    if (this.props.commentType !== prevProps.commentType) {
      this.props.setCommentPlacements();
    }

    // If a comment is finalized, then reset the state
    if (['active', 'inactive'].includes(prevProps.commentType) && this.props.commentType === 'readonly') {
      this.setState(this.init());
    }

    // If the comment is a new comment, and was previously active, and if the file is the same (not switching of files), activate this comment
    if (
      prevProps.comment.id !== this.props.comment.id &&
      prevProps.commentType === 'active' &&
      prevProps.file.id === this.props.file.id
    ) {
      this.activate();
    }

    // Destroy when un-focusing and comments remains empty (this was probably a mistake comment)
    // Only destroy if the comment id is the same. Otherwise, if a user only changes pointInput on a new comment it will delete.
    // This is because new comments temporarily de-activate because the comment ID has changed.
    // NOTE: This is the only place where we delete empty comments. There is a known bug that empty comments will persist
    //       if they are refreshed while still active.
    if (
      prevProps.commentType === 'active' &&
      this.props.commentType === 'inactive' &&
      prevProps.comment.id === this.props.comment.id
    ) {
      if (this.state.text.length === 0 && this.state.points === 0 && this.props.rubricComment === undefined) {
        this.props.onDelete(this.props.comment);
      }
    }

    if (!prevProps.cursored && this.props.cursored && prevProps.commentType !== 'active') {
      const scrollArea = document.getElementById('code-scroll-area');
      if (scrollArea !== null) {
        setTimeout(() => {
          if (
            this.props.placement > scrollArea.scrollTop + window.innerHeight - 100 ||
            this.props.placement < scrollArea.scrollTop
          ) {
            scrollArea.scrollTop = Math.max(0, this.props.placement - 100);
          }
        });
      }
    }
  }

  public init = (): ICommentState => {
    const text: string = this.props.comment.text ? this.props.comment.text : '';
    const points: number = UiComment.points(this.props.comment, this.props.rubricComment);
    const status: CommentStatus =
      text === '' && points === 0 && this.props.rubricComment === undefined ? 'edited' : 'idle';
    return { text, points, status, showDeletePopover: false, hasHover: false };
  };

  /***********************************************************************************************/
  /* Hover handlers
  /***********************************************************************************************/

  public onMouseEnter = () => {
    this.highlightRelatedComment();
    this.handleHoverEvent();
  };

  public onMouseLeave = () => {
    this.unhighlightRelatedComment();
    this.handleHoverEvent();
  };

  public handleHoverEvent = () => {
    this.setState((oldState) => {
      return { hasHover: !oldState.hasHover };
    });
  };

  /***********************************************************************************************/

  public save = async () => {
    this.unhighlightRelatedComment();

    const comment = {
      ...this.props.comment,
      text: this.state.text,
      pointDelta: this.props.rubricComment ? null : this.state.points,
      rubricComment: this.props.rubricComment ? this.props.rubricComment.id : null,
    };

    try {
      await this.props.onSave(comment);
      this.fadeSavedState();
      this.props.setCommentPlacements();
    } catch (error) {
      message.error(`Error saving comment: ${JSON.stringify(error)}`);
    }
  };

  public handleCursorHotkeys = (e: any) => {
    if (!this.props.cursored) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey && !this.state.showDeletePopover) {
      e.preventDefault();
      e.stopPropagation();
      if (this.props.commentType === 'active') {
        this.props.changeActive(undefined);
      } else {
        this.props.changeActive(this.props.comment.id);
      }
    }

    const os = getOperatingSystem();
    const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

    if (e.key === 'd' && triggerKey) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.state.showDeletePopover) {
        this.setState({ showDeletePopover: true });
      } else {
        this.confirmDelete(e);
      }
    }
  };

  public handleHotkeys = (e: any) => {
    if (e.key === 'Escape') {
      if (this.state.showDeletePopover) {
        this.confirmCancelDelete(e);
      } else {
        this.props.changeActive(undefined);
      }
    }

    if (this.state.showDeletePopover && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      this.confirmDelete(e);
    }

    if (this.props.commentType !== 'active') {
      return;
    }

    const os = getOperatingSystem();
    const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

    if (e.key === 'd' && triggerKey) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.state.showDeletePopover) {
        this.setState({ showDeletePopover: true });
      } else {
        this.confirmDelete(e);
      }
    }

    if (e.key === 'u' && triggerKey) {
      e.preventDefault();
      e.stopPropagation();
      this.removeRubricComment();
    }

    if (e.key === '[' && this.props.rubricComment === undefined && triggerKey) {
      e.preventDefault();
      e.stopPropagation();
      this.onMinus();
    } else if (e.key === ']' && this.props.rubricComment === undefined && triggerKey) {
      e.preventDefault();
      e.stopPropagation();
      this.onPlus();
    } else if (['[', ']'].includes(e.key) && triggerKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  public edited = () => {
    this.setState({ status: 'edited' });
  };

  public idle = () => {
    this.setState({ status: 'idle' });
  };

  public resetSaveTimeOut = () => {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(this.save, 500);
  };

  // Ant type bug https://cl.ly/c5094e2c4526
  public onChangePointInput = (value: any) => {
    const parsed = parseFloat(value);
    const points = isNaN(parsed) ? this.state.points : parsed;

    if (points !== UiComment.points(this.props.comment, this.props.rubricComment)) {
      this.edited();
      // Avoid save on meaningless change in sign of zero points
      this.resetSaveTimeOut();
    } else {
      this.idle();
    }
    this.setState({ points });
  };

  public roundDownToNearestMultiple = (n: number, m: number) => {
    return Math.floor(n / m) * m;
  };

  public roundUpToNearestMultiple = (n: number, m: number) => {
    return Math.ceil(n / m) * m;
  };

  public onPlus = () => {
    const points = this.roundDownToNearestMultiple(this.state.points, 0.5) - 0.5;

    this.onChangePointInput(points);
  };

  public onMinus = () => {
    const points = this.roundUpToNearestMultiple(this.state.points, 0.5) + 0.5;
    this.onChangePointInput(points);
  };

  public onCommentClick = (e: React.MouseEvent) => {
    // FIXME: No longer use 'expand' due to markdown issues
    if (e.target instanceof HTMLElement && e.target.textContent === 'expand') {
      e.stopPropagation();
    } else {
      this.activate();
    }
  };

  public activate = () => {
    this.props.changeActive(this.props.comment.id);
  };

  public deactivate = () => {
    this.props.changeActive(undefined);
  };

  public onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    this.setState({ text });
    if (text !== this.props.comment.text) {
      this.edited();
    } else {
      this.idle();
    }

    this.resetSaveTimeOut();
    this.props.setCommentPlacements();
  };

  public removeRubricComment = () => {
    if (this.props.rubricComment) {
      this.edited();

      if (this.props.forcedRubricMode) {
        this.setState({ text: '' });
      }

      this.props.removeRubricComment(this.props.comment, this.props.rubricComment);
      this.props.setCommentPlacements();
    }
  };

  public delete = async (e: any) => {
    try {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      e.preventDefault();
      e.stopPropagation();
      await this.props.onDelete(this.props.comment);
      this.props.setCommentPlacements();
    } catch (error) {
      message.error(`Error deleting comment: ${JSON.stringify(error)}`);
    }
  };

  public fadeSavedState = async () => {
    this.setState({ status: 'saved' });
    await wait(1000);
    this.setState({ status: 'idle' });
  };

  // FIXME: Type React.KeyboardEventHandler<HTMLTextAreaElement>
  public handleShiftEnter = (e: any) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault(); // skip OnChange method
      e.stopPropagation();
      this.save();
      this.deactivate();
    }
  };

  public highlightRelatedComment = (event?: any) => {
    CodePanelHighlighting.brightenHighlight(this.props.comment.id, this.context.consoleTheme.highlightActive);

    // For handling markdown
    const blockElement: HTMLElement | null = findBlockElement(this.props.file, this.props.comment.startLine);

    if (blockElement) {
      blockElement.className = `markdown-block markdown-block--focused ${
        this.props.commentType === 'readonly' ? 'readonly' : 'active'
      }`;
    }
  };

  public unhighlightRelatedComment = (event?: any) => {
    CodePanelHighlighting.darkenHighlight(this.props.comment.id, this.context.consoleTheme.highlight);

    // For handling markdown
    const blockElement: HTMLElement | null = findBlockElement(this.props.file, this.props.comment.startLine);

    if (blockElement) {
      blockElement.className = `markdown-block markdown-block--commented ${
        this.props.commentType === 'readonly' ? 'readonly' : 'active'
      }`;
    }
  };

  public showDeletePopover = () => {
    this.setState({ showDeletePopover: true });
  };

  public hideDeletePopover = () => {
    this.setState({ showDeletePopover: false });
  };

  public handleDeletePopoverVisibleChange = (showDeletePopover: boolean) => {
    this.setState({ showDeletePopover });
  };

  public confirmDelete = (e: any) => {
    this.delete(e);
    this.setState({ showDeletePopover: false });
  };

  public confirmCancelDelete = (e: any) => {
    this.setState({ showDeletePopover: false });
  };

  public render() {
    const className = `comment comment--${this.props.commentType} ant-popover ant-popover-placement-rightTop`;

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
    };

    let onClick;
    let cursor = 'auto';
    let shadow;

    //////////////////////////////////////////////////////////////////////////////////////////
    // -------------------------- codeType ['code', 'markdown'] --------------------------- //
    //////////////////////////////////////////////////////////////////////////////////////////

    if (['markdown', 'jupyter'].includes(File.codeType(this.props.file))) {
      commentElements.line = (
        <span
          className="cp-label--mid-bold cp-label--italic"
          style={{ color: this.context.consoleTheme.commentTitleText }}
        >
          Block {this.props.comment.startLine + 1}
        </span>
      );
    } else if (File.codeType(this.props.file) === 'pdf') {
      commentElements.line = (
        <span
          className="cp-label--mid-bold cp-label--italic"
          style={{ color: this.context.consoleTheme.commentTitleText }}
        >
          Page {this.props.comment.startLine}
        </span>
      );
    } else {
      commentElements.line = (
        <span
          className="cp-label--mid-bold cp-label--italic"
          style={{ color: this.context.consoleTheme.commentTitleText }}
        >
          Line {this.props.comment.startLine + 1}
        </span>
      );
    }

    const points: number = this.state.points;

    const badge = <Badge count={points * -1} />;

    //////////////////////////////////////////////////////////////////////////////////////////
    // ------------------------------------- author --------------------------------------- //
    //////////////////////////////////////////////////////////////////////////////////////////

    if (this.props.comment.author && (!this.props.isStudent || !this.props.hideAuthor)) {
      commentElements.author = (
        <span
          className="cp-label--italic cp-label--very-small"
          style={{ color: this.context.consoleTheme.commentAuthor }}
        >
          Author: {this.props.comment.author}
        </span>
      );
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // -------------------- commentStatus ['edited', 'saved', 'error'] -------------------- //
    //////////////////////////////////////////////////////////////////////////////////////////

    switch (this.state.status) {
      case 'edited':
        commentElements.status = (
          <span
            className="cp-label--small cp-label--italic"
            style={{ color: this.context.consoleTheme.commentTitleText }}
          >
            {!this.state.text ? '' : 'Saving...'}
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
          <CPButton cpType="secondary" size="small" style={{ width: '60px' }} onClick={this.confirmCancelDelete}>
            No
          </CPButton>,
          <CPButton cpType="danger" size="small" style={{ width: '60px' }} onClick={this.confirmDelete}>
            Yes
          </CPButton>,
        ]}
        gutterSize={14}
      />
    );

    if (this.props.commentType === 'active') {
      const tooltip = this.props.rubricComment ? tooltips.grade.comments.pointsDisabled : null;

      const shouldDisableTextArea = this.props.forcedRubricMode && this.props.rubricComment === undefined;

      const forcedRubricTooltip = shouldDisableTextArea
        ? 'You must link a Rubric Comment before writing any feedback.'
        : null;

      commentElements.points = (
        <CPTooltip title={tooltip} hideThisOnHideTips={true}>
          <div>
            <CPPointInput
              value={-points}
              size="small"
              onChange={this.onChangePointInput}
              disabled={this.props.forcedRubricMode || this.props.rubricComment ? true : false}
              onKeyDown={this.handleShiftEnter}
              defaultToPositive={this.props.additiveGrading}
            />
          </div>
        </CPTooltip>
      );

      commentElements.comment = (
        <CPTooltip title={forcedRubricTooltip} hideThisOnHideTips={true}>
          <TextArea
            id="comment-text-area"
            autosize
            className="comment__text-area"
            placeholder={
              this.props.rubricComment && !this.props.rubricComment.templateTextOn
                ? this.props.rubricComment.instructionText
                : undefined
            }
            value={this.state.text}
            onChange={this.onChangeText}
            onPressEnter={this.handleShiftEnter}
            style={{
              backgroundColor: this.context.consoleTheme.commentTextArea,
              color: this.context.consoleTheme.text,
            }}
            autoFocus
            disabled={shouldDisableTextArea}
            onFocus={(e) => {
              var temp_value = e.target.value;
              e.target.value = '';
              e.target.value = temp_value;
            }}
          />
        </CPTooltip>
      );

      commentElements.saveButton = <CPButton cpType="secondary" icon="check" onClick={this.deactivate} />;
      commentElements.deleteButton = (
        <Popover
          title="Are you sure you want to delete this comment?"
          visible={this.state.showDeletePopover}
          onVisibleChange={this.handleDeletePopoverVisibleChange}
          trigger="click"
          placement="bottomRight"
          content={popoverContent}
        >
          <CPButton cpType="danger" icon="delete" />
        </Popover>
      );

      if (this.props.rubricComment) {
        commentElements.rubricCommentAction = (
          <span
            style={{
              position: 'absolute',
              right: '20px',
              top: '42px',
              cursor: 'pointer',
            }}
            onClick={this.removeRubricComment}
          >
            X
          </span>
        );
      }

      shadow = { boxShadow: this.context.consoleTheme.commentShadow };
    }

    const preventDefault = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (this.props.commentType === 'inactive') {
      commentElements.points = badge;
      commentElements.comment = (
        <div className="comment__comment" style={{ color: this.context.consoleTheme.text }}>
          <BlockMarkdown source={this.state.text} />
        </div>
      );
      // Only shown delete button on inactive comment when the user is hovering
      commentElements.deleteButton = this.state.hasHover ? (
        <Popover
          title="Are you sure you want to delete this comment?"
          visible={this.state.showDeletePopover}
          onVisibleChange={this.handleDeletePopoverVisibleChange}
          trigger="click"
          placement="bottomRight"
          content={popoverContent}
        >
          <CPButton cpType="danger" icon="delete" onClick={preventDefault} />
        </Popover>
      ) : (
        <Popover
          title="Are you sure you want to delete this comment?"
          visible={this.state.showDeletePopover}
          onVisibleChange={this.handleDeletePopoverVisibleChange}
          trigger="click"
          placement="bottomRight"
          content={popoverContent}
        >
          {null}
        </Popover>
      );

      onClick = this.onCommentClick;
      cursor = 'pointer';
    }

    if (this.props.commentType === 'readonly') {
      commentElements.points = badge;
      commentElements.comment = (
        <div className="comment__comment" style={{ color: this.context.consoleTheme.text }}>
          <BlockMarkdown source={this.state.text} />
        </div>
      );
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // --------------------------------- rubricComment ------------------------------------ //
    //////////////////////////////////////////////////////////////////////////////////////////

    if (this.props.rubricComment) {
      let rubricCommentClassName = 'comment__rubric-comment';
      let style = {};
      if (this.props.rubricComment.pointDelta > 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--negative');
      } else if (this.props.rubricComment.pointDelta < 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--positive');
      } else {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--neutral');
        style = {
          color: this.context.consoleTheme.commentRubricCommentNeutral,
          borderLeft: `3px solid ${this.context.consoleTheme.commentRubricCommentNeutral}`,
        };
      }

      // Note: we should always be able to find the rubricComment's category in
      // this.props.rubricCategories, but we're playing it safe here.
      let rubricCategoryTitle = '';
      const matchedCategory = this.props.rubricCategories.find((cat) => {
        return cat.id === this.props.rubricComment!.category;
      });
      if (matchedCategory !== undefined) {
        rubricCategoryTitle = matchedCategory.name;
      }

      commentElements.rubricComment = (
        <div className={rubricCommentClassName} style={style}>
          <span className="cp-label--very-bold">{rubricCategoryTitle}</span>
          <BlockMarkdown
            source={
              (this.props.isStudent || this.props.showExplanations) && this.props.rubricComment.explanation
                ? this.props.rubricComment.explanation
                : this.props.rubricComment.text
            }
            em={!this.props.isStudent && this.props.showExplanations && this.props.rubricComment.explanation.length > 0}
          />
          {commentElements.rubricCommentAction}
        </div>
      );
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // --------------------------------- feedback      ------------------------------------ //
    //////////////////////////////////////////////////////////////////////////////////////////

    let feedback = null;
    if (this.props.isStudent && this.props.rubricComment && this.props.studentFeedbackOn) {
      const setFeedback = (feedbackNum: number) => {
        this.props.updateFeedback(feedbackNum);
      };

      const feedbackScore = this.props.comment.feedback;

      const negTheme =
        feedbackScore === -1 ? 'primary' : this.context.consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

      const posTheme =
        feedbackScore === 1 ? 'primary' : this.context.consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

      feedback = (
        <Button.Group style={{ width: '100%' }}>
          <Tooltip title={feedbackScore === -1 ? 'Click to undo.' : 'I found this comment unhelpful.'}>
            <CPButton
              style={{ width: '50%', borderTopLeftRadius: '0px' }}
              cpType={negTheme}
              onClick={setFeedback.bind(this, feedbackScore === -1 ? 0 : -1)}
            >
              <span role="img" aria-label="downvote">
                👎
              </span>
            </CPButton>
          </Tooltip>
          <Tooltip title={feedbackScore === 1 ? 'Click to undo.' : 'I found this comment helpful.'}>
            <CPButton
              style={{ width: '50%', borderTopRightRadius: '0px' }}
              cpType={posTheme}
              onClick={setFeedback.bind(this, feedbackScore === 1 ? 0 : 1)}
            >
              <span role="img" aria-label="upvote">
                👍
              </span>
            </CPButton>
          </Tooltip>
        </Button.Group>
      );
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // ---------------------------------- Components -------------------------------------- //
    //////////////////////////////////////////////////////////////////////////////////////////

    const titleLeft = [commentElements.line, commentElements.status];

    const titleRight = [commentElements.points];

    const footerLeft = [commentElements.author];

    const footerRight = [commentElements.saveButton, commentElements.deleteButton];

    // Sets zIndex explicitly to avoid style conflict when modals open on this page
    // Per: https://github.com/ant-design/ant-design/issues/6722
    // this.context.consoleTheme.commentBody
    // this.context.consoleTheme.commentBody
    return (
      <div
        className={className}
        id={`comment-${this.props.comment.id}`}
        style={{ top: `${this.props.placement}px`, cursor, zIndex: 0 }}
        onClick={onClick}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        data-status={this.state.status}
      >
        <div className="ant-popover-content">
          <div
            className="ant-popover-arrow"
            style={{
              borderColor: this.props.cursored
                ? 'lightblue'
                : this.props.comment.tags !== undefined && this.props.comment.tags.includes('late days')
                ? '#fffbe6'
                : this.props.comment.color !== undefined && this.props.comment.color !== null
                ? this.props.comment.color
                : this.context.consoleTheme.commentBody,
            }}
          />
          <div className="ant-popover-inner" style={shadow}>
            <div
              style={{
                backgroundColor: this.props.cursored
                  ? 'lightblue'
                  : this.props.comment.tags !== undefined && this.props.comment.tags.includes('late days')
                  ? '#fffbe6'
                  : this.props.comment.color !== undefined && this.props.comment.color !== null
                  ? this.props.comment.color
                  : this.context.consoleTheme.commentBody,
              }}
            >
              <div
                className="ant-popover-title"
                style={{
                  backgroundColor: this.context.consoleTheme.commentTitle,
                  borderBottom: `1px solid ${this.context.consoleTheme.commentTitleBorder}`,
                }}
              >
                <CPFlex left={titleLeft} right={titleRight} gutterSize={14} />
              </div>
              <div className="ant-popover-inner-content">
                {commentElements.rubricComment}
                {commentElements.comment}
              </div>
              {this.props.commentType === 'readonly' && this.props.hideAuthor ? null : (
                <div
                  style={{
                    margin: '0px 20px 0px 20px',
                    paddingBottom: '6px',
                    lineHeight: '9px',
                  }}
                >
                  <CPFlex left={footerLeft} right={footerRight} gutterSize={10} style={{ minHeight: '32px' }} />
                </div>
              )}
            </div>
          </div>
        </div>
        {feedback}
      </div>
    );
  }
}
Comment.contextType = ConsoleThemeContext;

export default Comment;

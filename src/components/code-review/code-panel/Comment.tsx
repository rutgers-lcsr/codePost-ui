import * as React from 'react';

// We use ts-ignore since Popover never explicitly used. We just use the classNames
// @ts-ignore: no-unused-variable
import { Button, Input, message, Popover, Tooltip } from 'antd';
const { TextArea } = Input;

import CPButton from '../../core/CPButton';
import CPFlex from '../../core/CPFlex';
import CPPointInput from '../../core/CPPointInput';

import BlockMarkdown from '../../core/BlockMarkdown';
import InlineMarkdown from '../../core/InlineMarkdown';

import Badge from '../../core/Badge';

import { CommentType, UiComment } from '../../../infrastructure/comment';
import { File, FileType } from '../../../infrastructure/file';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import CodePanelHighlighting from './CodePanelHighlighting';

import { wait } from '../../../infrastructure/animation';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

export type UICommentType = 'readonly' | 'active' | 'inactive';

export type CommentStatus = 'edited' | 'saved' | 'idle' | 'error';

interface ICommentProps {
  additiveGrading: boolean;
  commentType: UICommentType;
  comment: CommentType;
  file: FileType;
  rubricComment?: RubricCommentType;

  isStudent: boolean;

  placement: number;

  changeActive: (id: number | undefined) => void;
  onSave: (comment: CommentType) => void;
  onDelete: (comment: CommentType) => void;

  addUnsaved: (commentID: number) => void;
  removeUnsaved: (commentID: number) => void;
  removeRubricComment: (comment: CommentType, rubricComment: RubricCommentType) => void;

  setCommentPlacements: () => void;

  updateFeedback: (feedback: number) => void;
  studentFeedbackOn: boolean;

  hideAuthor: boolean;
}

interface ICommentState {
  status: CommentStatus;
  text: string;
  points: number;
}

class Comment extends React.Component<ICommentProps, ICommentState> {
  public constructor(props: ICommentProps, context: any) {
    super(props, context);
    this.state = this.init();
  }

  public componentDidMount() {
    this.props.setCommentPlacements();
  }

  public componentDidUpdate(prevProps: ICommentProps) {
    // If a rubric comment is linked, unlinked, or updated, make sure to recalculate points
    if (this.props.rubricComment !== prevProps.rubricComment) {
      this.setState({ points: UiComment.points(this.props.comment, this.props.rubricComment) });
      this.props.setCommentPlacements();
    }

    if (this.props.commentType !== prevProps.commentType) {
      this.props.setCommentPlacements();
    }

    // If a comment is finalized, then reset the state
    if (['active', 'inactive'].includes(prevProps.commentType) && this.props.commentType === 'readonly') {
      this.setState(this.init());
    }

    // Destroy when un-focusing and comments remains empty (this was probably a mistake comment)
    if (prevProps.commentType === 'active' && this.props.commentType === 'inactive') {
      if (this.state.text.length === 0 && this.state.points === 0) {
        this.props.onDelete(this.props.comment);
      }
    }
  }

  public init = () => {
    const text: string = this.props.comment.text ? this.props.comment.text : '';
    const points: number = UiComment.points(this.props.comment, this.props.rubricComment);
    const status: CommentStatus =
      text === '' && points === 0 && this.props.rubricComment === undefined ? 'edited' : 'idle';

    return { text, points, status };
  };

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

  public edited = () => {
    this.setState({ status: 'edited' });
  };

  public idle = () => {
    this.setState({ status: 'idle' });
  };

  // Ant type bug https://cl.ly/c5094e2c4526
  public onChangePointInput = (value: any) => {
    const parsed = parseFloat(value);
    const points = isNaN(parsed) ? this.state.points : parsed;

    if (points !== UiComment.points(this.props.comment, this.props.rubricComment)) {
      this.edited();
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

    this.props.setCommentPlacements();
  };

  public removeRubricComment = () => {
    if (this.props.rubricComment) {
      this.edited();
      this.props.removeRubricComment(this.props.comment, this.props.rubricComment);
    }
  };

  public delete = async (e: any) => {
    try {
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
      this.save();
    }
  };

  public highlightRelatedComment = (event?: any) => {
    CodePanelHighlighting.brightenHighlight(this.props.comment.id, this.context.consoleTheme.highlightActive);

    // For handling markdown
    const blockElement: HTMLElement | null = document.querySelector(`[index-number="${this.props.comment.startLine}"]`);
    if (blockElement) {
      blockElement.className = `markdown-block markdown-block--focused ${
        this.props.commentType === 'readonly' ? 'readonly' : 'active'
      }`;
    }
  };

  public unhighlightRelatedComment = (event?: any) => {
    CodePanelHighlighting.darkenHighlight(this.props.comment.id, this.context.consoleTheme.highlight);

    // For handling markdown
    const blockElement: HTMLElement | null = document.querySelector(`[index-number="${this.props.comment.startLine}"]`);
    if (blockElement) {
      blockElement.className = `markdown-block markdown-block--commented ${
        this.props.commentType === 'readonly' ? 'readonly' : 'active'
      }`;
    }
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

    if (this.props.comment.author) {
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
            Draft
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

    if (this.props.commentType === 'active') {
      commentElements.points = (
        <CPPointInput
          value={-points}
          size="small"
          onChange={this.onChangePointInput}
          disabled={this.props.rubricComment ? true : false}
          onKeyDown={this.handleShiftEnter}
          defaultToPositive={this.props.additiveGrading}
        />
      );
      commentElements.comment = (
        <TextArea
          autosize
          className="comment__text-area"
          value={this.state.text}
          onChange={this.onChangeText}
          onPressEnter={this.handleShiftEnter}
          style={{ backgroundColor: this.context.consoleTheme.commentTextArea, color: this.context.consoleTheme.text }}
          autoFocus
        />
      );

      commentElements.saveButton = <CPButton cpType="secondary" icon="save" onClick={this.save} />;
      commentElements.deleteButton = <CPButton cpType="danger" icon="delete" onClick={this.delete} />;

      if (this.props.rubricComment) {
        commentElements.rubricCommentAction = (
          <span
            style={{ position: 'absolute', right: '20px', top: '42px', cursor: 'pointer' }}
            onClick={this.removeRubricComment}
          >
            X
          </span>
        );
      }

      shadow = { boxShadow: this.context.consoleTheme.commentShadow };
    }

    if (this.props.commentType === 'inactive') {
      commentElements.points = badge;
      commentElements.comment = (
        <div className="comment__comment" style={{ color: this.context.consoleTheme.text }}>
          <BlockMarkdown source={this.state.text} />
        </div>
      );
      commentElements.deleteButton = <CPButton cpType="danger" icon="delete" onClick={this.delete} />;

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
      let pointsString = '';
      let style = {};
      if (this.props.rubricComment.pointDelta > 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--negative');
        pointsString = `${points * -1}`;
      } else if (this.props.rubricComment.pointDelta < 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--positive');
        pointsString = `+${points * -1}`;
      } else {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--neutral');
        style = {
          color: this.context.consoleTheme.commentRubricCommentNeutral,
          borderLeft: `3px solid ${this.context.consoleTheme.commentRubricCommentNeutral}`,
        };
      }

      commentElements.rubricComment = (
        <div className={rubricCommentClassName} style={style}>
          <span className="cp-label--very-bold">{pointsString}</span>
          <InlineMarkdown source={this.props.rubricComment.text} />
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
              👎
            </CPButton>
          </Tooltip>
          <Tooltip title={feedbackScore === 1 ? 'Click to undo.' : 'I found this comment helpful.'}>
            <CPButton
              style={{ width: '50%', borderTopRightRadius: '0px' }}
              cpType={posTheme}
              onClick={setFeedback.bind(this, feedbackScore === 1 ? 0 : 1)}
            >
              👍
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
        onMouseEnter={this.highlightRelatedComment}
        onMouseLeave={this.unhighlightRelatedComment}
        data-status={this.state.status}
      >
        <div className="ant-popover-content">
          <div
            className="ant-popover-arrow"
            style={{
              borderColor:
                this.props.comment.color !== undefined
                  ? this.props.comment.color
                  : this.context.consoleTheme.commentBody,
            }}
          />
          <div className="ant-popover-inner" style={shadow}>
            <div
              style={{
                backgroundColor:
                  this.props.comment.color !== undefined
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

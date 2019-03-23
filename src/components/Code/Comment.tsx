import * as React from 'react';
import { Button, TextField } from 'react-md';

import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';

import { ICSSStyleObject } from '../../types/common';

import { CommentIO, CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';
import { RubricCommentType } from '../../infrastructure/rubricComment';

import CodePanelUtils from './CodePanelUtils';

export interface ICommentProps {
  key: number;
  comment: CommentType;
  rubricComment: RubricCommentType | undefined;
  style: ICSSStyleObject;
  readOnly: boolean;

  file: FileType;
  active: boolean;
  changeActive: (id: number | undefined) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => boolean;
  updateSubmissionGrade: () => void;
  unsavedComments: number[];
  rerender: any;
}

interface ICommentState {
  savingClass: string;
  isUnsaved: boolean;
}

class Comment extends React.Component<ICommentProps, ICommentState> {
  public textarea: any = React.createRef();
  public deductionField: any = React.createRef();

  public state: Readonly<ICommentState> = {
    savingClass: 'saving-spinner--idle',
    isUnsaved: this.props.comment.id < 0 || this.props.unsavedComments.includes(this.props.comment.id),
  };

  //////////////////////////////////////
  // Lifecycle Methods
  //////////////////////////////////////

  public componentDidUpdate = (prevProps: ICommentProps) => {
    CodePanelUtils.updateCommentPanelHeight();

    if (this.props.unsavedComments !== prevProps.unsavedComments) {
      this.setState({
        isUnsaved: this.props.comment.id < 0 || this.props.unsavedComments.includes(this.props.comment.id),
      });
    }

    // Is the deduction field active?
    const activeDeductionField =
      this.deductionField && this.deductionField.context && this.deductionField.getField() === document.activeElement;

    // Is the rubric search active?
    let activeSearch = false;
    if (document.activeElement && document.activeElement.className === 'grade-rubric__search-bar') {
      activeSearch = true;
    }

    // Hack to focus on a conditionally rendered component
    if (!activeDeductionField && !activeSearch && this.textarea && this.textarea.style) {
      this.textarea.focus();
    }
  };

  //////////////////////////////////////
  // Prop Methods
  //////////////////////////////////////

  public updateComment = (event: any) => {
    const { comment, updateComment, file } = this.props;
    comment.text = event.target.value;
    this.setState({ isUnsaved: true });
    updateComment(comment.id, comment, file, false);
  };

  public updateDeduction = (value: string) => {
    const { comment, updateComment, file } = this.props;
    comment.pointDelta = parseFloat(value);
    this.setState({ isUnsaved: true });
    updateComment(comment.id, comment, file, false);
  };

  public toggleActive = () => {
    const { active, changeActive, comment } = this.props;
    if (active) {
      this.save().then(() => {
        changeActive(undefined);
      });
    } else {
      changeActive(comment.id);
    }
  };

  public save = () => {
    const { comment, file, updateComment } = this.props;

    this.setState({ savingClass: 'saving-spinner--saving' });

    // If this is a new comment being edited, then it doesn't have an id yet
    // The new comments get initalized in CodeGrader:onMouseUp (with negative)
    // New comments should be a POST request
    // Else PATCH
    if (comment.id < 0) {
      const payload = {
        id: comment.id, // codePost convention
        endChar: comment.endChar,
        endLine: comment.endLine,
        file: comment.file,
        pointDelta: comment.pointDelta,
        rubricComment: comment.rubricComment,
        startChar: comment.startChar,
        startLine: comment.startLine,
        text: comment.text,
      };

      return CommentIO.create(payload)
        .then((json) => {
          // eagerly update submission grade
          this.props.updateSubmissionGrade();
          // this is just aesthetic wait time to watch the comment save
          setTimeout(() => {
            this.setState({ savingClass: 'saving-spinner--success' });
          }, 500);
          setTimeout(() => {
            this.setState({ savingClass: 'saving-spinner--idle', isUnsaved: false });
            // It's important that we update the parent state
            // after this timeout, otherwise we face memory-leaks
            // setting the state of an unmounted component
            // (which has an out-dated, negative comment.id)
            updateComment(comment.id, json, file, true);
            this.props.rerender();
            return true;
          }, 1000);
          return true;
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      return CommentIO.update(comment).then((json) => {
        // this is just aesthetic wait time to watch the comment save
        // eagerly update submission grade
        this.props.updateSubmissionGrade();
        setTimeout(() => {
          this.setState({ savingClass: 'saving-spinner--success' });
        }, 500);
        setTimeout(() => {
          this.setState({ savingClass: 'saving-spinner--idle', isUnsaved: false });
          updateComment(comment.id, json, file, true);
          this.props.rerender();
          return true;
        }, 1000);
        return true;
      });
    }
  };

  //////////////////////////////////////
  // Helper Methods
  //////////////////////////////////////
  public handleShiftEnter = (event: any) => {
    const { active } = this.props;
    if (event.key === 'Enter' && event.shiftKey && active) {
      this.toggleActive();
    }
  };

  public onMouseEnter = (comment: CommentType, event?: any) => {
    const className = `highlight-${comment.id}`;
    const elems = document.getElementsByClassName(className);
    [].forEach.call(elems, (elem: any) => {
      elem.style.setProperty('background-color', 'rgba(250,255,145, 0.5)', 'important');
    });

    // For handling markdown
    const blockElement: HTMLElement | null = document.querySelector(`[index-number="${comment.startLine}"]`);
    if (blockElement) {
      blockElement.className = 'markdown-code__block--focused';
      // blockElement.style.setProperty('border-left', '5px solid #f9ff91');
    }
  };

  public onMouseLeave = (comment: CommentType, event?: any) => {
    const className = `highlight-${comment.id}`;
    const elems = document.getElementsByClassName(className);
    [].forEach.call(elems, (elem: any) => {
      elem.style.backgroundColor = 'rgba(255, 202, 147, 0.5)';
    });

    // For handling markdown
    const blockElement: HTMLElement | null = document.querySelector(`[index-number="${comment.startLine}"]`);
    if (blockElement) {
      blockElement.className = 'markdown-code__block--commented';
      // blockElement.style.setProperty('border-left', '5px solid #24b47e');
    }
  };

  public deleteComment = (comment: CommentType, file: FileType) => {
    this.props.deleteComment(comment, file);
  };

  public getPointDelta = (rubricComment: RubricCommentType | undefined, comment: CommentType) => {
    return rubricComment ? rubricComment.pointDelta : comment.pointDelta;
  };

  public getPointDeltaLabel = (pointDelta: number | null) => {
    return pointDelta ? (pointDelta > 0 ? `-${pointDelta}` : `+${pointDelta * -1}`) : null;
  };

  public getPointDeltaModifier = (pointDelta: number | null) => {
    return pointDelta === null ? '--null' : pointDelta > 0 ? '--negative' : pointDelta < 0 ? '--positive' : '--zero';
  };

  public getPointDeltaSize = (pointDeltaLabel: string | null) => {
    return pointDeltaLabel && pointDeltaLabel.length >= 4 ? 'comment__pointdelta--small' : '';
  };

  public getCommentClassName = (isUnsaved: boolean, savingClass: string) => {
    return isUnsaved && savingClass === 'saving-spinner--idle' ? 'comment--unsaved comment' : 'comment';
  };

  public getAuthorSring = (comment: CommentType) => {
    return comment.author ? `author: ${comment.author}` : '';
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const { active, comment, file, readOnly, style, rubricComment } = this.props;
    const { savingClass } = this.state;

    const pointDelta = this.getPointDelta(rubricComment, comment);
    const pointDeltaLabel = this.getPointDeltaLabel(pointDelta);
    const pointDeltaModifier = this.getPointDeltaModifier(pointDelta);
    const pointDeltaSize = this.getPointDeltaSize(pointDeltaLabel);

    const className = this.getCommentClassName(this.state.isUnsaved, this.state.savingClass);
    const author = this.getAuthorSring(comment);

    // Non-editable comment
    if (readOnly) {
      return (
        <div
          className={className}
          style={style}
          onMouseEnter={this.onMouseEnter.bind(this.props, comment)}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment)}
          id={`comment-${comment.id}`}
        >
          <div className="comment__body">
            <div className={savingClass} />
            <div className={`${pointDeltaSize} comment__pointdelta${pointDeltaModifier}`}>{pointDeltaLabel} </div>
            {rubricComment ? <div className="comment__rubric-comment">{rubricComment.text}</div> : null}
            <ReactMarkdown source={comment.text} />
            <div className="comment__footer">
              <div className="comment__footer__line">line: {comment.startLine + 1}&nbsp;</div>
              <div className="comment__footer__author">{author}</div>
            </div>
          </div>
        </div>
      );
    }

    // Editable-active comment
    if (active) {
      return (
        <div
          className={className}
          style={style}
          onMouseEnter={this.onMouseEnter.bind(this.props, comment)}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment)}
          id={`comment-${comment.id}`}
        >
          <div className="comment__body">
            <div className={savingClass} />
            <TextField
              id="pointdelta-field"
              className="comment__pointdelta-field"
              value={pointDelta ? pointDelta : ''}
              step={0.5}
              pattern="^d+(\.|\,)\d{1}"
              type="number"
              placeholder={'Deduction'}
              // tslint:disable-next-line
              ref={(field) => (this.deductionField = field)}
              fullWidth={true}
              disabled={rubricComment ? true : false}
              onChange={this.updateDeduction}
            />
            {rubricComment ? <div className="comment__rubric-comment">{rubricComment.text}</div> : null}

            <TextareaAutosize
              minRows={2}
              maxRows={8}
              onChange={this.updateComment}
              onKeyPress={this.handleShiftEnter}
              value={comment.text ? comment.text : ''}
              className="comment__textarea"
              // tslint:disable-next-line
              inputRef={(tag: any) => (this.textarea = tag)}
            />

            <div>
              <Button
                icon={true}
                className="button--comment"
                forceIconFontSize={true}
                forceIconSize={20}
                tooltipLabel="Save comment [SHIFT + ENTER]"
                tooltipDelay={1}
                tooltipPosition="left"
                onClick={this.toggleActive}
              >
                save
              </Button>
              <Button
                icon={true}
                className="button--comment"
                forceIconFontSize={true}
                forceIconSize={20}
                tooltipLabel="Delete comment"
                tooltipDelay={50}
                tooltipPosition="left"
                onClick={this.deleteComment.bind(this, comment, file)}
              >
                delete
              </Button>
            </div>
            <div className="comment__footer">
              <div className="comment__footer__line">line: {comment.startLine + 1}&nbsp;</div>
              <div className="comment__footer__author">{author}</div>
            </div>
          </div>
        </div>
      );
    }

    // Editable-inactive comment
    const styleWithCursor = { ...style, cursor: 'pointer' };
    return (
      <div
        className={className}
        style={styleWithCursor}
        onMouseEnter={this.onMouseEnter.bind(this.props, comment)}
        onMouseLeave={this.onMouseLeave.bind(this.props, comment)}
        id={`comment-${comment.id}`}
        onClick={this.toggleActive}
      >
        <div className={`${pointDeltaSize} comment__pointdelta${pointDeltaModifier}`}>{pointDeltaLabel} </div>
        <div className="comment__body">
          <div className={savingClass} />
          {rubricComment ? <div className="comment__rubric-comment">{rubricComment.text}</div> : null}
          <div className="comment__text">
            <ReactMarkdown source={comment.text} />
          </div>
          <div className="comment__footer">
            <div className="comment__footer__line">line: {comment.startLine + 1}&nbsp;</div>
            <div className="comment__footer__author">{author}</div>
            <div className="comment__footer__buttons">
              <Button
                className="button--comment"
                icon={true}
                forceIconFontSize={true}
                forceIconSize={20}
                onClick={this.deleteComment.bind(this, comment, file)}
              >
                delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Comment;

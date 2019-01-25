import * as React from 'react';
import { Button, TextField } from 'react-md';

import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';

import { ICSSStyleObject } from '../types/common';

import { CommentIO, CommentType } from '../infrastructure/comment';
import { FileType } from '../infrastructure/file';
import { RubricCommentType } from '../infrastructure/rubricComment';

interface IProps {
  key: number;
  comment: CommentType;
  rubricComment: RubricCommentType | undefined;
  style: ICSSStyleObject;
  readOnly: boolean;

  file: FileType;
  active: boolean;
  changeActive: (id: number | undefined) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType) => void;
  saveGrade: () => any;
}

interface IState {
  saveWarning: boolean;
  savingClass: string;
  isUnsaved: boolean;
}

class Comment extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    saveWarning: false,
    savingClass: 'saving-spinner--idle',
    isUnsaved: this.props.comment.id < 0,
  };

  //////////////////////////////////////
  // Lifecycle Methods
  //////////////////////////////////////

  //////////////////////////////////////
  // Prop Methods
  //////////////////////////////////////

  public updateComment = (event: any) => {
    const { comment, updateComment, file } = this.props;
    comment.text = event.target.value;
    this.setState({ isUnsaved: true });
    updateComment(comment.id, comment, file);
  };

  public updateDeduction = (value: string) => {
    const { comment, updateComment, file } = this.props;
    comment.pointDelta = parseFloat(value);
    this.setState({ isUnsaved: true });
    updateComment(comment.id, comment, file);
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
    const { comment, file, updateComment, saveGrade } = this.props;

    if (!this.validateSave()) {
      return Promise.resolve(false);
    }

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
            updateComment(comment.id, json, file);
            saveGrade(); // async issue with setState
            return true;
          }, 1000);
          return true;
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      console.log('PATCH', JSON.stringify(comment));
      return CommentIO.update(comment).then((json) => {
        // this is just aesthetic wait time to watch the comment save
        setTimeout(() => {
          this.setState({ savingClass: 'saving-spinner--success' });
        }, 500);
        setTimeout(() => {
          this.setState({ savingClass: 'saving-spinner--idle', isUnsaved: false });
          updateComment(comment.id, json, file);
          saveGrade(); // async issue with setState
          return true;
        }, 1000);
        return true;
      });
    }
  };

  //////////////////////////////////////
  // Helper Methods
  //////////////////////////////////////

  public validateSave = () => {
    const { comment, file, updateComment } = this.props;

    updateComment(comment.id, comment, file);

    // if (isNaN(comment.pointDelta)) {
    //   this.setState({ saveWarning: true });
    //   return false;
    // }
    // this.setState({ saveWarning: false });
    return true;
  };

  public handleShiftEnter = (event: any) => {
    const { active } = this.props;
    if (event.key === 'Enter' && event.shiftKey && active) {
      this.toggleActive();
    }
  };

  public onMouseEnter = (i: string, event: any) => {
    const elems = document.getElementsByClassName(i);
    [].forEach.call(elems, (elem: any) => {
      elem.style.setProperty('background-color', 'rgba(250,255,145, 0.5)', 'important');
    });
  };

  public onMouseLeave = (i: string, eevent: any) => {
    const elems = document.getElementsByClassName(i);
    [].forEach.call(elems, (elem: any) => {
      elem.style.backgroundColor = 'rgba(255, 202, 147, 0.5)';
    });
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const { active, comment, file, deleteComment, readOnly, style, rubricComment } = this.props;
    const { savingClass } = this.state;

    console.log('comment', comment);

    const pointDelta = rubricComment ? rubricComment.pointDelta : comment.pointDelta;
    const pointDeltaLabel = pointDelta ? (pointDelta > 0 ? `-${pointDelta}` : `+${pointDelta * -1}`) : null;
    const pointDeltaModifier =
      pointDelta === null ? '--null' : pointDelta > 0 ? '--negative' : pointDelta < 0 ? '--positive' : '--zero';

    const className = this.state.isUnsaved ? 'comment--unsaved' : 'comment';
    const author = comment.author ? `| author: ${comment.author}` : '';

    // Ugly for type checking
    let rubricCommentText = '';
    if (rubricComment) {
      rubricCommentText = rubricComment.text;
    }

    // Non-editable comment
    if (readOnly) {
      return (
        <div
          className={className}
          style={style}
          onMouseEnter={this.onMouseEnter.bind(this.props, comment.id.toString())}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment.id.toString())}
          id={`comment-${comment.id}`}
        >
          <div className="comment__body">
            <div className={savingClass} />
            {comment.startLine}
            <div className={`comment__pointdelta${pointDeltaModifier}`}>{pointDeltaLabel} </div>
            {rubricComment ? <div className="comment__rubric-comment">{rubricCommentText}</div> : null}
            <ReactMarkdown source={comment.text} />
            <div className="comment__footer">
              <div className="comment__footer__author">
                line: {comment.startLine + 1} {author}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Editable-active comment
    if (active) {
      // SaveWarning unused right now. But leaving it here in case we want to include
      // it in a form validation
      // const pointDeltaClassName = saveWarning ? 'point-delta warning' : 'point-delta';
      return (
        <div
          className={className}
          style={style}
          onMouseEnter={this.onMouseEnter.bind(this.props, comment.id.toString())}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment.id.toString())}
          id={`comment-${comment.id}`}
        >
          <div className="comment__body">
            <div className={savingClass} />
            <TextField
              id="pointdelta-field"
              className="comment__pointdelta-field"
              value={pointDelta ? pointDelta : 0}
              step={0.5}
              pattern="^d+(\.|\,)\d{1}"
              type="number"
              placeholder={'Deduction'}
              fullWidth={true}
              disabled={rubricComment ? true : false}
              onChange={this.updateDeduction}
            />
            {rubricComment ? <div className="comment__rubric-comment">{rubricCommentText}</div> : null}

            <TextareaAutosize
              minRows={1}
              maxRows={8}
              onChange={this.updateComment}
              onKeyPress={this.handleShiftEnter}
              value={comment.text ? comment.text : ''}
              className="comment__textarea"
            />

            <div>
              <Button
                icon={true}
                className="button--comment"
                forceIconFontSize={true}
                forceIconSize={20}
                tooltipLabel="Save comment"
                tooltipDelay={750}
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
                tooltipDelay={750}
                onClick={deleteComment.bind(this, comment, file)}
              >
                delete
              </Button>
            </div>
            <div className="comment__footer">
              <div className="comment__footer__author">
                line: {comment.startLine + 1} {author}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Editable-inactive comment
    return (
      <div
        className={className}
        style={style}
        onMouseEnter={this.onMouseEnter.bind(this.props, comment.id.toString())}
        onMouseLeave={this.onMouseLeave.bind(this.props, comment.id.toString())}
        id={`comment-${comment.id}`}
      >
        <div className={`comment__pointdelta${pointDeltaModifier}`}>{pointDeltaLabel} </div>
        <div className="comment__body">
          <div className={savingClass} />
          {rubricComment ? <div className="comment__rubric-comment">{rubricCommentText}</div> : null}
          <div className="comment__text">
            <ReactMarkdown source={comment.text} />
          </div>

          <div className="comment__footer__buttons">
            <Button
              className="button--comment"
              icon={true}
              forceIconFontSize={true}
              forceIconSize={20}
              tooltipLabel="Edit comment"
              tooltipDelay={750}
              onClick={this.toggleActive}
            >
              edit
            </Button>
            <Button
              className="button--comment"
              icon={true}
              forceIconFontSize={true}
              forceIconSize={20}
              tooltipLabel="Delete comment"
              tooltipDelay={750}
              onClick={deleteComment.bind(this, comment, file)}
            >
              delete
            </Button>
          </div>
          <div className="comment__footer">
            <div className="comment__footer__author">
              line: {comment.startLine + 1} {author}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Comment;

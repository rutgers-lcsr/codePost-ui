import * as React from 'react';
import { Button, Card, CardText, Chip, TextField } from 'react-md';

import { IComment, IFile } from '../../types/common';

interface IProps {
  readOnly: boolean;
  file: IFile;
  key: number;
  comment: IComment;
  style: any;
  active: boolean;
  changeActive: any;
  deleteComment: any;
  updateComment: any;
  getRubricComment: any;
}

interface IState {
  saveWarning: boolean;
  savingClass: string;
}

class EditableComment extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    saveWarning: false,
    savingClass: 'comment-idle',
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
    updateComment(comment.id, comment, file);
  };

  public updateDeduction = (value: any) => {
    const { comment, updateComment, file } = this.props;
    comment.pointDelta = value;
    updateComment(comment.id, comment, file);
  };

  public toggleActive = () => {
    const { active, changeActive, comment } = this.props;
    if (active) {
      this.save().then((successful) => {
        console.log('successful?', successful);
        changeActive(undefined);
      });
    } else {
      changeActive(comment.id);
    }
  };

  public save = () => {
    const { comment, file, updateComment } = this.props;

    if (!this.validateSave()) {
      return Promise.resolve(false);
    }

    this.setState({ savingClass: 'comment-saving' });

    // If this is a new comment being edited, then it doesn't have an id yet
    // The new comments get initalized in CodeGrader:onMouseUp (with id undefined)
    // New comments should be a POST request
    // Else PATCH
    if (comment.id < 0) {
      const payload = {
        endChar: comment.endChar,
        endLine: comment.endLine,
        file: comment.file,
        pointDelta: comment.pointDelta,
        rubricComment: comment.rubricComment,
        startChar: comment.startChar,
        startLine: comment.startLine,
        text: comment.text,
      };

      console.log('POST', JSON.stringify(comment));
      return fetch('/api/comments/', {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          setTimeout(() => {
            this.setState({ savingClass: 'comment-saved' });
          }, 1000);
          setTimeout(() => {
            this.setState({ savingClass: 'comment-idle' });
            // It's important that we update the parent state
            // after this timeout, otherwise we face memory-leaks
            // setting the state of an unmounted component
            // (which has an out-dated, negative comment.id)
            updateComment(comment.id, json, file);
            return true;
          }, 2000);
          return true;
        });
    } else {
      // Temp fix until API
      // Boilerplate PATCH can't handle nested objects
      // Should update API to handle
      // const payload = {
      //   endChar: comment.endChar,
      //   endLine: comment.endLine,
      //   id: comment.id,
      //   pointDelta: comment.pointDelta,
      //   rubricComment: comment.rubricComment,
      //   startChar: comment.startChar,
      //   startLine: comment.startLine,
      //   text: comment.text,
      // };

      console.log('PATCH', JSON.stringify(comment));
      return fetch(`/api/comments/${comment.id}/`, {
        body: JSON.stringify(comment),
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          setTimeout(() => {
            this.setState({ savingClass: 'comment-saved' });
          }, 1000);
          setTimeout(() => {
            this.setState({ savingClass: 'comment-idle' });
            updateComment(comment.id, json, file);
            return true;
          }, 2000);
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

  public enterKey = (event: any) => {
    const { active } = this.props;
    if (event.key === 'Enter' && active) {
      this.toggleActive();
    }
  };

  public onMouseEnter = (i: string, e: any) => {
    const elems = document.getElementsByClassName(i);
    [].forEach.call(elems, (elem: any) => {
      elem.style.backgroundColor = '#FAFF91';
    });
  };

  public onMouseLeave = (i: string, e: any) => {
    const elems = document.getElementsByClassName(i);
    [].forEach.call(elems, (elem: any) => {
      elem.style.backgroundColor = '#ffca93';
    });
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const { active, comment, file, deleteComment, readOnly, style, getRubricComment } = this.props;
    const { savingClass } = this.state;

    const pointDeltaLabel = `-${comment.pointDelta}`;

    let pointDeltaElement = null;
    if (comment.pointDelta && comment.pointDelta === 0) {
      pointDeltaElement = <Chip label={pointDeltaLabel} />;
    }

    let className = 'comment';
    if (comment.id < 0) {
      className += ' comment-unsaved';
    }

    // Non-editable comment
    if (readOnly) {
      return (
        <Card
          className={className}
          style={style}
          onMouseEnter={this.onMouseEnter.bind(this.props, comment.id.toString())}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment.id.toString())}
        >
          <CardText>
            <div className={savingClass} />
            {pointDeltaElement}
            <div className="comment-rubric">
              {comment.rubricComment ? getRubricComment(comment.rubricComment).text : 'no standard'}
            </div>
            {comment.text}
          </CardText>
        </Card>
      );
    }

    // Editable-active comment
    if (active) {
      // SaveWarning unused right now. But leaving it here in case we want to include
      // it in a form validation
      // const pointDeltaClassName = saveWarning ? 'point-delta warning' : 'point-delta';
      return (
        <Card
          className={className}
          style={style}
          onMouseEnter={this.onMouseEnter.bind(this.props, comment.id.toString())}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment.id.toString())}
        >
          <CardText>
            <div className={savingClass} />
            <TextField
              id="pointdelta-field"
              className="comment-pointdelta-field"
              defaultValue={comment.pointDelta}
              step={0.5}
              pattern="^d+(\.|\,)\d{1}"
              type="number"
              min={0}
              label={'Deduction'}
              fullWidth={true}
              onChange={this.updateDeduction}
            />
            {comment.rubricComment ? (
              <div className="comment-rubric">{getRubricComment(comment.rubricComment).text}</div>
            ) : null}

            <textarea
              onChange={this.updateComment}
              onKeyPress={this.enterKey}
              value={comment.text}
              className="comment-textarea"
            />

            <div>
              <Button flat className="comment-button" onClick={this.toggleActive}>
                Save
              </Button>
            </div>
          </CardText>
        </Card>
      );
    }

    // Editable-inactive comment
    return (
      <Card
        className={className}
        style={style}
        onMouseEnter={this.onMouseEnter.bind(this.props, comment.id.toString())}
        onMouseLeave={this.onMouseLeave.bind(this.props, comment.id.toString())}
      >
        <CardText>
          <div className={savingClass} />
          {pointDeltaElement}
          {comment.rubricComment ? (
            <div className="comment-rubric">{getRubricComment(comment.rubricComment).text}</div>
          ) : null}
          <div className="comment-text">{comment.text}</div>
          <div>
            <Button flat className="comment-button" onClick={this.toggleActive}>
              Edit
            </Button>
            <Button flat className="comment-button" onClick={deleteComment.bind(this, comment, file)}>
              Delete
            </Button>
          </div>
        </CardText>
      </Card>
    );
  }
}

export default EditableComment;

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
    updateComment(comment, file);
  };

  public updateDeduction = (value: any) => {
    const { comment, updateComment, file } = this.props;
    comment.pointDelta = value;
    updateComment(comment, file);
  };

  public toggleActive = () => {
    const { active, changeActive, comment } = this.props;
    if (active) {
      const saved = this.save();
      if (saved) {
        changeActive(undefined);
      }
    } else {
      changeActive(comment.localId);
    }
  };

  public save = () => {
    const { comment, file, updateComment } = this.props;

    if (!this.validateSave()) {
      return false;
    }

    this.setState({ savingClass: 'comment-saving' });

    // If this is a new comment being edited, then it doesn't have an id yet
    // The new comments get initalized in CodeGrader:onMouseUp (with id undefined)
    // New comments should be a POST request
    // Else PATCH
    if (comment.id) {
      // Temp fix until API
      // Boilerplate PATCH can't handle nested objects
      // Should update API to handle
      const payload = {
        endChar: comment.endChar,
        endLine: comment.endLine,
        id: comment.id,
        localId: comment.localId,
        pointDelta: comment.pointDelta,
        rubricComment: comment.rubricComment,
        startChar: comment.startChar,
        startLine: comment.startLine,
        text: comment.text,
      };

      console.log('PATCH', JSON.stringify(comment));
      fetch(`/api/comments/${comment.id}/`, {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      }).then((res) => {
        setTimeout(() => {
          this.setState({ savingClass: 'comment-saved' });
        }, 1000);
        setTimeout(() => {
          this.setState({ savingClass: 'comment-idle' });
        }, 2000);
      });
    } else {
      console.log('POST', JSON.stringify(comment));
      fetch('/api/comments/', {
        body: JSON.stringify(comment),
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
          }, 2000);
          updateComment(json, file);
        });
    }
    return true;
  };

  //////////////////////////////////////
  // Helper Methods
  //////////////////////////////////////

  public validateSave = () => {
    const { comment, file, updateComment } = this.props;
    if (comment.pointDelta === '') {
      comment.pointDelta = 0;
      updateComment(comment, file);
    }

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

    let pointDelta = '';
    if (comment.pointDelta && comment.pointDelta !== 0) {
      pointDelta = `-${comment.pointDelta}`;
    }

    // Non-editable comment
    if (readOnly) {
      return (
        <Card
          className="comment"
          style={style}
          onMouseEnter={this.onMouseEnter.bind(this.props, comment.localId.toString())}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment.localId.toString())}
        >
          <CardText>
            <div className={savingClass} />
            <Chip label={pointDelta} />
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
          className="comment"
          style={style}
          onMouseEnter={this.onMouseEnter.bind(this.props, comment.localId.toString())}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment.localId.toString())}
        >
          <CardText>
            <div className={savingClass} />
            <TextField
              id="pointdelta-field"
              className="comment-pointdelta-field"
              lineDirection="center"
              label="Deduction"
              placeholder="0"
              onChange={this.updateDeduction}
              value={comment.pointDelta}
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
        className="comment"
        style={style}
        onMouseEnter={this.onMouseEnter.bind(this.props, comment.localId.toString())}
        onMouseLeave={this.onMouseLeave.bind(this.props, comment.localId.toString())}
      >
        <CardText>
          <div className={savingClass} />
          {pointDelta === '' ? null : <Chip label={pointDelta} />}

          {comment.rubricComment ? (
            <div className="comment-rubric">{getRubricComment(comment.rubricComment).text}</div>
          ) : null}
          <div className="comment-text">{comment.text}</div>
          <div>
            <Button flat className="comment-button" onClick={this.toggleActive}>
              Edit
            </Button>
            <Button
              flat
              className="comment-button"
              onClick={deleteComment.bind(this, comment, file)}
            >
              Delete
            </Button>
          </div>
        </CardText>
      </Card>
    );
  }
}

export default EditableComment;

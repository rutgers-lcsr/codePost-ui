import * as React from 'react';

import { IComment, IFile } from '../../types/common';

interface IProps {
  file: IFile;
  key: number;
  comment: IComment;
  style: any;
  active: boolean;
  changeActive: any;
  deleteComment: any;
  updateComment: any;
}

interface IState {
  saveWarning: boolean;
}

class EditableComment extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    saveWarning: false,
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

  public updateComment = (event: any) => {
    const { comment, updateComment, file } = this.props;
    comment.text = event.target.value;
    updateComment(comment, file);
  };

  public updateDeduction = (event: any) => {
    const { comment, updateComment, file } = this.props;
    comment.pointDelta = event.target.value;
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

  public enterKey = (event: any) => {
    const { active } = this.props;
    if (event.key === 'Enter' && active) {
      this.toggleActive();
    }
  };

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

  public save = () => {
    const { comment, file, updateComment } = this.props;

    if (!this.validateSave()) {
      return false;
    }

    // If this is a new comment being edited, then it doesn't have an id yet
    // The new comments get initalized in CodeGrader:onMouseUp (with id undefined)
    // New comments should be a POST request
    // Else PATCH
    if (comment.id) {
      console.log('PATCH', JSON.stringify(comment));
      fetch(`/api/comments/${comment.id}/`, {
        body: JSON.stringify(comment),
        headers: {
          Authorization: `JWT ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
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
          updateComment(json, file);
        });
    }
    return true;
  };

  public commentContent = () => {
    const { active, comment, file, deleteComment, style } = this.props;
    const { saveWarning } = this.state;

    if (active) {
      // SaveWarning unused right now. But leaving it here in case we want to include
      // it in a form validation
      const pointDeltaClassName = saveWarning ? 'point-delta warning' : 'point-delta';
      return (
        <div
          className="comment"
          onMouseEnter={this.onMouseEnter.bind(this.props, comment.localId.toString())}
          onMouseLeave={this.onMouseLeave.bind(this.props, comment.localId.toString())}
          style={style}
        >
          <div>Deduction: </div>
          <input
            className={pointDeltaClassName}
            type="text"
            onChange={this.updateDeduction}
            value={comment.pointDelta}
          />
          <div>Text: </div>
          <textarea onChange={this.updateComment} onKeyPress={this.enterKey} value={comment.text} />
          <EditCommentButton active={active} toggleActive={this.toggleActive} />
        </div>
      );
    }

    let pointDelta = '';
    if (comment.pointDelta && comment.pointDelta !== 0) {
      pointDelta = `(-${comment.pointDelta})`;
    }

    return (
      <div
        className="comment"
        onMouseEnter={this.onMouseEnter.bind(this.props, comment.localId.toString())}
        onMouseLeave={this.onMouseLeave.bind(this.props, comment.localId.toString())}
        style={style}
      >
        <div className="button-delete-comment" onClick={deleteComment.bind(this, comment, file)} />
        <div>{pointDelta}</div>
        {comment.text}
        <EditCommentButton active={active} toggleActive={this.toggleActive} />
      </div>
    );
  };

  public render() {
    return <div className="comment-container">{this.commentContent()}</div>;
  }
}

interface IEditCommentButtonProps {
  active: boolean;
  toggleActive: any;
}

const EditCommentButton = (props: IEditCommentButtonProps) => {
  const { active, toggleActive } = props;
  if (active) {
    return <div className="button-save" onClick={toggleActive} />;
  }
  return <div className="button-edit" onClick={toggleActive} />;
};

export default EditableComment;

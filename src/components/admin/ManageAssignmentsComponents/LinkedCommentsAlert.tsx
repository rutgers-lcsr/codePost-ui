import * as React from 'react';
import { Button, DialogContainer } from 'react-md';

import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

interface IPropsLinkedCommentsAlert {
  rubricComment: RubricCommentType;
  onDelete: () => void;
  onUnLink: () => void;
  onCancel: (revert: boolean) => void;
  isVisible: boolean;
  isDialog: boolean;
}

const LinkedCommentsAlert = (props: IPropsLinkedCommentsAlert) => {
  // Redefine change functions in order to remove the dialog upon button click
  const onDelete = () => {
    props.onDelete();
    props.onCancel(false);
  };

  const onUnlink = () => {
    props.onUnLink();
    props.onCancel(false);
  };

  const onCancel = () => {
    props.onCancel(true);
  };

  if (!props.isVisible) {
    return <div />;
  }

  const content = (
    <div>
      <div className="error-padding" />
      The following Rubric Comment you are trying to delete has been applied to submissions.
      <br />
      <br />
      <b>Comment</b>: {props.rubricComment.text}
      <br />
      Applied to {props.rubricComment.comments.length} submissions
      <br />
      <br />
      <br />
      Choose <b>delete</b> if you want us to delete the associated comments.
      <br />
      <br />
      Choose <b>unlink</b> if you want us to keep the comments in place. They will become normal comments (not linked to
      any rubric item).
      <br />
      <br />
      Choose <b>cancel</b> if you want us to cancel save and go back to editing.
      <div className="error-padding" />
      <Button raised onClick={onDelete} primary={false} flat={true}>
        Delete
      </Button>
      <div className="error-padding" />
      <Button raised onClick={onUnlink} primary={true} flat={true}>
        Unlink
      </Button>
      <div className="error-padding" />
      <Button raised onClick={onCancel} primary={false} flat={true}>
        Cancel
      </Button>
      <div className="error-padding" />
    </div>
  );

  if (props.isDialog) {
    return (
      <DialogContainer id="rubricFile-dialog" visible={true} title="Warning" onHide={props.onCancel} modal>
        {content}
      </DialogContainer>
    );
  } else {
    return <div>{content}</div>;
  }
};

interface IPropsConfirm {
  onAccept: () => void;
  onCancel: () => void;
  isVisible: boolean;
  unsavedComments: RubricCommentType[];
  savedRubricComments: IRubricCategoryToRubricCommentsMap;
}

const LinkedCommentsConfirm = (props: IPropsConfirm) => {
  if (!props.isVisible) {
    return <div />;
  }

  const savedComments: RubricCommentType[] = Object.values(props.savedRubricComments).flat();

  // Ignore unsaved comments where the only change is in the order
  const contentEditedComments = props.unsavedComments.filter((unsavedComment: RubricCommentType) => {
    const match = savedComments.find((savedComment: RubricCommentType) => {
      return savedComment.id === unsavedComment.id;
    });

    if (match) {
      return match.text !== unsavedComment.text || match.pointDelta !== unsavedComment.pointDelta;
    }
    return false;
  });

  if (contentEditedComments.length === 0) {
    // FIXME: This throws a console warning
    // > Warning: Cannot update during an existing state transition (such as within `render`). R
    // > Render methods should be a pure function of props and state.
    props.onAccept();
    return <div />;
  }

  return (
    <DialogContainer id="rubricFile-dialog" visible={true} title="Warning" onHide={props.onCancel} modal>
      You're about to save edits to rubric comments that have already been applied to submissions. Continuing will
      propagate these changes to the submissions to which they are applied (including any finalized submissions). Are
      you sure you want to continue?
      <div className="error-padding" />
      <h3>Changed Comments</h3>
      <ul>
        {contentEditedComments.map((el) => {
          if (el.id > 0 && el.comments.length > 0) {
            return <li>{el.text}</li>;
          } else {
            return undefined;
          }
        })}
      </ul>
      <div className="error-padding" />
      <div className="error-padding" />
      <Button raised onClick={props.onAccept} primary={true} flat={true}>
        Continue
      </Button>
      <div className="error-padding" />
      <Button raised onClick={props.onCancel} primary={false} flat={true}>
        Cancel
      </Button>
    </DialogContainer>
  );
};

export { LinkedCommentsAlert, LinkedCommentsConfirm };

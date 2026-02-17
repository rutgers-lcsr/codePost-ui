/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* ant imports */
import { Button, Modal } from 'antd';

/* codePost imports */
import { RubricComment } from '../../../../api-client';
import { IRubricCategoryToRubricCommentsMap } from '../../../../types/common';

/**********************************************************************************************************************/

interface IPropsLinkedCommentsAlert {
  rubricComment: RubricComment;
  onDelete: () => void;
  onUnLink: () => void;
  onCancel: (revert: boolean) => void;
  isVisible: boolean;
  numComments: number;
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
      <br />
      {`> Applied to ${props.numComments} submission${props.numComments === 1 ? '' : 's'}`}
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
    </div>
  );

  return (
    <Modal
      open={true}
      title="Warning"
      footer={[
        <Button key="cancel" onClick={onCancel} type="primary">
          Cancel
        </Button>,
        <Button key="delete" onClick={onDelete} danger>
          Delete
        </Button>,
        <Button key="unlink" onClick={onUnlink}>
          Unlink
        </Button>,
      ]}
    >
      {content}
    </Modal>
  );
};

interface IPropsConfirm {
  onAccept: () => void;
  onCancel: () => void;
  isVisible: boolean;
  unsavedComments: RubricComment[];
  savedRubricComments: IRubricCategoryToRubricCommentsMap;
}

const LinkedCommentsConfirm = (props: IPropsConfirm) => {
  if (!props.isVisible) {
    return <div />;
  }

  const savedComments: RubricComment[] = Object.values(props.savedRubricComments).flat();

  // Ignore unsaved comments where the only change is in the order
  const contentEditedComments = props.unsavedComments.filter((unsavedComment: RubricComment) => {
    const match = savedComments.find((savedComment: RubricComment) => {
      return savedComment.id === unsavedComment.id;
    });

    return match !== undefined;
  });

  if (contentEditedComments.length === 0) {
    // FIXME: This throws a console warning
    // > Warning: Cannot update during an existing state transition (such as within `render`). R
    // > Render methods should be a pure function of props and state.
    props.onAccept();
    return <div />;
  }

  return (
    <Modal open={true} title="Warning" onCancel={props.onCancel} onOk={props.onAccept} okText="Continue">
      You're about to save edits to rubric comments that have already been applied to submissions. Continuing will
      propagate these changes to the submissions to which they are applied (including any finalized submissions). Are
      you sure you want to continue?
      <div className="error-padding" />
      <br />
      <h3>Changed Comments</h3>
      <ul>
        {contentEditedComments.map((el) => {
          if (el.id) {
            return <li key={el.text}>{el.text}</li>;
          } else {
            return undefined;
          }
        })}
      </ul>
    </Modal>
  );
};

export { LinkedCommentsAlert, LinkedCommentsConfirm };

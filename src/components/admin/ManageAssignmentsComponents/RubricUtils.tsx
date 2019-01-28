import * as React from 'react';
import {
  Button,
  DataTable,
  DialogContainer,
  EditDialogColumn,
  FontIcon,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
  Tooltipped,
} from 'react-md';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

// -- Rubric Comment Row  Object --
// Creating a new class to render RubricCommentRows in the admin panel, in order
// to avoid binds and improve performance

interface IPropsRubricComment {
  commentID: number;
  categoryID: number;
  commentIndex: number;
  changeCommentText: (categoryID: number, commentIndex: number, newText: string) => void;
  changeCommentDelta: (categoryID: number, commentIndex: number, newDelta: number) => void;
  defaultText: string;
  defaultDelta: number;
  isDisabled: boolean;
  deleteComment: (categoryID: number, commentIndex: number) => void;
  updateComment: (categoryID: number, commentIndex: number) => void;
  savedComments: { [id: number]: boolean };
  linkedComments: number[];
  triggerCommentExplorer: (categoryID: number, commentIndex: number) => void;
}

const RubricCommentRow = (props: IPropsRubricComment) => {
  const changeThisCommentText = (newText: string) => {
    props.changeCommentText(props.categoryID, props.commentIndex, newText);
  };

  const changeThisCommentDelta = (newDelta: number) => {
    props.changeCommentDelta(props.categoryID, props.commentIndex, newDelta);
  };

  const deleteThisComment = () => {
    props.deleteComment(props.categoryID, props.commentIndex);
  };

  const updateThisComment = () => {
    props.updateComment(props.categoryID, props.commentIndex);
  };

  const triggerCommentExplorer = () => {
    props.triggerCommentExplorer(props.categoryID, props.commentIndex);
  };

  const deleteCommentColumn = !props.isDisabled ? (
    <TableColumn>
      <Button
        key="Delete"
        className="Btn"
        flat={true}
        icon={true}
        disabled={props.isDisabled}
        onClick={deleteThisComment}
      >
        delete
      </Button>
    </TableColumn>
  ) : null;

  let unSavedChanges = <div style={{ width: '20px' }} />;
  if (props.commentID in props.savedComments) {
    unSavedChanges = props.savedComments[props.commentID] ? (
      <Tooltipped label="Changes saved." position="right" setPosition={true} delay={500}>
        <div>
          <FontIcon>done_all</FontIcon>
        </div>
      </Tooltipped>
    ) : (
      <Tooltipped label="Unsaved changes. Click anywhere to save." position="right" setPosition={true} delay={500}>
        <div>
          <FontIcon>cloud_off</FontIcon>
        </div>
      </Tooltipped>
    );
  }

  const frequencyClassName =
    props.linkedComments.length > 0
      ? 'admin-rubric__commentRow__frequency'
      : 'admin-rubric__commentRow__frequency--none';

  return (
    <TableRow key={props.commentID}>
      <TableColumn>{unSavedChanges}</TableColumn>
      <TableColumn>
        <Tooltipped label="Click to explore." setPosition={true} position="right" delay={500}>
          <div className={frequencyClassName} onClick={triggerCommentExplorer}>
            {props.linkedComments.length}
          </div>
        </Tooltipped>
      </TableColumn>
      <EditDialogColumn
        defaultValue={props.defaultText}
        inline={true}
        disabled={props.isDisabled}
        noIcon={props.isDisabled}
        onChange={changeThisCommentText}
        onBlur={updateThisComment}
        centered={true}
      />
      <EditDialogColumn
        type="number"
        defaultValue={props.defaultDelta}
        inline={true}
        step={0.5}
        pattern="^d+(\.|\,)\d{1}"
        className="deduction-field"
        disabled={props.isDisabled}
        noIcon={props.isDisabled}
        onChange={changeThisCommentDelta}
        onBlur={updateThisComment}
        centered={true}
      />
      {deleteCommentColumn}
    </TableRow>
  );
};

// -- Rubric Category Table  Object --

interface IPropsRubricCategory {
  categoryID: number;
  categoryIndex: number;
  // CommentFunctions
  changeCommentText: (categoryID: number, commentIndex: number, newText: string) => void;
  changeCommentDelta: (categoryID: number, commentIndex: number, newDelta: number) => void;
  deleteComment: (categoryID: number, commentIndex: number) => void;
  updateComment: (categoryID: number, commentIndex: number) => void;

  // Category props
  comments: RubricCommentType[];
  categoryName: string;
  categoryPointLimit: number | null;

  // Category fuctions
  deleteCategory: (categoryID: number, categoryName: string) => void;
  changeCategoryName: (categoryIndex: number, newText: string) => void;
  changeCategoryCap: (categoryIndex: number, newCap: number | null) => void;
  addEmptyComment: (categoryIndex: number) => void;
  updateCategory: (catetgoryIndex: number) => void;

  // General props
  isDisabled: boolean;
  savedComments: { [id: number]: boolean };
  savedCategories: { [id: number]: boolean };

  triggerCommentExplorer: (categoryID: number, commentIndex: number) => void;
}

const RubricCategoryTable = (props: IPropsRubricCategory) => {
  const changeThisCategoryText = (newText: string) => {
    props.changeCategoryName(props.categoryIndex, newText);
  };

  const changeThisCategoryCap = (newCap: number) => {
    props.changeCategoryCap(props.categoryIndex, newCap);
  };

  const deleteThisCategory = () => {
    props.deleteCategory(props.categoryID, props.categoryName);
  };

  const addEmptyCommentToThis = () => {
    props.addEmptyComment(props.categoryID);
  };

  const updateThisCategory = () => {
    props.updateCategory(props.categoryIndex);
  };

  const renderCommentRows = () => {
    if (props.comments) {
      return props.comments.map((comm, commIndex) => {
        return (
          <RubricCommentRow
            key={commIndex}
            commentID={comm.id}
            categoryID={props.categoryID}
            commentIndex={commIndex}
            changeCommentText={props.changeCommentText}
            changeCommentDelta={props.changeCommentDelta}
            deleteComment={props.deleteComment}
            defaultText={comm.text}
            defaultDelta={comm.pointDelta}
            isDisabled={props.isDisabled}
            updateComment={props.updateComment}
            savedComments={props.savedComments}
            linkedComments={comm.comments}
            triggerCommentExplorer={props.triggerCommentExplorer}
          />
        );
      });
    }
    return <div />;
  };

  let deleteCategoryButton = null;
  let deleteCommentHeader = null;
  if (!props.isDisabled) {
    deleteCategoryButton = (
      <Button
        key="Delete"
        className="Btn"
        icon={true}
        fullWidth={false}
        disabled={props.isDisabled}
        onClick={deleteThisCategory}
      >
        delete
      </Button>
    );
    deleteCommentHeader = <TableColumn key={'Delete'}>Delete</TableColumn>;
  }

  let unSavedChanges;
  if (props.categoryID in props.savedCategories) {
    unSavedChanges = props.savedCategories[props.categoryID] ? (
      <Tooltipped label="Changes saved." position="right" setPosition={true} delay={500}>
        <div>
          <FontIcon>done_all</FontIcon>
        </div>
      </Tooltipped>
    ) : (
      <Tooltipped label="Unsaved changes. Click anywhere to save." position="right" setPosition={true} delay={500}>
        <div>
          <FontIcon>cloud_off</FontIcon>
        </div>
      </Tooltipped>
    );
  }

  return (
    <div key={props.categoryID}>
      <div>
        <TextField
          defaultValue={props.categoryName}
          label={'Category Name'}
          fullWidth={false}
          onChange={changeThisCategoryText}
          disabled={props.isDisabled}
          onBlur={updateThisCategory}
        />
        <TextField
          defaultValue={typeof props.categoryPointLimit === 'number' ? props.categoryPointLimit : ''}
          label={'Category points cap'}
          fullWidth={false}
          step={0.5}
          pattern="^d+(\.|\,)\d{1}"
          type="number"
          min={0}
          onChange={changeThisCategoryCap}
          disabled={props.isDisabled}
          onBlur={updateThisCategory}
        />
        {unSavedChanges}
        {deleteCategoryButton}
      </div>
      <DataTable key={props.categoryID} className="edit-rubric-table" baseId="edit-rubric-table" plain={true}>
        <TableHeader>
          <TableRow selectable={false}>
            <TableColumn key={'spacing1'} />
            <TableColumn key={'Linked comments'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Linked Comments
                <Tooltipped
                  label="Warning: Edits made to items with linked comments in submissions will affect those comments. "
                  position="right"
                  setPosition={true}
                  delay={500}
                >
                  <div style={{ paddingLeft: '2px' }}>
                    <FontIcon>error</FontIcon>
                  </div>
                </Tooltipped>
              </div>
            </TableColumn>
            <TableColumn key={'CommentText'} grow={true}>
              Comment text
            </TableColumn>
            <TableColumn key={'Deduction'}>Deduction</TableColumn>
            {deleteCommentHeader}
          </TableRow>
        </TableHeader>
        <TableBody>{renderCommentRows()}</TableBody>
      </DataTable>
      <Button className="Btn" iconChildren={'playlist_add'} disabled={props.isDisabled} onClick={addEmptyCommentToThis}>
        Add New Comment
      </Button>
      <div className="padding" />
    </div>
  );
};

// -- Object to ask user if they want to delete or unlink linked comments upon deletion of rubricComment/Category --

interface IPropsDeleteLinkedDialog {
  numCommentsAffected?: number;
  onDelete: () => void;
  onUnLink: () => void;
  onCancel: () => void;
  isVisible: boolean;
  isDialog: boolean;
}

const DeleteLinkedCommentsDialog = (props: IPropsDeleteLinkedDialog) => {
  if (!props.isVisible) {
    return <div />;
  }
  const content = (
    <div>
      <div className="error-padding" />
      Performing this action will delete one or more rubricComments that are linked to comments provided on submissions.
      Do you wish to delete those linked comments or 'unlink' them (keeping the comment intact with the same text and
      point value)?
      <div className="error-padding" />
      <Button raised onClick={props.onDelete} primary={false} flat={true}>
        Delete
      </Button>
      <div className="error-padding" />
      <Button raised onClick={props.onUnLink} primary={true} flat={true}>
        Unlink
      </Button>
      <div className="error-padding" />
      <Button raised onClick={props.onCancel} primary={false} flat={true}>
        Cancel
      </Button>
      <div className="error-padding" />
    </div>
  );

  if (props.isDialog) {
    return (
      <DialogContainer id="rubricFile-dialog" visible={true} title="Manage rubric files" onHide={props.onCancel} modal>
        {content}
      </DialogContainer>
    );
  } else {
    return <div>{content}</div>;
  }
};

export { RubricCategoryTable, DeleteLinkedCommentsDialog };

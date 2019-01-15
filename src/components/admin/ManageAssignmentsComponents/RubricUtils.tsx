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

  let unSavedChanges;
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

  return (
    <div>
      <TableRow key={props.commentID}>
        {unSavedChanges}
        <EditDialogColumn
          defaultValue={props.defaultText}
          inline={true}
          disabled={props.isDisabled}
          noIcon={props.isDisabled}
          centered={true}
          onChange={changeThisCommentText}
          onBlur={updateThisComment}
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
          centered={true}
          onChange={changeThisCommentDelta}
          onBlur={updateThisComment}
        />
        {deleteCommentColumn}
      </TableRow>
    </div>
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
          />
        );
      });
    }
    return <div />;
  };

  let deleteCategoryButton;
  let deleteCommentHeader;
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
          defaultValue={props.categoryPointLimit ? props.categoryPointLimit : ''}
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
          <TableRow>
            <TableColumn key={'CommentText'}>Comment text</TableColumn>
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
      Performing this action will delete some rubric comments. If there are submission comments associated with these,
      you can choose to delete those comments or to 'unlink those comments' (keeping the comment intact with the same
      text and point value). Which action would you like to take?
      <div className="error-padding" />
      <Button raised onClick={props.onDelete} primary={false} flat={true}>
        Delete linked comments
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

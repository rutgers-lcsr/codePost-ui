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
import { RubricCommentType } from '../../infrastructure/rubricComment';

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

interface IPropsDeleteLinkedDialog {
  numCommentsAffected?: number;
  onDelete: () => void;
  onUnLink: () => void;
  onCancel: () => void;
  isVisible: boolean;
  isDialog: boolean;
}
// Creating a new class to render RubricCommentRows in the admin panel, in order
// to avoid binds and improve performance
const RubricCommentRow = (props: IPropsRubricComment) => {
  const {
    categoryID,
    commentIndex,
    commentID,
    isDisabled,
    defaultText,
    defaultDelta,
    changeCommentText,
    changeCommentDelta,
    deleteComment,
    updateComment,
    savedComments,
  } = props;

  const changeThisCommentText = (newText: string) => {
    changeCommentText(categoryID, commentIndex, newText);
  };

  const changeThisCommentDelta = (newDelta: number) => {
    changeCommentDelta(categoryID, commentIndex, newDelta);
  };

  const deleteThisComment = () => {
    deleteComment(categoryID, commentIndex);
  };

  const updateThisComment = () => {
    updateComment(categoryID, commentIndex);
  };

  const deleteCommentColumn = !isDisabled ? (
    <TableColumn>
      <Button key="Delete" className="Btn" flat={true} icon={true} disabled={isDisabled} onClick={deleteThisComment}>
        delete
      </Button>
    </TableColumn>
  ) : null;

  let unSavedChanges;
  if (commentID in savedComments) {
    unSavedChanges = savedComments[commentID] ? (
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
      <TableRow key={commentID}>
        {unSavedChanges}
        <EditDialogColumn
          defaultValue={defaultText}
          inline={true}
          disabled={isDisabled}
          noIcon={isDisabled}
          centered={true}
          onChange={changeThisCommentText}
          onBlur={updateThisComment}
        />
        <EditDialogColumn
          type="number"
          defaultValue={defaultDelta}
          inline={true}
          step={0.5}
          pattern="^d+(\.|\,)\d{1}"
          className="deduction-field"
          disabled={isDisabled}
          noIcon={isDisabled}
          centered={true}
          onChange={changeThisCommentDelta}
          onBlur={updateThisComment}
        />
        {deleteCommentColumn}
      </TableRow>
    </div>
  );
};

const RubricCategoryTable = (props: IPropsRubricCategory) => {
  const {
    categoryName,
    categoryPointLimit,
    comments,
    categoryID,
    categoryIndex,
    changeCommentText,
    changeCommentDelta,
    deleteComment,
    isDisabled,
    changeCategoryName,
    changeCategoryCap,
    deleteCategory,
    addEmptyComment,
    updateComment,
    updateCategory,
    savedComments,
    savedCategories,
  } = props;

  const changeThisCategoryText = (newText: string) => {
    changeCategoryName(categoryIndex, newText);
  };

  const changeThisCategoryCap = (newCap: number) => {
    changeCategoryCap(categoryIndex, newCap);
  };

  const deleteThisCategory = () => {
    deleteCategory(categoryID, categoryName);
  };

  const addEmptyCommentToThis = () => {
    addEmptyComment(categoryID);
  };

  const updateThisCategory = () => {
    updateCategory(categoryIndex);
  };

  const renderCommentRows = () => {
    if (comments) {
      return comments.map((comm, commIndex) => {
        return (
          <RubricCommentRow
            key={commIndex}
            commentID={comm.id}
            categoryID={categoryID}
            commentIndex={commIndex}
            changeCommentText={changeCommentText}
            changeCommentDelta={changeCommentDelta}
            deleteComment={deleteComment}
            defaultText={comm.text}
            defaultDelta={comm.pointDelta}
            isDisabled={isDisabled}
            updateComment={updateComment}
            savedComments={savedComments}
          />
        );
      });
    }
    return <div />;
  };

  let deleteCategoryButton;
  let deleteCommentHeader;
  if (!isDisabled) {
    deleteCategoryButton = (
      <Button
        key="Delete"
        className="Btn"
        icon={true}
        fullWidth={false}
        disabled={isDisabled}
        onClick={deleteThisCategory}
      >
        delete
      </Button>
    );
    deleteCommentHeader = <TableColumn key={'Delete'}>Delete</TableColumn>;
  }

  let unSavedChanges;
  if (categoryID in savedCategories) {
    unSavedChanges = savedCategories[categoryID] ? (
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
    <div key={categoryID}>
      <div>
        <TextField
          defaultValue={categoryName}
          label={'Category Name'}
          fullWidth={false}
          onChange={changeThisCategoryText}
          disabled={isDisabled}
          onBlur={updateThisCategory}
        />
        <TextField
          defaultValue={categoryPointLimit ? categoryPointLimit : ''}
          label={'Category points cap'}
          fullWidth={false}
          step={0.5}
          pattern="^d+(\.|\,)\d{1}"
          type="number"
          min={0}
          onChange={changeThisCategoryCap}
          disabled={isDisabled}
          onBlur={updateThisCategory}
        />
        {unSavedChanges}
        {deleteCategoryButton}
      </div>
      <DataTable key={categoryID} className="edit-rubric-table" baseId="edit-rubric-table" plain={true}>
        <TableHeader>
          <TableRow>
            <TableColumn key={'CommentText'}>Comment text</TableColumn>
            <TableColumn key={'Deduction'}>Deduction</TableColumn>
            {deleteCommentHeader}
          </TableRow>
        </TableHeader>
        <TableBody>{renderCommentRows()}</TableBody>
      </DataTable>
      <Button className="Btn" iconChildren={'playlist_add'} disabled={isDisabled} onClick={addEmptyCommentToThis}>
        Add New Comment
      </Button>
      <div className="padding" />
    </div>
  );
};

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
      <Button raised onClick={props.onUnLink} primary={true} flat={true}>
        Unlink
      </Button>
      <Button raised onClick={props.onCancel} primary={false} flat={true}>
        Cancel upload
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

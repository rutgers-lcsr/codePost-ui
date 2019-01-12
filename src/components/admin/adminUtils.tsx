import * as React from 'react';
import {
  Button,
  DataTable,
  EditDialogColumn,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
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
  deleteComment: (categoryID: number, commentIndex: number, deleteLinkedComments: boolean) => void;
  updateComment: (categoryID: number, commentIndex: number) => void;
}
interface IPropsRubricCategory {
  categoryID: number;
  categoryIndex: number;
  // CommentFunctions
  changeCommentText: (categoryID: number, commentIndex: number, newText: string) => void;
  changeCommentDelta: (categoryID: number, commentIndex: number, newDelta: number) => void;
  deleteComment: (categoryID: number, commentIndex: number, deleteLinkedComments: boolean) => void;
  updateComment: (categoryID: number, commentIndex: number) => void;

  // Category props
  comments: RubricCommentType[];
  categoryName: string;
  categoryPointLimit: number | undefined;

  // Category fuctions
  deleteCategory: (categoryID: number, categoryName: string) => void;
  changeCategoryName: (categoryIndex: number, newText: string) => void;
  changeCategoryCap: (categoryIndex: number, newCap: number) => void;
  addEmptyComment: (categoryIndex: number) => void;
  updateCategory: (catetgoryIndex: number) => void;

  // General props
  isDisabled: boolean;
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
  } = props;

  const changeThisCommentText = (newText: string) => {
    changeCommentText(categoryID, commentIndex, newText);
  };

  const changeThisCommentDelta = (newDelta: number) => {
    changeCommentDelta(categoryID, commentIndex, newDelta);
  };

  const deleteThisComment = () => {
    deleteComment(categoryID, commentIndex, true);
  };

  const updateThisComment = () => {
    updateComment(categoryID, commentIndex);
  };

  let deleteCommentColumn;
  if (!isDisabled) {
    deleteCommentColumn = (
      <Button key="Delete" className="Btn" flat={true} icon={true} disabled={isDisabled} onClick={deleteThisComment}>
        delete
      </Button>
    );
  }

  return (
    <TableRow key={commentID}>
      <TableColumn>
        <EditDialogColumn
          defaultValue={defaultText}
          inline={true}
          disabled={isDisabled}
          noIcon={isDisabled}
          centered={true}
          onChange={changeThisCommentText}
          onBlur={updateThisComment}
        />
      </TableColumn>
      <TableColumn>
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
      </TableColumn>
      {deleteCommentColumn}
    </TableRow>
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

  return (
    <div key={categoryID}>
      <TextField
        defaultValue={categoryName}
        label={'Category Name'}
        fullWidth={false}
        onChange={changeThisCategoryText}
        disabled={isDisabled}
        onBlur={updateThisCategory}
      />
      <TextField
        defaultValue={categoryPointLimit}
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
      {deleteCategoryButton}
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

export default RubricCategoryTable;

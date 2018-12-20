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
import { IRubricComment } from '../../types/common';

interface IPropsRubricComment {
  commentID: number;
  categoryID: number;
  commentIndex: number;
  commentTextChange: (categoryID: number, commentIndex: number, newText: string) => void;
  commentDeltaChange: (categoryID: number, commentIndex: number, newDelta: number) => void;
  defaultText: string;
  defaultDelta: number;
  isDisabled: boolean;
  deleteCommentFunction: (categoryID: number, commentIndex: number) => void;
}
interface IPropsRubricCategory {
  categoryID: number;
  // CommentFunctions
  commentTextChange: (categoryID: number, commentIndex: number, newText: string) => void;
  commentDeltaChange: (categoryID: number, commentIndex: number, newDelta: number) => void;
  deleteCommentFunction: (categoryID: number, commentIndex: number) => void;

  // Category props
  comments: IRubricComment[];
  categoryName: string;
  categoryPointLimit: number | undefined;

  // Category fuctions
  deleteCategory: (categoryID: number, categoryName: string) => void;
  changeCategoryName: (categoryIndex: number, newText: string) => void;
  changeCategoryCap: (categoryIndex: number, newCap: number) => void;
  addEmptyComment: (categoryIndex: number) => void;

  // General props
  isDisabled: boolean;
}

// Creating a new class to render RubricCommentRows in the admin panel, in order
// to avoid binds and improve performance
const RubricCommentRow = (props: IPropsRubricComment) => {
  const changeThisCommentText = (newText: string) => {
    const { categoryID, commentIndex, commentTextChange } = props;
    commentTextChange(categoryID, commentIndex, newText);
  };

  const changeThisCommentDelta = (newDelta: number) => {
    const { categoryID, commentIndex, commentDeltaChange } = props;
    commentDeltaChange(categoryID, commentIndex, newDelta);
  };

  const deleteThisComment = () => {
    const { categoryID, commentIndex, deleteCommentFunction } = props;
    deleteCommentFunction(categoryID, commentIndex);
  };

  const { commentID, isDisabled, defaultText, defaultDelta } = props;

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
        />
      </TableColumn>
      <TableColumn>
        <Button
          key="Delete"
          className="Btn"
          flat={true}
          icon={true}
          disabled={isDisabled}
          onClick={deleteThisComment}
        >
          delete
        </Button>
      </TableColumn>
    </TableRow>
  );
};

const RubricCategoryTable = (props: IPropsRubricCategory) => {
  const {
    categoryName,
    categoryPointLimit,
    comments,
    categoryID,
    commentTextChange,
    commentDeltaChange,
    deleteCommentFunction,
    isDisabled,
    changeCategoryName,
    changeCategoryCap,
    deleteCategory,
    addEmptyComment,
  } = props;

  const changeThisCategoryText = (newText: string) => {
    changeCategoryName(categoryID, newText);
  };

  const changeThisCategoryCap = (newCap: number) => {
    changeCategoryCap(categoryID, newCap);
  };

  const deleteThisCategory = () => {
    deleteCategory(categoryID, categoryName);
  };

  const addEmptyCommentToThis = () => {
    addEmptyComment(categoryID);
  };

  const renderCommentRows = () => {
    if (comments) {
      return comments.map((comm, commIndex) => {
        return (
          <RubricCommentRow
            key={comm.id}
            commentID={comm.id}
            categoryID={categoryID}
            commentIndex={commIndex}
            commentTextChange={commentTextChange}
            commentDeltaChange={commentDeltaChange}
            deleteCommentFunction={deleteCommentFunction}
            defaultText={comm.text}
            defaultDelta={comm.pointDelta}
            isDisabled={isDisabled}
          />
        );
      });
    }
    return <div />;
  };

  return (
    <div key={categoryID}>
      <TextField
        defaultValue={categoryName}
        label={'Category Name'}
        fullWidth={false}
        onChange={changeThisCategoryText}
        disabled={isDisabled}
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
      />
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
      <DataTable
        key={categoryID}
        className="edit-rubric-table"
        baseId="edit-rubric-table"
        plain={true}
      >
        <TableHeader>
          <TableRow>
            <TableColumn key={'CommentText'}>Comment text</TableColumn>
            <TableColumn key={'Deduction'}>Deduction</TableColumn>
            <TableColumn key={'Delete'}>Delete</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody>{renderCommentRows()}</TableBody>
      </DataTable>
      <Button
        className="Btn"
        iconChildren={'playlist_add'}
        disabled={isDisabled}
        onClick={addEmptyCommentToThis}
      >
        Add New Comment
      </Button>
      <div className="padding" />
    </div>
  );
};

export default RubricCategoryTable;

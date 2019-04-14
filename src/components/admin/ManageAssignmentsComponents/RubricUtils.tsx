import * as React from 'react';
import {
  Button,
  DataTable,
  DialogContainer,
  FontIcon,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
  Tooltipped,
} from 'react-md';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

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
  draggableProvided: any;
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
    <tr
      key={props.commentID}
      className="md-table-row"
      ref={props.draggableProvided.innerRef}
      {...props.draggableProvided.draggableProps}
      {...props.draggableProvided.dragHandleProps}
    >
      <TableColumn>
        <div className="admin-rubric__commentRow__drag-handle" />
      </TableColumn>
      <TableColumn>{unSavedChanges}</TableColumn>
      <TableColumn>
        <Tooltipped label="Click to explore." setPosition={true} position="right" delay={500}>
          <div className={frequencyClassName} onClick={triggerCommentExplorer}>
            {props.linkedComments.length}
          </div>
        </Tooltipped>
      </TableColumn>
      <TableColumn grow={true}>
        <TextField
          value={props.defaultText}
          disabled={props.isDisabled}
          onChange={changeThisCommentText}
          onBlur={updateThisComment}
          className={'comment-text'}
          maxRows={5}
          rows={1}
          style={{ width: '100%' }}
        />
      </TableColumn>
      <TableColumn style={{ position: 'relative' }}>
        <TextField
          type="number"
          defaultValue={props.defaultDelta}
          step={0.5}
          pattern="^d+(\.|\,)\d{1}"
          className="deduction-field"
          disabled={props.isDisabled}
          onChange={changeThisCommentDelta}
          onBlur={updateThisComment}
          style={{ width: '100%', position: 'absolute', bottom: '0px' }}
        />
      </TableColumn>
      {deleteCommentColumn}
    </tr>
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
  deleteCategory: (categoryID: number, categoryIndex: number, categoryName: string) => void;
  changeCategoryName: (categoryIndex: number, newText: string) => void;
  changeCategoryCap: (categoryIndex: number, newCap: number | null) => void;
  addEmptyComment: (categoryIndex: number) => void;
  updateCategoryCaps: (categoryID: number, categoryIndex: number, categoryName: string) => void;
  updateCategoryName: (catetgoryIndex: number) => void;

  // General props
  isDisabled: boolean;
  savedComments: { [id: number]: boolean };
  savedCategories: { [id: number]: boolean };

  triggerCommentExplorer: (categoryID: number, commentIndex: number) => void;
  onDragEnd: any;
}

const RubricCategoryTable = (props: IPropsRubricCategory) => {
  const changeThisCategoryText = (newText: string) => {
    props.changeCategoryName(props.categoryIndex, newText);
  };

  const changeThisCategoryCap = (newCap: number) => {
    props.changeCategoryCap(props.categoryIndex, newCap);
  };

  const deleteThisCategory = () => {
    props.deleteCategory(props.categoryID, props.categoryIndex, props.categoryName);
  };

  const addEmptyCommentToThis = () => {
    props.addEmptyComment(props.categoryID);
  };

  const updateThisCategoryCaps = () => {
    props.updateCategoryCaps(props.categoryID, props.categoryIndex, props.categoryName);
  };

  const updateThisCategoryName = () => {
    props.updateCategoryName(props.categoryIndex);
  };

  const renderCommentRows = () => {
    if (props.comments) {
      return (
        <DragDropContext onDragEnd={props.onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided: any, snapshot: any) => (
              <tbody className="md-table-body" ref={provided.innerRef}>
                {props.comments.map((comm, commIndex) => (
                  <Draggable key={comm.id} draggableId={`draggable-${comm.id}`} index={commIndex}>
                    {// tslint:disable-next-line:no-shadowed-variable
                    (provided: any, snapshot: any) => (
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
                        draggableProvided={provided}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </DragDropContext>
      );
    }
    return <div />;
  };

  let deleteCategoryButton = null;
  let deleteCommentHeader = null;
  if (!props.isDisabled) {
    deleteCategoryButton = (
      <Button
        key="Delete"
        className="admin-rubric__category--header__delete-btn"
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
    <div className="admin-rubric__category" key={props.categoryID}>
      <div className="admin-rubric__category--header">
        <TextField
          defaultValue={props.categoryName}
          label={'Category Name'}
          fullWidth={false}
          onChange={changeThisCategoryText}
          disabled={props.isDisabled}
          onBlur={updateThisCategoryName}
          customSize="font-size-large"
        />
        <TextField
          defaultValue={typeof props.categoryPointLimit === 'number' ? props.categoryPointLimit : undefined}
          label={'Category points cap'}
          fullWidth={false}
          step={0.5}
          pattern="^d+(\.|\,)\d{1}"
          required={false}
          min={0}
          type="number"
          onChange={changeThisCategoryCap}
          disabled={props.isDisabled}
          onBlur={updateThisCategoryCaps}
          customSize="font-size-large"
        />
        <div className="admin-rubric__category--header__unsavedChanges">{unSavedChanges}</div>
        <div className="admin-rubric__category--header__delete">{deleteCategoryButton}</div>
        <div className="admin-rubric__category--header__warning">
          {props.categoryPointLimit === 0
            ? 'Warning: A Category Limit of 0 means that no submissions will receive deductions for this category'
            : ''}
        </div>
      </div>
      <DataTable key={props.categoryID} className="DataTable--RubricCategory" baseId="edit-rubric-table" plain={true}>
        <TableHeader>
          <TableRow selectable={false}>
            <TableColumn key={'dragHandle'} />
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
            <TableColumn key={'CommentText'}>Comment text</TableColumn>
            <TableColumn key={'Deduction'}>Deduction</TableColumn>
            {deleteCommentHeader}
          </TableRow>
        </TableHeader>
        {renderCommentRows()}
      </DataTable>
      <Button className="Btn" iconChildren={'playlist_add'} disabled={props.isDisabled} onClick={addEmptyCommentToThis}>
        Add New Comment
      </Button>
      <div className="padding" />
    </div>
  );
};

// -- Object to ask user if they want to delete or unlink linked comments upon deletion of rubricComment/Category --

interface IPropsLinkedCommentsAlert {
  numCommentsAffected?: number;
  onDelete: () => void;
  onUpdate: () => void;
  onUnLink: () => void;
  onCancel: (revert: boolean) => void;
  isVisible: boolean;
  isDialog: boolean;
  isDelete: boolean;
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

  const onUpdate = () => {
    props.onUpdate();
    props.onCancel(false);
  };

  if (!props.isVisible) {
    return <div />;
  }
  let content;
  if (props.isDelete) {
    content = (
      <div>
        <div className="error-padding" />
        Performing this action will delete one or more rubricComments that are linked to comments provided on
        submissions. Do you wish to delete those linked comments or 'unlink' them (keeping the comment intact with the
        same text and point value)?
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
  } else {
    content = (
      <div>
        <div className="error-padding" />
        Performing this action will update one or more rubricComments that are linked to comments provided on
        submissions. Do you wish to continue with this change?
        <div className="error-padding" />
        <Button raised onClick={onUpdate} primary={false} flat={true}>
          Continue
        </Button>
        <div className="error-padding" />
        <Button raised onClick={onCancel} primary={false} flat={true}>
          Cancel
        </Button>
        <div className="error-padding" />
      </div>
    );
  }

  if (props.isDialog) {
    return (
      <DialogContainer
        id="rubricFile-dialog"
        visible={true}
        title="Warning: Linked Comments"
        onHide={props.onCancel}
        modal
      >
        {content}
      </DialogContainer>
    );
  } else {
    return <div>{content}</div>;
  }
};

export { RubricCategoryTable, LinkedCommentsAlert };

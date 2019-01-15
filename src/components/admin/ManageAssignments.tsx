import * as React from 'react';
import {
  Button,
  DataTable,
  SelectionControl,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import { AssignmentType } from '../../infrastructure/assignment';

import {
  IAssignmentToRubricCategories,
  IAssignmentToSubmissionsMap,
  IRubricCategoryToRubricCommentsMap,
} from '../../types/common';
import { DeleteLinkedCommentsDialog, RubricCategoryTable } from './adminUtils';
import NewAssignmentDialog from './NewAssignmentDialog';
import RubricFileDialog from './RubricFileDialog';

import { CourseType } from '../../infrastructure/course';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';
import { SubmissionType } from '../../infrastructure/submission';

interface IProps {
  submissions: IAssignmentToSubmissionsMap;
  rubricCategories: IAssignmentToRubricCategories;
  rubricComments: IRubricCategoryToRubricCommentsMap;
  submissionsLoadComplete: boolean;
  lockManageAssignment: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  assignments: AssignmentType[];
  assignmentRubricLoadComplete: boolean;
  createRubricCategory: (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | null,
    newComments: RubricCommentType[],
  ) => Promise<RubricCategoryType>;
  createRubricComment: (
    assignmentID: number,
    categoryID: number,
    text: string,
    pointDelta: number,
  ) => Promise<RubricCommentType>;
  deleteRubricCategory: (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    deleteLinkedComments: boolean,
  ) => Promise<void>;
  deleteRubricComment: (
    assignmentID: number,
    categoryID: number,
    commentID: number,
    deleteLinkedComments: boolean,
  ) => Promise<void>;
  updateRubricCategory: (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | null,
  ) => Promise<void>;
  updateRubricComment: (
    categoryID: number,
    commentID: number,
    text: string | undefined,
    pointDelta: number | undefined,
  ) => Promise<void>;
  updateAssignment: (
    assignnmentID: number,
    name: string | undefined,
    points: number | undefined,
    isReleased: boolean | undefined,
  ) => Promise<void>;
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<AssignmentType>;
}

interface IState {
  activeAssignment: AssignmentType | undefined;
  activeRubricCategories: RubricCategoryType[] | undefined;
  activeRubricComments: IRubricCategoryToRubricCommentsMap | undefined;
  newCategoryCounter: number;
  deleteCommentDialogID: { categoryID: number; commentIndex: number } | undefined;
  deleteCategoryDialogID: { categoryID: number; categoryName: string } | undefined;
  savedComments: { [id: number]: boolean };
  savedCategories: { [id: number]: boolean };
}

class ManageAssignments extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    activeAssignment: undefined,
    activeRubricCategories: undefined,
    activeRubricComments: undefined,
    newCategoryCounter: -1,
    deleteCommentDialogID: undefined,
    deleteCategoryDialogID: undefined,
    savedComments: {},
    savedCategories: {},
  };

  public assignmentNameField: any;
  public assignmentPointsField: any;

  constructor(props: IProps) {
    super(props);
    this.assignmentNameField = React.createRef();
    this.assignmentPointsField = React.createRef();
  }

  public changeActiveAssignment = (assignment: AssignmentType | undefined) => {
    const { rubricCategories, rubricComments } = this.props;
    if (assignment) {
      this.setState({
        activeAssignment: assignment,
        activeRubricCategories: JSON.parse(JSON.stringify(rubricCategories[assignment.id])),
        activeRubricComments: JSON.parse(JSON.stringify(rubricComments)),
      });
    } else {
      this.setState({
        activeAssignment: undefined,
        activeRubricCategories: undefined,
        activeRubricComments: undefined,
      });
    }
  };

  // ------------------- Functions to modify activeRubricCategories state field -------------------
  public addEmptyCategory = () => {
    const { activeRubricCategories, activeRubricComments, activeAssignment, newCategoryCounter } = this.state;
    if (activeRubricCategories && activeAssignment && activeRubricComments) {
      activeRubricCategories.push({
        id: newCategoryCounter,
        name: '',
        // Reminder -- Magic number on pointLimit until we can update to be undefined
        pointLimit: null,
        assignment: activeAssignment.id,
        rubricComments: [],
      });
      activeRubricComments[newCategoryCounter] = [];
      this.setState({
        activeRubricCategories,
        activeRubricComments,
        newCategoryCounter: newCategoryCounter - 1,
      });
    }
  };

  public changeCategoryName = (categoryIndex: number, newText: string) => {
    const { activeRubricCategories, savedCategories } = this.state;
    if (activeRubricCategories) {
      activeRubricCategories[categoryIndex].name = newText;
      const categoryID = activeRubricCategories[categoryIndex].id;
      savedCategories[categoryID] = false;
    }
    this.setState({ activeRubricCategories, savedCategories });
  };

  public changeCategoryCap = (categoryIndex: number, newCap: number | null) => {
    const { activeRubricCategories, savedCategories } = this.state;
    if (activeRubricCategories) {
      activeRubricCategories[categoryIndex].pointLimit = Number(newCap);
      const categoryID = activeRubricCategories[categoryIndex].id;
      savedCategories[categoryID] = false;
    }
    this.setState({ activeRubricCategories, savedCategories });
  };

  // ------------------- Functions to modify activeRubricComments state field -------------------

  public addEmptyComment = (categoryID: number) => {
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      const newComment = {
        // id -1 indicates new comment
        id: -1,
        text: '',
        pointDelta: 0,
        category: categoryID,
        comments: [],
      };
      if (activeRubricComments[categoryID]) {
        activeRubricComments[categoryID].push(newComment);
      } else {
        activeRubricComments[categoryID] = [newComment];
      }
      this.setState({ activeRubricComments });
    }
  };

  public changeCommentText = (categoryID: number, commentIndex: number, newText: string) => {
    const { activeRubricComments, savedComments } = this.state;
    if (activeRubricComments) {
      activeRubricComments[categoryID][commentIndex].text = newText;
      const commentID = activeRubricComments[categoryID][commentIndex].id;
      savedComments[commentID] = false;
    }
    this.setState({ activeRubricComments, savedComments });
  };

  public changeCommentDelta = (categoryID: number, commentIndex: number, newDelta: number) => {
    const { activeRubricComments, savedComments } = this.state;
    if (activeRubricComments) {
      activeRubricComments[categoryID][commentIndex].pointDelta = Number(newDelta);
      const commentID = activeRubricComments[categoryID][commentIndex].id;
      savedComments[commentID] = false;
    }
    this.setState({ activeRubricComments, savedComments });
  };

  // ------------------- Functions that actually make API call to modify database -------------------
  public updateComment = (categoryID: number, commentIndex: number) => {
    const { activeAssignment, activeRubricComments, savedComments } = this.state;
    if (activeAssignment && activeRubricComments) {
      const comm = activeRubricComments[categoryID][commentIndex];
      if (comm.text.length === 0) {
        this.props.addErrorToast('Cannot save comment. Text must not be empty.', undefined);
        return;
      }
      activeRubricComments[categoryID].forEach((otherComment, index) => {
        if (otherComment.text === comm.text && index !== commentIndex) {
          this.props.addErrorToast('Cannot save comment. Text must be unique within category.', undefined);
          return;
        }
      });
      if (comm.id === -1) {
        this.props.createRubricComment(activeAssignment.id, categoryID, comm.text, comm.pointDelta).then((data) => {
          activeRubricComments[categoryID][commentIndex].id = data.id;
          savedComments[data.id] = true;
          delete savedComments[-1];
          this.setState({ activeRubricComments, savedComments });
          setTimeout(this.clearSaveComment.bind(this.props, data.id), 2000);
        });
      } else {
        this.props.updateRubricComment(categoryID, comm.id, comm.text, comm.pointDelta).then(() => {
          savedComments[comm.id] = true;
          this.setState({ savedComments });
          setTimeout(this.clearSaveComment.bind(this.props, comm.id), 2000);
        });
      }
    }
  };

  public updateCategory = (categoryIndex: number) => {
    const { activeAssignment, activeRubricCategories, activeRubricComments, savedCategories } = this.state;
    if (activeAssignment && activeRubricCategories && activeRubricComments) {
      const cat = activeRubricCategories[categoryIndex];
      const oldID = cat.id;
      if (cat.name.length === 0) {
        this.props.addErrorToast('Cannot save category. Category name must not be empty.', undefined);
        return;
      } else {
        let duplicate = false;
        activeRubricCategories.forEach((i, index) => {
          if (i.name === cat.name && index !== categoryIndex) {
            duplicate = true;
          }
        });
        if (duplicate) {
          this.props.addErrorToast(
            'Cannot have category with same name as existing category. Please change the name',
            undefined,
          );
          return;
        }
        if (oldID < 0) {
          this.props.createRubricCategory(activeAssignment.id, cat.name, cat.pointLimit, []).then((data) => {
            if (data) {
              const newRubricCategories = activeRubricCategories.map((i, index) => {
                if (index === categoryIndex) {
                  i.id = data.id;
                  i.name = data.name;
                  i.pointLimit = data.pointLimit;
                  i.rubricComments = data.rubricComments;
                }
                return i;
              });
              activeRubricComments[data.id] = activeRubricComments[oldID];
              delete activeRubricComments[oldID];

              // update savedCategories to reflect that the new category has been saved in the database
              savedCategories[data.id] = true;
              delete savedCategories[-1];
              this.setState({
                activeRubricCategories: newRubricCategories,
                activeRubricComments,
                savedCategories,
              });
              setTimeout(this.clearSaveCategory.bind(this.props, data.id), 2000);
            }
          });
        } else {
          this.props.updateRubricCategory(activeAssignment.id, cat.id, cat.name, cat.pointLimit).then(() => {
            savedCategories[cat.id] = true;
            this.setState({ savedCategories });
            setTimeout(this.clearSaveCategory.bind(this.props, cat.id), 2000);
          });
        }
      }
    }
  };

  public deleteComment = (categoryID: number, commentIndex: number, deleteLinkedComments: boolean) => {
    const { activeRubricComments, activeRubricCategories, activeAssignment, savedComments } = this.state;

    if (activeAssignment && activeRubricCategories && activeRubricComments) {
      const commentID = activeRubricComments[categoryID][commentIndex].id;
      this.props.deleteRubricComment(activeAssignment.id, categoryID, commentID, deleteLinkedComments).then(() => {
        const newRubricComments = activeRubricComments;
        newRubricComments[categoryID] = activeRubricComments[categoryID].filter((_, index) => {
          return index !== commentIndex;
        });
        const newRubricCategories = activeRubricCategories.map((cat) => {
          if (cat.id === categoryID) {
            const newComments = cat.rubricComments.filter((i) => {
              return i !== commentID;
            });
            cat.rubricComments = newComments;
          }
          return cat;
        });
        delete savedComments[commentID];
        this.setState({
          activeRubricComments: newRubricComments,
          activeRubricCategories: newRubricCategories,
          deleteCommentDialogID: undefined,
          savedComments,
        });
      });
    }
  };

  public deleteCategory = (categoryID: number, categoryName: string, deleteLinkedComments: boolean) => {
    const { activeAssignment } = this.state;
    const { activeRubricCategories, activeRubricComments, savedCategories } = this.state;
    if (activeAssignment && activeRubricCategories && activeRubricComments) {
      this.props.deleteRubricCategory(activeAssignment.id, categoryID, categoryName, deleteLinkedComments).then(() => {
        const newRubricCategories = activeRubricCategories.filter((cat) => {
          return cat.id !== categoryID;
        });
        delete activeRubricComments[categoryID];
        delete savedCategories[categoryID];
        this.setState({
          activeRubricCategories: newRubricCategories,
          activeRubricComments,
          deleteCategoryDialogID: undefined,
          savedCategories,
        });
      });
    }
  };

  public updateAssignmentName = () => {
    const { activeAssignment } = this.state;
    console.log(this.assignmentNameField);
    if (activeAssignment) {
      this.props.updateAssignment(activeAssignment.id, this.assignmentNameField.getField().value, undefined, undefined);
    }
  };

  public updateAssignmentPoints = () => {
    const { activeAssignment } = this.state;
    if (activeAssignment) {
      this.props.updateAssignment(
        activeAssignment.id,
        undefined,
        this.assignmentPointsField.getField().value,
        undefined,
      );
    }
  };

  // ------------------- Functions for setTimeout to call to remove 'saved' status of comments -------------------

  public clearSaveComment = (commentID: number) => {
    const { savedComments } = this.state;
    delete savedComments[commentID];
    this.setState({ savedComments });
  };

  public clearSaveCategory = (categoryID: number) => {
    const { savedCategories } = this.state;
    delete savedCategories[categoryID];
    this.setState({ savedCategories });
  };

  // ------------------- Delete Linked Comments Dialog functions -------------------
  public triggerDeleteCommentDialog = (categoryID: number, commentIndex: number) => {
    this.setState({ deleteCommentDialogID: { categoryID, commentIndex } });
  };

  public triggerDeleteCategoryDialog = (categoryID: number, categoryName: string) => {
    this.setState({ deleteCategoryDialogID: { categoryID, categoryName } });
  };

  public clearDeleteCommentDialog = () => {
    this.setState({ deleteCommentDialogID: undefined });
  };

  public clearDeleteCategoryDialog = () => {
    this.setState({ deleteCategoryDialogID: undefined });
  };

  // ------------------- Render -------------------
  public render() {
    const {
      submissions,
      submissionsLoadComplete,
      lockManageAssignment,
      assignments,
      assignmentRubricLoadComplete,
    } = this.props;

    const { activeAssignment } = this.state;
    const lockIcon = lockManageAssignment ? 'lock' : 'lock_open';

    let tableBody;
    if (submissionsLoadComplete && assignmentRubricLoadComplete) {
      tableBody = Object.keys(submissions).map((assignmentID) => {
        const assignmentSubs = submissions[assignmentID];
        const numSubmissions = assignmentSubs.length;
        let numGraded = 0;
        let numUngraded = 0;
        let numUnclaimed = 0;

        const assignment = assignments.filter((assn) => {
          return assn.id === Number(assignmentID);
        })[0];

        assignmentSubs.forEach((submission: SubmissionType) => {
          if (submission.isFinalized) {
            numGraded += 1;
          } else if (submission.grader) {
            numUngraded += 1;
          } else {
            numUnclaimed += 1;
          }
        });

        return (
          <TableRow key={assignmentID} onClick={this.changeActiveAssignment.bind(this.props, assignment)}>
            <TableColumn>{assignment.name}</TableColumn>
            <TableColumn>{numSubmissions}</TableColumn>
            <TableColumn>{numGraded}</TableColumn>
            <TableColumn>{numUngraded}</TableColumn>
            <TableColumn>{numUnclaimed}</TableColumn>
          </TableRow>
        );
      });
    } else {
      tableBody = (
        <TableRow>
          <TableColumn>Loading...</TableColumn>
          <TableColumn />
          <TableColumn />
          <TableColumn />
          <TableColumn />
        </TableRow>
      );
    }

    if (!activeAssignment) {
      return (
        <div>
          <div className="padding" />
          <NewAssignmentDialog
            assignments={this.props.assignments}
            addErrorToast={this.props.addErrorToast}
            createAssignment={this.props.createAssignment}
          />
          <div className="padding" />
          <DataTable className="Manage-assignments-table" baseId="Manage-assignments-table" plain={true}>
            <TableHeader>
              <TableRow>
                <TableColumn key={'AssignmentName'}>Assignment name</TableColumn>
                <TableColumn key={'SubNumber'}># of submissions</TableColumn>
                <TableColumn key={'GradedNumber'}># graded</TableColumn>
                <TableColumn key={'UngradedNumber'}># ungraded</TableColumn>
                <TableColumn key={'UnclaimedNumber'}># unclaimed</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>{tableBody}</TableBody>
          </DataTable>
        </div>
      );
    } else {
      const { activeRubricCategories, activeRubricComments } = this.state;

      let categoryTables;

      if (activeRubricCategories && activeRubricComments) {
        categoryTables = activeRubricCategories.map((cat, catIndex) => {
          return (
            <RubricCategoryTable
              key={cat.id}
              categoryID={cat.id}
              categoryIndex={catIndex}
              comments={activeRubricComments[cat.id]}
              categoryName={cat.name}
              categoryPointLimit={cat.pointLimit}
              deleteCategory={this.triggerDeleteCategoryDialog}
              changeCategoryName={this.changeCategoryName}
              changeCategoryCap={this.changeCategoryCap}
              addEmptyComment={this.addEmptyComment}
              changeCommentText={this.changeCommentText}
              changeCommentDelta={this.changeCommentDelta}
              deleteComment={this.triggerDeleteCommentDialog}
              isDisabled={lockManageAssignment}
              updateComment={this.updateComment}
              updateCategory={this.updateCategory}
              savedComments={this.state.savedComments}
              savedCategories={this.state.savedCategories}
            />
          );
        });
      }

      return (
        <div>
          <Button
            key="Back"
            className="Btn"
            flat={true}
            icon={true}
            onClick={this.changeActiveAssignment.bind(this.props, undefined)}
          >
            arrow_back
          </Button>
          <div>
            <RubricFileDialog
              activeAssignment={this.state.activeAssignment}
              activeRubricComments={this.state.activeRubricComments}
              activeRubricCategories={this.state.activeRubricCategories}
              addErrorToast={this.props.addErrorToast}
              addToast={this.props.addToast}
              createRubricCategory={this.props.createRubricCategory}
              createRubricComment={this.props.createRubricComment}
              updateRubricCategory={this.props.updateRubricCategory}
              updateRubricComment={this.props.updateRubricComment}
              deleteRubricCategory={this.props.deleteRubricCategory}
              deleteRubricComment={this.props.deleteRubricComment}
              parentUpdate={this.changeActiveAssignment}
            />
            <TextField
              defaultValue={activeAssignment.name}
              ref={(field) => {
                this.assignmentNameField = field;
              }}
              label={'Assignment Name'}
              fullWidth={false}
              disabled={lockManageAssignment}
              onBlur={this.updateAssignmentName}
            />
            <TextField
              defaultValue={activeAssignment.points}
              step={0.5}
              pattern="^d+(\.|\,)\d{1}"
              type="number"
              min={0}
              ref={(field) => {
                this.assignmentPointsField = field;
              }}
              label={'Total Points'}
              fullWidth={false}
              disabled={lockManageAssignment}
              onBlur={this.updateAssignmentPoints}
            />
            <SelectionControl
              id="assignment-release-checkbox"
              name="assignment-release-checkbox"
              type="checkbox"
              label="released"
              defaultChecked={activeAssignment.isReleased}
              disabled={lockManageAssignment}
              onChange={this.props.updateAssignment.bind(
                this.props,
                activeAssignment.id,
                undefined,
                undefined,
                !activeAssignment.isReleased,
              )}
            />
          </div>
          <br />
          {categoryTables}
          <Button
            className="Btn"
            iconChildren={'playlist_add'}
            disabled={lockManageAssignment}
            onClick={this.addEmptyCategory}
          >
            Add New Category
          </Button>
          <DeleteLinkedCommentsDialog
            onDelete={
              typeof this.state.deleteCommentDialogID !== 'undefined'
                ? this.deleteComment.bind(
                    this.props,
                    this.state.deleteCommentDialogID.categoryID,
                    this.state.deleteCommentDialogID.commentIndex,
                    true,
                  )
                : ''
            }
            onUnLink={
              typeof this.state.deleteCommentDialogID !== 'undefined'
                ? this.deleteComment.bind(
                    this.props,
                    this.state.deleteCommentDialogID.categoryID,
                    this.state.deleteCommentDialogID.commentIndex,
                    false,
                  )
                : ''
            }
            onCancel={this.clearDeleteCommentDialog}
            isVisible={typeof this.state.deleteCommentDialogID !== 'undefined'}
            isDialog={true}
          />
          <DeleteLinkedCommentsDialog
            onDelete={
              typeof this.state.deleteCategoryDialogID !== 'undefined'
                ? this.deleteCategory.bind(
                    this.props,
                    this.state.deleteCategoryDialogID.categoryID,
                    this.state.deleteCategoryDialogID.categoryName,
                    true,
                  )
                : ''
            }
            onUnLink={
              typeof this.state.deleteCategoryDialogID !== 'undefined'
                ? this.deleteCategory.bind(
                    this.props,
                    this.state.deleteCategoryDialogID.categoryID,
                    this.state.deleteCategoryDialogID.categoryName,
                    false,
                  )
                : ''
            }
            onCancel={this.clearDeleteCategoryDialog}
            isVisible={typeof this.state.deleteCategoryDialogID !== 'undefined'}
            isDialog={true}
          />
          <Button key="Lock" className="Btn" floating={true} fixed={true} icon={true} onClick={this.props.toggleLock}>
            {lockIcon}
          </Button>
        </div>
      );
    }
  }
}

export default ManageAssignments;

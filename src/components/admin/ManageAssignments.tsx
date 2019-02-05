import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  SelectionControl,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
  Tooltipped,
} from 'react-md';
import { AssignmentType } from '../../infrastructure/assignment';

import {
  IAssignmentToRubricCategories,
  IAssignmentToSubmissionsMap,
  IRubricCategoryToRubricCommentsMap,
} from '../../types/common';
import NewAssignmentDialog from './ManageAssignmentsComponents/NewAssignmentDialog';
import RubricCommentExplorer from './ManageAssignmentsComponents/RubricCommentExplorer';
import RubricFileDialog from './ManageAssignmentsComponents/RubricFileDialog';
import { LinkedCommentsAlert, RubricCategoryTable } from './ManageAssignmentsComponents/RubricUtils';

import { CourseType } from '../../infrastructure/course';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';
import { SubmissionType } from '../../infrastructure/submission';

import DeleteAssignmentDialog from './ManageAssignmentsComponents/DeleteAssignmentDialog';

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
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;
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

  setLoadingDialog: (message: string, title: string) => void;
  clearLoadingDialog: () => void;
}

interface IState {
  activeAssignment: AssignmentType | undefined;
  activeRubricCategories: RubricCategoryType[] | undefined;
  activeRubricComments: IRubricCategoryToRubricCommentsMap | undefined;
  newCategoryCounter: number;
  // isDelete boolean for change dialogs indicate whether the change is a delete or an update
  // Dialog ID is the id of a comment that has a pending change (delete or update) based on a dialog FileInput
  changeCommentDialogID: { categoryID: number; commentIndex: number; isDelete: boolean } | undefined;
  changeCategoryDialogID:
    | { categoryID: number; categoryIndex: number; categoryName: string; isDelete: boolean }
    | undefined;
  commentExplorer: { categoryID: number; commentIndex: number } | undefined;
  savedComments: { [id: number]: boolean };
  savedCategories: { [id: number]: boolean };
  deletingAssignment?: AssignmentType;
}

class ManageAssignments extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    activeAssignment: undefined,
    activeRubricCategories: undefined,
    activeRubricComments: undefined,
    newCategoryCounter: -1,
    changeCommentDialogID: undefined,
    changeCategoryDialogID: undefined,
    commentExplorer: undefined,
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
          this.setState({ activeRubricComments, savedComments, changeCommentDialogID: undefined });
          setTimeout(this.clearSaveComment.bind(this.props, data.id), 2000);
        });
      } else {
        this.props.updateRubricComment(categoryID, comm.id, comm.text, comm.pointDelta).then(() => {
          savedComments[comm.id] = true;
          this.setState({ savedComments, changeCommentDialogID: undefined });
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
                changeCategoryDialogID: undefined,
              });
              setTimeout(this.clearSaveCategory.bind(this.props, data.id), 2000);
            }
          });
        } else {
          this.props.updateRubricCategory(activeAssignment.id, cat.id, cat.name, cat.pointLimit).then(() => {
            savedCategories[cat.id] = true;
            this.setState({ savedCategories, changeCategoryDialogID: undefined });
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
          changeCommentDialogID: undefined,
          savedComments,
        });
      });
    }
  };

  public deleteCategory = (categoryID: number, categoryName: string, deleteLinkedComments: boolean) => {
    const { activeAssignment } = this.state;
    const { activeRubricCategories, activeRubricComments, savedCategories } = this.state;
    if (activeAssignment && activeRubricCategories && activeRubricComments) {
      // if unsaved comment in database, just delete on front end
      if (categoryID < 0) {
        const newRubricCategories = activeRubricCategories.filter((cat) => {
          return cat.id !== categoryID;
        });
        delete activeRubricComments[categoryID];
        delete savedCategories[categoryID];
        this.setState({
          activeRubricCategories: newRubricCategories,
          activeRubricComments,
          changeCategoryDialogID: undefined,
          savedCategories,
        });
        return;
      }

      // else, delete from database
      this.props.deleteRubricCategory(activeAssignment.id, categoryID, categoryName, deleteLinkedComments).then(() => {
        const newRubricCategories = activeRubricCategories.filter((cat) => {
          return cat.id !== categoryID;
        });
        delete activeRubricComments[categoryID];
        delete savedCategories[categoryID];
        this.setState({
          activeRubricCategories: newRubricCategories,
          activeRubricComments,
          changeCategoryDialogID: undefined,
          savedCategories,
        });
      });
    }
  };

  public updateAssignmentName = () => {
    const { activeAssignment } = this.state;
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
  public triggerChangeCommentDialog = (isDelete: boolean, categoryID: number, commentIndex: number) => {
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      const thisComment = activeRubricComments[categoryID][commentIndex];
      if (thisComment.comments.length > 0) {
        this.setState({ changeCommentDialogID: { categoryID, commentIndex, isDelete } });
      } else {
        if (isDelete) {
          this.deleteComment(categoryID, commentIndex, true);
        } else {
          this.updateComment(categoryID, commentIndex);
        }
      }
    }
  };

  public triggerChangeCategoryDialog = (
    isDelete: boolean,
    categoryID: number,
    categoryIndex: number,
    categoryName: string,
  ) => {
    const { activeRubricComments } = this.state;
    // if any child rubricComments have a linked comment, alert the user
    if (activeRubricComments) {
      const theseComments = activeRubricComments[categoryID];
      const isLinked = theseComments.some((comment) => {
        if (comment.comments.length > 0) {
          this.setState({ changeCategoryDialogID: { categoryID, categoryName, categoryIndex, isDelete } });
          return true;
        }
        return false;
      });

      // if no linked comments, delete the category
      if (!isLinked) {
        if (isDelete) {
          this.deleteCategory(categoryID, categoryName, true);
        } else {
          this.updateCategory(categoryIndex);
        }
      }
    }
  };

  public clearChangeCommentDialog = () => {
    const { changeCommentDialogID, activeRubricComments } = this.state;
    const { rubricComments } = this.props;

    // If a change to an item with linked comments is cancelled, revert to previous data
    if (activeRubricComments && changeCommentDialogID && !changeCommentDialogID.isDelete) {
      const oldComment = rubricComments[changeCommentDialogID.categoryID][changeCommentDialogID.commentIndex];
      activeRubricComments[changeCommentDialogID.categoryID][changeCommentDialogID.commentIndex].text = oldComment.text;
      activeRubricComments[changeCommentDialogID.categoryID][changeCommentDialogID.commentIndex].pointDelta =
        oldComment.pointDelta;
      this.setState({ activeRubricComments });
    }
    this.setState({ changeCommentDialogID: undefined });
  };

  public clearChangeCategoryDialog = () => {
    const { changeCategoryDialogID, activeRubricCategories, activeAssignment } = this.state;
    const { rubricCategories } = this.props;

    // If a change to an item with linked comments is cancelled, revert to previous data
    if (activeAssignment && activeRubricCategories && changeCategoryDialogID && !changeCategoryDialogID.isDelete) {
      const oldCat = rubricCategories[activeAssignment.id][changeCategoryDialogID.categoryIndex];
      activeRubricCategories[changeCategoryDialogID.categoryIndex].pointLimit = oldCat.pointLimit;
      this.setState({ activeRubricCategories });
    }
    this.setState({ changeCategoryDialogID: undefined });
  };

  // ------------------- RubricUI explorer -------------------

  public triggerCommentExplorer = (categoryID: number, commentIndex: number) => {
    this.setState({ commentExplorer: { categoryID, commentIndex } });
  };

  public clearCommentExplorer = () => {
    this.setState({ commentExplorer: undefined });
  };

  // ------------------- Delete Assignment functions -------------------
  public toggleDeleteAssignment = (assignment: AssignmentType | undefined) => {
    this.setState({ deletingAssignment: assignment });
  };

  public deleteAssignment = () => {
    const deletingAssignment = this.state.deletingAssignment;
    if (deletingAssignment) {
      this.setState({ deletingAssignment: undefined });
      this.props.setLoadingDialog(
        'This action could impact a lot of data and may take a few minutes.',
        'Assignment is being deleted',
      );
      this.props.deleteAssignment(deletingAssignment).then(() => {
        this.props.clearLoadingDialog();
        console.log('clearing');
      });
    }
  };

  // ------------------- Render -------------------
  // Function called upon downloading
  public downloadGrades = (assignment: AssignmentType) => {
    const { currentCourse, submissions } = this.props;
    if (!currentCourse) {
      return;
    }

    const subs = submissions[assignment.id];
    const grades = {};
    subs.forEach((sub) => {
      sub.students.forEach((student) => {
        grades[student] = sub.grade;
      });
    });

    const a = document.createElement('a');
    a.href = `data:attachment/json, ${JSON.stringify(grades)}`;
    a.download = `${currentCourse.name}-${currentCourse.period}-${assignment.name}-grades.json`;

    document.body.appendChild(a);
    a.click();
  };

  public render() {
    const {
      submissions,
      submissionsLoadComplete,
      lockManageAssignment,
      assignments,
      assignmentRubricLoadComplete,
    } = this.props;
    const { activeAssignment, commentExplorer } = this.state;

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

        const mean = assignment.mean ? assignment.mean.toString() : '--';
        const median = assignment.median ? assignment.median.toString() : '--';
        const onCellClick = this.changeActiveAssignment.bind(this.props, assignment);
        const downloadGrades = this.downloadGrades.bind(this.props, assignment);

        return (
          <Tooltipped
            key={assignmentID}
            label="Click to open Assignment rubric"
            delay={1000}
            position="top"
            setPosition={true}
            style={{ top: '150px', height: '50px' }}
          >
            <TableRow key={assignmentID}>
              <TableColumn key={`${assignmentID}-1`} onClick={onCellClick}>
                {assignment.name}
              </TableColumn>
              <TableColumn key={`${assignmentID}-2`} onClick={onCellClick}>
                {numSubmissions}
              </TableColumn>
              <TableColumn key={`${assignmentID}-3`} onClick={onCellClick}>
                {numGraded}
              </TableColumn>
              <TableColumn key={`${assignmentID}-4`} onClick={onCellClick}>
                {numUngraded}
              </TableColumn>
              <TableColumn key={`${assignmentID}-5`} onClick={onCellClick}>
                {numUnclaimed}
              </TableColumn>
              <TableColumn key={`${assignmentID}-6`} onClick={onCellClick}>
                {mean}
              </TableColumn>
              <TableColumn key={`${assignmentID}-7`} onClick={onCellClick}>
                {median}
              </TableColumn>
              <TableColumn>
                <Button icon={true} onClick={downloadGrades}>
                  vertical_align_bottom
                </Button>
              </TableColumn>
              <TableColumn>
                <Button icon={true} onClick={this.toggleDeleteAssignment.bind(this.props, assignment)}>
                  cancel
                </Button>
              </TableColumn>
            </TableRow>
          </Tooltipped>
        );
      });
    } else {
      tableBody = <CircularProgress id="progress" className="progress-circle" />;
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
                <TableColumn key={'Mean'}>Mean Grade</TableColumn>
                <TableColumn key={'Median'}>Median Grade</TableColumn>
                <TableColumn key={'Grades'}>Grades</TableColumn>
                <TableColumn key={'Delete'}>Delete</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>{tableBody}</TableBody>
          </DataTable>
          <DeleteAssignmentDialog
            isVisible={typeof this.state.deletingAssignment !== 'undefined'}
            assignmentName={this.state.deletingAssignment ? this.state.deletingAssignment.name : ''}
            onCancel={this.toggleDeleteAssignment.bind(this.props, undefined)}
            onDelete={this.deleteAssignment}
          />
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
              // bind the trigger change with true for isDelete
              deleteCategory={this.triggerChangeCategoryDialog.bind(this.props, true)}
              changeCategoryName={this.changeCategoryName}
              changeCategoryCap={this.changeCategoryCap}
              addEmptyComment={this.addEmptyComment}
              changeCommentText={this.changeCommentText}
              changeCommentDelta={this.changeCommentDelta}
              deleteComment={this.triggerChangeCommentDialog.bind(this.props, true)}
              isDisabled={lockManageAssignment}
              updateComment={this.triggerChangeCommentDialog.bind(this.props, false)}
              updateCategoryCaps={this.triggerChangeCategoryDialog.bind(this.props, false)}
              updateCategoryName={this.updateCategory}
              savedComments={this.state.savedComments}
              savedCategories={this.state.savedCategories}
              triggerCommentExplorer={this.triggerCommentExplorer}
            />
          );
        });
      }

      return (
        <div>
          {lockManageAssignment ? (
            <div className="admin-rubric__lockMessage-container">
              <div className="admin-rubric__lockMessage-text">Edits are locked.</div>
            </div>
          ) : (
            <div />
          )}
          <Button
            key="Back"
            className="admin-rubric__back"
            flat={true}
            icon={true}
            onClick={this.changeActiveAssignment.bind(this.props, undefined)}
          >
            arrow_back
          </Button>
          <div className="admin-rubric__top-container">
            <div className="admin-rubric__assignment">
              <TextField
                defaultValue={activeAssignment.name}
                ref={(field) => {
                  this.assignmentNameField = field;
                }}
                label={'Assignment Name'}
                className="admin-rubric__assignment__name"
                fullWidth={false}
                disabled={lockManageAssignment}
                onBlur={this.updateAssignmentName}
                customSize="font-size-xxlarge"
              />
              <TextField
                defaultValue={activeAssignment.points}
                step={0.5}
                pattern="^d+(\.|\,)\d{1}"
                type="number"
                className="admin-rubric__assignment__points"
                min={0}
                ref={(field) => {
                  this.assignmentPointsField = field;
                }}
                label={'Total Points'}
                fullWidth={false}
                disabled={lockManageAssignment}
                onBlur={this.updateAssignmentPoints}
                customSize="font-size-xxlarge"
              />
              <SelectionControl
                id="assignment-release-checkbox"
                name="assignment-release-checkbox"
                className="admin-rubric__assignment__isReleased"
                type="switch"
                label="Released"
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
              isDisabled={this.props.lockManageAssignment}
            />
          </div>
          <br />
          {categoryTables}
          <Button
            className="admin-rubric__category__addbutton"
            iconChildren={'playlist_add'}
            disabled={lockManageAssignment}
            onClick={this.addEmptyCategory}
          >
            Add New Category
          </Button>
          <LinkedCommentsAlert
            isDelete={this.state.changeCommentDialogID ? this.state.changeCommentDialogID.isDelete : false}
            onDelete={
              typeof this.state.changeCommentDialogID !== 'undefined'
                ? this.deleteComment.bind(
                    this.props,
                    this.state.changeCommentDialogID.categoryID,
                    this.state.changeCommentDialogID.commentIndex,
                    true,
                  )
                : ''
            }
            onUnLink={
              typeof this.state.changeCommentDialogID !== 'undefined'
                ? this.deleteComment.bind(
                    this.props,
                    this.state.changeCommentDialogID.categoryID,
                    this.state.changeCommentDialogID.commentIndex,
                    false,
                  )
                : ''
            }
            onUpdate={
              typeof this.state.changeCommentDialogID !== 'undefined'
                ? this.updateComment.bind(
                    this.props,
                    this.state.changeCommentDialogID.categoryID,
                    this.state.changeCommentDialogID.commentIndex,
                  )
                : ''
            }
            onCancel={this.clearChangeCommentDialog}
            isVisible={typeof this.state.changeCommentDialogID !== 'undefined'}
            isDialog={true}
          />
          <LinkedCommentsAlert
            isDelete={this.state.changeCommentDialogID ? this.state.changeCommentDialogID.isDelete : false}
            onDelete={
              typeof this.state.changeCategoryDialogID !== 'undefined'
                ? this.deleteCategory.bind(
                    this.props,
                    this.state.changeCategoryDialogID.categoryID,
                    this.state.changeCategoryDialogID.categoryName,
                    true,
                  )
                : ''
            }
            onUnLink={
              typeof this.state.changeCategoryDialogID !== 'undefined'
                ? this.deleteCategory.bind(
                    this.props,
                    this.state.changeCategoryDialogID.categoryID,
                    this.state.changeCategoryDialogID.categoryName,
                    false,
                  )
                : ''
            }
            onUpdate={
              typeof this.state.changeCategoryDialogID !== 'undefined'
                ? this.updateCategory.bind(this.props, this.state.changeCategoryDialogID.categoryIndex)
                : ''
            }
            onCancel={this.clearChangeCategoryDialog}
            isVisible={typeof this.state.changeCategoryDialogID !== 'undefined'}
            isDialog={true}
          />
          <RubricCommentExplorer
            rubricComment={
              commentExplorer && this.state.activeRubricComments
                ? this.state.activeRubricComments[commentExplorer.categoryID][commentExplorer.commentIndex]
                : undefined
            }
            isVisible={typeof commentExplorer !== 'undefined'}
            closeCommentExplorer={this.clearCommentExplorer}
            submissions={this.props.submissions[activeAssignment.id]}
          />
          <Button key="Lock" className="Btn" floating={true} fixed={true} icon={true} onClick={this.props.toggleLock}>
            {lockManageAssignment ? 'lock' : 'lock_open'}
          </Button>
        </div>
      );
    }
  }
}

export default ManageAssignments;

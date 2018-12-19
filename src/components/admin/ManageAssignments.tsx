import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import '../../styles/index.scss';
import {
  IAssignment3,
  ICourse3,
  IOptionNumber,
  IRubricCategoriesByAssignment,
  IRubricCategory,
  IRubricComment,
  IRubricCommentsByCategory,
  ISubmission3,
  ISubmissionsByAssignment,
} from '../../types/common';
import RubricCategoryTable from './adminUtils';

interface IProps {
  submissions: ISubmissionsByAssignment;
  rubricCategories: IRubricCategoriesByAssignment;
  rubricComments: IRubricCommentsByCategory;
  submissionsLoadComplete: boolean;
  lockManageAssignment: boolean;
  toggleLock: () => void;
  currentCourse: ICourse3 | undefined;
  addToast: (text: string, action: string | undefined) => void;
  assignments: IAssignment3[];
  assignmentRubricLoadComplete: boolean;
  createRubricCategory: (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | undefined,
    newComments: IRubricComment[],
  ) => void;
  deleteRubricCategory: (assignmentID: number, categoryID: number, categoryName: string) => void;
  createRubricComment: (
    assignmentID: number,
    categoryID: number,
    text: string,
    pointDelta: number,
  ) => void;
  deleteRubricComment: (assignmentID: number, categoryID: number, commentID: number) => void;
  updateRubricComment: (
    categoryID: number,
    commentID: number,
    text: string,
    pointDelta: number,
  ) => void;
  updateRubricCategory: (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | undefined,
  ) => void;
  updateAssignment: (assignnmentID: number, name: string, points: number) => void;
}

interface IState {
  activeAssignment: IAssignment3 | undefined;
  activeRubricCategories: IRubricCategory[] | undefined;
  activeRubricComments: IRubricCommentsByCategory | undefined;
  addedCategories: IRubricCategory[];
  deletedCategories: IOptionNumber[];
  deletedComments: number[];
  newCategoryCounter: number;
}

class ManageAssignments extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    activeAssignment: undefined,
    activeRubricCategories: undefined,
    activeRubricComments: undefined,
    addedCategories: [],
    deletedCategories: [],
    deletedComments: [],
    newCategoryCounter: -1,
  };

  public assignmentNameField: any;
  public assignmentPointsField: any;

  constructor(props: IProps) {
    super(props);
    this.assignmentNameField = React.createRef();
    this.assignmentPointsField = React.createRef();
  }

  public changeActiveAssignment = (assignment: IAssignment3 | undefined) => {
    const { rubricCategories, rubricComments } = this.props;
    if (assignment) {
      // Need to do a deep copy of the data so that we can change without affecting the props
      // Reminder -- check if a deep copy is really needed
      const rubricCategoriesCopy = JSON.parse(JSON.stringify(rubricCategories[assignment.id]));
      const filteredComments = JSON.parse(JSON.stringify(rubricComments));
      // const rubricCategoriesCopy = rubricCategories[assignment.id];
      // const filteredComments = Object.keys(rubricComments)
      //   .filter((catID) => {
      //     return (
      //       rubricCategories[assignment.id]
      //         .map((i) => {
      //           return i.id;
      //         })
      //         .indexOf(Number(catID)) !== -1
      //     );
      //   })
      //   .reduce((obj, key) => {
      //     obj[key] = rubricComments[key];
      //     return obj;
      //   }, {});
      //
      // console.log(rubricComments);
      //
      // console.log(rubricCategoriesCopy);
      // console.log(filteredComments);
      this.setState({
        activeAssignment: assignment,
        activeRubricCategories: rubricCategoriesCopy,
        activeRubricComments: filteredComments,
      });
    } else {
      this.setState({ activeAssignment: undefined, activeRubric: undefined });
    }
  };

  public save = () => {
    const {
      activeRubricComments,
      activeRubricCategories,
      activeAssignment,
      deletedCategories,
    } = this.state;
    const { rubricCategories, rubricComments } = this.props;

    if (activeRubricCategories && activeRubricComments && activeAssignment) {
      const oldCategories = rubricCategories[activeAssignment.id];
      const oldComments = rubricComments;

      activeRubricCategories.forEach((cat) => {
        // If new category, create category and comments
        const catIndex = oldCategories
          .map((i) => {
            return i.id;
          })
          .indexOf(cat.id);

        if (catIndex === -1) {
          this.props.createRubricCategory(
            cat.assignment,
            cat.name,
            cat.pointLimit,
            activeRubricComments[cat.id],
          );
        } else {
          // If new comment for an existing category, create commnet
          activeRubricComments[cat.id].forEach((com) => {
            if (com.id === -1) {
              this.props.createRubricComment(cat.assignment, cat.id, com.text, com.pointDelta);
            } else {
              // If existing comment, and either text or points have changed, update comment
              const comIndex = oldComments[cat.id]
                .map((i) => {
                  return i.id;
                })
                .indexOf(com.id);
              if (
                comIndex !== -1 &&
                (oldComments[cat.id][comIndex].text !== com.text ||
                  oldComments[cat.id][comIndex].pointDelta !== com.pointDelta)
              ) {
                console.log('update');
                this.props.updateRubricComment(cat.id, com.id, com.text, com.pointDelta);
              } else {
                console.log(com.text);
                console.log(com.pointDelta);
                console.log(oldComments[cat.id][comIndex]);
              }
            }
          });
          // If a rubric comment has been deleted, delete it
          oldComments[cat.id].forEach((oldComment) => {
            const checkDelete = activeRubricComments[cat.id]
              .map((i) => {
                return i.id;
              })
              .indexOf(oldComment.id);
            if (checkDelete === -1) {
              this.props.deleteRubricComment(cat.assignment, cat.id, oldComment.id);
            }
          });
          // If a category name or pointLimit has been changed, update it
          if (
            oldCategories[catIndex].name !== cat.name ||
            oldCategories[catIndex].pointLimit !== cat.pointLimit
          ) {
            // Reminder -- need to decide as a team if we can allow pointLimit to be null
            this.props.updateRubricCategory(cat.assignment, cat.id, cat.name, cat.pointLimit);
          }
        }
      });
      // Delete deleted categories
      deletedCategories.forEach((cat) => {
        this.props.deleteRubricCategory(activeAssignment.id, cat.value, cat.label);
        this.setState({ deletedCategories: [] });
      });
      this.props.toggleLock();

      // Update assignment name and points if necessary
      const newName = this.assignmentNameField.getField().value;
      const newPoints = this.assignmentPointsField.getField().value;
      if (
        newName !== activeAssignment.name ||
        Number(newPoints) !== Number(activeAssignment.points)
      ) {
        this.props.updateAssignment(activeAssignment.id, newName, newPoints);
      }
    }

    this.props.addToast('Rubric has been updated.', undefined);
  };

  // ------------------- Functions to modify category -------------------
  public addEmptyCategory = () => {
    const { activeRubricCategories, activeAssignment, newCategoryCounter } = this.state;
    if (activeRubricCategories && activeAssignment) {
      activeRubricCategories.push({
        id: newCategoryCounter,
        name: '',
        pointLimit: undefined,
        comments: [],
        assignment: activeAssignment.id,
        rubricComments: [],
        categoryComments: [],
      });
      this.setState({ activeRubricCategories, newCategoryCounter: newCategoryCounter - 1 });
    }
  };

  public deleteCategory = (categoryID: number, categoryName: string) => {
    const { activeRubricCategories, deletedCategories } = this.state;
    if (activeRubricCategories) {
      const newCategories = activeRubricCategories.filter((i) => {
        return i.id !== categoryID;
      });
      deletedCategories.push({ label: categoryName, value: categoryID });
      this.setState({ activeCategories: newCategories, deletedCategories });
    }
  };

  public categoryNameChange = (categoryIndex: number, newText: string) => {
    const { activeRubricCategories } = this.state;
    if (activeRubricCategories) {
      activeRubricCategories[categoryIndex].name = newText;
    }
    this.setState({ activeRubricCategories });
  };

  public categoryCapChange = (categoryIndex: number, newCap: number) => {
    const { activeRubricCategories } = this.state;
    if (activeRubricCategories) {
      activeRubricCategories[categoryIndex].pointLimit = Number(newCap);
    }
    this.setState({ activeRubricCategories });
  };

  // ------------------- Functions to modify comment -------------------
  public addEmptyComment = (categoryID: number) => {
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      activeRubricComments[categoryID].push({
        // id -1 indicates new comment
        id: -1,
        text: '',
        pointDelta: 0,
        category: categoryID,
      });
      this.setState({ activeRubricComments });
    }
  };

  public commentTextChange = (categoryID: number, commentIndex: number, newText: string) => {
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      console.log('in here');
      console.log(categoryID);
      console.log(commentIndex);
      activeRubricComments[categoryID][commentIndex].text = newText;
    }
    this.setState({ activeRubricComments });
  };

  public commentDeltaChange = (categoryID: number, commentIndex: number, newDelta: number) => {
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      activeRubricComments[categoryID][commentIndex].pointDelta = Number(newDelta);
    }
    this.setState({ activeRubricComments });
  };

  public deleteComment = (categoryID: number, commentIndex: number) => {
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      const newComments = activeRubricComments[categoryID].filter((_, i) => i !== commentIndex);
      activeRubricComments[categoryID] = newComments;
      this.setState({ activeRubricComments });
    }
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

    if (submissions && submissionsLoadComplete && assignmentRubricLoadComplete && assignments) {
      if (!activeAssignment) {
        return (
          <div>
            <div className="padding" />
            <DataTable
              className="Manage-assignments-table"
              baseId="Manage-assignments-table"
              plain={true}
            >
              <TableHeader>
                <TableRow>
                  <TableColumn key={'AssignmentName'}>Assignment name</TableColumn>
                  <TableColumn key={'SubNumber'}># of submissions</TableColumn>
                  <TableColumn key={'GradedNumber'}># graded</TableColumn>
                  <TableColumn key={'UngradedNumber'}># ungraded</TableColumn>
                  <TableColumn key={'UnclaimedNumber'}># unclaimed</TableColumn>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(submissions).map((assignmentID) => {
                  const assignmentSubs = submissions[assignmentID];
                  const numSubmissions = assignmentSubs.length;
                  let numGraded = 0;
                  let numUngraded = 0;
                  let numUnclaimed = 0;

                  const assignment = assignments.filter((assn) => {
                    return assn.id === Number(assignmentID);
                  })[0];

                  assignmentSubs.forEach((submission: ISubmission3) => {
                    if (submission.isFinalized) {
                      numGraded += 1;
                    } else if (submission.grader) {
                      numUngraded += 1;
                    } else {
                      numUnclaimed += 1;
                    }
                  });

                  return (
                    <TableRow
                      key={assignmentID}
                      onClick={this.changeActiveAssignment.bind(this.props, assignment)}
                    >
                      <TableColumn>{assignment.name}</TableColumn>
                      <TableColumn>{numSubmissions}</TableColumn>
                      <TableColumn>{numGraded}</TableColumn>
                      <TableColumn>{numUngraded}</TableColumn>
                      <TableColumn>{numUnclaimed}</TableColumn>
                    </TableRow>
                  );
                })}
              </TableBody>
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
                comments={activeRubricComments[catIndex]}
                categoryName={cat.name}
                categoryPointLimit={cat.pointLimit}
                deleteCategory={this.deleteCategory}
                changeCategoryName={this.categoryNameChange}
                changeCategoryCap={this.categoryCapChange}
                addEmptyComment={this.addEmptyComment}
                commentTextChange={this.commentTextChange}
                commentDeltaChange={this.commentDeltaChange}
                deleteCommentFunction={this.deleteComment}
                isDisabled={lockManageAssignment}
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
              <TextField
                defaultValue={activeAssignment.name}
                ref={(field) => {
                  this.assignmentNameField = field;
                }}
                label={'Assignment Name'}
                fullWidth={false}
                disabled={lockManageAssignment}
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
              />
              <Button
                iconChildren="done"
                className="save-Btn"
                disabled={lockManageAssignment}
                onClick={this.save}
              >
                Save rubric changes
              </Button>
            </div>
            <div className="padding" />
            {categoryTables}
            <Button
              className="Btn"
              iconChildren={'playlist_add'}
              disabled={lockManageAssignment}
              onClick={this.addEmptyCategory}
            >
              Add New Category
            </Button>
            <Button
              key="Lock"
              className="Btn"
              floating={true}
              fixed={true}
              icon={true}
              onClick={this.props.toggleLock}
            >
              {lockIcon}
            </Button>
          </div>
        );
      }
    } else {
      return (
        <div>
          <hr />
          <CircularProgress id="circle" className="progressCircle" />
        </div>
      );
    }
  }
}

export default ManageAssignments;

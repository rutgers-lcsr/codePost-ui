import * as React from "react";
import {
  Button,
  CircularProgress,
  DataTable,
  EditDialogColumn,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField
} from "react-md";
import "../../styles/index.scss";
import {
  IAssignment,
  IAssignmentSubmissionsMap,
  ICourse,
  IOptionNumber,
  IRubricCategory,
  IRubricComment,
  ISubmission
} from "../../types/common";

interface IProps {
  submissionsByAssignment: IAssignmentSubmissionsMap;
  submissionsByAssignmentLoadComplete: boolean;
  lockedAssignmentChange: boolean;
  toggleLock: () => void;
  currentCourse: ICourse | undefined;
  addToast: (text: string, action: string | undefined) => void;
  assignments: IAssignment[];
  assignmentRubricLoadComplete: boolean;
  createRubricCategory: (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | undefined,
    newComments: IRubricComment[]
  ) => void;
  deleteRubricCategory: (
    assignmentID: number,
    categoryID: number,
    categoryName: string
  ) => void;
  createRubricComment: (
    assignmentID: number,
    categoryID: number,
    text: string,
    pointDelta: number
  ) => void;
  deleteRubricComment: (
    assignmentID: number,
    categoryID: number,
    commentID: number
  ) => void;
  updateRubricComment: (
    assignmentID: number,
    categoryID: number,
    commentID: number,
    text: string,
    pointDelta: number
  ) => void;
  updateRubricCategory: (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | undefined
  ) => void;
  updateAssignment: (
    assignnmentID: number,
    name: string,
    points: number
  ) => void;
}

interface IState {
  activeAssignment: IAssignment | undefined;
  activeRubric: IRubricCategory[] | undefined;
  addedCategories: IRubricCategory[];
  deletedCategories: IOptionNumber[];
  deletedComments: number[];
}

class ManageAssignments extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    activeAssignment: undefined,
    activeRubric: undefined,
    addedCategories: [],
    deletedCategories: [],
    deletedComments: []
  };

  public assignmentNameField: any;
  public assignmentPointsField: any;

  constructor(props: IProps) {
    super(props);
    this.assignmentNameField = React.createRef();
    this.assignmentPointsField = React.createRef();
  }

  public changeActiveAssignment = (assignment: IAssignment | undefined) => {
    if (assignment) {
      const rubric = JSON.parse(JSON.stringify(assignment.rubric));
      this.setState({
        activeAssignment: assignment,
        activeRubric: rubric
      });
    } else {
      this.setState({ activeAssignment: undefined, activeRubric: undefined });
    }
  };

  public save = () => {
    const { activeRubric, activeAssignment, deletedCategories } = this.state;

    if (activeRubric && activeAssignment && activeAssignment.rubric) {
      const oldRubric = activeAssignment.rubric;

      activeRubric.forEach(cat => {
        // If new category, create category and comments
        const catIndex = oldRubric.map(i => i.id).indexOf(cat.id);

        if (catIndex === -1) {
          this.props.createRubricCategory(
            cat.assignment,
            cat.name,
            cat.pointLimit,
            cat.comments
          );
        } else {
          // If new comment for an existing category, create commnet

          cat.comments.forEach(comment => {
            if (comment.id === -1) {
              this.props.createRubricComment(
                cat.assignment,
                cat.id,
                comment.text,
                comment.pointDelta
              );
            } else {
              // If existing comment, and either text or points have changed, update comment
              const comIndex = oldRubric[catIndex].comments
                .map(i => i.id)
                .indexOf(comment.id);
              if (
                comIndex !== -1 &&
                (oldRubric[catIndex].comments[comIndex].text !== comment.text ||
                  oldRubric[catIndex].comments[comIndex].pointDelta !==
                    comment.pointDelta)
              ) {
                this.props.updateRubricComment(
                  cat.assignment,
                  cat.id,
                  comment.id,
                  comment.text,
                  comment.pointDelta
                );
              }
            }
          });
          // If a rubric comment has been deleted, delete it
          oldRubric[catIndex].comments.forEach(oldComment => {
            const checkDelete = cat.comments
              .map(i => i.id)
              .indexOf(oldComment.id);
            if (checkDelete === -1) {
              this.props.deleteRubricComment(
                cat.assignment,
                cat.id,
                oldComment.id
              );
            }
          });
          // If a category name or pointLimit has been changed, update it
          if (
            oldRubric[catIndex].name !== cat.name ||
            oldRubric[catIndex].pointLimit !== cat.pointLimit
          ) {
            // Reminder -- need to decide as a team if we can allow pointLimit to be null
            this.props.updateRubricCategory(
              cat.assignment,
              cat.id,
              cat.name,
              cat.pointLimit
            );
          }
        }
      });
      // Delete deleted categories
      deletedCategories.forEach(cat => {
        this.props.deleteRubricCategory(
          activeAssignment.id,
          cat.value,
          cat.label
        );
        this.setState({ deletedCategories: [] });
      });
      this.setState({ activeRubric });
      this.props.toggleLock();

      // Update assignment name and points if necessary
      const newName = this.assignmentNameField.getField().value;
      const newPoints = this.assignmentPointsField.getField().value;
      if (
        newName !== activeAssignment.name ||
        newPoints !== activeAssignment.points
      ) {
        this.props.updateAssignment(activeAssignment.id, newName, newPoints);
      }
    }

    this.props.addToast("Rubric has been updated.", undefined);
  };

  // ------------------- Functions to modify category -------------------
  public deleteCategory = (
    categoryIndex: number,
    categoryID: number,
    categoryName: string
  ) => {
    const { activeRubric, deletedCategories } = this.state;
    if (activeRubric) {
      const newRubric = activeRubric.filter((_, i) => i !== categoryIndex);
      deletedCategories.push({ label: categoryName, value: categoryID });
      this.setState({ activeRubric: newRubric, deletedCategories });
    }
  };

  public addEmptyCategory = () => {
    const { activeRubric, activeAssignment } = this.state;
    if (activeRubric && activeAssignment) {
      activeRubric.push({
        id: -1,
        name: "",
        pointLimit: undefined,
        comments: [],
        assignment: activeAssignment.id,
        rubricComments: []
      });
      this.setState({ activeRubric });
    }
  };

  public categoryNameChange = (categoryIndex: number, newText: string) => {
    const { activeRubric } = this.state;
    if (activeRubric) {
      activeRubric[categoryIndex].name = newText;
    }
    this.setState({ activeRubric });
  };

  public categoryCapChange = (categoryIndex: number, newCap: number) => {
    const { activeRubric } = this.state;
    if (activeRubric) {
      activeRubric[categoryIndex].pointLimit = Number(newCap);
    }
    this.setState({ activeRubric });
  };

  // ------------------- Functions to modify comment -------------------
  public addEmptyComment = (categoryIndex: number) => {
    const { activeRubric } = this.state;
    if (activeRubric) {
      activeRubric[categoryIndex].comments.push({
        // id -1 indicates new comment
        id: -1,
        text: "",
        pointDelta: 0
      });
      this.setState({ activeRubric });
    }
  };

  public commentTextChange = (
    categoryIndex: number,
    commentIndex: number,
    newText: string
  ) => {
    const { activeRubric } = this.state;
    if (activeRubric) {
      activeRubric[categoryIndex].comments[commentIndex].text = newText;
    }
    this.setState({ activeRubric });
  };

  public commentDeltaChange = (
    categoryIndex: number,
    commentIndex: number,
    newDelta: number
  ) => {
    const { activeRubric } = this.state;
    if (activeRubric) {
      activeRubric[categoryIndex].comments[commentIndex].pointDelta = Number(
        newDelta
      );
    }
    this.setState({ activeRubric });
  };

  public deleteComment = (categoryIndex: number, commentIndex: number) => {
    const { activeRubric } = this.state;
    if (activeRubric) {
      const newComments = activeRubric[categoryIndex].comments.filter(
        (_, i) => i !== commentIndex
      );
      activeRubric[categoryIndex].comments = newComments;
      this.setState({ activeRubric });
    }
  };

  // ------------------- Render -------------------
  public render() {
    const {
      submissionsByAssignment,
      submissionsByAssignmentLoadComplete,
      lockedAssignmentChange,
      assignments,
      assignmentRubricLoadComplete
    } = this.props;

    const { activeAssignment } = this.state;

    const lockIcon = lockedAssignmentChange ? "lock" : "lock_open";

    if (
      submissionsByAssignmentLoadComplete &&
      submissionsByAssignment &&
      assignmentRubricLoadComplete &&
      assignments
    ) {
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
                  <TableColumn key={"AssignmentName"}>
                    Assignment name
                  </TableColumn>
                  <TableColumn key={"SubNumber"}># of submissions</TableColumn>
                  <TableColumn key={"GradedNumber"}># graded</TableColumn>
                  <TableColumn key={"UngradedNumber"}># ungraded</TableColumn>
                  <TableColumn key={"UnclaimedNumber"}># unclaimed</TableColumn>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(submissionsByAssignment).map(assignmentID => {
                  const submissions =
                    submissionsByAssignment[assignmentID].submissions;
                  const name = submissionsByAssignment[assignmentID].name;
                  const numSubmissions = submissions.length;
                  let numGraded = 0;
                  let numUngraded = 0;
                  let numUnclaimed = 0;

                  const assignment = assignments.filter(assn => {
                    return assn.id === Number(assignmentID);
                  })[0];

                  submissions.forEach((submission: ISubmission) => {
                    if (submission.isFinalized) {
                      numGraded++;
                    } else if (submission.grader) {
                      numUngraded++;
                    } else {
                      numUnclaimed++;
                    }
                  });

                  return (
                    <TableRow
                      key={assignmentID}
                      onClick={this.changeActiveAssignment.bind(
                        this.props,
                        assignment
                      )}
                    >
                      <TableColumn>{name}</TableColumn>
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
        const { activeRubric } = this.state;

        let categoryTables;

        if (activeRubric) {
          categoryTables = activeRubric.map((item, categoryIndex) => {
            return (
              <div key={item.id}>
                <TextField
                  defaultValue={item.name}
                  label={"Category Name"}
                  fullWidth={false}
                  onChange={this.categoryNameChange.bind(
                    this.props,
                    categoryIndex
                  )}
                  disabled={lockedAssignmentChange}
                />
                <TextField
                  defaultValue={item.pointLimit}
                  label={"Category points cap"}
                  fullWidth={false}
                  step={0.5}
                  pattern="^d+(\.|\,)\d{1}"
                  type="number"
                  min={0}
                  onChange={this.categoryCapChange.bind(
                    this.props,
                    categoryIndex
                  )}
                  disabled={lockedAssignmentChange}
                />
                <Button
                  key="Delete"
                  className="Btn"
                  icon={true}
                  fullWidth={false}
                  disabled={lockedAssignmentChange}
                  onClick={this.deleteCategory.bind(
                    this.props,
                    categoryIndex,
                    item.id,
                    item.name
                  )}
                >
                  delete
                </Button>
                <DataTable
                  key={item.id}
                  className="edit-rubric-table"
                  baseId="edit-rubric-table"
                  plain={true}
                >
                  <TableHeader>
                    <TableRow>
                      <TableColumn key={"CommentText"}>
                        Comment text
                      </TableColumn>
                      <TableColumn key={"Deduction"}>Deduction</TableColumn>
                      <TableColumn key={"Delete"}>Delete</TableColumn>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.comments.map((comment, commentIndex) => {
                      return (
                        <TableRow key={comment.id}>
                          <TableColumn>
                            <EditDialogColumn
                              defaultValue={comment.text}
                              inline={true}
                              disabled={lockedAssignmentChange}
                              noIcon={lockedAssignmentChange}
                              centered={true}
                              onChange={this.commentTextChange.bind(
                                this.props,
                                categoryIndex,
                                commentIndex
                              )}
                            />
                          </TableColumn>
                          <TableColumn>
                            <EditDialogColumn
                              type="number"
                              defaultValue={comment.pointDelta}
                              inline={true}
                              step={0.5}
                              pattern="^d+(\.|\,)\d{1}"
                              className="deduction-field"
                              disabled={lockedAssignmentChange}
                              noIcon={lockedAssignmentChange}
                              centered={true}
                              onChange={this.commentDeltaChange.bind(
                                this.props,
                                categoryIndex,
                                commentIndex
                              )}
                            />
                          </TableColumn>
                          <TableColumn>
                            <Button
                              key="Delete"
                              className="Btn"
                              flat={true}
                              icon={true}
                              disabled={lockedAssignmentChange}
                              onClick={this.deleteComment.bind(
                                this.props,
                                categoryIndex,
                                commentIndex
                              )}
                            >
                              delete
                            </Button>
                          </TableColumn>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </DataTable>
                <Button
                  className="Btn"
                  iconChildren={"playlist_add"}
                  disabled={lockedAssignmentChange}
                  onClick={this.addEmptyComment.bind(this.props, categoryIndex)}
                >
                  Add New Comment
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
                <div className="padding" />
              </div>
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
                ref={field => (this.assignmentNameField = field)}
                label={"Assignment Name"}
                fullWidth={false}
                disabled={lockedAssignmentChange}
              />
              <TextField
                defaultValue={activeAssignment.points}
                step={0.5}
                pattern="^d+(\.|\,)\d{1}"
                type="number"
                min={0}
                ref={field => (this.assignmentPointsField = field)}
                label={"Total Points"}
                fullWidth={false}
                disabled={lockedAssignmentChange}
              />
              <Button
                iconChildren="done"
                className="save-Btn"
                disabled={lockedAssignmentChange}
                onClick={this.save}
              >
                Save rubric changes
              </Button>
            </div>
            <div className="padding" />
            {categoryTables}
            <Button
              className="Btn"
              iconChildren={"playlist_add"}
              disabled={lockedAssignmentChange}
              onClick={this.addEmptyCategory}
            >
              Add New Category
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

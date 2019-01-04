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
} from 'react-md';
import '../../styles/index.scss';
import {
  IAssignment,
  IAssignmentToRubricCategories,
  IAssignmentToSubmissionsMap,
  ICourse,
  IRubricCategory,
  IRubricCategoryToRubricCommentsMap,
  IRubricComment,
  ISubmission,
} from '../../types/common';
import RubricCategoryTable from './adminUtils';
import NewAssignmentDialog from './NewAssignmentDialog';
import RubricFileDialog from './RubricFileDialog';

interface IProps {
  submissions: IAssignmentToSubmissionsMap;
  rubricCategories: IAssignmentToRubricCategories;
  rubricComments: IRubricCategoryToRubricCommentsMap;
  submissionsLoadComplete: boolean;
  lockManageAssignment: boolean;
  toggleLock: () => void;
  currentCourse: ICourse | undefined;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  assignments: IAssignment[];
  assignmentRubricLoadComplete: boolean;
  createRubricCategory: (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | undefined,
    newComments: IRubricComment[],
  ) => Promise<IRubricCategory>;
  createRubricComment: (
    assignmentID: number,
    categoryID: number,
    text: string,
    pointDelta: number,
  ) => Promise<IRubricComment>;
  deleteRubricCategory: (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
  ) => Promise<void>;
  deleteRubricComment: (
    assignmentID: number,
    categoryID: number,
    commentID: number,
  ) => Promise<void>;
  updateRubricCategory: (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | undefined,
  ) => Promise<IRubricCategory>;
  updateRubricComment: (
    categoryID: number,
    commentID: number,
    text: string | undefined,
    pointDelta: number | undefined,
  ) => Promise<IRubricComment>;
  updateAssignment: (
    assignnmentID: number,
    name: string | undefined,
    points: number | undefined,
    isReleased: boolean | undefined,
  ) => Promise<IAssignment>;
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<IAssignment>;
}

interface IState {
  activeAssignment: IAssignment | undefined;
  activeRubricCategories: IRubricCategory[] | undefined;
  activeRubricComments: IRubricCategoryToRubricCommentsMap | undefined;
  newCategoryCounter: number;
}

class ManageAssignments extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    activeAssignment: undefined,
    activeRubricCategories: undefined,
    activeRubricComments: undefined,
    newCategoryCounter: -1,
  };

  public assignmentNameField: any;
  public assignmentPointsField: any;

  constructor(props: IProps) {
    super(props);
    this.assignmentNameField = React.createRef();
    this.assignmentPointsField = React.createRef();
  }

  public changeActiveAssignment = (assignment: IAssignment | undefined) => {
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

  // ------------------- Functions to modify category -------------------
  // Reminder need to add checks to make sure cateogries can't be added
  //  with the same name as existing categories.
  public addEmptyCategory = () => {
    const {
      activeRubricCategories,
      activeRubricComments,
      activeAssignment,
      newCategoryCounter,
    } = this.state;
    if (activeRubricCategories && activeAssignment && activeRubricComments) {
      activeRubricCategories.push({
        id: newCategoryCounter,
        name: '',
        // Reminder -- Magic number on pointLimit until we can update to be undefined
        pointLimit: 0,
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

  public deleteCategory = (categoryID: number, categoryName: string) => {
    const { activeAssignment } = this.state;
    const { activeRubricCategories, activeRubricComments } = this.state;
    if (activeAssignment && activeRubricCategories && activeRubricComments) {
      this.props.deleteRubricCategory(activeAssignment.id, categoryID, categoryName).then(() => {
        const newRubricCategories = activeRubricCategories.filter((cat) => {
          return cat.id !== categoryID;
        });
        delete activeRubricComments[categoryID];
        this.setState({ activeRubricCategories: newRubricCategories, activeRubricComments });
      });
    }
  };

  public changeCategoryName = (categoryIndex: number, newText: string) => {
    const { activeRubricCategories } = this.state;
    if (activeRubricCategories) {
      activeRubricCategories[categoryIndex].name = newText;
    }
    this.setState({ activeRubricCategories });
  };

  public changeCategoryCap = (categoryIndex: number, newCap: number) => {
    const { activeRubricCategories } = this.state;
    if (activeRubricCategories) {
      activeRubricCategories[categoryIndex].pointLimit = Number(newCap);
    }
    this.setState({ activeRubricCategories });
  };

  // ------------------- Functions to modify database -------------------
  public updateComment = (categoryID: number, commentIndex: number) => {
    const { activeAssignment, activeRubricComments } = this.state;
    if (activeAssignment && activeRubricComments) {
      const comm = activeRubricComments[categoryID][commentIndex];
      if (comm.text.length === 0) {
        this.props.addErrorToast('Cannot save comment. Text must not be empty.', undefined);
        return;
      } else if (comm.id === -1) {
        const promise = this.props.createRubricComment(
          activeAssignment.id,
          categoryID,
          comm.text,
          comm.pointDelta,
        );
        if (promise) {
          promise.then((data) => {
            if (data) {
              console.log(activeRubricComments[categoryID].length);
              activeRubricComments[categoryID][commentIndex].id = data.id;
              this.setState({ activeRubricComments });
            }
          });
        }
      } else {
        this.props.updateRubricComment(categoryID, comm.id, comm.text, comm.pointDelta);
      }
    }
  };

  public updateCategory = (categoryIndex: number) => {
    const { activeAssignment, activeRubricCategories, activeRubricComments } = this.state;
    if (activeAssignment && activeRubricCategories && activeRubricComments) {
      const cat = activeRubricCategories[categoryIndex];
      const oldID = cat.id;
      if (cat.name.length === 0) {
        this.props.addErrorToast(
          'Cannot save category. Category name must not be empty.',
          undefined,
        );
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
          const promise = this.props.createRubricCategory(
            activeAssignment.id,
            cat.name,
            cat.pointLimit,
            [],
          );
          if (promise) {
            promise.then((data) => {
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
                this.setState({
                  activeRubricCategories: newRubricCategories,
                  activeRubricComments,
                });
              }
            });
          }
        } else {
          this.props.updateRubricCategory(activeAssignment.id, cat.id, cat.name, cat.pointLimit);
        }
      }
    }
  };

  public addEmptyComment = (categoryID: number) => {
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      const newComment = {
        // id -1 indicates new comment
        id: -1,
        text: '',
        pointDelta: 0,
        category: categoryID,
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
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      activeRubricComments[categoryID][commentIndex].text = newText;
    }
    this.setState({ activeRubricComments });
  };

  public changeCommentDelta = (categoryID: number, commentIndex: number, newDelta: number) => {
    const { activeRubricComments } = this.state;
    if (activeRubricComments) {
      activeRubricComments[categoryID][commentIndex].pointDelta = Number(newDelta);
    }
    this.setState({ activeRubricComments });
  };

  public deleteComment = (categoryID: number, commentIndex: number) => {
    const { activeRubricComments, activeRubricCategories, activeAssignment } = this.state;

    if (activeAssignment && activeRubricCategories && activeRubricComments) {
      const commentID = activeRubricComments[categoryID][commentIndex].id;
      this.props.deleteRubricComment(activeAssignment.id, categoryID, commentID);
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
      this.setState({
        activeRubricComments: newRubricComments,
        activeRubricCategories: newRubricCategories,
      });
    }
  };

  public updateAssignmentName = () => {
    const { activeAssignment } = this.state;
    console.log(this.assignmentNameField);
    if (activeAssignment) {
      this.props.updateAssignment(
        activeAssignment.id,
        this.assignmentNameField.getField().value,
        undefined,
        undefined,
      );
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
            <NewAssignmentDialog
              assignments={this.props.assignments}
              addErrorToast={this.props.addErrorToast}
              createAssignment={this.props.createAssignment}
            />
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

                  assignmentSubs.forEach((submission: ISubmission) => {
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
                categoryIndex={catIndex}
                comments={activeRubricComments[cat.id]}
                categoryName={cat.name}
                categoryPointLimit={cat.pointLimit}
                deleteCategory={this.deleteCategory}
                changeCategoryName={this.changeCategoryName}
                changeCategoryCap={this.changeCategoryCap}
                addEmptyComment={this.addEmptyComment}
                changeCommentText={this.changeCommentText}
                changeCommentDelta={this.changeCommentDelta}
                deleteComment={this.deleteComment}
                isDisabled={lockManageAssignment}
                updateComment={this.updateComment}
                updateCategory={this.updateCategory}
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

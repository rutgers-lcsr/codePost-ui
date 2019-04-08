import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  Drawer,
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
  IStudentSubmissionsDataTable,
} from '../../types/common';
import NewAssignmentDialog from './ManageAssignmentsComponents/NewAssignmentDialog';
import RubricCommentExplorer from './ManageAssignmentsComponents/RubricCommentExplorer';
import RubricFileDialog from './ManageAssignmentsComponents/RubricFileDialog';
import { LinkedCommentsAlert, RubricCategoryTable } from './ManageAssignmentsComponents/RubricUtils';

import { CourseType } from '../../infrastructure/course';
import { RubricCategoryType, sortRubricCategory } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';
import { SubmissionType } from '../../infrastructure/submission';

import DeleteAssignmentDialog from './ManageAssignmentsComponents/DeleteAssignmentDialog';
import UploadSubmissionDialog from './ManageAssignmentsComponents/UploadSubmissionDialog';

import { openSubmission } from './AdminUtils';

import { arrayMove, SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';

export interface IManageAssignmentsProps {
  submissions: IAssignmentToSubmissionsMap;
  students: string[];
  rubricCategories: IAssignmentToRubricCategories;
  rubricComments: IRubricCategoryToRubricCommentsMap;
  submissionsByStudent: IStudentSubmissionsDataTable;
  submissionsbyUserLoadComplete: boolean;
  submissionsLoadComplete: boolean;
  lockManageAssignment: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;
  assignments: AssignmentType[];
  assignmentsLoadComplete: boolean;
  assignmentRubricLoadComplete: boolean;
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;
  createRubricCategory: (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | null,
    sortKey: number,
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
    sortKey: number,
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
    hideGrades: boolean | undefined,
  ) => Promise<void>;
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<AssignmentType>;

  setLoadingDialog: (message: string, title: string) => void;
  clearLoadingDialog: () => void;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => void;
}

interface IManageAssignmentsState {
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
  uploadingSubmissionAssignment?: AssignmentType;
  deletingAssignment?: AssignmentType;
  drawerVisible: boolean;
  drawerContent: { title: string; subtitle: string; content: Array<{ email: string; subID: number | null }> };
  isDownloading: boolean;
}

export enum DRAWER_TYPE {
  Submitted,
  Graded,
  Ungraded,
  Unclaimed,
  Missing,
}

class ManageAssignments extends React.Component<IManageAssignmentsProps, IManageAssignmentsState> {
  public state: Readonly<IManageAssignmentsState> = {
    activeAssignment: undefined,
    activeRubricCategories: undefined,
    activeRubricComments: undefined,
    newCategoryCounter: -1,
    changeCommentDialogID: undefined,
    changeCategoryDialogID: undefined,
    commentExplorer: undefined,
    savedComments: {},
    savedCategories: {},
    drawerVisible: false,
    drawerContent: { title: '', subtitle: '', content: [] },
    isDownloading: false,
  };

  public assignmentNameField: any;
  public assignmentPointsField: any;

  constructor(props: IManageAssignmentsProps) {
    super(props);
    this.assignmentNameField = React.createRef();
    this.assignmentPointsField = React.createRef();
  }

  public changeActiveAssignment = (assignment: AssignmentType | undefined) => {
    const { rubricCategories, rubricComments } = this.props;

    if (assignment) {
      this.setState({
        activeAssignment: assignment,
        activeRubricCategories: sortRubricCategory(JSON.parse(JSON.stringify(rubricCategories[assignment.id]))),
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
        sortKey: 0,
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
      const newCategoryCap = newCap ? newCap : null;
      activeRubricCategories[categoryIndex].pointLimit = newCategoryCap;
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

  public changeCommentDelta = (categoryID: number, commentIndex: number, delta: number) => {
    const { activeRubricComments, savedComments } = this.state;
    const newDelta = delta ? delta : 0;
    if (activeRubricComments) {
      activeRubricComments[categoryID][commentIndex].pointDelta = newDelta;
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
        const oldComm = this.props.rubricComments[categoryID].find((i) => {
          return i.id === comm.id;
        });
        // If no change, then return
        if (oldComm && oldComm.text === comm.text && oldComm.pointDelta === comm.pointDelta) {
          return;
        }
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
          this.props
            .createRubricCategory(activeAssignment.id, cat.name, cat.pointLimit, cat.sortKey, [])
            .then((data) => {
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
          const oldCat = this.props.rubricCategories[activeAssignment.id].find((i) => {
            return i.id === cat.id;
          });
          // If no change, then return
          if (oldCat && oldCat.name === cat.name && oldCat.pointLimit === cat.pointLimit) {
            return;
          }
          this.props
            .updateRubricCategory(activeAssignment.id, cat.id, cat.name, cat.pointLimit, cat.sortKey)
            .then(() => {
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
    if (activeAssignment && activeAssignment.name !== this.assignmentNameField.getField().value) {
      this.props.updateAssignment(
        activeAssignment.id,
        this.assignmentNameField.getField().value,
        undefined,
        undefined,
        undefined,
      );
    }
  };

  public updateAssignmentPoints = () => {
    const { activeAssignment } = this.state;
    if (activeAssignment && activeAssignment.points !== Number(this.assignmentPointsField.getField().value)) {
      this.props.updateAssignment(
        activeAssignment.id,
        undefined,
        this.assignmentPointsField.getField().value,
        undefined,
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

  public clearChangeCommentDialog = (revert: boolean) => {
    const { changeCommentDialogID, activeRubricComments } = this.state;
    const { rubricComments } = this.props;

    // If a change to an item with linked comments is cancelled, revert to previous data
    if (revert) {
      if (activeRubricComments && changeCommentDialogID && !changeCommentDialogID.isDelete) {
        const oldComment = rubricComments[changeCommentDialogID.categoryID][changeCommentDialogID.commentIndex];
        activeRubricComments[changeCommentDialogID.categoryID][changeCommentDialogID.commentIndex].text =
          oldComment.text;
        activeRubricComments[changeCommentDialogID.categoryID][changeCommentDialogID.commentIndex].pointDelta =
          oldComment.pointDelta;
        this.setState({ activeRubricComments });
      }
    }
    this.setState({ changeCommentDialogID: undefined });
  };

  public clearChangeCategoryDialog = (revert: boolean) => {
    const { changeCategoryDialogID, activeRubricCategories, activeAssignment } = this.state;
    const { rubricCategories } = this.props;

    // If a change to an item with linked comments is cancelled, revert to previous data
    if (revert) {
      if (activeAssignment && activeRubricCategories && changeCategoryDialogID && !changeCategoryDialogID.isDelete) {
        const oldCat = rubricCategories[activeAssignment.id][changeCategoryDialogID.categoryIndex];
        activeRubricCategories[changeCategoryDialogID.categoryIndex].pointLimit = oldCat.pointLimit;
        this.setState({ activeRubricCategories });
      }
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

  // ------------------- Upload Submission functions -------------------
  public toggleUploadSubmission = (assignment: AssignmentType | undefined) => {
    this.setState({ uploadingSubmissionAssignment: assignment });
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
      });
    }
  };

  // Function called upon downloading
  public downloadGrades = (assignment: AssignmentType) => {
    const { currentCourse, submissions } = this.props;
    if (!currentCourse) {
      return;
    }

    const subs = submissions[assignment.id];

    const grades: string[] = [`Student,${assignment.name} Grade`];
    subs.forEach((sub) => {
      sub.students.forEach((student) => {
        if (this.props.students.includes(student)) {
          grades.push(`${student},${sub.grade}`);
        }
      });
    });

    const csv = grades.join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8, ${csv}`;
    a.download = `${currentCourse.name}-${currentCourse.period}-${assignment.name}-grades.csv`;

    document.body.appendChild(a);
    a.click();
  };

  public getAllGrades = (
    assignments: AssignmentType[],
    submissions: IAssignmentToSubmissionsMap,
    students: string[],
  ) => {
    const columns: string[] = ['Active Student'].concat(
      assignments.map((assignment: AssignmentType) => {
        return assignment.name;
      }),
    );

    const csv = [columns];
    students.forEach((student: string) => {
      const row: string[] = [student];
      assignments.forEach((assignment: AssignmentType) => {
        const sub = submissions[assignment.id].find((submission: SubmissionType) => {
          return submission.students.includes(student);
        });
        const grade = sub && sub.grade ? sub.grade.toString() : '';
        row.push(grade);
      });
      csv.push(row);
    });

    return csv;
  };

  public downloadAllGrades = () => {
    if (!this.props.currentCourse) {
      return;
    }

    this.setState({ isDownloading: true });
    const csv = this.getAllGrades(this.props.assignments, this.props.submissions, this.props.students).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8, ${csv}`;
    a.download = `${this.props.currentCourse.name}-${this.props.currentCourse.period}-grades.csv`;

    document.body.appendChild(a);
    a.click();

    this.setState({ isDownloading: false });
  };

  // This function is called when a an assignment drawer is opened
  // Depending on the type of data (DRAWER_TYPE), different sets of data will
  // be stored in state. We need to store the data in state of on render because
  // the drawer sliding takes time and looks bad if the data changes while it's sliding
  public openDrawer = (assignmentID: number, type: DRAWER_TYPE) => {
    const { submissionsByStudent } = this.props;
    const subs = this.props.submissions[assignmentID];

    // Get the assignment for the assignment name, displayed as the drawer title
    const assignment = this.props.assignments.filter((assn) => {
      return assn.id === Number(assignmentID);
    })[0];

    if (!assignment) {
      return;
    }

    const getContent = () => {
      switch (type) {
        case DRAWER_TYPE.Submitted:
          return subs.map((sub: SubmissionType) => {
            return { email: sub.students.toString(), subID: sub.id };
          });
        case DRAWER_TYPE.Graded:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && sub.isFinalized) {
              students.push({ email: sub.students.toString(), subID: sub.id });
            }
            return students;
          }, []);
        case DRAWER_TYPE.Ungraded:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && !sub.isFinalized && sub.grader) {
              students.push({ email: sub.students.toString(), subID: sub.id });
            }
            return students;
          }, []);
        case DRAWER_TYPE.Unclaimed:
          return subs.reduce((students: Array<{ email: string; subID: number | null }>, sub: SubmissionType) => {
            if (sub && !sub.isFinalized && !sub.grader) {
              students.push({ email: sub.students.toString(), subID: sub.id });
            }
            return students;
          }, []);
        case DRAWER_TYPE.Missing:
          return Object.keys(submissionsByStudent).reduce(
            (students: Array<{ email: string; subID: number | null }>, student: string) => {
              if (!submissionsByStudent[student][assignmentID]) {
                students.push({ email: student, subID: null });
              }
              return students;
            },
            [],
          );
      }
    };

    const newContent: Array<{ email: string; subID: number | null }> = getContent();

    // Get the subtitle text to pass to the drawer
    const getText = () => {
      switch (type) {
        case DRAWER_TYPE.Submitted:
          return `Submissions (${newContent.length})`;
        case DRAWER_TYPE.Graded:
          return `Graded Submissions (${newContent.length})`;
        case DRAWER_TYPE.Ungraded:
          return `Ungraded Submissions (${newContent.length})`;
        case DRAWER_TYPE.Unclaimed:
          return `Unclaimed Submissions (${newContent.length})`;
        case DRAWER_TYPE.Missing:
          return `Students with missing submission (${newContent.length})`;
      }
    };

    this.setState({
      drawerContent: { title: assignment.name, subtitle: getText(), content: newContent },
    });

    this.setState({ drawerVisible: true });
  };

  // We don't reset the data to null on close because we don't want the data to change
  // while the drawer is sliding
  public closeDrawer = (e: any) => {
    e.stopPropagation();
    this.setState({ drawerVisible: false });
  };

  // Called when external area is clicked
  public handleDrawerChange = (visible: boolean) => {
    if (!visible) {
      this.setState({ drawerVisible: false });
    }
  };

  public onSortEnd = ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
    if (this.state.activeRubricCategories) {
      this.setState({
        activeRubricCategories: arrayMove(this.state.activeRubricCategories, oldIndex, newIndex),
      });
    }
  };

  // ------------------- Render -------------------
  public render() {
    const {
      submissions,
      submissionsLoadComplete,
      lockManageAssignment,
      assignments,
      assignmentsLoadComplete,
      assignmentRubricLoadComplete,
      submissionsbyUserLoadComplete,
      submissionsByStudent,
    } = this.props;
    const { activeAssignment, commentExplorer, drawerVisible, drawerContent } = this.state;

    let tableBody;
    const dummyFunction = () => {
      return;
    };
    if (
      submissionsLoadComplete &&
      assignmentsLoadComplete &&
      assignmentRubricLoadComplete &&
      submissionsbyUserLoadComplete
    ) {
      const submissionAssignments = this.props.assignments
        .filter((assignment) => {
          return assignment.id in submissions;
        })
        .map((assignment) => {
          return `${assignment.id}`;
        });

      tableBody = submissionAssignments.map((assignmentID) => {
        const assignmentSubs = submissions[assignmentID];
        const numSubmissions = assignmentSubs.length;

        // Calculate data for the assignment table:
        //  numGraded: number of submissions Graded
        //  numUngraded: number of submissions not yet graded or claimed
        //  numUnclaimed: (subset of numUngraded) submissions not claimed
        //  numMissing: number of students who did not submit
        let numGraded = 0;
        let numUngraded = 0;
        let numUnclaimed = 0;
        let totalScore = 0;

        const assignment = assignments.filter((assn) => {
          return assn.id === Number(assignmentID);
        })[0];

        if (!assignment) {
          return <div />;
        }

        assignmentSubs.forEach((submission: SubmissionType) => {
          if (submission.isFinalized) {
            numGraded += 1;
            if (submission.grade !== null) {
              totalScore += submission.grade;
            }
          } else if (submission.grader) {
            numUngraded += 1;
          } else {
            numUnclaimed += 1;
          }
        });

        const numMissing = Object.keys(submissionsByStudent).reduce((missing: number, student: string) => {
          if (!submissionsByStudent[student][assignment.id]) {
            return missing + 1;
          }
          return missing;
        }, 0);

        // Get Mean and Median stats. If the assignment is released, we take the mean median calculated by the models
        //  which is provided in the assignment object, so that students will see the same stats that admins see
        // If the assignment is not released, we want to calculate it across all finalized submissions
        const sortedFinalized = assignmentSubs.reduce((grades: number[], sub: SubmissionType) => {
          if (sub.isFinalized && sub.grade !== null) {
            grades.push(sub.grade);
          }
          return grades;
        }, []);

        let calculatedMedian;
        if (sortedFinalized) {
          sortedFinalized.sort();
          const index = Math.floor(sortedFinalized.length / 2);
          // if odd, get the index, if even average the two middle elements
          if (sortedFinalized.length % 2) {
            calculatedMedian = sortedFinalized[index];
          } else {
            calculatedMedian = (sortedFinalized[index - 1] + sortedFinalized[index]) / 2;
          }
        }

        const mean = assignment.mean
          ? assignment.mean.toString()
          : sortedFinalized.length
          ? (totalScore / numGraded).toFixed(2).toString()
          : '--';
        const median = assignment.median
          ? assignment.median.toString()
          : sortedFinalized.length
          ? calculatedMedian
          : '--';

        const onCellClick = this.changeActiveAssignment.bind(this.props, assignment);
        const downloadGrades = this.downloadGrades.bind(this.props, assignment);

        return (
          <TableRow key={assignmentID}>
            <Tooltipped
              key={assignmentID}
              label="Click to open Assignment rubric"
              delay={250}
              position="top"
              setPosition={true}
              style={{ height: '50px', left: '5px' }}
            >
              <TableColumn key={`${assignmentID}-1`} onClick={onCellClick} style={{ cursor: 'pointer' }}>
                {assignment.name}
              </TableColumn>
            </Tooltipped>
            <TableColumn
              key={`${assignmentID}-2`}
              onClick={
                numSubmissions > 0 ? this.openDrawer.bind(this, assignment.id, DRAWER_TYPE.Submitted) : dummyFunction
              }
              style={numSubmissions > 0 ? { cursor: 'pointer' } : {}}
            >
              {numSubmissions}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-3`}
              onClick={numGraded > 0 ? this.openDrawer.bind(this, assignment.id, DRAWER_TYPE.Graded) : dummyFunction}
              style={numGraded > 0 ? { cursor: 'pointer' } : {}}
            >
              {numGraded}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-4`}
              onClick={
                numUngraded > 0 ? this.openDrawer.bind(this, assignment.id, DRAWER_TYPE.Ungraded) : dummyFunction
              }
              style={numUngraded > 0 ? { cursor: 'pointer' } : {}}
            >
              {numUngraded}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-5`}
              onClick={
                numUnclaimed > 0 ? this.openDrawer.bind(this, assignment.id, DRAWER_TYPE.Unclaimed) : dummyFunction
              }
              style={numUnclaimed > 0 ? { cursor: 'pointer' } : {}}
            >
              {numUnclaimed}
            </TableColumn>
            <TableColumn
              key={`${assignmentID}-6`}
              onClick={numMissing > 0 ? this.openDrawer.bind(this, assignment.id, DRAWER_TYPE.Missing) : dummyFunction}
              style={numMissing > 0 ? { cursor: 'pointer' } : {}}
            >
              {numMissing}
            </TableColumn>
            <TableColumn key={`${assignmentID}-7`}>{mean}</TableColumn>
            <TableColumn key={`${assignmentID}-8`}>{median}</TableColumn>
            <TableColumn>
              <Button icon={true} onClick={downloadGrades}>
                vertical_align_bottom
              </Button>
            </TableColumn>
            <TableColumn style={{ textAlign: 'center' }}>
              <Button icon={true} onClick={this.toggleUploadSubmission.bind(this.props, assignment)}>
                vertical_align_top
              </Button>
            </TableColumn>
            <TableColumn>
              <Button icon={true} onClick={this.toggleDeleteAssignment.bind(this.props, assignment)}>
                cancel
              </Button>
            </TableColumn>
          </TableRow>
        );
      });
    } else {
      tableBody = <div />;
    }

    if (!activeAssignment) {
      return (
        <div className="admin__main-panel__content-container">
          <div className="padding" />
          <NewAssignmentDialog
            assignments={this.props.assignments}
            addErrorToast={this.props.addErrorToast}
            createAssignment={this.props.createAssignment}
          />
          {this.state.isDownloading ? (
            <Button raised className="button--download-assignments">
              Downloading...
            </Button>
          ) : (
            <Button raised className="button--download-assignments" onClick={this.downloadAllGrades}>
              Download All Grades
            </Button>
          )}

          <div className="padding" />
          {submissionsLoadComplete && assignmentRubricLoadComplete ? (
            <DataTable className="Manage-assignments-table" baseId="Manage-assignments-table" plain={true}>
              <TableHeader>
                <TableRow>
                  <TableColumn key={'AssignmentName'}>Assignment name</TableColumn>
                  <TableColumn key={'SubNumber'}># of submissions</TableColumn>
                  <TableColumn key={'GradedNumber'}># graded</TableColumn>
                  <TableColumn key={'UngradedNumber'}># ungraded</TableColumn>
                  <TableColumn key={'UnclaimedNumber'}># unclaimed</TableColumn>
                  <TableColumn key={'NumMissing'}># missing</TableColumn>
                  <TableColumn key={'Mean'}>Mean Grade</TableColumn>
                  <TableColumn key={'Median'}>Median Grade</TableColumn>
                  <TableColumn key={'Grades'}>Grades</TableColumn>
                  <TableColumn key={'UploadSubmission'}>Upload Submission</TableColumn>
                  <TableColumn key={'Delete'}>Delete</TableColumn>
                </TableRow>
              </TableHeader>
              <TableBody>{tableBody}</TableBody>
            </DataTable>
          ) : (
            <CircularProgress id="progress" className="progress-circle" />
          )}
          <DeleteAssignmentDialog
            isVisible={typeof this.state.deletingAssignment !== 'undefined'}
            assignmentName={this.state.deletingAssignment ? this.state.deletingAssignment.name : ''}
            onCancel={this.toggleDeleteAssignment.bind(this.props, undefined)}
            onDelete={this.deleteAssignment}
          />
          <UploadSubmissionDialog
            isVisible={typeof this.state.uploadingSubmissionAssignment !== 'undefined'}
            assignments={this.props.assignments}
            selectedAssignment={this.state.uploadingSubmissionAssignment!}
            students={this.props.students}
            selectedStudents={null}
            onCancel={this.toggleUploadSubmission.bind(this.props, undefined)}
            uploadSubmission={this.props.uploadSubmission}
          />
          <div
            className={`drawer__background${!drawerVisible ? '--hidden' : ''}`}
            onClick={drawerVisible ? this.closeDrawer : dummyFunction}
          />
          <Drawer
            id="drawer--ManageAssignments"
            type={Drawer.DrawerTypes.TEMPORARY}
            className="drawer--ManageAssignments"
            visible={drawerVisible}
            position={'right'}
            onVisibilityChange={this.handleDrawerChange}
            style={{ zIndex: 16777271 }}
            header={
              <div className="drawer__header">
                <div className="drawer__title">{drawerContent.title}</div>
                <Button className="drawer__close" icon={true} flat={true} onClick={this.closeDrawer}>
                  clear
                </Button>
                <div className="drawer__subtitle">{drawerContent.subtitle}</div>
              </div>
            }
          >
            <div className="drawer__content">
              {drawerContent.content.map((item: { email: string; subID: number | null }) => {
                return (
                  <div
                    key={item.email}
                    className={`drawer__item${item.subID ? '--allowHover' : ''}`}
                    onClick={item.subID ? openSubmission.bind(this, item.subID) : dummyFunction}
                  >
                    {item.email}
                  </div>
                );
              })}
            </div>
          </Drawer>
        </div>
      );
    } else {
      const { activeRubricCategories, activeRubricComments } = this.state;

      let categoryTables;
      // ~~~~~~~~
      if (activeRubricCategories && activeRubricComments) {
        const DragHandle = SortableHandle(() => <span>||</span>);

        const SortableItem = SortableElement(
          ({ rubricCategory, index }: { rubricCategory: RubricCategoryType; index: number }) => (
            <li>
              <DragHandle />
              <RubricCategoryTable
                key={rubricCategory.id}
                categoryID={rubricCategory.id}
                categoryIndex={index}
                comments={activeRubricComments[rubricCategory.id]}
                categoryName={rubricCategory.name}
                categoryPointLimit={rubricCategory.pointLimit}
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
            </li>
          ),
        );

        const SortableList = SortableContainer(({ items }: { items: RubricCategoryType[] }) => {
          return (
            <ul>
              {items.map((rubricCategory, index) => (
                <SortableItem key={`item-${index}`} index={index} rubricCategory={rubricCategory} />
              ))}
            </ul>
          );
        });

        categoryTables = <SortableList items={activeRubricCategories} onSortEnd={this.onSortEnd} />;
        // categoryTables = activeRubricCategories.map((cat, catIndex) => {
        //   return (
        //     <RubricCategoryTable
        //       key={cat.id}
        //       categoryID={cat.id}
        //       categoryIndex={catIndex}
        //       comments={activeRubricComments[cat.id]}
        //       categoryName={cat.name}
        //       categoryPointLimit={cat.pointLimit}
        //       // bind the trigger change with true for isDelete
        //       deleteCategory={this.triggerChangeCategoryDialog.bind(this.props, true)}
        //       changeCategoryName={this.changeCategoryName}
        //       changeCategoryCap={this.changeCategoryCap}
        //       addEmptyComment={this.addEmptyComment}
        //       changeCommentText={this.changeCommentText}
        //       changeCommentDelta={this.changeCommentDelta}
        //       deleteComment={this.triggerChangeCommentDialog.bind(this.props, true)}
        //       isDisabled={lockManageAssignment}
        //       updateComment={this.triggerChangeCommentDialog.bind(this.props, false)}
        //       updateCategoryCaps={this.triggerChangeCategoryDialog.bind(this.props, false)}
        //       updateCategoryName={this.updateCategory}
        //       savedComments={this.state.savedComments}
        //       savedCategories={this.state.savedCategories}
        //       triggerCommentExplorer={this.triggerCommentExplorer}
        //     />
        //   );
        // });
      }

      return (
        <div className={`admin__main-panel__content-container${this.props.lockManageAssignment ? '--locked' : ''}`}>
          {lockManageAssignment ? (
            <div className="admin__lockMessage-container">
              <div className="admin__lockMessage-text">Edits are locked.</div>
            </div>
          ) : (
            <div />
          )}
          <div className="admin-rubric__title-container">
            <Button
              key="Back"
              className="admin-rubric__back"
              raised={true}
              icon={true}
              onClick={this.changeActiveAssignment.bind(this.props, undefined)}
            >
              arrow_back
            </Button>
            <div className="admin-rubric__title-text">Assignment Rubric</div>
          </div>
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

              <div className="admin-rubric__assignment__isReleased">
                <Tooltipped
                  key="assignment-release"
                  label="If published, students with finalized submissions can view their submissions."
                  delay={250}
                  position="top"
                  setPosition={true}
                  style={{ height: '50px' }}
                >
                  <div>
                    <SelectionControl
                      id="assignment-release-checkbox"
                      name="assignment-release-checkbox"
                      type="switch"
                      label="Published to students"
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
                </Tooltipped>
                <SelectionControl
                  id="assignment-hide-grades-checkbox"
                  name="assignment-hide-grades-checkbox"
                  type="switch"
                  label="Hide grades"
                  defaultChecked={activeAssignment.hideGrades}
                  disabled={lockManageAssignment}
                  onChange={this.props.updateAssignment.bind(
                    this.props,
                    activeAssignment.id,
                    undefined,
                    undefined,
                    undefined,
                    !activeAssignment.hideGrades,
                  )}
                />
              </div>
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
            isDelete={this.state.changeCategoryDialogID ? this.state.changeCategoryDialogID.isDelete : false}
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
          <Button
            key="Lock"
            className="admin__lockBtn"
            floating={true}
            fixed={true}
            icon={true}
            onClick={this.props.toggleLock}
          >
            {lockManageAssignment ? 'lock' : 'lock_open'}
          </Button>
        </div>
      );
    }
  }
}

export default ManageAssignments;

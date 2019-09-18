/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* antd imports */
import { message } from 'antd';

/* other library imports */
import arrayMove from 'array-move';
import _ from 'lodash';

import { Assignment, AssignmentType, RubricType } from '../../../infrastructure/assignment';
import { CommentIO } from '../../../infrastructure/comment';
import { RubricCategory, RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../infrastructure/rubricComment';
import { SubmissionType } from '../../../infrastructure/submission';

import { DIRECTION, IRubricCategoryToRubricCommentsMap } from '../../../types/common';

/**********************************************************************************************************************/

export enum RESOLUTION {
  DELETE,
  UNLINK,
}

export interface IRubricManagerParams {
  props: IRubricManagerProps;
  state: IRubricManagerState;
  helpers: IRubricManagerHelpers;
}

export interface IRubricManagerHelpers {
  loadAssignmentRubric: any;
  loadFeedbackScores: any;
  resetRubric: any;
  setNewRubric: any;
  replaceRubric: any;
  onCategoryEdit: any;
  onCategoryUndo: any;
  onCommentEdit: any;
  onCommentUndo: any;
  saveRubric: any;
  deleteLinkedComments: any;
  unlinkLinkedComments: any;
  buildLinkedList: any;
  onSave: any;
  buildCommentMap: any;
  moveCategory: any;
  updateRubricCategory: any;
  deleteRubricCategory: any;
  addRubricCategory: any;
  updateRubricComment: any;
  deleteRubricComment: any;
  addRubricComment: any;
  onLinkedAlertCancel: any;
  onLinkedCommentsResolve: any;
  onLinkedConfirmCancel: any;
  onLinkedConfirmAccept: any;
  onBack: any;
  onUnload: any;
  toggleLock: any;
  changesMade: any;
  activateCommentExplorer: any;
  clearCommentExplorer: any;
  onCommentDragEnd: any;
}

export interface IRubricManagerProps {
  /* assignment data */
  assignment: AssignmentType;
  submissions: SubmissionType[];

  onCancel: () => void;

  reloadInterval?: number;

  children: (params: IRubricManagerParams) => React.ReactNode;
}

export interface IRubric {
  categories: RubricCategoryType[];
  comments: RubricCommentType[];
}

export interface IFeedbackScore {
  negative: number;
  positive: number;
}

export interface IRubricManagerState {
  // status cache
  loadComplete: boolean;
  changeLock: boolean;
  isSaving: boolean;
  errorObjects: number[];

  // rubric editing
  unsavedComments: RubricCommentType[];
  deletedComments: RubricCommentType[];
  unsavedCategories: RubricCategoryType[];
  deletedCategories: RubricCategoryType[];
  hasMoved: boolean;

  // rubric explorer
  activeComment?: RubricCommentType;

  // linked category/comment resolution
  linkedComments: RubricCommentType[];
  resolutions: { [key: number]: RESOLUTION };
  confirmedPropagation: boolean;
  showConfirmDialog: boolean;

  // data
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;

  // saved data
  savedRubricCategories: RubricCategoryType[];
  savedRubricComments: IRubricCategoryToRubricCommentsMap;

  // misc
  newObjectCounter: number;
  feedbackScores?: { [commentID: number]: IFeedbackScore };
}

/**********************************************************************************************************************/

class RubricManager extends React.Component<IRubricManagerProps, IRubricManagerState> {
  // @ts-ignore
  private interval: number;

  constructor(props: IRubricManagerProps) {
    super(props);
    this.state = {
      loadComplete: false,
      changeLock: true,
      isSaving: false,
      errorObjects: [],

      unsavedComments: [],
      deletedComments: [],
      unsavedCategories: [],
      deletedCategories: [],
      hasMoved: false,

      linkedComments: [],
      resolutions: {},
      confirmedPropagation: false,
      showConfirmDialog: false,

      rubricCategories: [],
      rubricComments: {},

      savedRubricCategories: [],
      savedRubricComments: {},

      newObjectCounter: -1,
    };
    this.onUnload = this.onUnload.bind(this);
    this.loadAssignmentRubric(props.assignment);
  }

  public loadAssignmentRubric = (assignment: AssignmentType) => {
    return Assignment.readRubric(assignment.id)
      .then((rubric: RubricType) => {
        const commentMap = this.buildCommentMap(rubric.rubricCategories, rubric.rubricComments);
        this.setState(
          {
            rubricCategories: rubric.rubricCategories,
            rubricComments: commentMap,
            savedRubricCategories: _.cloneDeep(rubric.rubricCategories),
            savedRubricComments: _.cloneDeep(commentMap),
            loadComplete: true,
          },
          () => {
            this.loadFeedbackScores(rubric.rubricComments);
          },
        );
      })
      .catch((errors) => {
        return Promise.reject(errors);
      });
  };

  public loadFeedbackScores = async (rubricComments: RubricCommentType[]) => {
    const newMap: any = {};
    for (const rComment of rubricComments) {
      // feedback scores
      let numNegative = 0;
      let numPositive = 0;
      const totalComments = rComment.comments.length;

      if (totalComments === 0) {
        newMap[rComment.id] = { negative: 0, positive: 0 };
      } else {
        for (const commentID of rComment.comments) {
          const loadedComment = await CommentIO.read(commentID);
          if (loadedComment.feedback === -1) {
            numNegative = numNegative + 1;
          } else if (loadedComment.feedback === 1) {
            numPositive = numPositive + 1;
          }
        }

        newMap[rComment.id] = {
          negative: numNegative / totalComments,
          positive: numPositive / totalComments,
        };
      }
    }

    this.setState({ feedbackScores: newMap });
  };

  public componentDidMount() {
    window.addEventListener('beforeunload', this.onUnload);

    if (this.props.reloadInterval !== undefined) {
      this.interval = window.setInterval(() => {
        // to remove before prod
        message.success('updating rubric');
        this.loadAssignmentRubric(this.props.assignment);
      }, this.props.reloadInterval);
    }
  }

  public componentDidUpdate(prevProps: IRubricManagerProps) {
    if (prevProps.reloadInterval !== this.props.reloadInterval) {
      if (this.props.reloadInterval !== undefined) {
        clearInterval(this.interval);
      } else {
        this.interval = window.setInterval(async () => {
          // to remove before prod
          message.success('updating rubric');
          await this.loadAssignmentRubric(this.props.assignment);
        }, this.props.reloadInterval);
      }
    }
  }

  public componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onUnload);

    if (this.props.reloadInterval) {
      clearInterval(this.interval);
    }
  }

  /************************************************************************
  /* Editing functions
  /***********************************************************************/

  public resetRubric = () => {
    this.setState({
      deletedCategories: [],
      deletedComments: [],
      unsavedCategories: [],
      unsavedComments: [],
      rubricCategories: _.cloneDeep(this.state.savedRubricCategories),
      rubricComments: _.cloneDeep(this.state.savedRubricComments),
      hasMoved: false,
      confirmedPropagation: false,
    });
  };

  public setNewRubric = (
    rubricCategories: RubricCategoryType[],
    rubricComments: IRubricCategoryToRubricCommentsMap,
  ) => {
    this.setState(
      {
        rubricComments,
        rubricCategories,
      },
      () => {
        this.onSave(undefined);
      },
    );
  };

  public replaceRubric = (
    rubricCategories: RubricCategoryType[],
    rubricComments: IRubricCategoryToRubricCommentsMap,
  ) => {
    // we can delete the saved rubric, and ignore any edits that have been made
    // since any queued edits, creates, or deletes don't need to be executed
    const { savedRubricCategories, savedRubricComments } = this.state;

    this.setState(
      {
        deletedCategories: [...savedRubricCategories],
        deletedComments: _.flatten(
          savedRubricCategories.map((el) => {
            return savedRubricComments[el.id];
          }),
        ),
        unsavedCategories: [...rubricCategories],
        unsavedComments: _.flatten(
          rubricCategories.map((el) => {
            return rubricComments[el.id];
          }),
        ),
        rubricCategories,
        rubricComments,
      },
      () => {
        this.onSave(this.setNewRubric.bind(this, rubricCategories, rubricComments));
      },
    );
  };

  public onCategoryEdit = (category: RubricCategoryType) => {
    this.setState({
      unsavedCategories: [...this.state.unsavedCategories, category],
    });
  };

  public onCommentEdit = (comment: RubricCommentType) => {
    if (
      this.state.unsavedComments.find((unsavedComment: RubricCommentType) => {
        return comment.id === unsavedComment.id;
      }) === undefined
    ) {
      this.setState({
        unsavedComments: [...this.state.unsavedComments, comment],
      });
    }
  };

  public onCategoryUndo = (category: RubricCategoryType) => {
    this.setState({
      unsavedCategories: this.state.unsavedCategories.filter((el) => {
        return el.id !== category.id;
      }),
    });
  };

  public onCommentUndo = (comment: RubricCommentType) => {
    this.setState({
      unsavedComments: this.state.unsavedComments.filter((el) => {
        return el.id !== comment.id;
      }),
    });
  };

  public saveRubric = (
    categories: RubricCategoryType[],
    comments: IRubricCategoryToRubricCommentsMap,
    unsavedComments: RubricCommentType[],
    deletedComments: RubricCommentType[],
    unsavedCategories: RubricCategoryType[],
    deletedCategories: RubricCategoryType[],
    resolved: { [key: number]: RESOLUTION },
  ) => {
    // Perform all creates and updates
    const promises = categories.map((category) => {
      if (category.id < 0) {
        // Category is new
        // Step 1: create rubric category
        // Step 2: create rubric comments, using new category ID

        return RubricCategory.create(category).then((newCategory) => {
          const commentList = comments[category.id];
          const innerPromises = commentList.map((comment) => {
            // assume all comments are also new
            comment.category = newCategory.id;
            return RubricComment.create(comment);
          });

          return Promise.all(innerPromises);
        });
      } else {
        // Category already exists
        // Step 1: update category, if necessary
        // Step 2: loop through comments, updating if necessary

        const categoryNeedsSaving = unsavedCategories.some((el) => {
          return el.id === category.id;
        });

        let categoryPromise: Promise<any>;
        if (categoryNeedsSaving) {
          // We don't want to pass in the ids of comments on update
          // Passing in these comments can create race conditions
          const { rubricComments, ...payload } = category;
          categoryPromise = RubricCategory.update(payload);
        } else {
          categoryPromise = Promise.resolve();
        }

        const commentList = comments[category.id];
        const commentPromises = commentList.map((comment) => {
          if (comment.id < 0) {
            return RubricComment.create(comment);
          } else {
            const commentNeedsSaving = unsavedComments.some((el) => {
              return el.id === comment.id;
            });

            if (commentNeedsSaving) {
              // We don't want to pass in the ids of linked comments on update
              // Passing in these comments can create race conditions
              // An example is if a linked comment gets deleted between rubric saves
              const { category: rubricCategory, comments: linkedComments, ...payload } = comment;
              return RubricComment.update(payload);
            } else {
              return Promise.resolve();
            }
          }
        });

        return Promise.all([...commentPromises, categoryPromise]).then();
      }
    });

    // Perform all deletes
    const deleteComments = deletedComments.map((rubricComment) => {
      if (Object.keys(resolved).includes(rubricComment.id.toString())) {
        const howToResolve = resolved[rubricComment.id];
        switch (howToResolve) {
          case RESOLUTION.DELETE:
            return this.deleteLinkedComments(rubricComment).then(() => {
              return RubricComment.delete(rubricComment.id);
            });
            break;
          case RESOLUTION.UNLINK:
            return this.unlinkLinkedComments(rubricComment).then(() => {
              return RubricComment.delete(rubricComment.id);
            });
            break;
          default:
            return Promise.resolve();
            break;
        }
      } else {
        return RubricComment.delete(rubricComment.id);
      }
    });

    const deleteCategories = deletedCategories.map((rubricCategory) => {
      return RubricCategory.delete(rubricCategory.id);
    });

    const allPromises: Array<Promise<any>> = [...promises, ...deleteComments, ...deleteCategories];
    return Promise.all(allPromises)
      .then(() => {
        // retrieve rubric
        return Assignment.readRubric(this.props.assignment.id).then((newRubric: RubricType) => {
          const commentMap: IRubricCategoryToRubricCommentsMap = this.buildCommentMap(
            newRubric.rubricCategories,
            newRubric.rubricComments,
          );

          this.loadFeedbackScores(newRubric.rubricComments);

          return {
            rubricCategories: newRubric.rubricCategories,
            rubricComments: commentMap,
          };
        });
      })
      .catch((errors) => {
        return {
          rubricCategories: categories,
          rubricComments: comments,
        };
      });
  };

  public deleteLinkedComments = (rubricComment: RubricCommentType) => {
    const promises = rubricComment.comments.map((commentID) => {
      CommentIO.delete(commentID);
    });

    return Promise.all(promises);
  };

  public unlinkLinkedComments = (rubricComment: RubricCommentType) => {
    const promises = rubricComment.comments.map((commentID) => {
      const payload = {
        id: commentID,
        text: rubricComment.text,
        pointDelta: rubricComment.pointDelta,
        rubricComment: null,
      };
      CommentIO.update(payload);
    });

    return Promise.all(promises);
  };

  public buildLinkedList = (
    deletedComments: RubricCommentType[],
    editedComments: RubricCommentType[],
    resolved: { [key: number]: RESOLUTION },
  ) => {
    const deleted = [];
    const edited = [];

    // Look up deleted comments in cached list (source of truth)
    for (const comment of deletedComments) {
      if (!Object.keys(resolved).includes(comment.id.toString())) {
        if (comment.comments.length > 0) {
          deleted.push(comment);
        }
      }
    }

    for (const comment of editedComments) {
      if (!Object.keys(resolved).includes(comment.id.toString())) {
        if (comment.comments.length > 0) {
          edited.push(comment);
        }
      }
    }
    // FIXME: need to include categories here as well

    return {
      edited,
      deleted,
    };
  };

  public onSave = (fnc?: (rubric: any) => void) => {
    const {
      rubricComments,
      rubricCategories,
      unsavedComments,
      deletedComments,
      unsavedCategories,
      deletedCategories,
      resolutions,
      confirmedPropagation,
    } = this.state;

    if (this.state.errorObjects.length > 0) {
      message.error('Fix all errors before saving.');
      return;
    }

    this.setState({ isSaving: true }, () => {
      const conflicts = this.buildLinkedList(deletedComments, unsavedComments, resolutions);
      // Do we need to figure out what to do with applied rubric comments that are being deleted?
      if (conflicts.deleted.length > 0) {
        this.setState({ linkedComments: conflicts.deleted, isSaving: false });
        return;
      }

      // Do we need to confirm the user is ok propagating changes to previously used comments?
      if (conflicts.edited.length > 0 && !confirmedPropagation) {
        this.setState({ showConfirmDialog: true, isSaving: false });
        return;
      }

      this.saveRubric(
        rubricCategories,
        rubricComments,
        unsavedComments,
        deletedComments,
        unsavedCategories,
        deletedCategories,
        resolutions,
      ).then((savedRubric) => {
        message.success('Rubric saved!');
        this.setState({
          rubricCategories: savedRubric.rubricCategories,
          rubricComments: savedRubric.rubricComments,
          savedRubricCategories: _.cloneDeep(savedRubric.rubricCategories),
          savedRubricComments: _.cloneDeep(savedRubric.rubricComments),
          unsavedComments: [],
          deletedComments: [],
          unsavedCategories: [],
          deletedCategories: [],
          hasMoved: false,
          confirmedPropagation: false,
          isSaving: false,
        });
        if (fnc !== undefined) {
          fnc(savedRubric);
        }
      });
    });
  };

  /************************************************************************
  /* Utility functions
  /***********************************************************************/

  public buildCommentMap = (rubricCategories: RubricCategoryType[], rubricComments: RubricCommentType[]) => {
    const commentMap: any = {};
    rubricCategories.forEach((category) => {
      commentMap[category.id] = []; // ensures that categories with no comments will have an entry
    });

    rubricComments.forEach((comment: RubricCommentType) => {
      commentMap[comment.category].push(comment);
    });

    return commentMap;
  };

  public moveCategory = (category: RubricCategoryType, direction: DIRECTION) => {
    const { rubricCategories } = this.state;
    const index = rubricCategories.findIndex((x: RubricCategoryType) => x.id === category.id);

    if (index > -1) {
      let targetIndex = index;

      switch (direction) {
        case DIRECTION.Up: {
          targetIndex = index === 0 ? 0 : index - 1;
          break;
        }
        case DIRECTION.Down: {
          targetIndex = index === rubricCategories.length - 1 ? index : index + 1;
          break;
        }
        default: {
          targetIndex = index;
        }
      }

      const reorderedCategories: RubricCategoryType[] = arrayMove(rubricCategories, index, targetIndex);

      // Eagerly update order
      const toAdd: RubricCategoryType[] = [];
      reorderedCategories.forEach((cat, i) => {
        if (cat.sortKey !== i) {
          cat.sortKey = i;
          toAdd.push(reorderedCategories[i]);
        }
      });

      // don't signal an edit if no category is moved
      if (toAdd.length > 0) {
        this.setState({
          rubricCategories: reorderedCategories,
          unsavedCategories: [...this.state.unsavedCategories, ...toAdd],
          hasMoved: true,
        });
      }
    }
  };

  /************************************************************************
  /* RubricCategory wrappers
  /***********************************************************************/

  public updateRubricCategory = (rubricCategory: RubricCategoryType, hasError?: boolean) => {
    const { rubricCategories } = this.state;
    const index = rubricCategories.findIndex((x: RubricCategoryType) => x.id === rubricCategory.id);

    if (index > -1) {
      const newCategories: RubricCategoryType[] = [...rubricCategories];
      newCategories[index] = rubricCategory;
      this.setState({ rubricCategories: newCategories });
      if (hasError !== undefined) {
        if (hasError) {
          this.setState({
            errorObjects: [...this.state.errorObjects, rubricCategory.id],
          });
        } else {
          this.setState({
            errorObjects: this.state.errorObjects.filter((el) => {
              return el !== rubricCategory.id;
            }),
          });
        }
      }
    }
  };

  public deleteRubricCategory = (rubricCategory: RubricCategoryType) => {
    const { rubricCategories, rubricComments } = this.state;
    const newCategories = [...rubricCategories];
    const index = rubricCategories.findIndex((x: RubricCategoryType) => x.id === rubricCategory.id);

    if (index > -1) {
      newCategories.splice(index, 1);

      this.setState((oldState: IRubricManagerState) => {
        const alwaysDelete = {
          // remove rubric category
          rubricCategories: newCategories,
          // remove object from errorObjects, since the error is no longer relevant
          errorObjects: oldState.errorObjects.filter((el) => {
            return el !== rubricCategory.id;
          }),
          // deleted categories go in deleteCategories
          unsavedCategories: oldState.unsavedCategories.filter((el) => {
            return el.id !== rubricCategory.id;
          }),
          // all of these comments should no longer be saved
          unsavedComments: oldState.unsavedComments.filter((el) => {
            return !rubricComments[rubricCategory.id].some((el2) => {
              return el2.id === el.id;
            });
          }),
        };

        if (rubricCategory.id > 0) {
          // Only try to delete the category if it has been saved
          const toRet = {
            ...alwaysDelete,
            deletedCategories: [...this.state.deletedCategories, rubricCategory],
          };
          return toRet;
        } else {
          return alwaysDelete;
        }
      });
    }
  };

  public addRubricCategory = (name?: string) => {
    const { rubricCategories, rubricComments, newObjectCounter } = this.state;
    const newComments = { ...rubricComments };

    const payload = {
      id: newObjectCounter, // indicates unsaved
      name: name !== undefined ? name : '',
      pointLimit: null,
      assignment: this.props.assignment.id,
      rubricComments: [], // ignored by API,
      sortKey: rubricCategories.length,
      helpText: '',
    };

    newComments[payload.id] = [];

    this.setState({
      rubricCategories: [...rubricCategories, payload],
      rubricComments: newComments,
      newObjectCounter: payload.id < 0 ? newObjectCounter - 1 : newObjectCounter,
      unsavedCategories: [...this.state.unsavedCategories, payload],
    });
  };

  /************************************************************************
  /* RubricComment wrappers
  /***********************************************************************/

  public updateRubricComment = (rubricComment: RubricCommentType) => {
    const { rubricComments } = this.state;
    const commentList = rubricComments[rubricComment.category];
    const index = commentList.findIndex((x: RubricCommentType) => x.id === rubricComment.id);

    if (index > -1) {
      const newComments = { ...rubricComments };
      newComments[rubricComment.category][index] = rubricComment;
      this.setState({ rubricComments: newComments });
    }
  };

  public deleteRubricComment = (rubricComment: RubricCommentType) => {
    const { rubricComments } = this.state;

    const commentList = rubricComments[rubricComment.category];
    const index = commentList.findIndex((x: RubricCommentType) => x.id === rubricComment.id);

    if (index > -1) {
      commentList.splice(index, 1);
      rubricComments[rubricComment.category] = commentList;
      this.setState(
        {
          rubricComments,
          unsavedComments: this.state.unsavedComments.filter((el) => {
            return el.id !== rubricComment.id;
          }),
        },
        () => {
          if (rubricComment.id > 0) {
            this.setState({
              deletedComments: [...this.state.deletedComments, rubricComment],
            });
          }
        },
      );
    }
  };

  public addRubricComment = (category: RubricCategoryType) => {
    const { rubricComments, newObjectCounter } = this.state;
    const newComments = { ...rubricComments };

    const payload = {
      id: newObjectCounter, // indicates unsaved
      text: '',
      pointDelta: 0,
      category: category.id,
      comments: [],
      sortKey: rubricComments[category.id] ? rubricComments[category.id].length : 0,
    };

    newComments[category.id] = [...newComments[category.id], payload];

    this.setState({
      rubricComments: newComments,
      newObjectCounter: newObjectCounter - 1,
      unsavedComments: [...this.state.unsavedComments, payload],
    });
  };

  /************************************************************************
  /* LinkedComment resolution
  /***********************************************************************/

  public onLinkedAlertCancel = () => {
    this.setState({
      linkedComments: [],
    });
  };

  public onLinkedCommentsResolve = (comment: RubricCommentType, resolution: RESOLUTION) => {
    const { resolutions } = this.state;
    const newMap = { ...resolutions };
    newMap[comment.id] = resolution;
    this.setState(
      {
        resolutions: newMap,
      },
      () => {
        // If the user has finished figuring out what to do with deleted linked comments,
        // then trigger a save
        if (this.state.linkedComments.length === 0) {
          this.onSave(undefined);
        }
      },
    );
  };

  public onLinkedConfirmCancel = () => {
    this.setState({
      showConfirmDialog: false,
    });
  };

  public onLinkedConfirmAccept = (fnc?: () => void) => {
    this.setState(
      {
        showConfirmDialog: false,
        confirmedPropagation: true,
      },
      () => {
        this.onSave(fnc);
      },
    );
  };

  /************************************************************************
  /* Miscellaneous UI control
  /***********************************************************************/

  public onBack = () => {
    const changesMade = this.changesMade();

    if (changesMade && !this.state.changeLock) {
      /* eslint-disable */
      const wantsToLeave = confirm(
        'You will lose your unsaved changes if you leave this page without saving. Are you sure you want to leave?',
      );
      /* eslint-enable */
      if (wantsToLeave) {
        this.props.onCancel();
      }
    } else {
      this.props.onCancel();
    }
  };

  public onUnload(event: any) {
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
    // chrome requires return value to be set
    if (this.changesMade()) {
      event.returnValue = 'james was here';
    }
  }

  public toggleLock = () => {
    this.setState({
      changeLock: !this.state.changeLock,
    });
  };

  public changesMade = () => {
    return (
      this.state.unsavedCategories.length > 0 ||
      this.state.unsavedComments.length > 0 ||
      this.state.deletedComments.length > 0 ||
      this.state.deletedCategories.length > 0 ||
      this.state.hasMoved
    );
  };

  public activateCommentExplorer = (rComment: RubricCommentType) => {
    this.setState({ activeComment: rComment });
  };

  public clearCommentExplorer = () => {
    this.setState({ activeComment: undefined });
  };

  public onCommentDragEnd = (result: any) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    if (result.source.index !== result.destination.index) {
      const categoryID = +result.destination.droppableId; // categoryID stored in Droppable
      const reorderedComments: RubricCommentType[] = arrayMove(
        this.state.rubricComments[categoryID],
        result.source.index,
        result.destination.index,
      );

      // Eagerly update order
      const toAdd: RubricCommentType[] = [];
      reorderedComments.forEach((comm, i) => {
        if (comm.sortKey !== i) {
          comm.sortKey = i;

          const firstChange =
            this.state.unsavedComments.find((comment: RubricCommentType) => {
              return comment.id === comm.id;
            }) === undefined;

          if (firstChange) {
            toAdd.push(comm);
          }
        }
      });

      this.setState({
        rubricComments: {
          ...this.state.rubricComments,
          [categoryID]: reorderedComments,
        },
        unsavedComments: [...this.state.unsavedComments, ...toAdd],
        hasMoved: true,
      });
    }
  };

  /************************************************************************
  /* Render
  /***********************************************************************/

  public collectClass = (): IRubricManagerParams => {
    return {
      props: this.props,
      state: this.state,
      helpers: {
        loadAssignmentRubric: this.loadAssignmentRubric,
        loadFeedbackScores: this.loadFeedbackScores,
        resetRubric: this.resetRubric,
        setNewRubric: this.setNewRubric,
        replaceRubric: this.replaceRubric,
        onCategoryEdit: this.onCategoryEdit,
        onCategoryUndo: this.onCategoryUndo,
        onCommentEdit: this.onCommentEdit,
        onCommentUndo: this.onCommentUndo,
        saveRubric: this.saveRubric,
        deleteLinkedComments: this.deleteLinkedComments,
        unlinkLinkedComments: this.unlinkLinkedComments,
        buildLinkedList: this.buildLinkedList,
        onSave: this.onSave,
        buildCommentMap: this.buildCommentMap,
        moveCategory: this.moveCategory,
        updateRubricCategory: this.updateRubricCategory,
        deleteRubricCategory: this.deleteRubricCategory,
        addRubricCategory: this.addRubricCategory,
        updateRubricComment: this.updateRubricComment,
        deleteRubricComment: this.deleteRubricComment,
        addRubricComment: this.addRubricComment,
        onLinkedAlertCancel: this.onLinkedAlertCancel,
        onLinkedCommentsResolve: this.onLinkedCommentsResolve,
        onLinkedConfirmCancel: this.onLinkedConfirmCancel,
        onLinkedConfirmAccept: this.onLinkedConfirmAccept,
        onBack: this.onBack,
        onUnload: this.onUnload,
        toggleLock: this.toggleLock,
        changesMade: this.changesMade,
        activateCommentExplorer: this.activateCommentExplorer,
        clearCommentExplorer: this.clearCommentExplorer,
        onCommentDragEnd: this.onCommentDragEnd,
      },
    };
  };

  public render() {
    return this.props.children(this.collectClass());
  }
}

export default RubricManager;

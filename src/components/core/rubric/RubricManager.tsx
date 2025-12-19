/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* React imports */
import * as React from 'react';

/* antd imports */
import { message, notification } from 'antd';

/* other library imports */
import { arrayMoveImmutable as arrayMove } from 'array-move';
import _ from 'lodash';

import { Assignment, AssignmentType, RubricType } from '../../../infrastructure/assignment';
import { CommentIO } from '../../../infrastructure/comment';
import { RubricCategory, RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../infrastructure/rubricComment';
import { SubmissionInfoType } from '../../../infrastructure/submission';

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
  loadInstanceLists: any;
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
  submissions: SubmissionInfoType[];

  shouldLoadFeedback: boolean;
  shouldLoadInstanceLists: boolean;

  onCancel: () => void;

  reloadInterval?: number;

  setRubric?: (rubric: {
    rubricCategories: RubricCategoryType[];
    rubricComments: IRubricCategoryToRubricCommentsMap;
  }) => void;

  children: (params: IRubricManagerParams) => React.ReactNode;

  defaultRubric?: IRubric;
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
  instanceLists: { [commentID: number]: number[] };
}

/**********************************************************************************************************************/

class RubricManager extends React.PureComponent<IRubricManagerProps, IRubricManagerState> {
  // @ts-expect-error - window.setInterval returns number in browsers
  private interval: number;

  // Memoization cache for collectClass to prevent unnecessary child rerenders
  private _memoizedHelpers: IRubricManagerHelpers | null = null;
  private _memoizedParams: IRubricManagerParams | null = null;
  private _lastPropsRef: IRubricManagerProps | null = null;
  private _lastStateRef: IRubricManagerState | null = null;

  constructor(props: IRubricManagerProps) {
    super(props);

    // If defaultRubric exists, format it correctly
    const defaultRubric =
      props.defaultRubric !== undefined
        ? {
            categories: props.defaultRubric.categories,
            comments: this.buildCommentMap(props.defaultRubric.categories, props.defaultRubric.comments),
          }
        : undefined;

    this.state = {
      loadComplete: props.defaultRubric !== undefined,
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

      rubricCategories: defaultRubric ? defaultRubric.categories : [],
      rubricComments: defaultRubric ? defaultRubric.comments : {},

      savedRubricCategories: defaultRubric ? defaultRubric.categories : [],
      savedRubricComments: defaultRubric ? defaultRubric.comments : {},

      newObjectCounter: -1,
      instanceLists: {},
    };
    this.onUnload = this.onUnload.bind(this);
  }

  public loadAssignmentRubric = (
    assignment: AssignmentType,
    shouldLoadInstances: boolean,
    shouldLoadFeedback: boolean,
  ) => {
    return Assignment.readRubric(assignment.id)
      .then((rubric: RubricType) => {
        const commentMap = this.buildCommentMap(rubric.rubricCategories, rubric.rubricComments);

        const categoriesChanged = !_.isEqual(this.state.savedRubricCategories, rubric.rubricCategories);
        const commentsChanged = !_.isEqual(this.state.savedRubricComments, commentMap);
        const shouldUpdateState = !this.state.loadComplete || categoriesChanged || commentsChanged;

        // calculate diff between old rubric and new rubric, and notify user of new comments
        const oldComments = Object.values(this.state.rubricComments).flat();
        if (oldComments.length > 0) {
          for (const newComment of rubric.rubricComments) {
            const found = oldComments.find((el) => el.id === newComment.id);
            if (!found) {
              const category = rubric.rubricCategories.find((el) => el.id === newComment.category);
              notification.open({
                message: `New rubric comment in ${category ? category.name : ''}`,
                description: newComment.text,
              });
            }
          }
        }

        if (shouldUpdateState && this.props.setRubric !== undefined) {
          this.props.setRubric({
            rubricCategories: rubric.rubricCategories,
            rubricComments: commentMap,
          });
        }

        if (!shouldUpdateState) {
          return;
        }

        const clonedCategories = _.cloneDeep(rubric.rubricCategories);
        const clonedComments = _.cloneDeep(commentMap);

        this.setState(
          {
            rubricCategories: clonedCategories,
            rubricComments: clonedComments,
            savedRubricCategories: clonedCategories,
            savedRubricComments: clonedComments,
            loadComplete: true,
          },
          () => {
            if (shouldLoadFeedback) {
              this.loadFeedbackScores(rubric.rubricComments);
            }

            if (shouldLoadInstances) {
              this.loadInstanceLists(rubric.rubricComments);
            }
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
      if (rComment.id > 0) {
        const score = await RubricComment.readFeedbackScore(rComment.id);

        // feedback scores
        newMap[rComment.id] = {
          negative: score.negative,
          positive: score.positive,
        };
      }
    }

    this.setState({ feedbackScores: newMap });
  };

  public loadInstanceLists = async (rubricComments: RubricCommentType[]) => {
    const newMap: { [id: number]: number[] } = {};
    for (const rComment of rubricComments) {
      if (rComment.id > 0) {
        const list = await RubricComment.readCommmentList(rComment.id);
        newMap[rComment.id] = list.comments;
      } else {
        newMap[rComment.id] = [];
      }
    }

    this.setState({ instanceLists: newMap });
    return await newMap;
  };

  public componentDidMount() {
    window.addEventListener('beforeunload', this.onUnload);

    // Load rubric if not provided via defaultRubric prop
    if (!this.props.defaultRubric) {
      this.loadAssignmentRubric(
        this.props.assignment,
        this.props.shouldLoadInstanceLists,
        this.props.shouldLoadFeedback,
      );
    }

    if (this.props.reloadInterval !== undefined) {
      this.interval = window.setInterval(() => {
        this.loadAssignmentRubric(
          this.props.assignment,
          this.props.shouldLoadInstanceLists,
          this.props.shouldLoadFeedback,
        );
      }, this.props.reloadInterval);
    }
  }

  public componentDidUpdate(prevProps: IRubricManagerProps) {
    if (prevProps.reloadInterval !== this.props.reloadInterval) {
      if (this.props.reloadInterval === undefined) {
        clearInterval(this.interval);
      } else {
        this.interval = window.setInterval(async () => {
          await this.loadAssignmentRubric(
            this.props.assignment,
            this.props.shouldLoadInstanceLists,
            this.props.shouldLoadFeedback,
          );
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
        this.onSave(undefined);
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

  public saveRubric = async (
    categories: RubricCategoryType[],
    comments: IRubricCategoryToRubricCommentsMap,
    unsavedComments: RubricCommentType[],
    deletedComments: RubricCommentType[],
    unsavedCategories: RubricCategoryType[],
    deletedCategories: RubricCategoryType[],
    resolved: { [key: number]: RESOLUTION },
    demoMode?: boolean,
  ) => {
    // Perform all creates and updates
    const promises = demoMode
      ? []
      : categories.map((category) => {
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
              const { rubricComments: _unusedRubricComments, ...payload } = category;
              void _unusedRubricComments;
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
                  const { category: _unusedCategory, ...payload } = comment;
                  void _unusedCategory;
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
    const deleteComments = demoMode
      ? []
      : deletedComments.map((rubricComment) => {
          if (Object.keys(resolved).includes(rubricComment.id.toString())) {
            const howToResolve = resolved[rubricComment.id];
            switch (howToResolve) {
              case RESOLUTION.DELETE:
                return this.deleteLinkedComments(rubricComment).then(() => {
                  return RubricComment.delete(rubricComment);
                });
              case RESOLUTION.UNLINK:
                return this.unlinkLinkedComments(rubricComment).then(() => {
                  return RubricComment.delete(rubricComment);
                });
              default:
                return Promise.resolve();
            }
          } else {
            return RubricComment.delete(rubricComment);
          }
        });

    // Wait until comments are deleted before deleting categories
    await Promise.all(deleteComments);
    const deleteCategories = demoMode
      ? []
      : deletedCategories.map((rubricCategory) => {
          return RubricCategory.delete(rubricCategory);
        });

    const allPromises: Array<Promise<any>> = [...promises, ...deleteCategories];
    await Promise.all(allPromises);

    // retrieve rubric
    try {
      if (demoMode) {
        return {
          rubricCategories: categories,
          rubricComments: comments,
        };
      } else {
        return Assignment.readRubric(this.props.assignment.id).then((newRubric: RubricType) => {
          const commentMap: IRubricCategoryToRubricCommentsMap = this.buildCommentMap(
            newRubric.rubricCategories,
            newRubric.rubricComments,
          );

          if (this.props.shouldLoadInstanceLists) {
            this.loadInstanceLists(newRubric.rubricComments);
          }

          if (this.props.shouldLoadFeedback) {
            this.loadFeedbackScores(newRubric.rubricComments);
          }

          return {
            rubricCategories: newRubric.rubricCategories,
            rubricComments: commentMap,
          };
        });
      }
    } catch (errors) {
      return {
        rubricCategories: categories,
        rubricComments: comments,
      };
    }
  };

  public deleteLinkedComments = async (rubricComment: RubricCommentType) => {
    // If we've already loaded this comment's instances, use the cached value
    let comments = [];
    if (this.state.instanceLists) {
      comments = this.state.instanceLists[rubricComment.id];
    } else {
      comments = (await RubricComment.readCommmentList(rubricComment.id)).comments;
    }

    const promises = comments.map((commentID) => {
      return CommentIO.delete({ id: commentID });
    });

    return Promise.all(promises);
  };

  public unlinkLinkedComments = async (rubricComment: RubricCommentType) => {
    // If we've already loaded this comment's instances, use the cached value
    let comments = [];
    if (this.state.instanceLists) {
      comments = this.state.instanceLists[rubricComment.id];
    } else {
      comments = (await RubricComment.readCommmentList(rubricComment.id)).comments;
    }

    const promises = comments.map((commentID) => {
      const payload = {
        id: commentID,
        text: rubricComment.text,
        pointDelta: rubricComment.pointDelta,
        rubricComment: null,
      };
      return CommentIO.update(payload);
    });

    return Promise.all(promises);
  };

  public buildLinkedList = (
    deletedComments: RubricCommentType[],
    editedComments: RubricCommentType[],
    resolved: { [key: number]: RESOLUTION },
    instanceLists: { [key: number]: number[] },
  ) => {
    const deleted = [];
    const edited = [];

    // Look up deleted comments in cached list (source of truth)
    for (const comment of deletedComments) {
      if (!Object.keys(resolved).includes(comment.id.toString())) {
        if (instanceLists[comment.id] && instanceLists[comment.id].length > 0) {
          deleted.push(comment);
        }
      }
    }

    for (const comment of editedComments) {
      if (!Object.keys(resolved).includes(comment.id.toString())) {
        if (instanceLists[comment.id] && instanceLists[comment.id].length > 0) {
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

  public onSave = async (fnc?: (rubric: any) => void, demoMode?: boolean) => {
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

    this.setState({ isSaving: true }, async () => {
      // Grab latest instances (in case we haven't loaded them yet, or they've changed)
      const newLists = await this.loadInstanceLists(Object.values(rubricComments).flat());
      const conflicts = this.buildLinkedList(deletedComments, unsavedComments, resolutions, newLists);

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
        demoMode,
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
      atMostOnce: false,
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
      explanation: '',
      instructionText: '',
      templateTextOn: false,
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

  public onLinkedCommentsResolve = (comment: RubricCommentType, resolution: RESOLUTION, fnc?: () => void) => {
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
          this.onSave(fnc);
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
        // Protect against accidental (i.e. not caught by typescript)
        // passes of non-function variables into fnc
        if (typeof fnc === 'function') {
          this.onSave(fnc);
        } else {
          this.onSave();
        }
      },
    );
  };

  /************************************************************************
  /* Miscellaneous UI control
  /***********************************************************************/

  public onBack = () => {
    const changesMade = this.changesMade();

    if (changesMade && !this.state.changeLock) {
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

  public onUnload(event: BeforeUnloadEvent) {
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

  public onCommentDragEnd = (result: {
    destination?: { droppableId: string; index: number } | null;
    source: { index: number };
  }) => {
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
    // Memoize to prevent unnecessary child rerenders
    // Only create new object if props or state reference actually changed
    if (this._memoizedParams && this._lastStateRef === this.state && this._lastPropsRef === this.props) {
      return this._memoizedParams;
    }

    // Cache helpers object separately to maintain stable references
    if (!this._memoizedHelpers) {
      this._memoizedHelpers = {
        loadAssignmentRubric: this.loadAssignmentRubric,
        loadFeedbackScores: this.loadFeedbackScores,
        loadInstanceLists: this.loadInstanceLists,
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
      };
    }

    // Create new params object
    const params = {
      props: this.props,
      state: this.state,
      helpers: this._memoizedHelpers,
    };

    // Cache for next render
    this._memoizedParams = params;
    this._lastStateRef = this.state;
    this._lastPropsRef = this.props;

    return params;
  };

  public render() {
    return this.props.children(this.collectClass());
  }
}

// Wrap with React.memo to prevent unnecessary rerenders from parent components
export default React.memo(RubricManager);

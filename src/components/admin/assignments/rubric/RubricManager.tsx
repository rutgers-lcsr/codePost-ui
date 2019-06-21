/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* antd imports */
import { Breadcrumb, Empty, message, Spin } from 'antd';

/* other library imports */
import arrayMove from 'array-move';
import _ from 'lodash';

/* codePost imports */
import RubricCommentExplorer from './RubricCommentExplorer';

import { LinkedCommentsAlert, LinkedCommentsConfirm } from './LinkedCommentsAlert';

import MergeRubricCommentsDialog from './MergeRubricCommentsDialog';
import RubricFileDownload from './RubricFileDownload';
import RubricFileUpload from './RubricFileUpload';

import { Assignment, AssignmentType, RubricType } from '../../../../infrastructure/assignment';
import { CommentIO } from '../../../../infrastructure/comment';
import { RubricCategory, RubricCategoryType } from '../../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../../infrastructure/rubricComment';
import { SubmissionType } from '../../../../infrastructure/submission';

import { DIRECTION, IRubricCategoryToRubricCommentsMap } from '../../../../types/common';

import CPButton from '../../../../components/core/CPButton';
import CPAdminRubric from './CPAdminRubric';
import CPRubricCategory from './CPRubricCategory';

/**********************************************************************************************************************/

export enum RESOLUTION {
  DELETE,
  UNLINK,
}

export interface IProps {
  /* assignment data */
  assignment: AssignmentType;
  submissions: SubmissionType[];

  onCancel: () => void;
}

export interface IRubric {
  categories: RubricCategoryType[];
  comments: RubricCommentType[];
}

export interface IState {
  // status cache
  loadComplete: boolean;
  changeLock: boolean;
  isSaving: boolean;

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
}

/**********************************************************************************************************************/

class RubricManager extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      loadComplete: false,
      changeLock: true,
      isSaving: false,

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
        this.setState({
          rubricCategories: rubric.rubricCategories,
          rubricComments: commentMap,
          savedRubricCategories: _.cloneDeep(rubric.rubricCategories),
          savedRubricComments: _.cloneDeep(commentMap),
          loadComplete: true,
        });
      })
      .catch((errors) => {
        return Promise.reject(errors);
      });
  };

  public componentDidMount() {
    window.addEventListener('beforeunload', this.onUnload);
  }

  public componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onUnload);
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
    this.setState({ unsavedCategories: [...this.state.unsavedCategories, category] });
  };

  public onCommentEdit = (comment: RubricCommentType) => {
    if (
      this.state.unsavedComments.find((unsavedComment: RubricCommentType) => {
        return comment.id === unsavedComment.id;
      }) === undefined
    ) {
      this.setState({ unsavedComments: [...this.state.unsavedComments, comment] });
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
          categoryPromise = RubricCategory.update(category);
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
              return RubricComment.update(comment);
            } else {
              return Promise.resolve();
            }
          }
        });

        return Promise.all([...commentPromises, categoryPromise]);
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
          return {
            newCategories: newRubric.rubricCategories,
            newComments: commentMap,
          };
        });
      })
      .catch((errors) => {
        return {
          newCategories: categories,
          newComments: comments,
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

  public onSave = (fnc?: () => void) => {
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
          rubricCategories: savedRubric.newCategories,
          rubricComments: savedRubric.newComments,
          savedRubricCategories: _.cloneDeep(savedRubric.newCategories),
          savedRubricComments: _.cloneDeep(savedRubric.newComments),
          unsavedComments: [],
          deletedComments: [],
          unsavedCategories: [],
          deletedCategories: [],
          hasMoved: false,
          confirmedPropagation: false,
          isSaving: false,
        });
      });
    });
  };

  /************************************************************************
  /* Utility functions
  /***********************************************************************/

  public buildCommentMap = (rubricCategories: RubricCategoryType[], rubricComments: RubricCommentType[]) => {
    const commentMap = {};
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

  public updateRubricCategory = (rubricCategory: RubricCategoryType) => {
    const { rubricCategories } = this.state;
    const index = rubricCategories.findIndex((x: RubricCategoryType) => x.id === rubricCategory.id);

    if (index > -1) {
      const newCategories: RubricCategoryType[] = [...rubricCategories];
      newCategories[index] = rubricCategory;
      this.setState({ rubricCategories: newCategories });
    }
  };

  public deleteRubricCategory = (rubricCategory: RubricCategoryType) => {
    const { rubricCategories, rubricComments } = this.state;
    const newCategories = [...rubricCategories];

    const index = rubricCategories.findIndex((x: RubricCategoryType) => x.id === rubricCategory.id);

    if (index > -1) {
      newCategories.splice(index, 1);
      this.setState({
        rubricCategories: newCategories,
      });

      this.setState(
        {
          unsavedCategories: this.state.unsavedCategories.filter((el) => {
            return el.id !== rubricCategory.id;
          }),
          unsavedComments: this.state.unsavedComments.filter((el) => {
            return rubricComments[rubricCategory.id].some((el2) => {
              return el2.id === el.id;
            });
          }),
        },
        () => {
          if (rubricCategory.id > 0) {
            this.setState({
              deletedCategories: [...this.state.deletedCategories, rubricCategory],
              unsavedComments: [...this.state.deletedComments, ...rubricComments[rubricCategory.id]],
            });
          }
        },
      );
    }
  };

  public addRubricCategory = () => {
    const { rubricCategories, rubricComments, newObjectCounter } = this.state;
    const newComments = { ...rubricComments };

    const payload = {
      id: newObjectCounter, // indicates unsaved
      name: '',
      pointLimit: null,
      assignment: this.props.assignment.id,
      rubricComments: [], // ignored by API,
      sortKey: rubricCategories.length,
      helpText: '',
    };

    console.log(payload);

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

  public onLinkedConfirmAccept = () => {
    this.setState(
      {
        showConfirmDialog: false,
        confirmedPropagation: true,
      },
      () => {
        this.onSave(undefined);
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
        rubricComments: { ...this.state.rubricComments, [categoryID]: reorderedComments },
        unsavedComments: [...this.state.unsavedComments, ...toAdd],
        hasMoved: true,
      });
    }
  };

  /************************************************************************
  /* Render
  /***********************************************************************/

  public render() {
    const { rubricCategories, rubricComments, loadComplete } = this.state;

    if (loadComplete) {
      const changesMade = this.changesMade();

      const categoryTables = rubricCategories
        .sort(RubricCategory.compare)
        .map((cat: RubricCategoryType, catIndex: number) => {
          const savedCategory = this.state.savedRubricCategories.find((el) => {
            return el.id === cat.id;
          });

          return (
            <CPRubricCategory
              key={cat.id}
              rubricCategory={cat}
              savedRubricCategory={savedCategory}
              rubricComments={cat.id in rubricComments ? rubricComments[cat.id].sort(RubricComment.compare) : []}
              savedRubricComments={savedCategory ? this.state.savedRubricComments[savedCategory.id] : undefined}
              updateCategory={this.updateRubricCategory}
              deleteCategory={this.deleteRubricCategory}
              addComment={this.addRubricComment}
              updateComment={this.updateRubricComment}
              deleteComment={this.deleteRubricComment}
              onEdit={this.onCategoryEdit}
              onUndo={this.onCategoryUndo}
              onCommentEdit={this.onCommentEdit}
              onCommentUndo={this.onCommentUndo}
              activateCommentExplorer={this.activateCommentExplorer}
              onCommentDragEnd={this.onCommentDragEnd}
              moveCategory={this.moveCategory}
              index={catIndex}
              numCategories={this.state.savedRubricCategories.length}
            />
          );
        });

      const actions = [
        <RubricFileUpload
          key="2"
          assignment={this.props.assignment}
          rubricComments={this.state.rubricComments}
          rubricCategories={this.state.rubricCategories}
          onRubricUpload={this.replaceRubric}
          isDisabled={false}
        />,
        <RubricFileDownload
          key="download"
          assignment={this.props.assignment}
          rubricComments={this.state.rubricComments}
          rubricCategories={this.state.rubricCategories}
          isDisabled={false}
        />,
        <MergeRubricCommentsDialog
          key="3"
          isDisabled={false}
          rubricCategories={this.state.rubricCategories}
          rubricComments={this.state.rubricComments}
          assignment={this.props.assignment}
          reloadRubric={this.loadAssignmentRubric}
        />,
        <CPButton key="0" onClick={this.resetRubric} cpType="secondary" disabled={!changesMade} icon="undo">
          Undo changes
        </CPButton>,
        <CPButton
          key="1"
          onClick={this.onSave.bind(this, undefined)}
          disabled={!changesMade}
          cpType="primary"
          icon="save"
          loading={this.state.isSaving}
        >
          Save
        </CPButton>,
      ];

      const content = (
        <div>
          {categoryTables}
          <CPButton cpType="primary" onClick={this.addRubricCategory.bind(this, undefined)}>
            Add New Category
          </CPButton>
          {this.state.activeComment ? (
            <RubricCommentExplorer
              rubricComment={this.state.activeComment}
              isVisible={typeof this.state.activeComment !== 'undefined'}
              closeCommentExplorer={this.clearCommentExplorer}
              submissions={this.props.submissions}
            />
          ) : null}
          <LinkedCommentsAlert
            rubricComment={this.state.linkedComments[0]}
            onDelete={this.onLinkedCommentsResolve.bind(this, this.state.linkedComments[0], RESOLUTION.DELETE)}
            onUnLink={this.onLinkedCommentsResolve.bind(this, this.state.linkedComments[0], RESOLUTION.UNLINK)}
            onCancel={this.onLinkedAlertCancel}
            isVisible={this.state.linkedComments.length > 0}
          />
          <LinkedCommentsConfirm
            onAccept={this.onLinkedConfirmAccept}
            onCancel={this.onLinkedConfirmCancel}
            isVisible={this.state.showConfirmDialog}
            unsavedComments={this.state.unsavedComments}
            savedRubricComments={this.state.rubricComments}
          />
        </div>
      );

      return (
        <CPAdminRubric
          actions={actions}
          title="Rubric"
          content={content}
          goBack={null}
          isEmpty={this.state.rubricCategories.length === 0}
          emptyNode={
            <Empty
              imageStyle={{
                height: 60,
              }}
              description={<span>No rubric yet</span>}
            >
              <CPButton cpType="primary" onClick={this.addRubricCategory}>
                Create a category
              </CPButton>
            </Empty>
          }
          breadcrumbs={
            <Breadcrumb>
              <Breadcrumb.Item onClick={this.props.onCancel}>
                <a>Assignments</a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>{this.props.assignment.name}</Breadcrumb.Item>
              <Breadcrumb.Item>Edit rubric</Breadcrumb.Item>
            </Breadcrumb>
          }
        />
      );
    } else {
      return <Spin />;
    }
  }
}

export default RubricManager;

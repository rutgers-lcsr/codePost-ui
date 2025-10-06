/***********************************************************************************************/
/* Imports
/*******************************************************************************************************/

/* react imports */

/* ant imports */

/* other library imports */
import _ from 'lodash';

// import { DragDropContext, DragSource, DropTarget } from 'react-dnd';

/* codePost imports */
import withWindowWatcher, { IWithWindowWatcherProps } from '../withWindowWatcher';

import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { DIRECTION } from '../../../types/common';
import { STATUS, statusChange } from '../../admin/assignments/rubric/RubricUtils';

import { InputRef } from 'antd/lib/input';
import { Component, createRef } from 'react';
import { IFeedbackScore } from './RubricManager';

/************************************************************************/

export interface IRubricCategoryManagerParams {
  propz: IRubricCategoryManagerProps;
  statez: IRubricCategoryManagerState;
  helperz: IRubricCategoryManagerHelpers;
}

export interface IRubricCategoryManagerState {
  /* local rubric category data */
  name: string;
  pointLimit: number | null;
  helpText: string;
  atMostOnce: boolean;
  status: STATUS;

  /* local rubric comment data */
  rubricComments: { [id: number]: RubricCommentType };
  rubricCommentStatus: { [id: number]: STATUS };

  /* validation status */
  hasError: boolean;
  errorMessage: string;
  hasCommentError: boolean;
  commentErrorMessage: string;
}

export interface IRubricCategoryManagerProps extends IWithWindowWatcherProps {
  // data
  rubricCategory: RubricCategoryType;
  rubricComments: RubricCommentType[];
  index: number;
  numCategories: number;
  instanceLists: { [id: number]: number[] };

  // saved data
  savedRubricCategory?: RubricCategoryType;
  savedRubricComments?: RubricCommentType[];

  // RubricCategory functions
  updateCategory: (rCategory: RubricCategoryType, hasError?: boolean) => void;
  deleteCategory: (rCategory: RubricCategoryType) => void;
  moveCategory: (rCategory: RubricCategoryType, direction: DIRECTION) => void;

  // RubricComment functions
  addComment: (rCategory: RubricCategoryType) => void;
  deleteComment: (rComment: RubricCommentType) => void;
  updateComment: (rComment: RubricCommentType) => void;
  activateCommentExplorer: (rComment: RubricCommentType) => void;

  // misc
  onEdit: (obj: RubricCategoryType) => void;
  onUndo: (obj: RubricCategoryType) => void;
  onCommentEdit: (obj: RubricCommentType) => void;
  onCommentUndo: (obj: RubricCommentType) => void;
  onCommentDragEnd: any;
  otherCategories: RubricCategoryType[];
  feedbackScores?: { [commentID: number]: IFeedbackScore };
  commentFeedbackOn: boolean;
  showPointLimits: boolean;
  showHelpText: boolean;
  showExplanations: boolean;
  showInstructions: boolean;
  showAtMostOnce: boolean;

  children: (params: IRubricCategoryManagerParams) => React.ReactNode;
}

export interface IRubricCategoryManagerHelpers {
  buildLocalRubricCommentsStructure: any;
  initializeRubricCommentStatus: any;
  updateCategoryStatus: any;
  setValue: any;
  validateCategory: any;
  saveCategory: any;
  changeName: any;
  changeHelpText: any;
  addComment: any;
  deleteComment: any;
  validateComments: any;
  saveComment: any;
  updateCommentStatus: any;
  updateRubricComment: any;
  nameInput: any;
}
class RubricCategoryManager extends Component<IRubricCategoryManagerProps, IRubricCategoryManagerState> {
  /****************************************************************************
   Lifecycle methods
  *****************************************************************************/
  private nameInput = createRef<InputRef>();

  public constructor(props: IRubricCategoryManagerProps) {
    super(props);
    this.state = {
      name: props.rubricCategory.name,
      pointLimit: props.rubricCategory.pointLimit,
      helpText: props.rubricCategory.helpText ? props.rubricCategory.helpText : '',
      atMostOnce: props.rubricCategory.atMostOnce,
      status: typeof props.savedRubricCategory === 'undefined' ? STATUS.UNSAVED : STATUS.NONE,
      rubricComments: this.buildLocalRubricCommentsStructure(props.rubricComments),
      rubricCommentStatus: this.initializeRubricCommentStatus(props.rubricComments),
      hasError: false,
      errorMessage: '',
      hasCommentError: false,
      commentErrorMessage: '',
    };
  }

  public componentDidMount() {
    // If new category is being mounted for the first time, focus on the name
    // Ant handles refs strangely (there are many github issues on this), and upon initial mount
    // the element is not focusable, but is focusable shortly after
    if (this.props.rubricCategory.id < 0) {
      setTimeout(() => {
        const node = this.nameInput.current;
        if (node) {
          try {
            node.focus();
          } catch {
            return;
          }
        }
      }, 100);
    }
  }

  public componentDidUpdate(prevProps: IRubricCategoryManagerProps) {
    /* Update status when rubric is saved */
    if (this.props.savedRubricCategory !== prevProps.savedRubricCategory) {
      this.updateCategoryStatus();
    }
    if (this.props.savedRubricComments !== prevProps.savedRubricComments) {
      for (const rubricComment of Object.values(this.state.rubricComments)) {
        this.updateCommentStatus(rubricComment);
      }
    }

    /* Undo local changes to rubricCategory */
    if (this.props.rubricCategory !== prevProps.rubricCategory) {
      this.setState(
        {
          name: this.props.rubricCategory.name,
          pointLimit: this.props.rubricCategory.pointLimit,
          helpText: this.props.rubricCategory.helpText ? this.props.rubricCategory.helpText : '',
        },
        () => {
          this.updateCategoryStatus();
        },
      );
    }

    /* Undo local changes to rubricComments */
    if (this.props.rubricComments !== prevProps.rubricComments) {
      const newMap = this.state.rubricComments;
      for (const rubricComment of this.props.rubricComments) {
        const match = prevProps.rubricComments.find((el) => {
          return el.id === rubricComment.id;
        });
        if (match) {
          if (match !== rubricComment) {
            newMap[rubricComment.id] = _.cloneDeep(rubricComment);
          }
        } else {
          newMap[rubricComment.id] = _.cloneDeep(rubricComment);
        }
      }
      this.setState({
        rubricComments: newMap,
        rubricCommentStatus: this.initializeRubricCommentStatus(this.props.rubricComments),
      });
    }
  }

  public buildLocalRubricCommentsStructure = (rubricComments: RubricCommentType[]) => {
    const toRet: any = {};
    for (const rubricComment of rubricComments) {
      toRet[rubricComment.id] = _.cloneDeep(rubricComment);
    }
    return toRet;
  };

  public initializeRubricCommentStatus = (rubricComments: RubricCommentType[]) => {
    const toRet: any = {};
    for (const rubricComment of rubricComments) {
      toRet[rubricComment.id] = STATUS.NONE;
    }
    return toRet;
  };

  /****************************************************************************
   Category-level functions
  *****************************************************************************/

  public updateCategoryStatus = () => {
    const { savedRubricCategory } = this.props;
    const { name, pointLimit, helpText, status, atMostOnce } = this.state;
    if (savedRubricCategory) {
      const newStatus = statusChange(
        [
          savedRubricCategory.name,
          savedRubricCategory.pointLimit,
          savedRubricCategory.helpText,
          savedRubricCategory.atMostOnce,
        ],
        [name, pointLimit, helpText, atMostOnce],
        status,
      );
      if (newStatus !== status) {
        this.setState({ status: newStatus }, () => {
          switch (newStatus) {
            case STATUS.UNSAVED:
              this.props.onEdit(this.props.rubricCategory);
              break;
            case STATUS.NONE:
              this.props.onUndo(this.props.rubricCategory);
              break;
          }
        });
      }
    }
  };

  public setValue = (label: string, value: any) => {
    this.setState(
      (prevstate) => {
        const newState: any = { ...prevstate };
        let newVal = value;
        if (label === 'pointLimit') {
          // Note: isNaN('') returns false, isNaN(null) returns false
          if (value === '' || value === null || isNaN(value)) {
            newVal = null;
          } else {
            newVal = parseFloat(value);
          }
        }

        newState[label] = newVal;
        return newState;
      },
      () => {
        this.updateCategoryStatus();
        if (label === 'pointLimit' || label === 'atMostOnce') {
          this.saveCategory();
        }
      },
    );
  };

  public validateCategory = (name: string, helpText: string, pointLimit: number | null) => {
    if (name.length === 0) {
      return {
        valid: false,
        message: 'Category name cannot be blank.',
      };
    }

    if (name.length < 4) {
      return {
        valid: false,
        message: 'Category name must be at least 4 characters',
      };
    }

    if (name.length > 72) {
      return {
        valid: false,
        message: 'Category name cannot exceed 72 characters',
      };
    }

    if (helpText.length > 500) {
      return {
        valid: false,
        message: 'Helptext cannot exceed 500 characters',
      };
    }

    if (pointLimit !== null && !Number.isInteger(pointLimit)) {
      return {
        valid: false,
        message: 'pointLimit must be a valid integer.',
      };
    }

    return {
      valid: true,
      message: '',
    };
  };

  public saveCategory = () => {
    const { rubricCategory } = this.props;
    const { name, pointLimit, helpText, atMostOnce } = this.state;

    if (
      rubricCategory.id < 0 ||
      name !== rubricCategory.name ||
      pointLimit !== rubricCategory.pointLimit ||
      helpText !== rubricCategory.helpText ||
      atMostOnce !== rubricCategory.atMostOnce
    ) {
      const { valid, message } = this.validateCategory(name, helpText, pointLimit);
      const payload: RubricCategoryType = Object.assign({}, this.props.rubricCategory);
      payload.name = this.state.name;
      payload.pointLimit = this.state.pointLimit;
      payload.helpText = this.state.helpText;
      payload.atMostOnce = this.state.atMostOnce;

      // have to take into account the possibility of a comment error here
      this.props.updateCategory(payload, !valid || this.state.hasCommentError);
      this.setState({ hasError: !valid, errorMessage: message });
    } else {
      this.setState({ hasError: false });
    }
  };

  public changeName = (event: React.ChangeEvent<HTMLInputElement> | string) => {
    if (typeof event === 'string') {
      this.setValue('name', event);
    } else {
      this.setValue('name', event.target.value);
    }
  };

  public changeHelpText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setValue('helpText', event.target.value);
  };

  /****************************************************************************
   Comment-level functions
  *****************************************************************************/

  public addComment = () => {
    this.props.addComment(this.props.rubricCategory);
  };

  public deleteComment = (rubricComment: RubricCommentType) => {
    this.props.deleteComment(rubricComment);
  };

  public validateComments = (_newComment: RubricCommentType) => {
    // no tests yet!

    return {
      valid: true,
      message: '',
    };
  };

  public saveComment = (rubricCommentID: number) => {
    const { rubricComments } = this.props;
    const rubricComment = this.state.rubricComments[rubricCommentID];

    const match = rubricComments.find((el) => {
      return el.id === rubricComment.id;
    });

    if (match) {
      let pointDelta = parseFloat(rubricComment.pointDelta.toFixed(1));
      const text = rubricComment.text;

      if (isNaN(rubricComment.pointDelta) || rubricComment.pointDelta === null) {
        this.updateRubricComment(rubricComment.id, 'pointDelta', 0);
        pointDelta = 0;
      }

      const { valid, message } = this.validateComments(rubricComment);
      const payload: RubricCommentType = { ...rubricComment };
      this.props.updateComment(payload);

      if (
        text !== match.text ||
        pointDelta !== match.pointDelta ||
        rubricComment.explanation !== match.explanation ||
        rubricComment.instructionText !== match.instructionText ||
        rubricComment.templateTextOn !== match.templateTextOn
      ) {
        const hasCurrentError = this.state.hasError || this.state.hasCommentError;
        if (hasCurrentError && !this.state.hasError && valid) {
          // moving from error state to safe state
          this.props.updateCategory(this.props.rubricCategory, false);
        } else if (!hasCurrentError && !valid) {
          // moving from safe state to error state
          this.props.updateCategory(this.props.rubricCategory, true);
        }
      }

      // we need to set state outside of the preceding if block
      // this handles the situation in which moving from an edited state
      // to a non-edited state clears or introduces an error
      this.setState({ hasCommentError: !valid, commentErrorMessage: message });
    }
  };

  public updateCommentStatus = (rubricComment: RubricCommentType) => {
    const { savedRubricComments } = this.props;

    if (savedRubricComments) {
      const savedRubricComment = savedRubricComments.find((el) => {
        return el.id === rubricComment.id;
      });
      const localRubricComment = this.state.rubricComments[rubricComment.id];
      if (savedRubricComment) {
        const status = this.state.rubricCommentStatus[rubricComment.id];
        const newStatus = statusChange(
          [
            savedRubricComment.text,
            savedRubricComment.pointDelta,
            savedRubricComment.explanation,
            savedRubricComment.instructionText,
            savedRubricComment.templateTextOn,
          ],
          [
            localRubricComment.text,
            localRubricComment.pointDelta,
            localRubricComment.explanation,
            localRubricComment.instructionText,
            localRubricComment.templateTextOn,
          ],
          status,
        );
        if (newStatus !== status) {
          const newStatusMap = { ...this.state.rubricCommentStatus };
          newStatusMap[rubricComment.id] = newStatus;
          this.setState({ rubricCommentStatus: newStatusMap }, () => {
            switch (newStatus) {
              case STATUS.UNSAVED:
                this.props.onCommentEdit(rubricComment);
                break;
              case STATUS.NONE:
                this.props.onCommentUndo(rubricComment);
                break;
            }
          });
        }
      }
    }
  };

  public updateRubricComment = (rubricCommentID: number, key: string, event: any) => {
    const rubricComments = { ...this.state.rubricComments };
    switch (typeof event) {
      case 'undefined':
      case 'number':
        rubricComments[rubricCommentID] = {
          ...rubricComments[rubricCommentID],
          [key]: event,
        };
        break;
      case 'boolean':
      case 'string':
        if (key !== 'pointDelta') {
          rubricComments[rubricCommentID] = {
            ...rubricComments[rubricCommentID],
            [key]: event,
          };
        }
        break;
      case 'object':
        rubricComments[rubricCommentID] = {
          ...rubricComments[rubricCommentID],
          [key]: event === null ? 0 : event.target.value,
        };
        break;
    }

    this.setState({ rubricComments }, () => {
      this.updateCommentStatus(rubricComments[rubricCommentID]);
      if (key !== 'text') {
        this.saveComment(rubricCommentID);
      }
    });
  };

  public collectClass = (): IRubricCategoryManagerParams => {
    return {
      propz: this.props,
      statez: this.state,
      helperz: {
        buildLocalRubricCommentsStructure: this.buildLocalRubricCommentsStructure,
        initializeRubricCommentStatus: this.initializeRubricCommentStatus,
        updateCategoryStatus: this.updateCategoryStatus,
        setValue: this.setValue,
        validateCategory: this.validateCategory,
        saveCategory: this.saveCategory,
        changeName: this.changeName,
        changeHelpText: this.changeHelpText,
        addComment: this.addComment,
        deleteComment: this.deleteComment,
        validateComments: this.validateComments,
        saveComment: this.saveComment,
        updateCommentStatus: this.updateCommentStatus,
        updateRubricComment: this.updateRubricComment,
        nameInput: this.nameInput,
      },
    };
  };

  public render() {
    return this.props.children(this.collectClass());
  }
}

/*****************************************************************************************/

// let draggingIndex = -1;

// interface IRowProps {
//   index: number;
//   style: any;
//   className: string;
//   isOver: boolean;
//   connectDragSource: any;
//   connectDropTarget: any;
//   moveRow: any;
// }

// class BodyRow extends React.Component<IRowProps, {}> {
//   render() {
//     const { isOver, connectDragSource, connectDropTarget, moveRow, ...restProps } = this.props;
//     const style = { ...restProps.style, cursor: 'move' };

//     let className = restProps.className;
//     if (isOver) {
//       if (restProps.index > draggingIndex) {
//         className += ' drop-over-downward';
//       }
//       if (restProps.index < draggingIndex) {
//         className += ' drop-over-upward';
//       }
//     }

//     return connectDragSource(connectDropTarget(<tr {...restProps} className={className} style={style} />));
//   }
// }

// const rowSource = {
//   beginDrag(props: IRowProps) {
//     draggingIndex = props.index;
//     return {
//       index: props.index,
//     };
//   },
// };

// const rowTarget = {
//   drop(props: IRowProps, monitor: any) {
//     const dragIndex = monitor.getItem().index;
//     const hoverIndex = props.index;

//     // Don't replace items with themselves
//     if (dragIndex === hoverIndex) {
//       return;
//     }

//     // Time to actually perform the action
//     props.moveRow(dragIndex, hoverIndex);

//     // Note: we're mutating the monitor item here!
//     // Generally it's better to avoid mutations,
//     // but it's good here for the sake of performance
//     // to avoid expensive index searches.
//     monitor.getItem().index = hoverIndex;
//   },
// };

// const DragableBodyRow = DropTarget('row', rowTarget, (connect: any, monitor: any) => ({
//   connectDropTarget: connect.dropTarget(),
//   isOver: monitor.isOver(),
// }))(
//   DragSource('row', rowSource, (connect: any) => ({
//     connectDragSource: connect.dragSource(),
//   }))(BodyRow),
// );

export default withWindowWatcher(RubricCategoryManager);

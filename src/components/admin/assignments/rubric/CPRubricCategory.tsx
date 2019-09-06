/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Badge, Button, Icon, Input, InputNumber, Popconfirm, Spin, Table, Tag } from 'antd';
const { TextArea } = Input;

/* other library imports */
import _ from 'lodash';

// import { DragDropContext, DragSource, DropTarget } from 'react-dnd';

/* codePost imports */
import CPButton from '../../../core/CPButton';
import CPFlex from '../../../core/CPFlex';
import CPTooltip from '../../../core/CPTooltip';
import { tooltips } from '../../../core/tooltips';
import withWindowWatcher, { IWithWindowWatcherProps } from '../../../core/withWindowWatcher';

import { RubricCategoryType } from '../../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../../infrastructure/rubricComment';

import { STATUS, statusChange } from './RubricUtils';

import { DIRECTION } from '../../../../types/common';

import { IFeedbackScore } from './RubricManager';

import CPPointInput from '../../../core/CPPointInput';

/**********************************************************************************************************************/

interface ICPRubricCategoryProps extends IWithWindowWatcherProps {
  // data
  rubricCategory: RubricCategoryType;
  rubricComments: RubricCommentType[];
  index: number;
  numCategories: number;

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
}

interface IState {
  /* local rubric category data */
  name: string;
  pointLimit: number | null;
  helpText: string;
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

const aligner: 'left' | 'center' | 'right' = 'center';
const commentTableColumns = [
  {
    title: 'Comment Text',
    dataIndex: 'text',
    key: 'text',
  },
  {
    title: (
      <div>
        Deduction
        <CPTooltip
          title={tooltips.admin.rubric.deduction}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 5 }}
        />
      </div>
    ),
    dataIndex: 'deduction',
    key: 'deduction',
    align: aligner,
  },
  {
    title: (
      <div>
        Instances
        <CPTooltip
          title={tooltips.admin.rubric.instances}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 5 }}
        />
      </div>
    ),
    key: 'linked',
    dataIndex: 'linked',
    align: aligner,
  },
  {
    title: (
      <div>
        Feedback
        <CPTooltip
          title={'Comprehension scores from students.'}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 5 }}
        />
      </div>
    ),
    key: 'feedback',
    dataIndex: 'feedback',
    align: aligner,
  },
  {
    title: '',
    dataIndex: 'delete',
    key: 'delete',
    align: aligner,
  },
];

class CPRubricCategory extends React.Component<ICPRubricCategoryProps, IState> {
  /****************************************************************************
   Lifecycle methods
  *****************************************************************************/
  private nameInput = React.createRef<Input>();

  public constructor(props: ICPRubricCategoryProps) {
    super(props);
    this.state = {
      name: props.rubricCategory.name,
      pointLimit: props.rubricCategory.pointLimit,
      helpText: props.rubricCategory.helpText,
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

  public componentDidUpdate(prevProps: ICPRubricCategoryProps) {
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
          helpText: this.props.rubricCategory.helpText,
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
      this.setState({ rubricComments: newMap });
    }
  }

  public buildLocalRubricCommentsStructure = (rubricComments: RubricCommentType[]) => {
    const toRet = {};
    for (const rubricComment of rubricComments) {
      toRet[rubricComment.id] = _.cloneDeep(rubricComment);
    }
    return toRet;
  };

  public initializeRubricCommentStatus = (rubricComments: RubricCommentType[]) => {
    const toRet = {};
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
    const { name, pointLimit, helpText, status } = this.state;
    if (savedRubricCategory) {
      const newStatus = statusChange(
        [savedRubricCategory.name, savedRubricCategory.pointLimit, savedRubricCategory.helpText],
        [name, pointLimit, helpText],
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
        const newState = { ...prevstate };
        let newVal = value;
        if (label === 'pointLimit') {
          if (value !== null) {
            newVal = parseFloat(value);
          } else {
            newVal = null;
          }
        }

        newState[label] = newVal;
        return newState;
      },
      () => {
        this.updateCategoryStatus();
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

    if (pointLimit !== null && (!Number.isInteger(pointLimit) || pointLimit < 0)) {
      return {
        valid: false,
        message: 'pointLimit must be a positive integer.',
      };
    }

    return {
      valid: true,
      message: '',
    };
  };

  public saveCategory = () => {
    const { rubricCategory } = this.props;
    const { name, pointLimit, helpText } = this.state;

    if (
      rubricCategory.id < 0 ||
      name !== rubricCategory.name ||
      pointLimit !== rubricCategory.pointLimit ||
      helpText !== rubricCategory.helpText
    ) {
      const { valid, message } = this.validateCategory(name, helpText, pointLimit);
      const payload: RubricCategoryType = Object.assign({}, this.props.rubricCategory);
      payload.name = this.state.name;
      payload.pointLimit = this.state.pointLimit;
      payload.helpText = this.state.helpText;

      // have to take into account the possibility of a comment error here
      this.props.updateCategory(payload, !valid || this.state.hasCommentError);
      this.setState({ hasError: !valid, errorMessage: message });
    } else {
      this.setState({ hasError: false });
    }
  };

  public changeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setValue('name', event.target.value);
  };

  public changeHelpText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setValue('helpText', event.target.value);
  };

  /****************************************************************************
   Comment-level functions
  *****************************************************************************/

  public addComment = (event: any) => {
    this.props.addComment(this.props.rubricCategory);
  };

  public deleteComment = (rubricComment: RubricCommentType, event: any) => {
    this.props.deleteComment(rubricComment);
  };

  public validateComments = (newComment: RubricCommentType) => {
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

      if (text !== match.text || pointDelta !== match.pointDelta) {
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
          [savedRubricComment.text, savedRubricComment.pointDelta],
          [localRubricComment.text, localRubricComment.pointDelta],
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
      case 'number':
        rubricComments[rubricCommentID] = { ...rubricComments[rubricCommentID], [key]: event };
        break;
      case 'string':
        if (key !== 'pointDelta') {
          rubricComments[rubricCommentID] = { ...rubricComments[rubricCommentID], [key]: event };
        }
        break;
      case 'object':
        rubricComments[rubricCommentID] = { ...rubricComments[rubricCommentID], [key]: event.target.value };
        break;
    }

    this.setState({ rubricComments }, () => {
      this.updateCommentStatus(rubricComments[rubricCommentID]);
    });
  };

  public buildCommentTableData = (
    rubricComments: RubricCommentType[],
    commentMap: { [id: number]: RubricCommentType },
  ) => {
    return rubricComments.map((rubricComment) => {
      const thisComment = commentMap[rubricComment.id];
      let thisFeedback;
      if (thisComment && this.props.feedbackScores && thisComment.id in this.props.feedbackScores) {
        thisFeedback = this.props.feedbackScores[thisComment.id];
      }

      if (thisComment) {
        return {
          key: thisComment.id,
          text: (
            <TextArea
              autosize
              value={thisComment.text}
              onChange={this.updateRubricComment.bind(this, thisComment.id, 'text')}
              onBlur={this.saveComment.bind(this, thisComment.id)}
            />
          ),
          deduction: (
            <CPPointInput
              value={-thisComment.pointDelta}
              size="small"
              onChange={this.updateRubricComment.bind(this, thisComment.id, 'pointDelta')}
              disabled={false}
              onBlur={this.saveComment.bind(this, thisComment.id)}
            />
          ),
          linked: (
            <span onClick={this.props.activateCommentExplorer.bind(this, thisComment)}>
              <Badge
                count={thisComment.comments.length}
                className="badge badge--standard"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}
              />
            </span>
          ),
          feedback: !this.props.commentFeedbackOn ? (
            <Tag color="volcano" key="disabled">
              DISABLED
            </Tag>
          ) : thisFeedback === undefined ? (
            rubricComment.id < 0 ? (
              '--'
            ) : (
              <Spin />
            )
          ) : (
            `👎 ${thisFeedback.negative * 100}%   👍 ${thisFeedback.positive * 100}%`
          ),
          delete: (
            <CPTooltip title={tooltips.admin.rubric.deleteComment} hideThisOnHideTips={true}>
              <Icon type="delete" onClick={this.deleteComment.bind(this, rubricComment)} />
            </CPTooltip>
          ),
        };
      } else {
        return {
          key: rubricComment.id,
          text: (
            <TextArea
              autosize
              value={''}
              onChange={this.updateRubricComment.bind(this, rubricComment.id, 'text')}
              onBlur={this.saveComment.bind(this, rubricComment.id)}
            />
          ),
          deduction: (
            <InputNumber
              value={0}
              onChange={this.updateRubricComment.bind(this, rubricComment.id, 'pointDelta')}
              onBlur={this.saveComment.bind(this, rubricComment.id)}
            />
          ),
          linked: null,
          delete: (
            <CPTooltip title={tooltips.admin.rubric.deleteComment} hideThisOnHideTips={true}>
              <Icon type="delete" onClick={this.deleteComment.bind(this, rubricComment)} />
            </CPTooltip>
          ),
        };
      }
    });
  };

  /****************************************************************************
   Lifecycle methods
  *****************************************************************************/

  public render() {
    const data = this.buildCommentTableData(this.props.rubricComments, this.state.rubricComments);

    const titleLeft = [
      <span key="title" className="cp-label cp-label--plus cp-label--bold">
        Category: {this.props.rubricCategory.name}
      </span>,
      <span key="buttons">
        <CPTooltip title={this.props.index === 0 ? '' : tooltips.admin.rubric.categoryUp} hideThisOnHideTips={true}>
          <Button
            icon="caret-up"
            size="small"
            onClick={this.props.moveCategory.bind(this, this.props.rubricCategory, DIRECTION.Up)}
            disabled={this.props.index === 0}
          />
        </CPTooltip>
        <CPTooltip
          title={this.props.index === this.props.numCategories - 1 ? '' : tooltips.admin.rubric.categoryDown}
          hideThisOnHideTips={true}
        >
          <Button
            icon="caret-down"
            size="small"
            disabled={this.props.index === this.props.numCategories - 1}
            onClick={this.props.moveCategory.bind(this, this.props.rubricCategory, DIRECTION.Down)}
          />
        </CPTooltip>
      </span>,
      this.state.hasError ? (
        <Tag color="volcano" key="warning">
          Error: {this.state.errorMessage}
        </Tag>
      ) : this.state.hasCommentError ? (
        <Tag color="volcano" key="warning">
          Error: {this.state.commentErrorMessage}
        </Tag>
      ) : null,
    ];
    const titleRight = [
      <Popconfirm
        key="delete"
        title="Are you sure you want to delete this category?"
        onConfirm={this.props.deleteCategory.bind(this, this.props.rubricCategory)}
      >
        <CPButton cpType="danger" fallback="delete">
          Delete
        </CPButton>
      </Popconfirm>,
    ];

    const categoryName = (
      <div key="name">
        <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
          Category Name
        </div>
        <Input value={this.state.name} onChange={this.changeName} onBlur={this.saveCategory} ref={this.nameInput} />
      </div>
    );

    const categoryPoints = (
      <div key="points">
        <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
          Category Point Limit
          <CPTooltip
            title={tooltips.admin.rubric.categoryPointLimit}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        </div>
        <CPPointInput
          value={this.state.pointLimit !== null ? -this.state.pointLimit : undefined}
          size="small"
          onChange={this.setValue.bind(this, 'pointLimit')}
          disabled={false}
          onBlur={this.saveCategory}
        />
      </div>
    );

    const helpText = (
      <div key="help-text" style={{ maxWidth: 300 }}>
        <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
          Category Help Text
          <CPTooltip
            title={tooltips.admin.rubric.categoryHelpText}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        </div>
        <Input.TextArea
          style={{ width: 350 }}
          value={this.state.helpText}
          onChange={this.changeHelpText}
          onBlur={this.saveCategory}
          autosize={true}
        />
      </div>
    );

    const contentLeft =
      this.props.windowwidth < 1200 ? (
        <div>
          <CPFlex left={[categoryName, categoryPoints]} right={[]} gutterSize={60} />
          <CPFlex left={[helpText]} right={[]} gutterSize={60} style={{ paddingTop: 30 }} />
        </div>
      ) : (
        <CPFlex left={[categoryName, categoryPoints]} right={[helpText]} gutterSize={60} />
      );

    return (
      <div className="cp-rubric-category">
        <div className="cp-rubric-category__title ">
          <CPFlex left={titleLeft} right={titleRight} gutterSize={10} />
        </div>
        <div className="cp-rubric-category__content">
          {contentLeft}
          <div style={{ height: '40px' }} />
          <Table
            columns={commentTableColumns}
            dataSource={data}
            pagination={false}
            locale={{ emptyText: 'No comments yet' }}
          />
          <div className="cp-rubric-category__add-new-comment">
            <CPButton cpType="primary" icon="plus" onClick={this.addComment} />
            <span style={{ marginLeft: '20px' }} className="cp-label cp-label--success cp-label--bold">
              ADD NEW COMMENT
            </span>
          </div>
        </div>
      </div>
    );
  }
}

/**********************************************************************************************************************/

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

export default withWindowWatcher(CPRubricCategory);

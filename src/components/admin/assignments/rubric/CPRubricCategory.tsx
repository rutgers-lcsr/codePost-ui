/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Badge, Icon, Input, InputNumber, Popconfirm, Table } from 'antd';
const { TextArea } = Input;

/* other library imports */
import _ from 'lodash';

/* codePost imports */
import CPButton from '../../../core/CPButton';
import CPFlex from '../../../core/CPFlex';

import { RubricCategoryType } from '../../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../../infrastructure/rubricComment';

import { STATUS, statusChange } from './RubricUtils';

/**********************************************************************************************************************/

interface ICPRubricCategoryProps {
  // data
  rubricCategory: RubricCategoryType;
  rubricComments: RubricCommentType[];

  // saved data
  savedRubricCategory?: RubricCategoryType;
  savedRubricComments?: RubricCommentType[];

  // RubricCategory functions
  updateCategory: (rCategory: RubricCategoryType) => void;
  deleteCategory: (rCategory: RubricCategoryType) => void;

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
}

const aligner: 'left' | 'center' | 'right' = 'center';
const commentTableColumns = [
  {
    title: 'Comment Text',
    dataIndex: 'text',
    key: 'text',
  },
  {
    title: 'Deduction',
    dataIndex: 'deduction',
    key: 'deduction',
    align: aligner,
  },
  {
    title: 'Instances',
    key: 'linked',
    dataIndex: 'linked',
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

  public constructor(props: ICPRubricCategoryProps) {
    super(props);
    this.state = {
      name: props.rubricCategory.name,
      pointLimit: props.rubricCategory.pointLimit,
      helpText: props.rubricCategory.helpText,
      status: typeof props.savedRubricCategory === 'undefined' ? STATUS.UNSAVED : STATUS.NONE,
      rubricComments: this.buildLocalRubricCommentsStructure(props.rubricComments),
      rubricCommentStatus: this.initializeRubricCommentStatus(props.rubricComments),
    };
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
          if (value) {
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

  public saveCategory = () => {
    const { rubricCategory } = this.props;
    const { name, pointLimit, helpText } = this.state;
    console.log('bump');
    console.log(pointLimit);

    if (
      name !== rubricCategory.name ||
      pointLimit !== rubricCategory.pointLimit ||
      helpText !== rubricCategory.helpText
    ) {
      const payload: RubricCategoryType = Object.assign({}, this.props.rubricCategory);
      payload.name = this.state.name;
      payload.pointLimit = this.state.pointLimit;
      payload.helpText = this.state.helpText;
      this.props.updateCategory(payload);
    }
  };

  public changeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setValue('name', event.target.value);
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

  public saveComment = (rubricCommentID: number) => {
    const { rubricComments } = this.props;
    const rubricComment = this.state.rubricComments[rubricCommentID];

    const match = rubricComments.find((el) => {
      return el.id === rubricComment.id;
    });

    if (match) {
      let pointDelta = rubricComment.pointDelta;
      const text = rubricComment.text;

      if (isNaN(rubricComment.pointDelta) || rubricComment.pointDelta === null) {
        this.updateRubricComment(rubricComment.id, 'pointDelta', 0);
        pointDelta = 0;
      }

      if (text !== match.text || pointDelta !== match.pointDelta) {
        const payload: RubricCommentType = { ...rubricComment };
        this.props.updateComment(payload);
      }
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
            <InputNumber
              value={thisComment.pointDelta}
              onChange={this.updateRubricComment.bind(this, thisComment.id, 'pointDelta')}
              onBlur={this.saveComment.bind(this, thisComment.id)}
            />
          ),
          linked: (
            <span onClick={this.props.activateCommentExplorer.bind(this, thisComment)}>
              <Badge
                count={thisComment.comments.length}
                className="cp-badge"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}
              />
            </span>
          ),
          delete: <Icon type="delete" onClick={this.deleteComment.bind(this, rubricComment)} />,
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
          delete: <Icon type="delete" onClick={this.deleteComment.bind(this, rubricComment)} />,
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

    const contentLeft = [
      <div key="name">
        <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
          Category Name
        </div>
        <Input value={this.state.name} onChange={this.changeName} onBlur={this.saveCategory} />
      </div>,
      <div key="points">
        <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
          Category Point Limit
        </div>
        <InputNumber
          value={this.state.pointLimit ? this.state.pointLimit : 0}
          onChange={this.setValue.bind(this, 'pointLimit')}
          onBlur={this.saveCategory}
        />
      </div>,
    ];

    return (
      <div className="cp-rubric-category">
        <div className="cp-rubric-category__title ">
          <CPFlex left={titleLeft} right={titleRight} gutterSize={10} />
        </div>
        <div className="cp-rubric-category__content">
          <CPFlex left={contentLeft} right={[]} gutterSize={60} />
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

export default CPRubricCategory;

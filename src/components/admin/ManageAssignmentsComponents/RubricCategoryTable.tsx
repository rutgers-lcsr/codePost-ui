/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* react-md imports */
import {
  Button,
  DataTable,
  FontIcon,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
  Tooltipped,
} from 'react-md';

/* codePost imports */
import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import RubricCommentRow from './RubricCommentRow';

import { STATUS, statusChange } from './RubricUtils';

/**********************************************************************************************************************/

interface IProps {
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
  isDisabled: boolean;
  onEdit: (obj: RubricCategoryType) => void;
  onUndo: (obj: RubricCategoryType) => void;
  onCommentEdit: (obj: RubricCommentType) => void;
  onCommentUndo: (obj: RubricCommentType) => void;
}

interface IState {
  name: string;
  pointLimit: number | null;
  status: STATUS;
}

/**********************************************************************************************************************/

class RubricCategoryTable extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      name: this.props.rubricCategory.name,
      pointLimit: this.props.rubricCategory.pointLimit,
      status: typeof this.props.savedRubricCategory === 'undefined' ? STATUS.UNSAVED : STATUS.NONE,
    };
  }

  public componentDidUpdate(prevProps: IProps) {
    if (this.props.savedRubricCategory !== prevProps.savedRubricCategory) {
      this.updateStatus();

      // For undoing local changes
      if (this.props.rubricCategory !== prevProps.rubricCategory) {
        this.setState(
          {
            name: this.props.rubricCategory.name,
            pointLimit: this.props.rubricCategory.pointLimit,
          },
          () => {
            this.updateStatus();
          },
        );
      }
    }
  }

  public updateStatus = () => {
    const { savedRubricCategory } = this.props;
    const { name, pointLimit, status } = this.state;
    if (savedRubricCategory) {
      const newStatus = statusChange(
        [savedRubricCategory.name, savedRubricCategory.pointLimit],
        [name, pointLimit],
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
            newVal = parseInt(value, 10);
          } else {
            newVal = null;
          }
        }

        newState[label] = newVal;
        return newState;
      },
      () => {
        this.updateStatus();
      },
    );
  };

  public saveCategory = () => {
    const { rubricCategory } = this.props;
    const { name, pointLimit } = this.state;

    if (name !== rubricCategory.name || pointLimit !== rubricCategory.pointLimit) {
      const payload: RubricCategoryType = Object.assign({}, this.props.rubricCategory);
      payload.name = this.state.name;
      payload.pointLimit = this.state.pointLimit;
      this.props.updateCategory(payload);
    }
  };

  public render() {
    const { isDisabled, deleteCategory, rubricCategory, rubricComments } = this.props;
    const { name, pointLimit, status } = this.state;

    let deleteCategoryButton = null;
    let deleteCommentHeader = null;

    // only show delete button if editing is enabled
    if (!isDisabled) {
      deleteCategoryButton = (
        <Button
          key="Delete"
          className="admin-rubric__category--header__delete-btn"
          icon={true}
          disabled={isDisabled}
          onClick={deleteCategory.bind(this, rubricCategory)}
        >
          delete
        </Button>
      );
      deleteCommentHeader = <TableColumn key={'Delete'}>Delete</TableColumn>;
    }

    // Indicator of a recent save or unsaved change
    let unSavedChanges = null;
    switch (status) {
      case STATUS.UNSAVED:
        unSavedChanges = (
          <Tooltipped label="Unsaved changes. Click anywhere to save." position="right" setPosition={true} delay={500}>
            <div>
              <FontIcon>cloud_off</FontIcon>
            </div>
          </Tooltipped>
        );
        break;
      default:
        unSavedChanges = null;
    }

    return (
      <div className="admin-rubric__category" key={rubricCategory.id}>
        <div className="admin-rubric__category--header">
          <TextField
            defaultValue={name}
            label={'Category Name'}
            onChange={this.setValue.bind(this, 'name')}
            disabled={isDisabled}
            onBlur={this.saveCategory}
            customSize="font-size-large"
            fullWidth={false}
          />
          <TextField
            defaultValue={typeof pointLimit === 'number' ? pointLimit : undefined}
            label={'Category points cap'}
            step={0.5}
            pattern="^d+(\.|\,)\d{1}"
            required={false}
            min={0}
            type="number"
            onChange={this.setValue.bind(this, 'pointLimit')}
            disabled={isDisabled}
            onBlur={this.saveCategory}
            customSize="font-size-large"
            fullWidth={false}
          />
          <div className="admin-rubric__category--header__unsavedChanges">{unSavedChanges}</div>
          <div className="admin-rubric__category--header__delete">{deleteCategoryButton}</div>
          <div className="admin-rubric__category--header__warning">
            {pointLimit === 0
              ? 'Warning: A limit of 0 means that no submissions will receive deductions for this category'
              : ''}
          </div>
        </div>
        <DataTable
          key={rubricCategory.id}
          className="DataTable--RubricCategory"
          baseId="edit-rubric-table"
          plain={true}
        >
          <TableHeader>
            <TableRow selectable={false}>
              <TableColumn key={'spacing1'} />
              <TableColumn key={'Linked comments'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Linked Comments
                  <Tooltipped
                    label="Warning: edits will propagate to submissions to which these comments are applied"
                    position="right"
                    setPosition={true}
                    delay={500}
                  >
                    <div style={{ paddingLeft: '2px' }}>
                      <FontIcon>error</FontIcon>
                    </div>
                  </Tooltipped>
                </div>
              </TableColumn>
              <TableColumn key={'CommentText'}>Comment text</TableColumn>
              <TableColumn key={'Deduction'}>Deduction</TableColumn>
              {deleteCommentHeader}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rubricComments
              .sort((a, b) => a.id - b.id)
              .map((comment) => {
                const savedRubricComment = this.props.savedRubricComments
                  ? this.props.savedRubricComments.find((el) => {
                      // tslint:disable-next-line
                      return el.id === comment.id;
                      // tslint:disable-next-line
                    })
                  : undefined;
                return (
                  <RubricCommentRow
                    key={comment.id}
                    rubricComment={comment}
                    savedRubricComment={savedRubricComment}
                    isDisabled={isDisabled}
                    deleteComment={this.props.deleteComment}
                    updateComment={this.props.updateComment}
                    onEdit={this.props.onCommentEdit}
                    onUndo={this.props.onCommentUndo}
                    activateCommentExplorer={this.props.activateCommentExplorer}
                  />
                );
              })}
          </TableBody>
        </DataTable>
        <Button
          className="Btn"
          iconChildren={'playlist_add'}
          disabled={isDisabled}
          onClick={this.props.addComment.bind(this, this.props.rubricCategory)}
        >
          Add New Comment
        </Button>
        <div className="padding" />
      </div>
    );
  }
}

// <Button className="Btn" iconChildren={'playlist_add'} disabled={isDisabled} onClick={addEmptyCommentToThis}>
//   Add New Comment
// </Button>

export default RubricCategoryTable;

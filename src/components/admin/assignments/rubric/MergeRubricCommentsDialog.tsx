/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Icon, Modal, Spin } from 'antd';

/* other library imports */
import Select from 'react-select';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { CommentIO } from '../../../../infrastructure/comment';
import { RubricCategoryType } from '../../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../../infrastructure/rubricComment';

import { IRubricCategoryToRubricCommentsMap } from '../../../../types/common';

import CPButton from '../../../../components/core/CPButton';

/**********************************************************************************************************************/

interface IMergeRubricCommentsDialogProps {
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  isDisabled: boolean;

  assignment: AssignmentType;
  reloadRubric: (assignment: AssignmentType) => Promise<void>;
}

interface IMergeRubricCommentsDialogState {
  fromComment: RubricCommentType | null;
  toComment: RubricCommentType | null;
  isLoading: boolean;
  visible: boolean;
}

class MergeRubricCommentsDialog extends React.Component<
  IMergeRubricCommentsDialogProps,
  IMergeRubricCommentsDialogState
> {
  public state: Readonly<IMergeRubricCommentsDialogState> = {
    fromComment: null,
    toComment: null,
    isLoading: false,
    visible: false,
  };

  public openDialog = () => {
    this.setState({
      fromComment: null,
      toComment: null,
      visible: true,
    });
  };

  public closeDialog = () => {
    this.setState({
      fromComment: null,
      toComment: null,
      visible: false,
    });
  };

  public onChangeFromComment = (selected: any) => {
    this.setState({ fromComment: selected.comment });
  };

  public onChangeToComment = (selected: any) => {
    this.setState({ toComment: selected.comment });
  };

  public mergeComments = () => {
    if (!this.state.fromComment || !this.state.toComment) {
      return;
    }

    if (this.state.fromComment.id === this.state.toComment.id) {
      return;
    }

    this.setState({ isLoading: true });

    // Loop through linked comments of fromComment and relink to toComment
    const relinkCommentPromises = this.state.fromComment.comments.map((commentID: number) => {
      const payload = {
        id: commentID,
        rubricComment: this.state.toComment!.id,
      };

      return CommentIO.update(payload);
    });

    // If all goes well, delete the fromComment
    Promise.all(relinkCommentPromises)
      .then(() => {
        RubricComment.delete(this.state.fromComment!.id).then(() => {
          this.props.reloadRubric(this.props.assignment).then(() => {
            this.closeDialog();
            this.setState({ isLoading: false });
          });
        });
      })
      // Otherwise undo the changes
      .catch(() => {
        const undoLinkCommentPromises = this.state.fromComment!.comments.map((commentID: number) => {
          const payload = {
            id: commentID,
            rubricComment: this.state.fromComment!.id,
          };

          return CommentIO.update(payload);
        });

        Promise.all(undoLinkCommentPromises);
        this.closeDialog();
        this.setState({ isLoading: false });
      });
  };

  public buildGroupedOptions = (
    rubricCategories: RubricCategoryType[],
    rubricComments: IRubricCategoryToRubricCommentsMap,
  ) => {
    const groupedOptions: Array<{
      label: string;
      options: Array<{ label: string; value: number; comment: RubricCommentType }>;
    }> = [];

    rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
      if (rubricComments.hasOwnProperty(rubricCategory.id)) {
        const comments = rubricComments[rubricCategory.id].map((rubricComment: RubricCommentType) => {
          return {
            label: rubricComment.text,
            value: rubricComment.id,
            comment: rubricComment,
          };
        });

        groupedOptions.push({
          label: rubricCategory.name,
          options: comments,
        });
      }
    });

    return groupedOptions;
  };

  public render() {
    const groupedOptions = this.buildGroupedOptions(this.props.rubricCategories, this.props.rubricComments);

    let currentFromCommentOption = null;
    if (this.state.fromComment) {
      currentFromCommentOption = {
        value: this.state.fromComment.id,
        label: this.state.fromComment.text,
        comment: this.state.fromComment,
      };
    }

    let currentToCommentOption = null;
    if (this.state.toComment) {
      currentToCommentOption = {
        value: this.state.toComment.id,
        label: this.state.toComment.text,
        comment: this.state.toComment,
      };
    }

    return (
      <div>
        <CPButton
          onClick={this.openDialog}
          disabled={this.props.isDisabled}
          cpType="secondary"
          icon="branches"
          fallback="branches"
        >
          Merge Comments
        </CPButton>
        <Modal
          visible={this.state.visible}
          title="Merge rubric comments"
          onCancel={this.closeDialog}
          onOk={this.mergeComments}
          okText="Merge"
        >
          {this.state.isLoading ? (
            <Spin />
          ) : (
            <div>
              <div>
                Merging will
                <ul>
                  <li>delete the 'From' rubric comment, and</li>
                  <li>relink all of its comments to the 'To' rubric comment</li>
                </ul>
                This action cannot be undone.
                <br />
                <br />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: '2 2 auto' }}>
                  <Select
                    id="fromSelect"
                    options={groupedOptions}
                    value={currentFromCommentOption}
                    onChange={this.onChangeFromComment}
                  />
                </div>
                <div style={{ flex: ' 0 0 50px', textAlign: 'center' }}>
                  <Icon type="arrow-right" />
                </div>
                <div style={{ flex: '2 2 auto' }}>
                  <Select
                    id="toSelect"
                    options={groupedOptions}
                    value={currentToCommentOption}
                    onChange={this.onChangeToComment}
                  />
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }
}

export default MergeRubricCommentsDialog;

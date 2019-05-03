import * as React from 'react';
import { Button, CircularProgress, DialogContainer, FontIcon } from 'react-md';
import Select from 'react-select';

import { AssignmentType } from '../../../infrastructure/assignment';
import { CommentIO } from '../../../infrastructure/comment';
import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../infrastructure/rubricComment';

import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

interface IMergeRubricCommentsDialogProps {
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  isDisabled: boolean;
  addToast: (text: string, action: string | undefined) => void;
  addErrorToast: (text: string, action: string | undefined) => void;

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
      this.props.addErrorToast('You cannot merge a rubric comment into itself.', undefined);
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
          this.props.addToast('Successfully merged rubric comments.', undefined);

          this.props.reloadRubric(this.props.assignment).then(() => {
            this.closeDialog();
            this.setState({ isLoading: false });
          });
        });
      })
      // Otherwise undo the changes
      .catch(() => {
        this.props.addErrorToast('Something went wrong. Please try again or contact team@codepost.io.', undefined);

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

    const dialogActions = [];
    dialogActions.push(
      <Button flat secondary style={{ color: '#f64852' }} onClick={this.closeDialog}>
        Cancel
      </Button>,
    );

    dialogActions.push(
      <Button flat primary onClick={this.mergeComments}>
        Merge
      </Button>,
    );

    return (
      <div>
        <Button
          onClick={this.openDialog}
          disabled={this.props.isDisabled}
          raised
          primary={false}
          iconChildren={'call_merge'}
          iconBefore={false}
          flat={true}
        >
          Merge Comments
        </Button>
        <DialogContainer
          id="dialog--merge-comments"
          visible={this.state.visible}
          title="Merge rubric comments"
          onHide={this.closeDialog}
          focusOnMount={false}
          containFocus={false}
          className="dialog--merge-comments"
          actions={dialogActions}
        >
          {this.state.isLoading ? (
            <CircularProgress id="progress" />
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
                  <FontIcon>forward</FontIcon>
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
        </DialogContainer>
      </div>
    );
  }
}

export default MergeRubricCommentsDialog;

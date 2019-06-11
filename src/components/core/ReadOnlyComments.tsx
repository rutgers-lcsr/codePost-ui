import * as React from 'react';

import { CommentType } from '../../infrastructure/comment';

import Comments from './Comments';

import { RubricCommentType } from '../../infrastructure/rubricComment';

const makeReadOnly = (Component: React.ComponentType<any>) => {
  return class WrappedComponent extends React.Component<any, any> {
    public readOnly = true;
    public activeCommentId = undefined;

    public saveComment = (comment: any) => {
      return;
    };

    public changeActive = (id: number) => {
      return;
    };

    public deleteComment = (comment: CommentType) => {
      return;
    };

    public addUnsaved = (commentID: number) => {
      return;
    };

    public removeUnsaved = (commentID: number) => {
      return;
    };

    public removeRubricComment = (comment: CommentType, rubricComment: RubricCommentType) => {
      return;
    };

    public render() {
      return (
        <Component
          {...this.props}
          readOnly={this.readOnly}
          activeCommentId={this.activeCommentId}
          changeActive={this.changeActive}
          saveComment={this.saveComment}
          deleteComment={this.deleteComment}
          addUnsaved={this.addUnsaved}
          removeUnsaved={this.removeUnsaved}
          removeRubricComment={this.removeRubricComment}
        />
      );
    }
  };
};

export default makeReadOnly(Comments);

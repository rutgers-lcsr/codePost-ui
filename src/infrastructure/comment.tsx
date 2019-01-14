import * as t from 'io-ts';
import * as React from 'react';

import { FileType } from './file';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const CommentV = t.intersection(
  [
    GenericObject,
    t.type({
      startChar: t.number,
      endChar: t.number,
      startLine: t.number,
      endLine: t.number,
      pointDelta: t.union([t.number, t.null]),
      text: t.string,
      file: t.number,
      rubricComment: t.union([t.number, t.null]),
    }),
    t.partial({
      author: t.string,
    }),
  ],
  'Comment',
);

const CommentVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      author: t.string,
      startChar: t.number,
      endChar: t.number,
      startLine: t.number,
      endLine: t.number,
      pointDelta: t.union([t.number, t.null]),
      text: t.string,
      file: t.number,
      rubricComment: t.union([t.number, t.null]),
    }),
  ],
  'CommentVPatch',
);

type CommentType = t.TypeOf<typeof CommentV>;

class CommentIO {
  public static create = createObject(CommentV, 'comments');
  public static read = readObject(CommentV, 'comments');
  public static update = updateObject(CommentV, CommentVPatch, 'comments');
  public static delete = deleteObject(CommentV, 'comments');
}

const withoutEditing = (Component: React.ComponentType<any>) => {
  return class WrappedComponent extends React.Component<any, any> {
    public readOnly = true;
    public active = false;

    public changeActive = (id: number) => {
      return;
    };

    public deleteComment = (comment: CommentType, file: FileType) => {
      return;
    };

    public updateComment = (commentID: number, newComment: CommentType, file: FileType) => {
      return;
    };

    public saveGrade = () => {
      return;
    };

    public render() {
      return (
        <Component
          {...this.props}
          readOnly={this.readOnly}
          active={this.active}
          changeActive={this.changeActive}
          deleteComment={this.deleteComment}
          updateComment={this.updateComment}
          saveGrade={this.saveGrade}
        />
      );
    }
  };
};

export { CommentType, CommentIO, withoutEditing };

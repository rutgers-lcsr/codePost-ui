import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

export const RubricCommentV = t.intersection(
  [
    GenericObject,
    t.type({
      text: t.string,
      pointDelta: t.number,
      category: t.number,
      comments: t.array(t.number),
      sortKey: t.number,
      explanation: t.string,
      instructionText: t.string,
      templateTextOn: t.boolean,
    }),
  ],
  'RubricComment',
);

const RubricCommentVPost = t.intersection(
  [
    GenericObject,
    t.type({
      text: t.string,
      pointDelta: t.number,
      category: t.number,
    }),
    t.partial({}),
  ],
  'RubricComment',
);

const RubricCommentVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      text: t.string,
      pointDelta: t.number,
      category: t.number,
    }),
  ],
  'RubricCommentPatch',
);

export type RubricCommentType = t.TypeOf<typeof RubricCommentV>;
export type RubricCommentPatchType = t.TypeOf<typeof RubricCommentVPatch>;

export class RubricComment {
  public static create = createObject(RubricCommentV, RubricCommentVPost, 'rubricComments');
  public static read = readObject(RubricCommentV, 'rubricComments');
  public static update = updateObject(RubricCommentV, RubricCommentVPatch, 'rubricComments');
  public static delete = deleteObject(RubricCommentV, 'rubricComments');

  public static compare = (a: RubricCommentType, b: RubricCommentType) => {
    if (a.sortKey === b.sortKey) {
      return a.id - b.id;
    } else {
      return a.sortKey - b.sortKey;
    }
  };
}

export const RubricCommentMock: RubricCommentType = {
  id: 1,
  text: 'Mocked rubric comment',
  pointDelta: 3,
  category: 1,
  comments: [1],
  sortKey: 0,
  explanation: '',
  instructionText: '',
  templateTextOn: false,
};

// export { RubricCommentType, RubricCommentPatchType, RubricComment, RubricCommentV, RubricCommentMock };

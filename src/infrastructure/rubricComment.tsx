import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject, readObjectDetail } from './generics';

export const RubricCommentV = t.intersection(
  [
    GenericObject,
    t.type({
      text: t.string,
      pointDelta: t.number,
      category: t.number,
      sortKey: t.number,
      explanation: t.string,
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

const RubricCommentVComments = t.intersection(
  [
    GenericObject,
    t.type({
      comments: t.array(t.number),
    }),
  ],
  'RubricCommentPatch',
);

export type RubricCommentInstanceListType = t.TypeOf<typeof RubricCommentVComments>;

const RubricCommentVFeedback = t.intersection(
  [
    GenericObject,
    t.type({
      negative: t.number,
      positive: t.number,
    }),
  ],
  'RubricCommentPatch',
);

export type RubricCommentFeedbackType = t.TypeOf<typeof RubricCommentVComments>;

export class RubricComment {
  public static create = createObject(RubricCommentV, RubricCommentVPost, 'rubricComments');
  public static read = readObject(RubricCommentV, 'rubricComments');
  public static update = updateObject(RubricCommentV, RubricCommentVPatch, 'rubricComments');
  public static delete = deleteObject(RubricCommentV, 'rubricComments');

  public static readCommmentList = readObjectDetail(RubricCommentVComments, 'rubricComments', 'comments');
  public static readFeedbackScore = readObjectDetail(RubricCommentVFeedback, 'rubricComments', 'feedbackScore');

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
  sortKey: 0,
  explanation: '',
};

// export { RubricCommentType, RubricCommentPatchType, RubricComment, RubricCommentV, RubricCommentMock };

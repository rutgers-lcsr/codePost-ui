import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const RubricCommentV = t.intersection(
  [
    GenericObject,
    t.type({
      text: t.string,
      pointDelta: t.number,
      category: t.number,
      comments: t.array(t.number),
      sortKey: t.number,
    }),
    t.partial({}),
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

type RubricCommentType = t.TypeOf<typeof RubricCommentV>;

class RubricComment {
  public static create = createObject(RubricCommentV, RubricCommentVPost, 'rubricComments');
  public static read = readObject(RubricCommentV, 'rubricComments');
  public static update = updateObject(RubricCommentV, RubricCommentVPatch, 'rubricComments');
  public static delete = deleteObject(RubricCommentV, 'rubricComments');
}

const sortRubricComment = (rubricComments: RubricCommentType[]): RubricCommentType[] => {
  // First sort by RubricCategory 'sortKey', then by ID
  const compareRubricComments = (a: RubricCommentType, b: RubricCommentType) => {
    if (a.sortKey === b.sortKey) {
      return a.id - b.id;
    } else {
      return a.sortKey - b.sortKey;
    }
  };

  return rubricComments.sort(compareRubricComments);
};

export { RubricCommentType, RubricComment, RubricCommentV, sortRubricComment };

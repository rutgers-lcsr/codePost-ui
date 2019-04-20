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
type RubricCommentPatchType = t.TypeOf<typeof RubricCommentVPatch>;

class RubricComment {
  public static create = createObject(RubricCommentV, RubricCommentVPost, 'rubricComments');
  public static read = readObject(RubricCommentV, 'rubricComments');
  public static update = updateObject(RubricCommentV, RubricCommentVPatch, 'rubricComments');
  public static delete = deleteObject(RubricCommentV, 'rubricComments');
}

export { RubricCommentType, RubricCommentPatchType, RubricComment, RubricCommentV };

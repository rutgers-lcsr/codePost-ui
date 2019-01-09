import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const RubricCommentV = t.intersection([
  GenericObject,
  t.type({
    text: t.string,
    pointDelta: t.number,
    category: t.number,
  }),
  t.partial({
  }),
], 'RubricComment');

const RubricCommentVPatch = t.intersection([
  GenericObject,
  t.partial({
    text: t.string,
    pointDelta: t.number,
    category: t.number,
  }),
], 'RubricCommentPatch');

type RubricCommentType = t.TypeOf<typeof RubricCommentV>;

class RubricComment {
  public static create = createObject(RubricCommentV, 'rubricComments');
  public static read = readObject(RubricCommentV, 'rubricComments');
  public static update = updateObject(RubricCommentV, RubricCommentVPatch, 'rubricComments');
  public static delete = deleteObject(RubricCommentV, 'rubricComments');
}

export { RubricCommentType, RubricComment, RubricCommentV };

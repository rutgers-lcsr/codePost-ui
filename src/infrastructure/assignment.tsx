import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, readObjectDetail, updateObject } from './generics';

import { RubricCategoryV } from './rubricCategory';
import { RubricCommentV } from './rubricComment';
import { SubmissionV } from './submission';

const AssignmentV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      points: t.number,
      isReleased: t.boolean,
      rubricCategories: t.array(t.number),
    }),
    t.partial({
      mean: t.union([t.number, t.null]),
      median: t.union([t.number, t.null]),
      course: t.number,
    }),
  ],
  'Assignment',
);

const AssignmentVPost = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      points: t.number,
      isReleased: t.boolean,
      rubricCategories: t.array(t.number),
    }),
    t.partial({
      course: t.number,
    }),
  ],
  'Assignment',
);

const AssignmentVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      points: t.number,
      isReleased: t.boolean,
      rubricCategories: t.array(t.number),
      course: t.number,
    }),
  ],
  'AssignmentPatch',
);

type AssignmentType = t.TypeOf<typeof AssignmentV>;

const RubricV = t.intersection(
  [
    GenericObject,
    t.type({
      rubricCategories: t.array(RubricCategoryV),
      rubricComments: t.array(RubricCommentV),
    }),
    t.partial({}),
  ],
  'Roster',
);

class Assignment {
  public static create = createObject(AssignmentV, AssignmentVPost, 'assignments');
  public static read = readObject(AssignmentV, 'assignments');
  public static update = updateObject(AssignmentV, AssignmentVPatch, 'assignments');
  public static delete = deleteObject(AssignmentV, 'assignments');

  public static readRubric = readObjectDetail(RubricV, 'assignments', 'rubric');
  public static readSubmissions = readObjectDetail(t.array(SubmissionV), 'assignments', 'submissions');
}

export { AssignmentType, Assignment };

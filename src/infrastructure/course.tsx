import * as t from 'io-ts';
import {
  createObject,
  deleteObject,
  GenericObject,
  readObject,
  readObjectDetail,
  updateObject,
  updateObjectDetail,
} from './generics';

const CourseV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      period: t.string,
      assignments: t.array(t.number),
      sections: t.array(t.number),
    }),
  ],
  'Course',
);

const CourseVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      period: t.string,
      assignments: t.array(t.number),
      sections: t.array(t.number),
    }),
  ],
  'CoursePatch',
);

type CourseType = t.TypeOf<typeof CourseV>;

const RosterV = t.intersection(
  [
    GenericObject,
    t.type({
      students: t.array(t.string),
      inactive_students: t.array(t.string),
      inactive_graders: t.array(t.string),
      graders: t.array(t.string),
      courseAdmins: t.array(t.string),
    }),
    t.partial({}),
  ],
  'Roster',
);

const RosterVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      students: t.array(t.string),
      graders: t.array(t.string),
      courseAdmins: t.array(t.string),
    }),
  ],
  'RosterPatch',
);

type RosterType = t.TypeOf<typeof RosterV>;

class Course {
  public static create = createObject(CourseV, 'courses');
  public static read = readObject(CourseV, 'courses');
  public static update = updateObject(CourseV, CourseVPatch, 'courses');
  public static delete = deleteObject(CourseV, 'courses');

  public static readRoster = readObjectDetail(RosterV, 'courses', 'roster');
  public static updateRoster = updateObjectDetail(RosterV, RosterVPatch, 'courses', 'roster');
}

export { CourseType, Course, RosterType };

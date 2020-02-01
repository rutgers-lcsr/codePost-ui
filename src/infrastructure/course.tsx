import * as t from 'io-ts';
import {
  createObject,
  deleteObject,
  GenericObject,
  listObject,
  readObject,
  readObjectDetail,
  updateObject,
  updateObjectDetail,
} from './generics';

export const CourseV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      period: t.string,
      assignments: t.array(t.number),
      sections: t.array(t.number),
      sendReleasedSubmissionsToBack: t.boolean,
      showStudentsStatistics: t.boolean,
      timezone: t.string,
      emailNewUsers: t.boolean,
      anonymousGradingDefault: t.boolean,
      minComments: t.number,
      noUnfinalize: t.boolean,
      lateDaysAllowable: t.union([t.number, t.null]),
      archived: t.boolean,
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
      sendReleasedSubmissionsToBack: t.boolean,
      showStudentsStatistics: t.boolean,
      timezone: t.string,
      emailNewUsers: t.boolean,
      anonymousGradingDefault: t.boolean,
      lateDaysAllowable: t.union([t.number, t.null]),
      archived: t.boolean,
    }),
  ],
  'CoursePatch',
);

export type CourseType = t.TypeOf<typeof CourseV>;
export type CoursePatchType = t.TypeOf<typeof CourseVPatch>;

const RosterV = t.intersection(
  [
    GenericObject,
    t.type({
      students: t.array(t.string),
      inactive_students: t.array(t.string),
      inactive_graders: t.array(t.string),
      inactive_courseAdmins: t.array(t.string),
      graders: t.array(t.string),
      superGraders: t.array(t.string),
      courseAdmins: t.array(t.string),
      not_activated: t.array(t.string),
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
      superGraders: t.array(t.string),
      courseAdmins: t.array(t.string),
    }),
  ],
  'RosterPatch',
);

export type RosterType = t.TypeOf<typeof RosterV>;

const CourseSettingsV = t.intersection(
  [
    GenericObject,
    t.type({
      sendReleasedSubmissionsToBack: t.boolean,
      showStudentsStatistics: t.boolean,
      timezone: t.string,
      emailNewUsers: t.boolean,
      lateDaysAllowable: t.union([t.number, t.null]),
    }),
  ],
  'CourseSettings',
);

export type CourseSettingsType = t.TypeOf<typeof CourseSettingsV>;

export class Course {
  public static create = createObject(CourseV, CourseV, 'courses');
  public static read = readObject(CourseV, 'courses');
  public static list = listObject(CourseV, 'courses');
  public static update = updateObject(CourseV, CourseVPatch, 'courses');
  public static delete = deleteObject(CourseV, 'courses');

  public static readRoster = readObjectDetail(RosterV, 'courses', 'roster');
  public static updateRoster = updateObjectDetail(RosterV, RosterVPatch, 'courses', 'roster');

  public static readSettings = readObjectDetail(CourseSettingsV, 'courses', 'courseSettings');
}

// export { CourseType, Course, RosterType, CoursePatchType, CourseV, CourseSettingsType };

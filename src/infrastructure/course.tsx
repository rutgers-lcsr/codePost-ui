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
import { convertToPaginatedFunction, paginatedType } from './pagination';

import { SectionType, SectionV } from './section';

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
      lateDayCreditsAllowable: t.union([t.number, t.null]),
      archived: t.boolean,
      activateQueue: t.boolean,
      inviteCode: t.union([t.string, t.null]),
      emailWhitelist: t.string,
      inviteCodeEnabled: t.boolean,
      enableStudentFeedbackNotifications: t.boolean,
      expiration_date: t.union([t.string, t.null, t.undefined]),
      studentsCanSeeGraders: t.boolean,
      studentCount: t.number,
    }),
    t.partial({ webhooks: t.array(t.number) }),
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
      sendReleasedSubmissionsToBack: t.boolean,
      showStudentsStatistics: t.boolean,
      timezone: t.string,
      emailNewUsers: t.boolean,
      anonymousGradingDefault: t.boolean,
      allowGradersToEditRubric: t.boolean,
      minComments: t.number,
      noUnfinalize: t.boolean,
      activateQueue: t.boolean,
      studentsCanSeeGraders: t.boolean,
      lateDayCreditsAllowable: t.union([t.number, t.null]),
      archived: t.boolean,
      inviteCode: t.union([t.string, t.null]),
      emailWhitelist: t.string,
      inviteCodeEnabled: t.boolean,
      enableStudentFeedbackNotifications: t.boolean,
      expiration_date: t.union([t.string, t.null, t.undefined]),
      studentCount: t.number,
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
      name: t.string,
      period: t.string,
      students: t.array(t.string),
      inactive_students: t.array(t.string),
      inactive_graders: t.array(t.string),
      inactive_courseAdmins: t.array(t.string),
      graders: t.array(t.string),
      superGraders: t.array(t.string),
      courseAdmins: t.array(t.string),
      not_activated: t.array(t.string),
      organization: t.number, // API returns organization ID, not full object
    }),
    t.partial({
      inactive: t.boolean,
    }),
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

const RosterMapVPatch = t.intersection(
  [
    GenericObject,
    t.type({
      rosterMap: t.record(t.string, t.string),
    }),
  ],
  'RosterPatch',
);

const RosterMapV = t.record(t.string, t.string);

export type RosterType = t.TypeOf<typeof RosterV>;

const CourseSettingsV = t.intersection(
  [
    GenericObject,
    t.type({
      sendReleasedSubmissionsToBack: t.boolean,
      showStudentsStatistics: t.boolean,
      timezone: t.string,
      emailNewUsers: t.boolean,
      lateDayCreditsAllowable: t.union([t.number, t.null]),
    }),
  ],
  'CourseSettings',
);

export type CourseSettingsType = t.TypeOf<typeof CourseSettingsV>;

export class Course {
  public static create = createObject(CourseV, CourseV, 'courses');
  public static read = readObject(CourseV, 'courses');
  public static list = listObject(CourseV, 'courses');
  // @ts-expect-error io-ts type mismatch - CourseVPatch is partial but updateObject expects full type
  public static update = updateObject(CourseV, CourseVPatch, 'courses');
  public static delete = deleteObject(CourseV, 'courses');

  public static readRoster = readObjectDetail(RosterV, 'courses', 'roster');
  public static updateRoster = updateObjectDetail(RosterV, RosterVPatch, 'courses', 'roster');
  public static addToRoster = updateObjectDetail(RosterV, RosterVPatch, 'courses', 'addToRoster');
  public static removeFromRoster = updateObjectDetail(RosterV, RosterVPatch, 'courses', 'removeFromRoster');

  public static readRosterMap = readObjectDetail(RosterMapV, 'courses', 'rosterMap');
  public static updateRosterMap = updateObjectDetail(RosterMapV, RosterMapVPatch, 'courses', 'rosterMap');

  public static readSettings = readObjectDetail(CourseSettingsV, 'courses', 'courseSettings');

  // Paginated requests - for admin console performance on large courses
  public static readPaginatedSections = convertToPaginatedFunction<SectionType>(
    readObjectDetail(paginatedType(SectionV), 'courses', 'sections'),
  );
}

// export { CourseType, Course, RosterType, CoursePatchType, CourseV, CourseSettingsType };

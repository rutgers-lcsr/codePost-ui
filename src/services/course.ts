import { coursesApi } from '../api-client/clients';
import type { Course as CourseModel, CourseRoster, CourseSettings } from '../api-client';

export class Course {
  public static list = (): Promise<CourseModel[]> => coursesApi.list();
  public static read = (id: number): Promise<CourseModel> => coursesApi.retrieve({ id });
  public static create = (
    course: Omit<
      CourseModel,
      'id' | 'assignments' | 'sections' | 'inviteCode' | 'webhooks' | 'studentCount' | 'isRubricEditor'
    >,
  ) => coursesApi.create({ course });
  public static update = (id: number, payload: Partial<CourseModel>) =>
    coursesApi.partialUpdate({ id, patchedCourse: payload });

  public static readRoster = (id: number): Promise<CourseRoster> => coursesApi.rosterRetrieve({ id });
  public static updateRoster = (id: number, payload: Partial<CourseModel>) =>
    coursesApi.rosterPartialUpdate({ id, patchedCourse: payload });
  public static addToRoster = (id: number, payload: Partial<CourseModel>) =>
    coursesApi.addToRosterPartialUpdate({ id, patchedCourse: payload });
  public static removeFromRoster = (id: number, payload: Partial<CourseModel>) =>
    coursesApi.removeFromRosterPartialUpdate({ id, patchedCourse: payload });

  public static readSettings = (id: number): Promise<CourseSettings> => coursesApi.courseSettingsRetrieve({ id });
}

import * as t from 'io-ts';

import { GenericObject, listObject, readObject } from './generics';

import { CourseV } from './course';
import { SectionV } from './section';

const UserV = t.intersection(
  [
    GenericObject,
    t.type({
      token: t.string,
      email: t.string,
      organization: t.number,
      canCreateCourses: t.boolean,
      canModifyRosters: t.boolean,
      api_token: t.union([t.string, t.null]),
      studentCourses: t.array(CourseV),
      graderCourses: t.array(CourseV),
      superGraderCourses: t.array(CourseV),
      courseadminCourses: t.array(CourseV),
      leaderSections: t.array(SectionV),
      student_sections: t.array(t.number),
      showProductTips: t.boolean,
      codePostAdmin: t.boolean,
      hasCredentials: t.boolean,
    }),
    t.partial({}),
  ],
  'User',
);

export type UserType = t.TypeOf<typeof UserV>;

export class UserIO {
  public static read = readObject(UserV, 'comments');
  public static list = listObject(UserV, 'users');
}

// export { UserType, UserIO };

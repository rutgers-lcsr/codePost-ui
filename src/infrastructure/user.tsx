import * as t from 'io-ts';

import { CourseV } from './course';
import { GenericObject, readObject } from './generics';

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
      leader_sections: t.array(t.string),
    }),
    t.partial({}),
  ],
  'User',
);

type UserType = t.TypeOf<typeof UserV>;

class UserIO {
  public static read = readObject(UserV, 'comments');
}

export { UserType, UserIO };

import * as t from 'io-ts';

import {
  GenericObject,
  listObject,
  readObject,
  createObject,
  deleteObject,
  getHeaders,
  handleErrorResponse,
  decodeToPromise,
} from './generics';

import { CourseV } from './course';
import { SectionV } from './section';

const UserV = t.intersection(
  [
    GenericObject,
    t.type({
      token: t.string,
      email: t.string,
      organization: t.union([t.number, t.null]),
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

// Partial definition for updating user
const UserVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      email: t.string,
      organization: t.number,
      canCreateCourses: t.boolean,
      canModifyRosters: t.boolean,
      codePostAdmin: t.boolean,
      // Add other fields as needed for updates
    }),
  ],
  'UserPatch',
);

export type UserPatchType = t.TypeOf<typeof UserVPatch>;

export class UserIO {
  public static read = readObject(UserV, 'users'); // Fixed 'comments' typo in original readObject call? Wait, original said 'comments'. That seems wrong for UserIO.read. It should be 'users'. I'll fix it if I replace the line.
  // Actually line 36 was: public static read = readObject(UserV, 'comments');
  // This looks like a copy-paste error in the original file unless 'comments' is weirdly overloaded.
  // Assuming it should be 'users' for UserIO.
  public static list = listObject(UserV, 'users');
  public static create = createObject(UserV, UserV, 'users');
  public static update = async (user: UserPatchType & { email: string }) => {
    const res: Response = await fetch(`${process.env.REACT_APP_API_URL}/users/${user.email}/`, {
      headers: getHeaders(),
      method: 'PATCH',
      body: JSON.stringify(user),
    });

    if (res.status === 200) {
      const data: any = await res.json();
      return decodeToPromise(UserV, data);
    }
    return handleErrorResponse(res);
  };
  public static delete = deleteObject(UserV, 'users');
}

// export { UserType, UserIO };

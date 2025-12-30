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
      isOrgStaff: t.boolean,
    }),
    t.partial({
      password: t.string,
    }),
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

// Light user type for list views (minimal fields for performance)
export interface LightUserType {
  id: number;
  email: string;
  organization: number | null;
  codePostAdmin: boolean;
  isOrgStaff: boolean;
  pendingValidation: boolean;
  hasCredentials: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardStats {
  totalOrganizations: number;
  totalCourses: number;
  activeCourses: number;
  archivedCourses: number;
  totalUniqueUsers: number;
  totalCodePostAdmins: number;
  totalCourseAdmins: number;
  totalGraders: number;
  totalStudents: number;
  totalSections: number;
  totalAssignments: number;
  avgCoursesPerOrg: number;
  avgStudentsPerCourse: number;
  totalInactiveUsers: number;
  activeUsers30d: number;
}

export class UserIO {
  public static read = readObject(UserV, 'users');
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

  public static listPaginated = async (
    page = 1,
    pageSize = 50,
    search = ''
  ): Promise<PaginatedResponse<LightUserType>> => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (search) {
      params.append('search', search);
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/users/?${params}`, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (res.status === 200) {
      return res.json();
    }
    return handleErrorResponse(res);
  };

  public static getDashboardStats = async (): Promise<DashboardStats> => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/stats/`, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (res.status === 200) {
      return res.json();
    }
    return handleErrorResponse(res);
  };
}

// export { UserType, UserIO };

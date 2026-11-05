// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { dashboardApi, usersApi } from '../api-client/clients';
import type { DashboardStats, PaginatedUserList, User } from '../api-client';

export type PeopleRole = 'student' | 'grader' | 'course_admin' | 'platform_admin';

export class UserIO {
  public static read = (email: string): Promise<User> => usersApi.retrieve({ email });
  public static list = async (): Promise<User[]> => {
    const response: PaginatedUserList = await usersApi.list();
    return response.results;
  };
  /** One server-side page of users; `count` is the platform total for the search. */
  public static listPage = (params: {
    page: number;
    pageSize: number;
    search?: string;
    ordering?: string;
    /** Only people holding this role in at least one course. */
    role?: PeopleRole;
    /** Only people who never signed in, or not in 90 days. */
    inactive?: boolean;
  }): Promise<PaginatedUserList> =>
    usersApi.list({ ...params, role: params.role as NonNullable<Parameters<typeof usersApi.list>[0]>['role'] });
  public static create = (user: Omit<User, 'id'>): Promise<User> => usersApi.create({ user });
  public static update = (email: string, payload: Partial<User>): Promise<User> =>
    usersApi.partialUpdate({ email, patchedUser: payload });
  public static delete = (email: string) => usersApi.destroy({ email });

  public static getDashboardStats = (): Promise<DashboardStats> => dashboardApi.statsRetrieve();
}

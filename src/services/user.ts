import { dashboardApi, usersApi } from '../api-client/clients';
import type { DashboardStats, PaginatedUserList, User } from '../api-client';

export class UserIO {
  public static read = (id: number): Promise<User> => usersApi.retrieve({ id });
  public static list = (): Promise<PaginatedUserList> => usersApi.list();
  public static create = (user: Omit<User, 'id'>): Promise<User> => usersApi.create({ user });
  public static update = (id: number, payload: Partial<User>): Promise<User> =>
    usersApi.partialUpdate({ id, patchedUser: payload });
  public static delete = (id: number) => usersApi.destroy({ id });

  public static getDashboardStats = (): Promise<DashboardStats> => dashboardApi.statsRetrieve();
}

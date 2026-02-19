import { dashboardApi, usersApi } from '../api-client/clients';
import type { DashboardStats, PaginatedUserList, User } from '../api-client';

export class UserIO {
  public static read = (email: string): Promise<User> => usersApi.retrieve({ email });
  public static list = async (): Promise<User[]> => {
    const response: PaginatedUserList = await usersApi.list();
    return response.results;
  };
  public static create = (user: Omit<User, 'id'>): Promise<User> => usersApi.create({ user });
  public static update = (email: string, payload: Partial<User>): Promise<User> =>
    usersApi.partialUpdate({ email, patchedUser: payload });
  public static delete = (email: string) => usersApi.destroy({ email });

  public static getDashboardStats = (): Promise<DashboardStats> => dashboardApi.statsRetrieve();
}

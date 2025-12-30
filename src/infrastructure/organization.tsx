import * as t from 'io-ts';
import { GenericObject, listObject, createObject, readObject, getHeaders, handleErrorResponse } from './generics';
import { UserType } from './user';

export const OrganizationV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      shortname: t.string,
      emailDomain: t.union([t.string, t.null]),
      sso_enabled: t.boolean,
      send_welcome_email: t.boolean,
    }),
    t.partial({
      sso_provider: t.union([t.string, t.null]),
      sso_config: t.unknown,
    }),
  ],
  'Organization',
);

export type OrganizationType = t.TypeOf<typeof OrganizationV>;

export class Organization {
  public static list = listObject(OrganizationV, 'organizations');
  public static read = readObject(OrganizationV, 'organizations');
  public static create = createObject(OrganizationV, OrganizationV, 'organizations');

  static async getUsers(id: number): Promise<UserType[]> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${id}/users/`, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (res.status === 200) {
      const data = await res.json();
      // Decode if strict validation needed, but for now direct return
      return data;
    }
    return handleErrorResponse(res);
  }

  static async verifyUser(id: number, email: string, action: 'approve' | 'decline'): Promise<void> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${id}/verify_user/`, {
      headers: getHeaders(),
      method: 'POST',
      body: JSON.stringify({ user_email: email, action }),
    });

    if (res.status === 200) {
      return;
    }
    return handleErrorResponse(res);
  }

  static async promoteStaff(id: number, email: string): Promise<void> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${id}/promote_staff/`, {
      headers: getHeaders(),
      method: 'POST',
      body: JSON.stringify({ user_email: email }),
    });

    if (res.status === 200) {
      return;
    }
    return handleErrorResponse(res);
  }

  static async demoteStaff(id: number, email: string): Promise<void> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${id}/demote_staff/`, {
      headers: getHeaders(),
      method: 'POST',
      body: JSON.stringify({ user_email: email }),
    });

    if (res.status === 200) {
      return;
    }
    return handleErrorResponse(res);
  }

  static async removeUser(id: number, email: string): Promise<void> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${id}/remove_user/`, {
      headers: getHeaders(),
      method: 'POST',
      body: JSON.stringify({ user_email: email }),
    });

    if (res.status === 200) {
      return;
    }
    return handleErrorResponse(res);
  }

  static async resetUserPassword(id: number, email: string): Promise<void> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${id}/reset_user_password/`, {
      headers: getHeaders(),
      method: 'POST',
      body: JSON.stringify({ user_email: email }),
    });

    if (res.status === 200) {
      return;
    }
    return handleErrorResponse(res);
  }

  static async getAnalytics(id: number): Promise<{
    total_users: number;
    active_users: number;
    total_courses: number;
    active_courses: number;
    total_submissions: number;
    submissions_this_month: number;
  }> {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/organizations/${id}/analytics/`, {
      headers: getHeaders(),
      method: 'GET',
    });

    if (res.status === 200) {
      return res.json();
    }
    return handleErrorResponse(res);
  }
}

// export { Organization, OrganizationType };

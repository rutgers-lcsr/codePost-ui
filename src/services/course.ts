// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { coursesApi, apiClientConfig } from '../api-client/clients';
import type { Course as CourseModel, CourseRoster, CourseSettings } from '../api-client';
import { getAuthToken } from '../utils/auth';

// ─── Types for Course API Keys ────────────────────────────────────────────────

export interface CourseAPIKey {
  id: number;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdBy: string | null;
  created: string;
  modified: string;
}

export interface CourseAPIKeyCreateResponse extends CourseAPIKey {
  key: string; // Raw key — only returned on creation
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function basePath(): string {
  return apiClientConfig.basePath ?? '';
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${basePath()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.detail ?? body.error ?? res.statusText), { status: res.status, body });
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Course Service ───────────────────────────────────────────────────────────

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

  // ── API Keys ──────────────────────────────────────────────────────────────

  public static listAPIKeys = (courseId: number): Promise<CourseAPIKey[]> =>
    apiFetch(`/courses/${courseId}/apiKeys/`);

  public static createAPIKey = (courseId: number, name: string): Promise<CourseAPIKeyCreateResponse> =>
    apiFetch(`/courses/${courseId}/apiKeys/`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

  public static updateAPIKey = (courseId: number, keyId: number, payload: { name?: string; isActive?: boolean }) =>
    apiFetch<CourseAPIKey>(`/courses/${courseId}/apiKeys/${keyId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

  public static deleteAPIKey = (courseId: number, keyId: number) =>
    apiFetch<void>(`/courses/${courseId}/apiKeys/${keyId}/`, { method: 'DELETE' });
}

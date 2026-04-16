// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '../../../api-client/clients';
import { courseKeys } from '../../../lib/queryKeys';
import { CourseRoster } from '../../../api-client';

export type RosterData = {
  id?: number;
  name?: string;
  period?: string;
  students: string[];
  graders: string[];
  inactive_students: string[];
  inactive_graders: string[];
  inactive_courseAdmins?: string[];
  courseAdmins: string[];
  superGraders: string[];
  rubricEditors: string[];
  not_activated: string[];
  organization?: number;
};

export const normalizeRoster = (roster: CourseRoster | RosterData): RosterData => {
  if ('inactive_students' in roster) {
    return roster as RosterData;
  }

  const toStrings = (values?: Array<string | null>) => (values ?? []).filter((v): v is string => Boolean(v));
  const rosterApi = roster as CourseRoster;

  return {
    id: rosterApi.id,
    name: rosterApi.name,
    period: rosterApi.period,
    students: toStrings(rosterApi.students),
    inactive_students: toStrings(rosterApi.inactiveStudents),
    inactive_graders: toStrings(rosterApi.inactiveGraders),
    inactive_courseAdmins: toStrings(rosterApi.inactiveCourseAdmins),
    graders: toStrings(rosterApi.graders),
    superGraders: toStrings(rosterApi.superGraders),
    rubricEditors: toStrings(rosterApi.rubricEditors),
    courseAdmins: toStrings(rosterApi.courseAdmins),
    not_activated: rosterApi.notActivated ?? [],
    organization: rosterApi.organization,
  };
};

export const useRosterQuery = (courseId: number | undefined) => {
  return useQuery({
    queryKey: courseKeys.roster(courseId ?? -1),
    queryFn: async () => {
      const roster = await coursesApi.rosterRetrieve({ id: courseId! });
      return normalizeRoster(roster);
    },
    enabled: !!courseId,
  });
};

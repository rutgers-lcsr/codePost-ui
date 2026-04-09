// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import { useMemo } from 'react';
import { Course } from '../../api-client';

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export interface AdminCourseStats {
  activeCourses: number;
  archivedCourses: number;
  totalStudents: number;
  totalAssignments: number;
}

export interface AdminDashboardData {
  stats: AdminCourseStats;
  activeCourses: Course[];
  archivedCourses: Course[];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Hook                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export function useAdminDashboardData(courses: Course[]): AdminDashboardData {
  return useMemo(() => {
    const active = courses.filter((c) => !c.archived);
    const archived = courses.filter((c) => c.archived);

    const sortCourses = (a: Course, b: Course) => {
      const nameCompare = a.name.localeCompare(b.name);
      return nameCompare !== 0 ? nameCompare : a.period.localeCompare(b.period);
    };

    const sortedActive = [...active].sort(sortCourses);
    const sortedArchived = [...archived].sort(sortCourses);

    let totalStudents = 0;
    let totalAssignments = 0;

    for (const course of active) {
      totalStudents += course.studentCount ?? 0;
      totalAssignments += course.assignments?.length ?? 0;
    }

    return {
      stats: {
        activeCourses: active.length,
        archivedCourses: archived.length,
        totalStudents,
        totalAssignments,
      },
      activeCourses: sortedActive,
      archivedCourses: sortedArchived,
    };
  }, [courses]);
}

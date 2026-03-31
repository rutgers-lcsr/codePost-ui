// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { coursesApi } from '../api-client/clients';
import type { CourseAuditEvent, PaginatedCourseAuditEventList } from '../api-client';

export interface AuditLogQueryParams {
  student?: string;
  assignment?: number;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export class CourseAuditLogService {
  public static list = (courseId: number, params: AuditLogQueryParams = {}): Promise<PaginatedCourseAuditEventList> =>
    coursesApi.auditLogList({
      id: courseId,
      student: params.student,
      assignment: params.assignment,
      eventType: params.eventType,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page: params.page,
      pageSize: params.pageSize,
    });

  public static exportCsv = async (courseId: number, params: AuditLogQueryParams = {}): Promise<void> => {
    const response = await coursesApi.auditLogExportRetrieveRaw({
      id: courseId,
      student: params.student,
      assignment: params.assignment,
      eventType: params.eventType,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
    const blob = await response.raw.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_course_${courseId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };
}

export type { CourseAuditEvent };

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { coursesApi } from '../api-client/clients';

export interface GradebookExportOptions {
  /** Customizes the file name (e.g. "cs336-f2026"); falls back to the course id. */
  label?: string;
  /** Comma-separated assignment ids to include; omit for all ('' for none). */
  assignments?: string;
  /** Comma-separated quiz ids to include; omit for all ('' for none). */
  quizzes?: string;
  /** Restrict rows to students in this section; omit for all. */
  section?: string;
}

export class CourseGradebookService {
  /** Download the course gradebook CSV (server-generated, same data as the grid,
   *  optionally restricted to chosen columns/section — totals follow the selection). */
  public static exportCsv = async (courseId: number, options: GradebookExportOptions = {}): Promise<void> => {
    const response = await coursesApi.gradebookExportRetrieveRaw({
      id: courseId,
      assignments: options.assignments,
      quizzes: options.quizzes,
      section: options.section,
    });
    const blob = await response.raw.blob();
    const url = window.URL.createObjectURL(blob);
    const safe = (options.label ?? `course_${courseId}`).replace(/[^\w.-]+/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook_${safe}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };
}

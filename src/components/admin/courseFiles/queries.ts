// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useQuery } from '@tanstack/react-query';
import { courseFilesApi } from '../../../api-client/clients';
import { CourseFile } from '../../../api-client';
import { courseKeys } from '../../../lib/queryKeys';
import { withQueryParams } from '../../../utils/apiClient';

/** A course's course-level files (`GET /courseFiles/?course=<id>`). The generated `list()`
 *  sends no query params, but the backend requires `?course=<id>` (403 otherwise), so the
 *  request goes through `withQueryParams`. These files are usable as `{course_file:name}`
 *  context in AI quiz prompts. */
export const useCourseFiles = (courseId: number | undefined) =>
  useQuery({
    queryKey: courseKeys.files(courseId ?? -1),
    queryFn: (): Promise<CourseFile[]> => withQueryParams(courseFilesApi, { course: courseId! }).list(),
    enabled: !!courseId,
  });

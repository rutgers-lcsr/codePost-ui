// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../../api-client/clients';
import { assignmentKeys } from '../../../lib/queryKeys';
import { Assignment } from '../../../types/common';
import { Course } from '../../../api-client';

const sanitizeAssignment = (result: Assignment): Assignment => ({
  ...result,
  isReleased: result.isReleased ?? false,
  feedbackReleased: result.feedbackReleased ?? false,
  hideGrades: result.hideGrades ?? false,
  isVisible: result.isVisible ?? false,
  allowStudentUpload: result.allowStudentUpload ?? false,
  allowStudentUploadWithPartners: result.allowStudentUploadWithPartners ?? false,
  commentFeedback: result.commentFeedback ?? false,
  anonymousGrading: result.anonymousGrading ?? false,
  hideGradersFromStudents: result.hideGradersFromStudents ?? false,
  allowRegradeRequests: result.allowRegradeRequests ?? false,
  liveFeedbackMode: result.liveFeedbackMode ?? false,
  additiveGrading: result.additiveGrading ?? false,
  collaborativeRubricMode: result.collaborativeRubricMode ?? false,
  forcedRubricMode: result.forcedRubricMode ?? false,
  templateMode: result.templateMode ?? false,
  showFrequentlyUsedRubricComments: result.showFrequentlyUsedRubricComments ?? false,
  allowLateUploads: result.allowLateUploads ?? false,
  nudgeMode: result.nudgeMode ?? false,
  runFilesOnSubmit: result.runFilesOnSubmit ?? true,
  runTestsOnSubmit: result.runTestsOnSubmit ?? true,
  testsAffectGrade: result.testsAffectGrade ?? true,

  sortKey: result.sortKey ?? 0,
  points: result.points,
  maxLateDays: result.maxLateDays ?? 0,
  course: result.course,

  environment: result.environment ?? null,
  maxStudentTestRuns: result.maxStudentTestRuns ?? null,
  mean: result.mean ?? null,
  median: result.median ?? null,

  explanation: result.explanation ?? '',
  regradeInstructions: result.regradeInstructions ?? '',

  uploadDueDate: result.uploadDueDate ?? null,
  regradeDeadline: result.regradeDeadline ?? null,
  studentsCanSeeGraders: result.studentsCanSeeGraders ?? null,

  rubricCategories: result.rubricCategories ?? [],
  files: result.files ?? [],
  fileTemplates: result.fileTemplates ?? [],
  testCategories: result.testCategories ?? [],
  dataSets: result.dataSets ?? [],
  hideFrom: result.hideFrom ?? [],
  lateDeductions: result.lateDeductions ?? [],
});

const sortAssignments = (assignments: Assignment[]) => {
  return [...assignments].sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
};

/**
 * Fetch every assignment the caller may see in one request (the API's
 * courses/{id}/assignments/ aggregate — the old path was one retrieve per id),
 * and seed the per-id caches so assignmentKeys.detail consumers stay warm.
 */
const fetchCourseAssignments = async (queryClient: QueryClient, courseId: number): Promise<Assignment[]> => {
  const results = await coursesApi.assignmentsList({ id: courseId });
  const sanitized = results.map(sanitizeAssignment);
  sanitized.forEach((assignment) => queryClient.setQueryData(assignmentKeys.detail(assignment.id), assignment));
  return sortAssignments(sanitized);
};

export const useAssignmentsQuery = (course: Course | undefined) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: assignmentKeys.list(course?.id ?? -1),
    queryFn: () => fetchCourseAssignments(queryClient, course!.id),
    enabled: !!course,
  });
};

export { fetchCourseAssignments, sanitizeAssignment, sortAssignments };

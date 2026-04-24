// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import queryString from 'query-string';
import { useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  ICodeConsoleState,
  PANEL_TYPE,
  PERMISSION_LEVEL,
} from '../../../types/CodeConsole.types';
import {
  ICommentToRubricCommentMap,
  IFileToCommentsMap,
  IRubricCategoryToRubricCommentsMap,
} from '../../../types/common';
import {
  assignmentFilesApi,
  assignmentsApi,
  coursesApi,
  submissionTestsApi,
  submissionsApi,
} from '../../../api-client/clients';
import { assignmentKeys, submissionKeys } from '../../../lib/queryKeys';
import {
  Course,
  CourseRoster,
  RubricCategory,
} from '../../../api-client';
import type {
  AssignmentFileType,
  AssignmentType,
  AnonymousSubmissionType,
  StudentTestCaseType,
  StudentSubmissionType,
  SubmissionTestType,
  TestCaseType,
  TestCategoryType,
} from '../../../types/models';
import { FileWithId } from '../../../utils/file';
import { Submission as SubmissionService } from '../../../services/submission';
import { getLatestSubmissionTests } from '../../../utils/submissionTests';
import { usePermissionsStore } from '../../../stores/usePermissionsStore';
import type { Capabilities } from '../../../stores/usePermissionsStore';

import { loadDemoGrader, loadDemoStudent } from '../demo';
import { fetchTestData, StudentTestCasesByCategory, TestCasesByCategory } from '../types';
import { getCourseAISettings } from '../../../utils/aiService';
import {
  calculateGrade,
  fileBouncer,
  processRubricResponse,
  selectInitialFile,
} from '../codeConsoleUtils';

interface UseConsoleLoaderOptions {
  userEmail: string;
  courseadminCourses: Array<{ id: number }>;
  superGraderCourses: Array<{ id: number }>;
  inDemoMode: boolean;
  setState: (updater: React.SetStateAction<ICodeConsoleState>) => void;
}

/**
 * Hook that encapsulates all data-loading logic for the Code Console.
 *
 * Handles permission checking, submission/assignment/course/rubric fetching,
 * test data loading, AI settings, and demo mode initialization.
 *
 * Returns:
 * - `loadDemoData` — needed by CodeConsoleOnboardingSelector for file uploads
 * - `componentDidMountLogic` — the main loader, called once from a useEffect in CodeConsole
 */
export function useConsoleLoader({
  userEmail,
  courseadminCourses,
  superGraderCourses,
  inDemoMode,
  setState,
}: UseConsoleLoaderOptions) {
  const location = useLocation();
  const params = useParams<{ submissionId?: string }>();
  const queryClient = useQueryClient();

  const loadDemoData = React.useCallback(
    (filesToLoad: Array<{ name: string; data: string }>, studentSample?: boolean) => {
      const demoState =
        studentSample !== undefined && studentSample
          ? loadDemoStudent(filesToLoad, userEmail)
          : loadDemoGrader(filesToLoad, userEmail);

      setState((prev) => ({ ...prev, ...(demoState as Partial<ICodeConsoleState>) }));
    },
    [userEmail, setState],
  );

  const isCourseAdmin = React.useCallback(
    (assignmentToCheck: AssignmentType | undefined) => {
      if (!assignmentToCheck || !assignmentToCheck.course) {
        return false;
      }

      return courseadminCourses
        .map((course) => {
          return course.id;
        })
        .includes(assignmentToCheck.course);
    },
    [courseadminCourses],
  );

  // Component mount logic
  const componentDidMountLogic = React.useCallback(async () => {
    // CommandBar loading callbacks

    // Other stuff

    const queryValues = queryString.parse(location.search);

    if (inDemoMode) {
      document.title = 'codePost | Code Console Demo';

      /**********************************************************************************/
      /* BEGIN: QUERY ARG PARSING
			/**********************************************************************************/

      const isStudentPath = location.pathname.endsWith('/student');
      if (isStudentPath || (queryValues.sample && queryValues.sample === '1')) {
        loadDemoData([], true);
      } else {
        loadDemoData([], false);
      }

      /**********************************************************************************/
      /* END: QUERY ARG PARSING
			/**********************************************************************************/

      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Set window title
    const submissionIdParam = params.submissionId;
    if (!submissionIdParam) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }
    const submissionID: number = +submissionIdParam.valueOf();

    let permissionLevel: PERMISSION_LEVEL;
    try {
      const permissions = await queryClient.ensureQueryData({
        queryKey: submissionKeys.permissions(submissionID),
        queryFn: () => submissionsApi.checkPermissionRetrieve({ id: submissionID }),
        staleTime: 30_000,
      });

      // Feed capabilities into the permissions store
      if (permissions.capabilities) {
        usePermissionsStore
          .getState()
          .setCapabilities(`submission:${submissionID}`, permissions.capabilities as Capabilities);
      }

      if (permissions.write) {
        permissionLevel = PERMISSION_LEVEL.WRITE;
      } else if (permissions.filesOnly) {
        permissionLevel = PERMISSION_LEVEL.READ_FILES_ONLY;
      } else if (permissions.read) {
        permissionLevel = PERMISSION_LEVEL.READ;
      } else {
        permissionLevel = PERMISSION_LEVEL.NONE;
      }
    } catch (error) {
      console.error('Failed to fetch submission permissions', error);
      permissionLevel = PERMISSION_LEVEL.NOT_FOUND;
    }

    const values = queryString.parse(location.search);
    let simulatingStudent = false;

    // Check for permissionLevel override in query params (admin only)
    // permissionLevel: 0=NOT_FOUND, 1=NONE, 2=READ, 3=READ_FILES_ONLY, 4=WRITE
    if (values.permissionLevel !== undefined && permissionLevel === PERMISSION_LEVEL.WRITE) {
      const levelOverride = parseInt(values.permissionLevel as string);
      if (!isNaN(levelOverride)) {
        if (levelOverride === 0) {
          permissionLevel = PERMISSION_LEVEL.NOT_FOUND;
        } else if (levelOverride === 1) {
          permissionLevel = PERMISSION_LEVEL.NONE;
        } else if (levelOverride === 2) {
          permissionLevel = PERMISSION_LEVEL.READ;
        } else if (levelOverride === 3) {
          permissionLevel = PERMISSION_LEVEL.READ_FILES_ONLY;
        } else if (levelOverride === 4) {
          permissionLevel = PERMISSION_LEVEL.WRITE;
        }
      }
    }

    if (permissionLevel === PERMISSION_LEVEL.WRITE && values.student !== undefined) {
      permissionLevel = PERMISSION_LEVEL.READ;
      simulatingStudent = true;
    }

    let noSave = false;
    if (values.noSave !== undefined) {
      noSave = true;
    }

    // Everything we need to load
    let submission: StudentSubmissionType | AnonymousSubmissionType | undefined;
    let assignment: AssignmentType | undefined;
    let files: FileWithId[] = [];
    let comments: IFileToCommentsMap = {};
    let commentRubricComments: ICommentToRubricCommentMap = {};
    let course: Course | undefined;
    let rubricCategories: RubricCategory[] = [];
    let rubricComments: IRubricCategoryToRubricCommentsMap = {};
    let selectedFile: FileWithId | undefined;
    let tests: SubmissionTestType[];
    let panelTypeOverride: PANEL_TYPE | undefined;
    let activeSiderKeyOverride: string | undefined;

    if (queryValues.tab !== undefined) {
      const tabValue = queryValues.tab as string;
      // Check if it's a sidebar key string (e.g., 'tests-menu', 'file-menu')
      if (tabValue === 'tests-menu') {
        activeSiderKeyOverride = 'tests-menu';
        panelTypeOverride = PANEL_TYPE.TESTS;
      } else if (tabValue === 'file-menu') {
        activeSiderKeyOverride = 'file-menu';
        panelTypeOverride = PANEL_TYPE.FILE;
      } else if (tabValue === 'submission-info' || tabValue === 'rubric-menu' || tabValue === 'template-menu') {
        activeSiderKeyOverride = tabValue;
        // Keep default for panelTypeOverride (show file in main content)
      } else {
        // Legacy: numeric PANEL_TYPE
        const t = parseInt(tabValue);
        if (!isNaN(t)) {
          panelTypeOverride = t;
          activeSiderKeyOverride = t === PANEL_TYPE.TESTS ? 'tests-menu' : 'file-menu';
        }
      }
    }

    switch (permissionLevel) {
      case PERMISSION_LEVEL.NOT_FOUND:
      case PERMISSION_LEVEL.NONE: {
        // Will trigger 403 or 404 message in render
        setState((prev) => ({ ...prev, permissionLevel, isLoading: false }));
        break;
      }
      case PERMISSION_LEVEL.READ_FILES_ONLY: {
        // load the data with files only (no comments, rubrics, or grades)
        const res = await fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionID}/?filesOnly=true`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!res.ok) {
          setState((prev) => ({ ...prev, permissionLevel: PERMISSION_LEVEL.NONE, isLoading: false }));
          break;
        }

        const submissionData: StudentSubmissionType = await res.json();
        assignment = (await assignmentsApi.retrieve({ id: submissionData.assignment })) as unknown as AssignmentType;

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        // Start course fetch immediately (chained off assignment — runs while we process files below)
        const coursePromise = coursesApi.retrieve({ id: assignment.course }).then((c) => c as unknown as Course);

        // Files are already included in the response as full objects
        files = (submissionData.files as FileWithId[]) || [];

        files = files.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

        files = fileBouncer(files) as FileWithId[];

        if (selectedFile === undefined && files.length > 0) {
          selectedFile = files[0];
        }

        // No comments, rubrics, or tests in files-only mode
        comments = {};
        commentRubricComments = {};
        rubricCategories = [];
        tests = [];

        course = await coursePromise;

        setState((prev) => ({
          ...prev,
          noSave,
          assignment,
          course,
          readOnlySubmission: submissionData,
          files,
          comments,
          commentRubricComments,
          rubricCategories,
          isLoading: false,
          selectedFile,
          permissionLevel,
          testCategories: [],
          testCases: {},
          tests: [],
          isStudent: true,
        }));

        break;
      }
      case PERMISSION_LEVEL.READ: {
        // load the data a reader has access to
        const readSubmission = (await queryClient.ensureQueryData({
          queryKey: submissionKeys.detail(submissionID),
          queryFn: () => submissionsApi.retrieve({ id: submissionID }),
          staleTime: 30_000,
        })) as unknown as StudentSubmissionType;
        submission = readSubmission;
        [[assignment, course], [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
          await Promise.all([
            queryClient
              .ensureQueryData({
                queryKey: assignmentKeys.detail(readSubmission.assignment),
                queryFn: () => assignmentsApi.retrieve({ id: readSubmission.assignment }),
                staleTime: 60_000,
              })
              .then(async (a) => {
                const assnTyped = a as unknown as AssignmentType;
                const c = (await coursesApi.retrieve({ id: assnTyped.course })) as unknown as Course;
                return [assnTyped, c] as const;
              }),
            SubmissionService.loadConsoleData(readSubmission.id).then(([_data, f, c, rc]) => [f, c, rc]) as unknown as [
              FileWithId[],
              IFileToCommentsMap,
              ICommentToRubricCommentMap,
            ],
            queryClient
              .ensureQueryData({
                queryKey: assignmentKeys.rubric(readSubmission.assignment),
                queryFn: () => assignmentsApi.rubricRetrieve({ id: readSubmission.assignment }),
                staleTime: 60_000,
              })
              .then(processRubricResponse),
          ]);

        document.title = `${submissionID}-Submission [${assignment.name}]`;

        ({ files, selectedFile } = selectInitialFile(files, {
          file: queryValues.file as string | undefined,
          comment: queryValues.comment as string | undefined,
        }));

        // Read tests
        const { testCases, testCategories } = (await assignmentsApi.studentTestsRetrieve({
          id: assignment.id,
        })) as unknown as { testCases: StudentTestCaseType[]; testCategories: TestCategoryType[] };
        const caseObj: StudentTestCasesByCategory = {};
        testCategories.forEach((category) => {
          caseObj[category.id] = [];
        });
        testCases.forEach((testCase) => {
          caseObj[testCase.testCategory] = [...caseObj[testCase.testCategory], testCase];
        });
        tests = submission.tests
          ? await Promise.all(submission.tests.map((id) => submissionTestsApi.retrieve({ id })))
          : [];

        // then store it in state
        setState((prev) => ({
          ...prev,
          noSave,
          assignment,
          course,
          readOnlySubmission: submission as StudentSubmissionType,
          files,
          comments,
          commentRubricComments,
          rubricCategories,
          isLoading: false,
          selectedFile,
          permissionLevel,
          testCategories,
          testCases: caseObj,
          tests: getLatestSubmissionTests(tests),
          isStudent:
            simulatingStudent ||
            (submission?.students !== undefined && submission.students.indexOf(userEmail) > -1),
          panelType: panelTypeOverride !== undefined ? panelTypeOverride : prev.panelType,
          activeSiderKey: activeSiderKeyOverride ?? prev.activeSiderKey,
        }));

        if (assignment && assignment.liveFeedbackMode) {
          // reloadCommentsInterval.current = window.setInterval(() => {
          //   reloadComments();
          // }, LIVE_FEEDBACK_COMMENTS_RELOAD_INTERVAL);
        }

        break;
      }

      case PERMISSION_LEVEL.WRITE: {
        // load the data a writer has access to

        const writableSubmission = (await queryClient.ensureQueryData({
          queryKey: submissionKeys.detail(submissionID),
          queryFn: () => submissionsApi.retrieve({ id: submissionID }),
          staleTime: 30_000,
        })) as AnonymousSubmissionType;

        // Check for prefetched files data
        const cachedFiles = queryClient.getQueryData(submissionKeys.files(submissionID)) as
          | [FileWithId[], IFileToCommentsMap, ICommentToRubricCommentMap]
          | undefined;

        [[assignment, course], [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
          await Promise.all([
            queryClient
              .ensureQueryData({
                queryKey: assignmentKeys.detail(writableSubmission.assignment),
                queryFn: () => assignmentsApi.retrieve({ id: writableSubmission.assignment }),
                staleTime: 60_000,
              })
              .then(async (a) => {
                const assnTyped = a as unknown as AssignmentType;
                const c = (await coursesApi.retrieve({ id: assnTyped.course })) as unknown as Course;
                return [assnTyped, c] as const;
              }),
            cachedFiles
              ? (Promise.resolve(cachedFiles) as unknown as [
                  FileWithId[],
                  IFileToCommentsMap,
                  ICommentToRubricCommentMap,
                ])
              : (SubmissionService.loadConsoleData(writableSubmission.id).then(([_data, f, c, rc]) => [
                  f,
                  c,
                  rc,
                ]) as unknown as [FileWithId[], IFileToCommentsMap, ICommentToRubricCommentMap]),
            queryClient
              .ensureQueryData({
                queryKey: assignmentKeys.rubric(writableSubmission.assignment),
                queryFn: () => assignmentsApi.rubricRetrieve({ id: writableSubmission.assignment }),
                staleTime: 60_000,
              })
              .then(processRubricResponse),
          ]);

        document.title = `${submissionID}-Submission [${assignment.name}]`;
        let assignmentFiles: AssignmentFileType[] = [];
        if (assignment.templateMode) {
          assignmentFiles = await Promise.all(
            (assignment.files ?? []).map((assignmentFileOrID) => {
              if (typeof assignmentFileOrID !== 'number') {
                return assignmentFileOrID;
              }
              return assignmentFilesApi.retrieve({ id: assignmentFileOrID });
            }),
          );
        }

        // load the data only an admin or super grader has access to
        let graders: string[] = [];
        let students: string[] = [];

        const isSuperGrader = superGraderCourses.some((c) => c.id === assignment!.course);

        if (isCourseAdmin(assignment!) || isSuperGrader) {
          const roster = (await coursesApi.rosterRetrieve({
            id: assignment!.course,
          })) as unknown as CourseRoster;
          graders = [...(roster.graders || []), ...(roster.courseAdmins || [])].filter(
            (grader): grader is string => typeof grader === 'string',
          );
          students = (roster.students || []).filter((student): student is string => typeof student === 'string');
        }

        tests = await Promise.all(writableSubmission.tests.map((id) => submissionTestsApi.retrieve({ id })));
        const [categories, cases] = await fetchTestData(assignment);

        ({ files, selectedFile } = selectInitialFile(files, {
          file: queryValues.file as string | undefined,
          comment: queryValues.comment as string | undefined,
        }, { skipSelection: panelTypeOverride === PANEL_TYPE.TESTS }));

        // fill in grade using available data if submission doesn't contain an up-to-date grade
        let submissionWithGrade: AnonymousSubmissionType = writableSubmission;
        if (assignment && !writableSubmission.isFinalized) {
          const testCasesArray: TestCaseType[] = Array.isArray(cases) ? cases : Object.values(cases).flat();
          const calculatedGrade = calculateGrade(
            assignment,
            comments,
            commentRubricComments,
            rubricCategories,
            files,
            getLatestSubmissionTests(tests),
            testCasesArray,
          );
          submissionWithGrade = { ...writableSubmission, grade: calculatedGrade };
        }

        // Fetch AI settings for this course
        let aiEnabled = false;
        let aiFeatureStatus: Record<string, boolean> = {};
        try {
          const aiSettings = await getCourseAISettings(course!.id);
          aiEnabled = aiSettings.aiCommentsEnabled ?? aiSettings.aiEnabled;
          aiFeatureStatus =
            ((aiSettings as unknown as Record<string, unknown>).aiFeatures as Record<string, boolean>) ?? {};
        } catch {
          // AI settings not available or user doesn't have permission
          aiEnabled = false;
        }

        setState((prev) => ({
          ...prev,
          noSave,
          assignment,
          course,
          submission: submissionWithGrade,
          files,
          comments,
          commentRubricComments,
          rubricCategories,
          rubricComments,
          graders,
          students,
          isLoading: false,
          selectedFile,
          permissionLevel,
          assignmentFiles,
          tests: getLatestSubmissionTests(tests),
          testCategories: Array.isArray(categories) ? categories : [],
          testCases: cases as TestCasesByCategory,
          aiEnabled,
          aiFeatureStatus,
          panelType: panelTypeOverride !== undefined ? panelTypeOverride : prev.panelType,
          activeSiderKey: activeSiderKeyOverride ?? prev.activeSiderKey,
        }));
        break;
      }
    }

    // Populate the permissions store with course capabilities from the embedded serializer field
    if (course && course.capabilities) {
      usePermissionsStore.getState().setCapabilities(`course:${course.id}`, course.capabilities as Capabilities);
    }

    // Fetch assignment-level capabilities so the DevPanel shows them alongside submission caps
    if (assignment) {
      usePermissionsStore.getState().fetchAssignmentCapabilities(assignment.id);
    }
  }, [
    location.pathname,
    isCourseAdmin,
    loadDemoData,
    location.search,
    params.submissionId,
    inDemoMode,
    userEmail,
    superGraderCourses,
    setState,
    queryClient,
  ]);

  return { loadDemoData, componentDidMountLogic };
}

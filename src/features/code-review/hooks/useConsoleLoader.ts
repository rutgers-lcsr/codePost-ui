// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import queryString from 'query-string';
import { useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { ICodeConsoleState, PANEL_TYPE, PERMISSION_LEVEL } from '../../../types/CodeConsole.types';
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
import { Course, CourseRoster, RubricCategory, SubmissionConsoleData } from '../../../api-client';
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
import { getAuthToken } from '../../../utils/auth';
import { Submission as SubmissionService } from '../../../services/submission';
import { getLatestSubmissionTests } from '../../../utils/submissionTests';
import { usePermissionsStore } from '../../../stores/usePermissionsStore';
import type { Capabilities } from '../../../stores/usePermissionsStore';

import { loadDemoGrader, loadDemoStudent } from '../demo';
import { fetchTestData, StudentTestCasesByCategory, TestCasesByCategory } from '../types';
import { getCourseAISettings } from '../../../utils/aiService';
import { calculateGrade, processRubricResponse, selectInitialFile } from '../codeConsoleUtils';

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

    let simulatingStudent = false;

    // Check for permissionLevel override in query params (admin only)
    const PERMISSION_LEVEL_MAP: Record<number, PERMISSION_LEVEL> = {
      0: PERMISSION_LEVEL.NOT_FOUND,
      1: PERMISSION_LEVEL.NONE,
      2: PERMISSION_LEVEL.READ,
      3: PERMISSION_LEVEL.READ_FILES_ONLY,
      4: PERMISSION_LEVEL.WRITE,
    };
    if (queryValues.permissionLevel !== undefined && permissionLevel === PERMISSION_LEVEL.WRITE) {
      const levelOverride = parseInt(queryValues.permissionLevel as string);
      if (levelOverride in PERMISSION_LEVEL_MAP) {
        permissionLevel = PERMISSION_LEVEL_MAP[levelOverride];
      }
    }

    if (permissionLevel === PERMISSION_LEVEL.WRITE && queryValues.student !== undefined) {
      permissionLevel = PERMISSION_LEVEL.READ;
      simulatingStudent = true;
    }

    const noSave = queryValues.noSave !== undefined;

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
    let temporaryFileContent: Record<number, string> = {};

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
        // TODO: Use submissionsApi.retrieve() once the generated client supports ?filesOnly=true
        const res = await fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionID}/?filesOnly=true`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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

        // Files are already included in the response as full objects — selectInitialFile handles sort + fileBouncer
        ({ files, selectedFile } = selectInitialFile((submissionData.files as FileWithId[]) || [], {
          file: queryValues.file as string | undefined,
        }));

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
          hideGrades: assignment!.hideGrades ?? false,
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
        let consoleData: SubmissionConsoleData;
        [
          [assignment, course],
          [consoleData, files, comments, commentRubricComments],
          { rubricCategories, rubricComments },
        ] = await Promise.all([
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
          SubmissionService.loadConsoleData(readSubmission.id) as unknown as [
            SubmissionConsoleData,
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

        temporaryFileContent = Object.fromEntries(
          (consoleData.files ?? [])
            .filter((file: SubmissionConsoleData['files'][number]) => file.edit?.data !== undefined)
            .map((file: SubmissionConsoleData['files'][number]) => [file.id, file.edit.data]),
        );

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
          (caseObj[testCase.testCategory] ??= []).push(testCase);
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
          temporaryFileContent,
          testCategories,
          testCases: caseObj,
          tests: getLatestSubmissionTests(tests),
          isStudent:
            simulatingStudent || (submission?.students !== undefined && submission.students.indexOf(userEmail) > -1),
          panelType: panelTypeOverride !== undefined ? panelTypeOverride : prev.panelType,
          activeSiderKey: activeSiderKeyOverride ?? prev.activeSiderKey,
          hideGrades: assignment!.hideGrades ?? false,
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

        const cachedConsoleData = queryClient.getQueryData(submissionKeys.consoleData(submissionID)) as
          | SubmissionConsoleData
          | undefined;

        let consoleData: SubmissionConsoleData | undefined = cachedConsoleData;
        [
          [assignment, course],
          [consoleData, files, comments, commentRubricComments],
          { rubricCategories, rubricComments },
        ] = await Promise.all([
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
          cachedFiles && cachedConsoleData
            ? (Promise.resolve([cachedConsoleData, ...cachedFiles]) as unknown as [
                SubmissionConsoleData,
                FileWithId[],
                IFileToCommentsMap,
                ICommentToRubricCommentMap,
              ])
            : (SubmissionService.loadConsoleData(writableSubmission.id) as unknown as [
                SubmissionConsoleData,
                FileWithId[],
                IFileToCommentsMap,
                ICommentToRubricCommentMap,
              ]),
          queryClient
            .ensureQueryData({
              queryKey: assignmentKeys.rubric(writableSubmission.assignment),
              queryFn: () => assignmentsApi.rubricRetrieve({ id: writableSubmission.assignment }),
              staleTime: 60_000,
            })
            .then(processRubricResponse),
        ]);

        temporaryFileContent = Object.fromEntries(
          (consoleData?.files ?? [])
            .filter((file: SubmissionConsoleData['files'][number]) => file.edit?.data !== undefined)
            .map((file: SubmissionConsoleData['files'][number]) => [file.id, file.edit.data]),
        );

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

        ({ files, selectedFile } = selectInitialFile(
          files,
          {
            file: queryValues.file as string | undefined,
            comment: queryValues.comment as string | undefined,
          },
          { skipSelection: panelTypeOverride === PANEL_TYPE.TESTS },
        ));

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
          temporaryFileContent,
          assignmentFiles,
          tests: getLatestSubmissionTests(tests),
          testCategories: Array.isArray(categories) ? categories : [],
          testCases: cases as TestCasesByCategory,
          aiEnabled,
          aiFeatureStatus,
          panelType: panelTypeOverride !== undefined ? panelTypeOverride : prev.panelType,
          activeSiderKey: activeSiderKeyOverride ?? prev.activeSiderKey,
          hideGrades: assignment!.hideGrades ?? false,
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

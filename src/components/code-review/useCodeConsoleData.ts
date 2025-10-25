/**********************************************************************************************************************/
/* Custom Hook: useCodeConsoleData
 * Extracts the complex data loading logic from CodeConsole componentDidMount
 * This hook manages the initial data fetching and setup for the code console
/**********************************************************************************************************************/

import queryString from 'query-string';
import { useCallback, useEffect, useState } from 'react';

import { Assignment, AssignmentStudent, AssignmentType } from '../../infrastructure/assignment';
import { Course, CourseType } from '../../infrastructure/course';
import { FileType } from '../../infrastructure/file';
import { FileTemplate, FileTemplateType } from '../../infrastructure/fileTemplate';
import { RubricCategory, RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';
import { AnonymousSubmissionType, StudentSubmissionType, Submission } from '../../infrastructure/submission';
import { SubmissionTest, SubmissionTestType } from '../../infrastructure/submissionTest';
import { TestCategoryType } from '../../infrastructure/types';
import { UserType } from '../../infrastructure/user';

import { ICommentToRubricCommentMap, IFileToCommentsMap, IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { fetchTestData, StudentTestCasesByCategory, TestCasesByCategory } from '../core/testFetchUtils';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import * as CodeConsoleUtils from './codeConsoleUtils';

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

export enum PERMISSION_LEVEL {
  NOT_FOUND,
  NONE,
  READ,
  WRITE,
}

export interface UseCodeConsoleDataParams {
  submissionId?: string;
  location: any;
  user: UserType;
  inDemoMode: boolean;
  isCourseAdmin: (assignment?: AssignmentType) => boolean;
  loadDemoData: (files: any[], studentSample?: boolean) => any; // Returns demo state object
}

export interface CodeConsoleData {
  // Loading state
  isLoading: boolean;
  permissionLevel: PERMISSION_LEVEL;

  // Core data
  assignment?: AssignmentType;
  course?: CourseType;
  submission?: AnonymousSubmissionType;
  readOnlySubmission?: StudentSubmissionType;
  files: FileType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;

  // Rubric data
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;

  // Selected file
  selectedFile?: FileType;

  // Test data
  tests: SubmissionTestType[];
  testCategories: TestCategoryType[];
  testCases: TestCasesByCategory | StudentTestCasesByCategory;

  // Admin data
  graders: string[];
  students: string[];
  fileTemplates?: FileTemplateType[];

  // Flags
  isStudent: boolean;
  noSave?: boolean;
}

/**********************************************************************************************************************/
/* Hook Implementation
/**********************************************************************************************************************/

export const useCodeConsoleData = (params: UseCodeConsoleDataParams): CodeConsoleData => {
  const { submissionId, location, user, inDemoMode, isCourseAdmin, loadDemoData } = params;

  const [data, setData] = useState<CodeConsoleData>({
    isLoading: true,
    permissionLevel: PERMISSION_LEVEL.READ,
    files: [],
    comments: {},
    commentRubricComments: {},
    rubricCategories: [],
    rubricComments: {},
    tests: [],
    testCategories: [],
    testCases: {},
    graders: [],
    students: [],
    isStudent: false,
  });

  const loadRubric = useCallback(async (assignmentID: number) => {
    const rubric = await Assignment.readRubric(assignmentID);

    const rubricCategories = rubric.rubricCategories.sort(RubricCategory.compare);
    const rubricComments: IRubricCategoryToRubricCommentsMap = {};

    rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
      rubricComments[rubricCategory.id] = rubric.rubricComments
        .filter((rubricComment: RubricCommentType) => rubricComment.category === rubricCategory.id)
        .sort((a: RubricCommentType, b: RubricCommentType) => {
          if (a.sortKey !== null && b.sortKey !== null) {
            return a.sortKey - b.sortKey;
          }
          if (a.sortKey === null && b.sortKey === null) {
            return 0;
          }
          return a.sortKey === null ? 1 : -1;
        });
    });

    return { rubricCategories, rubricComments };
  }, []);

  const detectPermissionType = useCallback(async (submissionID: number): Promise<PERMISSION_LEVEL> => {
    return fetch(`${process.env.REACT_APP_API_URL}/submissions/${submissionID}/checkPermission/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(async (res) => {
        if (res.status === 404) {
          return PERMISSION_LEVEL.NOT_FOUND;
        }
        const json = await res.json();
        return json;
      })
      .then((json) => {
        // Handle object response format: { read: boolean, write: boolean }
        if (typeof json === 'object' && json !== null) {
          if (json.write === true) {
            return PERMISSION_LEVEL.WRITE;
          } else if (json.read === true) {
            return PERMISSION_LEVEL.READ;
          } else {
            return PERMISSION_LEVEL.NONE;
          }
        }
        // Handle legacy boolean response format
        if (json === true) {
          return PERMISSION_LEVEL.WRITE;
        } else if (json === false) {
          return PERMISSION_LEVEL.READ;
        } else {
          return PERMISSION_LEVEL.NONE;
        }
      })
      .catch((error) => {
        console.log('error', error);
        // we return NONE to display a 403 to the user
        // this is if they are not in the roster and/or not an admin
        return PERMISSION_LEVEL.NONE;
      });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const queryValues = queryString.parse(location.search);

      if (inDemoMode) {
        document.title = 'codePost | Code Console Demo';

        const demoData =
          queryValues.sample && queryValues.sample === '1' ? loadDemoData([], true) : loadDemoData([], false);

        setData({
          isLoading: false,
          permissionLevel: demoData.permissionLevel,
          assignment: demoData.assignment,
          course: demoData.course,
          submission: demoData.submission,
          readOnlySubmission: demoData.readOnlySubmission,
          files: demoData.files,
          comments: demoData.comments,
          commentRubricComments: demoData.commentRubricComments,
          rubricCategories: demoData.rubricCategories,
          rubricComments: demoData.rubricComments,
          selectedFile: demoData.selectedFile,
          tests: demoData.tests || [],
          testCategories: demoData.testCategories || [],
          testCases: demoData.testCases || {},
          graders: demoData.graders || [],
          students: demoData.students || [],
          fileTemplates: demoData.fileTemplates,
          isStudent: demoData.isStudent,
          noSave: demoData.noSave,
        });
        return;
      }

      if (!submissionId) {
        return;
      }

      // Set window title
      const submissionID: number = +submissionId;

      let permissionLevel = await detectPermissionType(submissionID);

      const values = queryString.parse(location.search);
      let simulatingStudent = false;
      if (permissionLevel === PERMISSION_LEVEL.WRITE && values.student !== undefined) {
        permissionLevel = PERMISSION_LEVEL.READ;
        simulatingStudent = true;
      }

      let noSave = false;
      if (values.noSave !== undefined) {
        noSave = true;
      }

      // Everything we need to load
      let submission: any;
      let assignment: AssignmentType;
      let files: FileType[];
      let comments: IFileToCommentsMap;
      let commentRubricComments: ICommentToRubricCommentMap;
      let course: CourseType;
      let rubricCategories: RubricCategoryType[];
      let rubricComments: IRubricCategoryToRubricCommentsMap;
      let selectedFile: FileType | undefined;
      let tests: SubmissionTestType[];

      switch (permissionLevel) {
        case PERMISSION_LEVEL.NOT_FOUND:
        case PERMISSION_LEVEL.NONE:
          // Will trigger 403 or 404 message in render
          setData((prev) => ({ ...prev, permissionLevel, isLoading: false }));
          break;

        case PERMISSION_LEVEL.READ: {
          // load the data a reader has access to
          submission = await Submission.readReadOnly(submissionID);
          [assignment, [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
            await Promise.all([
              Assignment.read(submission.assignment),
              Submission.loadData(submission),
              loadRubric(submission.assignment),
            ]);

          document.title = `${submissionID}-Submission [${assignment.name}]`;

          course = await Course.read(assignment.course);

          files = files.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });

          files = CodeConsoleUtils.fileBouncer(files);

          if (selectedFile === undefined && files.length > 0) {
            if (typeof queryValues.comment === 'string') {
              const matchingFile = files.find((el) =>
                el.comments.some((c) => c === parseInt(queryValues.comment as string)),
              );
              selectedFile = matchingFile || files[0];
            } else {
              selectedFile =
                files.find((f: FileType) => {
                  return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
                }) || files[0];
            }
          }

          // Read tests
          const { testCases: studentTestCases, testCategories: studentTestCategories } =
            await AssignmentStudent.readStudentTests(assignment.id);
          const caseObj: StudentTestCasesByCategory = {};
          studentTestCategories.forEach((category) => {
            caseObj[category.id] = [];
          });
          studentTestCases.forEach((testCase) => {
            caseObj[testCase.testCategory] = [...caseObj[testCase.testCategory], testCase];
          });
          tests = submission.tests
            ? await Promise.all(submission.tests.map((id: number) => SubmissionTest.read(id)))
            : [];

          // Store in state
          setData({
            noSave,
            assignment,
            course,
            readOnlySubmission: submission,
            files,
            comments,
            commentRubricComments,
            rubricCategories,
            rubricComments: {},
            isLoading: false,
            selectedFile,
            permissionLevel,
            testCategories: studentTestCategories,
            testCases: caseObj,
            tests: SubmissionTest.getLatest(tests),
            isStudent:
              simulatingStudent || (submission.students !== undefined && submission.students.indexOf(user.email) > -1),
            graders: [],
            students: [],
          });
          break;
        }

        case PERMISSION_LEVEL.WRITE: {
          // load the data a writer has access to
          const writableSubmission = await Submission.readAnonymous(submissionID);
          [assignment, [files, comments, commentRubricComments], { rubricCategories, rubricComments }] =
            await Promise.all([
              Assignment.read(writableSubmission.assignment),
              Submission.loadData(writableSubmission),
              loadRubric(writableSubmission.assignment),
            ]);

          document.title = `${submissionID}-Submission [${assignment.name}]`;

          course = await Course.read(assignment.course);
          let fileTemplates: FileTemplateType[] | undefined;
          if (assignment.templateMode) {
            fileTemplates = await Promise.all(
              (assignment.fileTemplates ?? []).map((fileTemplateID: number) => {
                return FileTemplate.read(fileTemplateID);
              }),
            );
          }

          // load the data only an admin has access to
          let graders: string[] = [];
          let students: string[] = [];
          if (isCourseAdmin(assignment)) {
            const roster = await Course.readRoster(assignment.course);
            graders = roster['graders'];
            students = roster['students'];
          }

          // fill in grade using available data if submission doesn't contain an up-to-date grade
          if (assignment && !writableSubmission.isFinalized) {
            writableSubmission.grade = CodeConsoleUtils.calculateGrade(
              assignment,
              comments,
              commentRubricComments,
              rubricCategories,
              files,
              [],
              [],
            );
          }

          files = files.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });

          files = CodeConsoleUtils.fileBouncer(files);

          if (selectedFile === undefined && files.length > 0) {
            if (typeof queryValues.comment === 'string') {
              const matchingFile = files.find((el) =>
                el.comments.some((c) => c === parseInt(queryValues.comment as string)),
              );
              selectedFile = matchingFile || files[0];
            } else {
              selectedFile =
                files.find((f: FileType) => {
                  return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
                }) || files[0];
            }
          }

          tests = await Promise.all(writableSubmission.tests.map((id: number) => SubmissionTest.read(id)));
          const [categories, cases] = await fetchTestData(assignment);

          setData({
            noSave,
            assignment,
            course,
            submission: writableSubmission,
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
            fileTemplates,
            tests: SubmissionTest.getLatest(tests),
            testCases: cases as TestCasesByCategory,
            testCategories: categories as TestCategoryType[],
            isStudent: false,
          });
          break;
        }
      }
    };

    loadData();
  }, [submissionId, location, user, inDemoMode, isCourseAdmin, loadDemoData, detectPermissionType, loadRubric]);

  return data;
};

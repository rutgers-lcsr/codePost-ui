// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
/* Import codePost API clients */
import { Course as NativeCourse } from '../../api-client';
import {
  assignmentsApi,
  autograderApi,
  commentsApi,
  coursesApi,
  rubricCategoriesApi,
  rubricCommentsApi,
  sectionsApi,
  submissionFilesApi,
  submissionTestsApi,
  submissionsApi,
  testCasesApi,
  testCategoriesApi,
} from '../../api-client/clients';
import { AssignmentType, CourseType, TestCategoryType } from '../../types/models';

import { fetchTestData } from '../core/testFetchUtils';

/* Import demo course data */
import { demoAssignments, demoCourse, demoRoster, demoSections, demoSubmissions } from './demo-data';
import { getDemoSubmissionTests } from './demo-submission-tests';

const createDemoCourse = async (email: string, username: string, org: string): Promise<NativeCourse> => {
  const payload = { ...demoCourse(username), isRubricEditor: false, webhooks: [] };
  return coursesApi.create({ course: payload as any }).then((course) => {
    // Create assignments
    const preAssignments = demoAssignments(course.id);
    const makeAssignmnets = preAssignments.map((assignment) => {
      return createAssignment(course, assignment);
    });

    return Promise.all(makeAssignmnets).then((assignments: AssignmentType[]) => {
      // Set roster
      const roster = demoRoster(org, course.id);
      // Add self to graders
      roster.graders = [...roster.graders, email];
      return coursesApi.rosterPartialUpdate({ id: course.id, patchedCourse: roster as any }).then((_rosterObj) => {
        // Make sections
        const sections = demoSections(org, roster.id);
        const makeSections = sections.map((section) => {
          return sectionsApi.create({ section: section as any });
        });
        return Promise.all(makeSections).then(() => {
          // Make submissions
          const makeSubmissions = assignments.map((assignment) => {
            return createSubmissions(assignment, org);
          });

          return Promise.all(makeSubmissions).then((subs) => {
            // Generate SubmissionTests from cached JSON
            const subTestPromises = assignments.map(async (assignment) => {
              const [categories, casesByCategory] = await fetchTestData(assignment);
              const testCategories = categories as TestCategoryType[]; // not clear why this is necessary
              const testCases = Object.values(casesByCategory).flat();
              const thisSubmissions = await assignmentsApi.submissionsList({ id: assignment.id });

              const demoSubmissionTests = getDemoSubmissionTests(org);
              return demoSubmissionTests.map((subEl) => {
                const subMatch = thisSubmissions.results.find((sub) => sub.students.indexOf(subEl.students[0]) > -1);
                return subEl.tests.map((subTestEl) => {
                  // Match submissionTest to newly created testCase object
                  const testCaseMatch = testCases.find((tc) => tc.description === subTestEl.testCase);
                  const testCategoryMatch = testCategories.find((cat) => cat.name === subTestEl.testCategory);

                  if (subMatch && testCaseMatch && testCategoryMatch) {
                    const payload = {
                      passed: subTestEl.passed,
                      logs: subTestEl.logs.length > 0 ? subTestEl.logs : '-',
                      submission: subMatch.id,
                      testCase: testCaseMatch.id,
                      id: -1,
                      testCategory: -1,
                      created: '',
                      modified: '',
                      isError: false,
                    };
                    return submissionTestsApi.create({ submissionTest: payload as any });
                  } else {
                    return null;
                  }
                });
              });
            });

            return Promise.all(subTestPromises).then(() => {
              const lastPromises = subs
                .flat()
                .flat()
                .flat()
                .map((lastSubEl) =>
                  submissionsApi.partialUpdate({
                    id: lastSubEl.id,
                    patchedSubmission: { ...lastSubEl, isFinalized: true } as any,
                  }),
                );
              return Promise.all(lastPromises).then(() => {
                return {
                  ...course,
                  expirationDate: (course as any).expirationDate || null,
                  cloneFrom: (course as any).cloneFrom,
                  inviteCode: course.inviteCode || null,
                } as unknown as NativeCourse;
              });
            });
          });
        });
      });
    });
  });
};

const createAssignment = async (course: CourseType, assignment: any) => {
  const assnPayload = {
    id: -1, // codePost convention
    name: assignment.name,
    points: assignment.points,
    course: course.id,
    isReleased: false,
    rubricCategories: [], // ignored by API
    sortKey: assignment.sortKey,
    hideGrades: false,
    feedbackReleased: false,
  };

  return assignmentsApi.create({ assignment: assnPayload as any }).then(async (assnObj: AssignmentType) => {
    // Update course object with assignment ids. This step is necessary to allow
    // the Admin component to load these assignments when the active course is switched
    // to the newly created demo course in changeLoadedCourse.
    course.assignments.push(assnObj.id);

    // Create environment for testing
    const payload = {
      language: 'java',
      dockerRunInstructions: [],
      assignment: assnObj.id,
      compileText: '',
      buildType: 'default',
      allowNetworkAccess: false,
      maxStudentTestRuns: null,

      maxExposedFailedTests: null,
      requirements: '',
      dockerfile: '',
      autoDetect: false,
      envVars: {},
    };
    const thisEnvironment = await autograderApi.environmentsCreate({ environment: payload as any });

    await autograderApi.environmentsBuildPartialUpdate({ id: thisEnvironment.id });

    // Create rubric
    const makeCategories = assignment.rubric.map((category: any) => {
      const categoryPayload = {
        id: -1, // codePost convention
        name: category.category,
        rubricComments: [], // ignored by API
        assignment: assnObj.id,
        pointLimit: category.cap,
        sortKey: 0,
        helpText: '',
        atMostOnce: false,
      };

      return rubricCategoriesApi.create({ rubricCategory: categoryPayload as any }).then((catObj) => {
        const makeComments = category.comments.map((comment: any) => {
          const comPayload = {
            id: -1, // codePost convention
            text: comment.text,
            pointDelta: comment.points,
            category: catObj.id,
            comments: [], // ignored by API
          };

          return rubricCommentsApi.create({
            rubricComment: { ...comPayload, explanation: '', instructionText: '', sortKey: 0, templateTextOn: false },
          });
        });

        return Promise.all(makeComments);
      });
    });

    // Create tests
    const makeTestCategories = assignment.tests.map((category: any) => {
      const catPayload = {
        assignment: assnObj.id,
        name: category.category,
        testCases: [],
        resources: [],
        targetFileName: undefined,
        testScript: undefined,
        maxPoints: undefined,
        sortKey: 0,
      };

      return testCategoriesApi.create({ testCategory: catPayload as any }).then((catObj) => {
        category.cases.map((testCase: any) => {
          const casePayload = { id: -1, testCategory: catObj.id, ...testCase };
          return testCasesApi.create({ testCase: casePayload as any });
        });
      });
    });

    return Promise.all([...makeCategories, ...makeTestCategories]).then(() => {
      return assnObj;
    });
  });
};

// Need to figure out how to handle the following:

const createSubmissions = (assignment: AssignmentType, domain: string) => {
  const subTemplates = demoSubmissions(assignment.name, domain);
  return assignmentsApi.rubricRetrieve({ id: assignment.id }).then((rubric: any) => {
    const rubricComments: any[] = rubric.rubricComments || [];
    const makeSubs = subTemplates.map((subT) => {
      const payload = {
        id: -1, // codePost convention
        assignment: assignment.id,
        students: subT.students,
        isFinalized: false,
        files: [], // ignored by API
        dateEdited: '', // ignored by API
        grade: 0, // ignored by API
        grader: subT.grader,
      };

      return submissionsApi.create({ submission: payload as any }).then((submission) => {
        // Make files
        const makeFiles = subT.files.map((fileT) => {
          const filePayload = {
            id: -1, // codePost convention
            data: fileT.code,
            comments: [], // ignored by API
            extension: fileT.ext,
            name: fileT.name,
            submission: submission.id,
            path: null,
          };

          return submissionFilesApi.create({ submissionFile: filePayload as any }).then((fileObj) => {
            // Make comments
            const makeComments = fileT.comments.map((commentT) => {
              let rubricID = null;
              if (commentT.rubric !== null) {
                const rubricMatch = rubricComments.find((el: any) => {
                  return el.text === commentT.rubric;
                });
                if (typeof rubricMatch !== 'undefined') {
                  rubricID = rubricMatch.id;
                }
              }

              const commentPayload = {
                id: -1, // codePost convention
                startChar: commentT.startChar,
                endChar: commentT.endChar,
                startLine: commentT.startLine,
                endLine: commentT.endLine,
                pointDelta: commentT.pointDelta,
                text: commentT.text,
                file: fileObj.id,
                rubricComment: rubricID,
                author: commentT.author,
                feedback: 0,
                color: null,
              };

              return commentsApi.create({ comment: commentPayload as any }).then(() => {
                return submission;
              });
            });

            return Promise.all(makeComments);
          });
        });

        return Promise.all(makeFiles);
      });
    });
    return Promise.all(makeSubs);
  });
};

export { createDemoCourse };

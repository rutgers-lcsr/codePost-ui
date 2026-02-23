// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type {
  AssignmentType,
  TestCaseType,
  StudentTestCaseType,
  SubmissionInfoType,
  AnonymousSubmissionType,
  SubmissionTestType,
  TestCategoryType,
} from '../../types/models';
import { getLatestSubmissionTests } from '../../utils/submissionTests';

import {
  assignmentsApi,
  autograderApi,
  testCategoriesApi,
  testCasesApi,
  submissionsApi,
} from '../../api-client/clients';

//********************************** Interfaces **** ******************************
export interface TestsBySubmission {
  [submissionID: number]: SubmissionTestType[];
}

export enum RESULT_STATUS {
  Passed = 1,
  Failed = 2,
  Error = 3,
}

export interface TestsByCase {
  [caseID: number]: SubmissionTestType[];
}

export interface TestCasesByCategory {
  [categoryID: number]: TestCaseType[];
}

export interface StudentTestCasesByCategory {
  [categoryID: number]: StudentTestCaseType[];
}

//********************************** Basic Fetch Utils *****************************
// For an assignment fetch teh testCategories
export const fetchTestCategories = async (assignment: AssignmentType) => {
  const categoryPromises = assignment.testCategories.map((id) => {
    return testCategoriesApi.retrieve({
      id: id,
    }) as unknown as Promise<TestCategoryType>;
  });
  return await Promise.all(categoryPromises);
};

export const fetchEnvironment = async (assignment: AssignmentType) => {
  // If assignment has an environment, fetch it
  // We don't allow users to delete environments in the UI, so once an assignment has
  // an environment, it won't change
  // If the environment was recently created, we want to make sure the assignment id
  // isn't out of date.
  const latestAssignment = assignment.environment
    ? assignment
    : await assignmentsApi.retrieve({
        id: assignment.id,
      });
  if (latestAssignment.environment) {
    return await autograderApi.environmentsRetrieve({
      id: latestAssignment.environment,
    });
  }
};

//********************************** Complex Fetch Utils (some data processing) *****************************
export const fetchTestData = async (assignment: AssignmentType) => {
  // get the latest assignment in case the categories have changed
  const latestAssignment = (await assignmentsApi.retrieve({
    id: assignment.id,
  })) as unknown as AssignmentType;
  const categories: TestCategoryType[] = await fetchTestCategories(latestAssignment);
  const casesByCategory: TestCasesByCategory = await fetchTestCasesByCategory(categories);
  return [categories, casesByCategory];
};

// For a list of test categories, create a {categoryID: TestCase[]} object
export const fetchTestCasesByCategory = async (categories: TestCategoryType[]) => {
  const categoryPromises = categories.map(async (category) => {
    const testCasePromises = category.testCases.map((id) => {
      return testCasesApi.retrieve({
        id: id,
      }) as unknown as Promise<TestCaseType>;
    });
    const testCases: TestCaseType[] = await Promise.all(testCasePromises);
    return {
      category: category.id,
      testCases: testCases,
    };
  });

  const toRet: TestCasesByCategory = {};
  const testCaseObjs = await Promise.all(categoryPromises);
  testCaseObjs.map((obj) => {
    toRet[obj.category] = obj.testCases;
    return null;
  });
  return toRet;
};

export const getTestsByCase = (testsBySubmission: TestsBySubmission, casesByCategory: TestCasesByCategory) => {
  const passedToRet: TestsByCase = {};
  const failedToRet: TestsByCase = {};
  const errorToRet: TestsByCase = {};
  // Loop through all tests, to iniate tests
  Object.keys(casesByCategory).forEach((categoryID) => {
    casesByCategory[parseInt(categoryID, 10)].forEach((t) => {
      passedToRet[t.id] = [];
      failedToRet[t.id] = [];
      errorToRet[t.id] = [];
    });
  });
  Object.keys(testsBySubmission).forEach((subID) => {
    const tests = getLatestSubmissionTests(testsBySubmission[parseInt(subID, 10)]);

    tests.forEach((t) => {
      const caseID = t.testCase;

      const status: RESULT_STATUS = t.passed
        ? RESULT_STATUS.Passed
        : t.isError
          ? RESULT_STATUS.Error
          : RESULT_STATUS.Failed;

      switch (status) {
        case RESULT_STATUS.Passed:
          passedToRet[caseID].push(t);
          break;
        case RESULT_STATUS.Failed:
          failedToRet[caseID].push(t);
          break;
        case RESULT_STATUS.Error:
          errorToRet[caseID].push(t);
          break;
      }
    });
  });
  return [passedToRet, failedToRet, errorToRet];
};

// For a list of submissions, create a {submissionID: SubmissionTest[]} object
export const fetchTestsBySubmission = async (submissions: (AnonymousSubmissionType | SubmissionInfoType)[]) => {
  const toRet: TestsBySubmission = {};
  const submissionPromises =
    submissions !== undefined
      ? submissions.map(async (submission: AnonymousSubmissionType | SubmissionInfoType) => {
          // Legacy: Submission.readTestResults(submission.id, { isStudentMode: 'False' });
          // New: submissionsApi.SubmissionTestsRetrieve
          const res = (await submissionsApi.submissionTestsList({
            id: submission.id,
          })) as unknown as any;

          // Handle potential different response structures
          // If it returns a list directly or an object with submissionTests
          if (Array.isArray(res)) {
            toRet[submission.id] = res;
          } else if (res.submissionTests) {
            toRet[submission.id] = res.submissionTests;
          } else {
            // Fallback or empty
            toRet[submission.id] = [];
          }
        })
      : [];
  await Promise.all(submissionPromises);
  return toRet;
};

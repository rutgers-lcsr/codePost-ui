/* codepost object imports */
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { TestCase, TestCaseType } from '../../../../../infrastructure/testCase';
import { SubmissionTest, SubmissionTestType } from '../../../../../infrastructure/submissionTest';
import { TestCategory, TestCategoryType } from '../../../../../infrastructure/testCategory';
import { SubmissionType } from '../../../../../infrastructure/submission';

import { BashFile } from '../../../../../infrastructure/autograder/bashFile';

import { BASHMODE_TEMPLATE } from './TestingSetup/utils/templates/testTemplates';

//********************************** Interfaces **** ******************************
export interface TestsBySubmission {
  [submissionID: number]: SubmissionTestType[];
}

export interface TestCasesByCategory {
  [categoryID: number]: TestCaseType[];
}

//********************************** Data Fetch Utils ******************************
export const fetchTestData = async (assignment: AssignmentType) => {
  const categories: TestCategoryType[] = await fetchTestCategories(assignment);
  const casesByCategory: TestCasesByCategory = await fetchTestCasesByCategory(categories);
  return [categories, casesByCategory];
};

// For an assignment fetch teh testCategories
export const fetchTestCategories = async (assignment: AssignmentType) => {
  const categoryPromises = assignment.testCategories.map((id) => {
    return TestCategory.read(id);
  });
  return await Promise.all(categoryPromises);
};

// For a list of test categories, create a {categoryID: TestCase[]} object
export const fetchTestCasesByCategory = async (categories: TestCategoryType[]) => {
  const categoryPromises = categories.map(async (category) => {
    const testCasePromises = category.testCases.map((id) => {
      return TestCase.read(id);
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
  });
  return toRet;
};

// For a list of submissions, create a {submissionID: SubmissionTest[]} object
export const fetchTestsBySubmission = async (submissions: SubmissionType[]) => {
  const toRet: TestsBySubmission = {};
  const submissionPromises = submissions.map(async (submission) => {
    const testPromises = submission.tests.map((id) => {
      return SubmissionTest.read(id);
    });
    const tests = await Promise.all(testPromises);
    toRet[submission.id] = tests;
  });
  await Promise.all(submissionPromises);
  return toRet;
};

export const fetchOrCreateBashFile = async (category: TestCategoryType) => {
  if (category.bashFile) {
    const bashFile = await BashFile.read(category.bashFile);
    return bashFile;
  } else {
    const payload = { id: -1, testCategory: category.id, code: BASHMODE_TEMPLATE };
    const bashFile = await BashFile.create(payload);
    return bashFile;
  }
};

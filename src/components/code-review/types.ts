/**
 * Type definitions specific to CodeConsole component that are not in CodeConsole.types.ts
 * This file contains enums and types that are unique to the code-review components
 * and not part of the main CodeConsole state/props.
 *
 * For main CodeConsole types (ICodeConsoleState, ICodeConsoleProps, PERMISSION_LEVEL, etc.),
 * see ../../types/CodeConsole.types.ts
 */

// Re-export test case types from their source
export type {
  RESULT_STATUS,
  StudentTestCasesByCategory,
  TestCasesByCategory,
  TestsByCase,
  TestsBySubmission,
} from '../core/testFetchUtils';

export { fetchTestData } from '../core/testFetchUtils';

// Re-export test case types from infrastructure
export type { SubmissionTestType } from '../../infrastructure/submissionTest';
export type { StudentTestCaseType, TestCaseType } from '../../infrastructure/testCase';
export type { TestCategoryType } from '../../infrastructure/testCategory';

/**
 * Enum for different console tab views
 * Used for navigation within the code review interface
 */
export enum ConsoleTab {
  Files = 'files',
  Tests = 'tests',
  Output = 'output',
  Rubric = 'rubric',
  Comments = 'comments',
}

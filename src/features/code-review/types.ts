// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
} from '../../components/core/testFetchUtils';

export { fetchTestData } from '../../components/core/testFetchUtils';

// Re-export test case types from models
export type { SubmissionTestType, StudentTestCaseType, TestCaseType, TestCategoryType } from '../../types/models';

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

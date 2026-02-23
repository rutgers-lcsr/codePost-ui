// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type {
  Assignment,
  AssignmentDataSet,
  AssignmentFile,
  Comment,
  CommentTemplate,
  Course,
  CourseRoster,
  CourseSettings,
  Environment,
  RubricCategory,
  RubricComment,
  Section,
  StudentSubmission,
  Submission,
  SubmissionHistory,
  SubmissionTest,
  SubmissionWithTests,
  TestCase,
  TestCategory,
  TestCategoryResource,
  User,
} from '../api-client';
import type { FileType } from '../utils/file';

export type AssignmentType = Assignment;
export type AssignmentStudentType = Assignment;
export type AssignmentFileType = AssignmentFile;
export type AssignmentDataSetType = AssignmentDataSet;

export type CommentType = Comment;
export type CommentTemplateType = CommentTemplate;

export type CourseType = Course;
export type CourseSettingsType = CourseSettings;
export type RosterType = CourseRoster;

export type EnvironmentType = Environment;

export type FileTypeAlias = FileType;

export type RubricCategoryType = RubricCategory;
export type RubricCommentType = RubricComment;

export type SectionType = Section;

export type SubmissionType = Submission;
export type SubmissionInfoType = Submission;
export type AnonymousSubmissionType = Submission;
export type AnonymousSubmissionInfoType = Submission;
export type StudentSubmissionType = StudentSubmission;
export type SubmissionHistoryType = SubmissionHistory;
export type SubmissionTestType = SubmissionTest;
export type SubmissionWithTestsType = SubmissionWithTests;

export type TestCaseType = TestCase;
export interface StudentTestCaseType {
  id: number;
  sortKey: number;
  testCategory: number;
  description: string;
  pointsPass: number;
  pointsFail: number;
  explanation: string;
  exposed: boolean;
  rubricItem: number | null;
}
export type TestCategoryType = TestCategory;
export type TestCategoryResourceType = TestCategoryResource;

export type UserType = User;

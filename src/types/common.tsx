/**
 * Common Types
 */

export enum APPS {
  Student,
  Grader,
  CourseAdmin,
}

export enum BUTTON_STATE {
  Active,
  Loading,
  Inactive,
}

export interface IUser {
  email: string;
  id: number;
}

export interface IOption {
  label: string;
  value: string | number;
}

export interface IOptionNumber {
  label: string;
  value: number;
}

export interface IAssignment {
  id: number;
  name: string;
  points: number;
  isReleased: boolean;
  rubric?: IRubricCategory[];
}

export interface ICourse {
  id: number;
  name: string;
  period: string;
  assignments: IAssignment[];
}

export interface ISubmission {
  id: number;
  isFinalized: any;
  dateFinalized?: any;
  files: any[];
  grade: number;
  grader?: IGrader;
  students: IStudent[];
  assignment: IAssignment;
}

export interface IFile {
  id: number;
  code: string;
  comments: any[];
  extension: string;
  name: string;
}

export interface IComment {
  id: number;
  author: any;
  startChar: number;
  endChar: number;
  startLine: number;
  endLine: number;
  pointDelta: number;
  text: string;
  rubricComment: any;
  file: number;
}

export interface IProfile {
  id: number;
  username: string;
}

export interface IStudent {
  profile: IProfile;
}

export interface IGrader {
  profile: IProfile;
}

export interface ICourseAdmin {
  profile: IProfile;
}

export interface IAssignmentSubmissionsMap {
  [id: number]: {
    name: string;
    points: number;
    isReleased: boolean;
    submissions: ISubmission[];
  };
}

export interface IUserSubmissionsMap {
  [id: number]: {
    profile: IProfile;
    submissionsByAssignment: {
      [id: number]: ISubmission;
    };
  };
}

export interface IRubricComment {
  id: number;
  text: string;
  pointDelta: number;
  category: number;
}

export interface IRubricCategory {
  id: number;
  name: string;
  pointLimit: number | undefined;
  // reminder - need to fix this, it's disgusting
  rubricComments: number[];
  comments: IRubricComment[];
  categoryComments: IRubricComment[];
  assignment: number;
}

export interface IToast {
  text: string;
  action: string | undefined;
}

export interface ISection {
  name: string;
  id: number;
  students: IStudent[];
  leader?: IGrader[];
}

export interface ISectionNoStudents {
  name: string;
  id: number;
}

export enum UserEnum {
  Student = 'Student',
  Grader = 'Grader',
  CourseAdmin = 'CourseAdmin',
}

// New interfaces for Admin panel -- to merge

export interface IRubricCategory3 {
  id: number;
  name: string;
  pointLimit: number | undefined;
  // reminder - need to fix this, it's disgusting
  rubricComments: number[];
  assignment: number;
}

export interface ISection3 {
  name: string;
  id: number;
  students: string[];
  leaders: string[];
}

// Making a separate data table to ensure that each
// student has only one submission for an assignment

export interface IStudentSubmissionsDataTable {
  [userEmail: string]: {
    [assignmentID: number]: ISubmission3;
  };
}

export interface IGraderSubmissionsDataTable {
  [userEmail: string]: ISubmissionsByAssignment;
}

export interface IAssignment3 {
  id: number;
  name: string;
  points: number;
  isReleased: boolean;
  rubricCategories: number[];
}

export interface ICourse3 {
  id: number;
  name: string;
  period: string;
  assignments: number[];
  sections: number[];
}

export interface ISubmission3 {
  id: number;
  isFinalized: any;
  dateFinalized?: any;
  files: number[];
  grade: number;
  grader?: string;
  students: string[];
  assignment: IAssignment;
}

export interface IAssignmentsByCourse {
  [courseID: number]: IAssignment3[];
}

export interface ISubmissionsByAssignment {
  [assignmentID: number]: ISubmission3[];
}

export interface IRubricCategoriesByAssignment {
  [assignmentID: number]: IRubricCategory3[];
}

export interface IRubricCommentsByCategory {
  [categoryID: number]: IRubricComment[];
}

export interface IRubricCategory2 {
  id: number;
  assignment: IAssignment;
  name: string;
  pointLimit: number;
  rubricComments: number[];
}

export interface ICourse2 {
  id: number;
  name: string;
  period: string;
  assignments: number[];
}

export interface ISubmission2 {
  id: number;
  isFinalized: any;
  dateFinalized: any;
  files: number[];
  grade: number;
  grader?: string;
  students: string[];
  assignment: number;
}

export interface IFile2 {
  id: number;
  code: string;
  comments: number[];
  extension: string;
  name: string;
}

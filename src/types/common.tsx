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
  localId: number;
  author: any;
  startChar: number;
  endChar: number;
  startLine: number;
  endLine: number;
  pointDelta: number | string;
  text: string;
  rubricComment: any;
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

export interface IRubricCategory3 {
  id: number;
  name: string;
  pointLimit: number | undefined;
  // reminder - need to fix this, it's disgusting
  rubricComments: number[];
  comments: IRubricComment[];
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

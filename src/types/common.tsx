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

export interface IAssignment {
  id: number;
  name: string;
  points: number;
  isReleased: boolean;
}

export interface ICourse {
  id: number;
  name: string;
  period: string;
  assignments?: IAssignment[];
}

export interface ISubmission {
  id: number;
  isFinalized: any;
  dateFinalized?: any;
  files: any[];
  grade: number;
  grader?: IGrader;
  students?: IStudent[];
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

export interface IRubricComment {
  id: number;
  text: string;
  pointDelta: number;
}

export interface IRubricCategory {
  id: number;
  assignment: IAssignment;
  name: string;
  pointLimit: number;
  categoryComments: IRubricComment[];
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

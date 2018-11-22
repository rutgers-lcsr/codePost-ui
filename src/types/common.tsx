/**
 * Common Types
 */

export enum APPS {
  Student,
  Grader,
  CourseAdmin,
}

export enum ButtonState {
  Active,
  Loading,
  Inactive
}
  
export interface IUser {
  email: string,
  id: number
}

export interface IOption {
  label: string,
  value: string | number
}

export interface IAssignment {
  id: number,
  name: string,
  points: number,
  isReleased: boolean,
}

export interface ICourse {
  id: number,
  name: string,
  period: string,
  assignments?: IAssignment[]
}

export interface ISubmission {
  id: number,
  isFinalized: any,
  dateFinalized?: any,
  files: any[],
  grade: number,
  students?: IStudent[]
}

export interface IFile {
  code: string,
  comments: any[],
  extension: string,
  name: string
}

export interface IComment {
  id: number,
  author: any,
  startChar: number,
  endChar: number,
  startLine: number,
  endLine: number,
  pointDelta: number,
  text: string
}

export interface IProfile {
  id: number,
  username: string
}

export interface IStudent {
  profile: IProfile
}
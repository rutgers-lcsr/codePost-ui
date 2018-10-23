/**
 * Common Types
 */

export enum APPS {
    Student,
    Grader,
    CourseAdmin,
}

export interface IOption {
  label: string,
  value: string | number
}

export interface IAssignment {
  id: number,
  name: string,
  points: number
}

export interface ICourse {
  id: number,
  name: string,
  period: string,
  assignments: IAssignment[]
}
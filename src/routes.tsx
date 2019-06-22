// This is the actual url endpoints defined
export const ADMIN = '/admin';
export const HOME = '/';
export const GRADE = '/grade';
export const GRADER = '/grader';
export const STUDENT = '/student';
export const RESET = '/password-reset';
export const RESET_TOKEN = '/password-reset/:uid/:token';
export const LANDING = '/landing';

export const COURSE_SELECTOR = ':courseName/:period';

export type ROUTES =
  | typeof ADMIN
  | typeof HOME
  | typeof STUDENT
  | typeof LANDING
  | typeof GRADER
  | typeof GRADE
  | typeof RESET
  | typeof RESET_TOKEN;

// This is the actual url endpoints defined
export const HOME = '/';
export const GRADER = '/grader';
export const STUDENT = '/student';
export const RESET = '/password-reset';
export const RESET_TOKEN = '/password-reset/:uid/:token';
export const LANDING = '/landing';

export type ROUTES =
  | typeof HOME
  | typeof STUDENT
  | typeof LANDING
  | typeof GRADER
  | typeof RESET
  | typeof RESET_TOKEN;

export const HOME = `/`;
export const GRADER = `/grader`;
export const STUDENT = `/student`;
export const RESET = `/password-reset`;
export const RESET_TOKEN = `/password-reset/:uid/:token`;

export type ROUTES =
  | typeof HOME
  | typeof GRADER
  | typeof STUDENT
  | typeof RESET
  | typeof RESET_TOKEN
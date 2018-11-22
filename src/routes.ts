// This is the actual url endpoints defined
export const HOME = `/`;
export const GRADER = `/grader`;
export const STUDENT = `/student`;
export const LANDING = `/landing`;

export type ROUTES =
  | typeof HOME
  | typeof STUDENT
  | typeof LANDING
  | typeof GRADER

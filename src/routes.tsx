// This is the actual url endpoints defined
export const ADMIN = '/admin';
export const HOME = '/';
export const CODE = '/code';
export const GRADER = '/grader';
export const STUDENT = '/student';
export const RESET = '/password-reset';
export const RESET_TOKEN = '/password-reset/:uid/:token';
export const LANDING = '/landing';
export const CODE_DEMO = '/demo';
export const HEALTH_CHECK = '/health-check';
export const COURSE_SELECTOR = ':courseName/:period';

export const CODE_TOUR_ID = '49817';
export const CODE_TOUR_DEMO_ID = '53617';
export const ADMIN_TOUR_ID = '49547';

export type ROUTES =
  | typeof ADMIN
  | typeof HOME
  | typeof STUDENT
  | typeof LANDING
  | typeof GRADER
  | typeof CODE
  | typeof RESET
  | typeof RESET_TOKEN
  | typeof LANDING
  | typeof CODE_DEMO
  | typeof HEALTH_CHECK;

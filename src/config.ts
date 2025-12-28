/**
 * Application-wide configuration
 */

// Code in Place course ID
// Used to apply specific logic for Code in Place courses (e.g. hiding due dates)
const cipCourseIdEnv = process.env.REACT_APP_CIP_COURSE_ID;
export const CIP_COURSE_ID = cipCourseIdEnv ? parseInt(cipCourseIdEnv, 10) : 925;

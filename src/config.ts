// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Application-wide configuration
 */

// Support URL shown in error messages and help text
export const SUPPORT_URL = process.env.REACT_APP_SUPPORT_URL || 'https://github.com/rutgers-lcsr/codepost/issues';

// Client URL (the URL of this app as seen by end users)
export const CLIENT_URL = process.env.REACT_APP_CLIENT_URL || window.location.origin;

// Code in Place course ID
// Used to apply specific logic for Code in Place courses (e.g. hiding due dates)
const cipCourseIdEnv = process.env.REACT_APP_CIP_COURSE_ID;
export const CIP_COURSE_ID = cipCourseIdEnv ? parseInt(cipCourseIdEnv, 10) : 925;

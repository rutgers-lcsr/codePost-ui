// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// Enums for CodeConsole

export enum PERMISSION_LEVEL {
  NOT_FOUND,
  NONE,
  READ,
  READ_FILES_ONLY, // Student can view files but no comments/rubrics
  WRITE,
}

export enum CURSOR_DOMAIN {
  CODE,
  CODE_HIDDEN,
  COMMENTS,
  COMMENTS_HIDDEN,
  RUBRIC,
}

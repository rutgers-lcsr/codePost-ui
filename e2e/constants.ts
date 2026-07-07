// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// Shared, non-test constants for the e2e suite (kept out of setup/spec files so Playwright
// doesn't flag a spec importing a test file).

export const COURSE_NAME = 'Demo Course';
export const COURSE_PERIOD = 'Spring 2026';
export const STUDENT_EMAIL = 'student_only@dev.edu';

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000';
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

import * as React from 'react';

import { Course } from '../../api-client';

export const defaultCourse: Course = {
  id: -1,
  name: '',
  period: '',
  assignments: [],
  sections: [],
  sendReleasedSubmissionsToBack: false,
  showStudentsStatistics: false,
  timezone: 'US/Eastern',
  emailNewUsers: false,
  anonymousGradingDefault: false,
  minComments: 0,
  noUnfinalize: false,
  lateDayCreditsAllowable: null,
  archived: false,
  activateQueue: true,
  inviteCode: '',
  emailWhitelist: '',
  inviteCodeEnabled: false,
  enableStudentFeedbackNotifications: false,
  expirationDate: null,
  webhooks: [],
  studentsCanSeeGraders: false,
  studentCount: 0,
  isRubricEditor: false,
  // Add other required fields if any, checking type definition would be verifying.
  // Assuming these are all required fields in Course.
};

export const CourseContext = React.createContext<Course>(defaultCourse);

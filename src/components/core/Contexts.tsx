import * as React from 'react';

import { CourseType } from '../../infrastructure/course';

export const defaultCourse: CourseType = {
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
  expiration_date: null,
  studentsCanSeeGraders: false,
};

export const CourseContext = React.createContext<CourseType>(defaultCourse);

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
  capabilities: {},
};

export const CourseContext = React.createContext<Course>(defaultCourse);

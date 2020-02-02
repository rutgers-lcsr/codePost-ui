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
};

export const CourseContext = React.createContext<CourseType>(defaultCourse);

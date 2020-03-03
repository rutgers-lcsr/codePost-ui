import React from 'react';

import moment from 'moment-timezone';

import { CourseContext } from '../core/Contexts';
import { AssignmentType, AssignmentStudentType } from '../../infrastructure/assignment';

const CodePostDateChild = (props: { datetime: string; timezone: string }) => {
  const dateObj = new Date(props.datetime);
  const momentObj = moment(dateObj).tz(props.timezone);
  return (
    <span>
      {momentObj.format('h:mm a')} on {momentObj.format('MMM DD')}
    </span>
  );
};

const CodePostDate = (props: { datetime: string }) => (
  <CourseContext.Consumer>
    {(course) => <CodePostDateChild {...props} timezone={course.timezone} />}
  </CourseContext.Consumer>
);

const dueDatePassed = (assignment: AssignmentType | AssignmentStudentType) => {
  const two_hours = 3.6e6 * 2; // ms grace period
  return assignment.uploadDueDate && Date.parse(assignment.uploadDueDate) + two_hours <= Date.now();
};

export { CodePostDate, dueDatePassed };

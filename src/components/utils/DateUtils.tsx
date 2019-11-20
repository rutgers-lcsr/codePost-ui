import React from 'react';

import moment from 'moment-timezone';

import { CourseContext } from '../core/Contexts';

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

export { CodePostDate };

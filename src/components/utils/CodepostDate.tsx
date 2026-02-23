// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import dayjs, { Dayjs } from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { CourseContext } from '../core/Contexts';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

const CodePostDateChild = (props: { datetime: Dayjs; timezone: string }) => {
  const dateObj = props.datetime.tz(props.timezone);
  return (
    <span>
      {dateObj.format('h:mm a')} on {dateObj.format('MMM DD')} {dayjs().tz(props.timezone).format('z')}
    </span>
  );
};

const CodePostDate = (props: { datetime: Dayjs | string }) => (
  <CourseContext.Consumer>
    {(course) => <CodePostDateChild datetime={dayjs(props.datetime)} timezone={course.timezone || 'UTC'} />}
  </CourseContext.Consumer>
);

export { CodePostDate };

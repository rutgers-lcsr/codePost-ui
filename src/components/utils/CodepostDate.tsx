import moment, { Moment } from 'moment-timezone';

import { CourseContext } from '../core/Contexts';

const CodePostDateChild = (props: { datetime: Moment; timezone: string }) => {
  const momentObj = props.datetime.clone().tz(props.timezone);
  return (
    <span>
      {momentObj.format('h:mm a')} on {momentObj.format('MMM DD')} {moment.tz(props.timezone).zoneAbbr()}
    </span>
  );
};

const CodePostDate = (props: { datetime: Moment | string }) => (
  <CourseContext.Consumer>
    {(course) => <CodePostDateChild datetime={moment(props.datetime)} timezone={course.timezone} />}
  </CourseContext.Consumer>
);

export { CodePostDate };

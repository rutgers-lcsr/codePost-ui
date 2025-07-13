import { message } from 'antd';

import { AssignmentType } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';

const sendEmailToUser = (
  user: string,
  template: string,
  course: CourseType,
  livemode: boolean,
  assignment?: AssignmentType,
) => {
  fetch(`${process.env.REACT_APP_API_URL}/users/${user}/email/`, {
    body: JSON.stringify({
      token: localStorage.getItem('token'),
      template,
      assignment: assignment !== undefined ? assignment.id : undefined,
      course: course.id,
      livemode,
    }),
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    .then(() => {
      message.success(`Email sent to ${user} successfully.`);
    })
    .catch(() => {
      message.error(`Failed to send email to ${user}. Please contact our team.`);
    });
};

export { sendEmailToUser };

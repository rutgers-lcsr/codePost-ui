// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { message } from 'antd';

import { Course } from '../../../../api-client';
import { AssignmentType } from '../../../../types/models';

const sendEmailToUser = (
  user: string,
  template: string,
  course: Course,
  livemode: boolean,
  assignment?: AssignmentType,
) => {
  // Manual fetch used because generated client schema does not match this custom endpoint's expectations.

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

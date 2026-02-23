// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { AssignmentType, AnonymousSubmissionType, SubmissionType } from '../../types/models';

import dayjs from 'dayjs';

const getDaysLate = (assignment: AssignmentType, submission: SubmissionType | AnonymousSubmissionType) => {
  if (assignment.uploadDueDate === null || submission.dateUploaded === null) {
    return 0;
  }

  const diff = dayjs(submission.dateUploaded).diff(dayjs(assignment.uploadDueDate), 'days') + 1;

  if (diff <= 0) {
    return 0;
  }

  return diff;
};

export { getDaysLate };

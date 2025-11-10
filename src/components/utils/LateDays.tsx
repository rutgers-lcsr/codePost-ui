import { AssignmentType } from '../../infrastructure/assignment';
import { SubmissionType, AnonymousSubmissionType } from '../../infrastructure/submission';

import moment from 'moment';

const getDaysLate = (assignment: AssignmentType, submission: SubmissionType | AnonymousSubmissionType) => {
  if (assignment.uploadDueDate === null || submission.dateUploaded === null) {
    return 0;
  }

  const diff = moment(submission.dateUploaded).diff(moment(assignment.uploadDueDate), 'days') + 1;

  if (diff <= 0) {
    return 0;
  }

  return diff;
};

export { getDaysLate };

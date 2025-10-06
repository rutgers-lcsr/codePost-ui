import moment, { Moment } from 'moment';

// Returns true if the due date has passed (i.e., is before the current time)
export const dueDatePassed = (dueDate: string | Moment | null) => {
  if (!dueDate) {
    return false;
  }
  const dueMoment = moment(dueDate);
  return dueMoment.isBefore(moment());
};

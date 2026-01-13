import dayjs, { Dayjs } from 'dayjs';

// Returns true if the due date has passed (i.e., is before the current time)
export const dueDatePassed = (dueDate: string | Dayjs | null) => {
  if (!dueDate) {
    return false;
  }
  const dueMoment = dayjs(dueDate);
  return dueMoment.isBefore(dayjs());
};

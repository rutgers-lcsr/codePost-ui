// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import dayjs, { Dayjs } from 'dayjs';

// Returns true if the due date has passed (i.e., is before the current time)
export const dueDatePassed = (dueDate: string | Dayjs | null) => {
  if (!dueDate) {
    return false;
  }
  const dueMoment = dayjs(dueDate);
  return dueMoment.isBefore(dayjs());
};

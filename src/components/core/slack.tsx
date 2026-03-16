// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { colors } from '../../theme/colors';
import { Logger } from '../../utils/logger';

// Deprecated: use Logger.error instead
export const slack = (url: string, payload: Record<string, unknown>) => {
  // For backward compatibility, we'll try to map this to Logger.
  // Ideally callers should switch to Logger.error directly.
  if (url.includes('logError')) {
    Logger.error(payload.error as string, payload.errorDetail as string);
  } else {
    // Fallback for other custom slack calls if any
    fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
};

export const sendSlack = (
  message: string,
  text = '',
  color: string = colors.brandPrimary,
  channel = '#user_notifications_everything',
  courseID = 0,
) => {
  Logger.info(message, {
    text,
    color,
    channel,
    courseID,
  });
};

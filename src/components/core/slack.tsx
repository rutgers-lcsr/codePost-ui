import { colors } from '../../theme/colors';
import { Logger } from '../../utils/logger';

// Deprecated: use Logger.error instead
export const slack = (url: string, payload: any) => {
  // For backward compatibility, we'll try to map this to Logger.
  // Ideally callers should switch to Logger.error directly.
  if (url.includes('logError')) {
    Logger.error(payload.error, payload.errorDetail);
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

import { colors } from '../../theme/colors';

export const slack = (url: string, payload: any) => {
  fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else {
        return Promise.reject(res.status);
      }
    })
    .catch((_err) => {
      // console.log(err);
    });
};

export const sendSlack = (
  message: string,
  text = '',
  color: string = colors.brandPrimary,
  channel = '#user_notifications_everything',
  courseID = 0,
) => {
  const targetURL = `${process.env.REACT_APP_API_URL}/logs/log/`;

  const attachments = [
    {
      title: message,
      color,
      text,
      footer: window.location.href,
    },
  ];

  const payload = {
    attachments: attachments,
    channel: channel,
    courseID,
  };

  slack(targetURL, payload);
};

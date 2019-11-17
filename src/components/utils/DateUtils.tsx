import React from 'react';

import moment from 'moment';

import { Tag } from 'antd';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (date: string, deadline?: string | null) => {
  let dateString;
  const dateObj = new Date(date);
  const today = new Date();
  if (dateObj.getFullYear() === today.getFullYear()) {
    if (dateObj.getMonth() === today.getMonth() && dateObj.getDate() === today.getDate()) {
      if (today.getTime() - dateObj.getTime() < 30000) {
        dateString = 'Uploaded: moments ago';
      } else {
        dateString = `Uploaded: ${moment(dateObj).format('h:mm a')} today`;
      }
    } else {
      dateString = `Uploaded: ${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
    }
  } else {
    dateString = `Uploaded:     in ${dateObj.getFullYear()}`;
  }

  if (deadline !== undefined && deadline !== null) {
    const deadlineDate = new Date(deadline);
    if (dateObj > deadlineDate) {
      return (
        <span>
          {dateString} <Tag color={'volcano'}>LATE</Tag>
        </span>
      );
    }
  }

  return dateString;
};

export { formatDate };

import moment from 'moment';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (date: string) => {
  let dateString;
  const dateObj = new Date(date);
  const today = new Date();
  if (dateObj.getFullYear() === today.getFullYear()) {
    if (dateObj.getMonth() === today.getMonth() && dateObj.getDate() === today.getDate()) {
      if (today.getTime() - dateObj.getTime() < 30000) {
        dateString = 'Last edited moments ago';
      } else {
        dateString = `Last edit at ${moment(dateObj).format('h:mm a')}`;
      }
    } else {
      dateString = `Last edit on ${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
    }
  } else {
    dateString = `Last edit in ${dateObj.getFullYear()}`;
  }
  return dateString;
};

export { formatDate };

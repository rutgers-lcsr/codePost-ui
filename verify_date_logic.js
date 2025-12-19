const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Mock props
const props = {
  timezone: 'US/Eastern',
};

// Mock a date selected in the DatePicker (Local Time)
// Let's say I am in UTC enviroment (like the server), but the user is in browser.
// DatePicker returns a Dayjs object.
// Example: User picks "2023-10-27 10:00:00" in their local time.
const mockSelectedDate = dayjs('2023-10-27 10:00:00');

console.log('Selected Date (Local):', mockSelectedDate.format());

// The logic in AssignmentSettingsDialog
try {
  const formattedDate = dayjs.tz(mockSelectedDate.format('YYYY-MM-DD HH:mm:ss'), props.timezone).format();
  console.log('Formatted Date (Payload):', formattedDate);
} catch (e) {
  console.error('Error formatting date:', e);
}

// Test case 2: Empty formatting?
const emptyDate = dayjs(null); // Invalid Date
console.log('Empty Date:', emptyDate.isValid());

// Test case 3: What if timezone is missing?
try {
  const formattedDateNoTz = dayjs.tz(mockSelectedDate.format('YYYY-MM-DD HH:mm:ss'), '').format();
  console.log('Formatted Date (No TZ):', formattedDateNoTz);
} catch (e) {
  console.error('Error formatting date (No TZ):', e);
}

// Test case 4: Bad Timezone
try {
  const formattedDateBadTz = dayjs.tz(mockSelectedDate.format('YYYY-MM-DD HH:mm:ss'), 'Moon/Crater').format();
  console.log('Formatted Date (Bad TZ):', formattedDateBadTz);
} catch (e) {
  console.error('Error formatting date (Bad TZ):', e);
}

// Test case 5: Explicit UTC conversion
try {
  const formattedDateUtc = dayjs.tz(mockSelectedDate.format('YYYY-MM-DD HH:mm:ss'), props.timezone).utc().format();
  console.log('Formatted Date (UTC):', formattedDateUtc);
} catch (e) {
  console.error('Error formatting date (UTC):', e);
}

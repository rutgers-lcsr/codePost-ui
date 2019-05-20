import React from 'react';

import { storiesOf } from '@storybook/react';

import { AdminAssignments } from './screens/admin';
import { Grade } from './screens/grade';

storiesOf('Screens', module)
  .add('Admin', () => <AdminAssignments />)
  .add('Grade', () => <Grade />);

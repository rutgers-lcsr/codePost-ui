import React from 'react';

import { select, text, withKnobs } from '@storybook/addon-knobs';

import { storiesOf } from '@storybook/react';

import { Admin } from './screens/admin';
import { Grade } from './screens/grade';
import { Rubric } from './screens/rubric';

storiesOf('Screens', module)
  .addDecorator(withKnobs)
  .add('Admin', () =>
    Admin(
      select('detail?', [null, '1'], null),
      text('title', 'Assignments'),
      select('actions', ['assignments', 'students', 'graders', 'detail', 'none'], 'assignments'),
    ),
  )
  .add('Grade', () => <Grade />)
  .add('Rubric', () => <Rubric />);

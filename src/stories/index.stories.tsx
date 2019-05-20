import React from 'react';

import 'typeface-muli';

import { storiesOf } from '@storybook/react';

import CPLayoutAdmin from '../components/core/CPLayoutAdmin';
import CPLayoutGrade from '../components/core/CPLayoutGrade';

import '../styles/main.scss';

storiesOf('Screens', module)
  .add('Admin', () => <CPLayoutAdmin />)
  .add('Grade', () => <CPLayoutGrade />);

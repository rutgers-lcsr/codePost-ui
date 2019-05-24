import React from 'react';

import { storiesOf } from '@storybook/react';

import CPLayoutAdmin from '../components/core/CPLayoutAdmin';
import CPLayoutGrade from '../components/core/CPLayoutGrade';

storiesOf('Layouts', module)
  .add('Admin', () => <CPLayoutAdmin header={null} detail={null} isRubric={false} />)
  .add('Grade', () => <CPLayoutGrade header={null} subheader={null} files={null} rubric={null} content={null} />)
  .add('Rubric', () => <CPLayoutAdmin header={null} detail={null} isRubric={true} />);

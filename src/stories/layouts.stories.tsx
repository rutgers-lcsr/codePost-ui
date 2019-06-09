import React from 'react';

import { storiesOf } from '@storybook/react';

import CPLayoutAdmin from '../components/core/CPLayoutAdmin';
import CPLayoutGrade from '../components/core/CPLayoutGrade';

const onClick = (e: any) => null;

storiesOf('Layouts', module)
  .add('Admin', () => (
    <CPLayoutAdmin onClick={onClick} selectedPanel={0} header={null} detail={null} isRubric={false} />
  ))
  .add('Grade', () => <CPLayoutGrade header={null} subheader={null} files={null} rubric={null} content={null} />)
  .add('Rubric', () => (
    <CPLayoutAdmin onClick={onClick} selectedPanel={0} header={null} detail={null} isRubric={true} />
  ));

// DO NOT DELETE
//
// For some reason this file is letting storybook run correctly
// It used to be the index.stories.tsx
// Deleting it will mess up storybook
//
// Not fully sure about why this is happening
// will investigate later

// @ts-ignore
import React from 'react';

import 'typeface-muli';

// @ts-ignore
import { storiesOf } from '@storybook/react';

// @ts-ignore
import CPLayoutAdmin from '../components/core/CPLayoutAdmin';

// @ts-ignore
import CPLayoutGrade from '../components/core/CPLayoutGrade';

import '../styles/main.scss';

storiesOf('zzzzz', module).add('zzzzz', () => (
  <CPLayoutGrade header={null} subheader={null} files={null} rubric={null} content={null} />
));

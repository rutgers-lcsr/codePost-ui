import React from 'react';

import { storiesOf } from '@storybook/react';

import CPFileMenu from '../components/core/CPFileMenu';
import CPMainNav from '../components/core/CPMainNav';
import CPRubricMenu from '../components/core/CPRubricMenu';

storiesOf('Menus', module)
  .add('Main Navigation', () => <CPMainNav />)
  .add('Rubric Menu', () => <CPRubricMenu />)
  .add('File Menu', () => <CPFileMenu />);

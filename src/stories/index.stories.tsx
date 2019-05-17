import React from 'react';

import { linkTo } from '@storybook/addon-links';
import { storiesOf } from '@storybook/react';

import { Welcome } from '@storybook/react/demo';

import { ButtonsDisabled, ButtonsPrimary, ButtonsSecondary } from './Buttons';
import { DropdownActive } from './Dropdown';

import CPLayoutAdmin from '../components/core/CPLayoutAdmin';
import CPLayoutGrade from '../components/core/CPLayoutGrade';

import Colors from './Styles/Colors';
import Fonts from './Styles/Fonts';
import { StorybookContainer } from './helpers';

import '../styles/main.scss';

storiesOf('Welcome', module).add('to Storybook', () => <Welcome showApp={linkTo('Button')} />);

storiesOf('Styles', module)
  .add('Colors', () => (
    <StorybookContainer title="Colors">
      <Colors />
    </StorybookContainer>
  ))
  .add('Fonts', () => (
    <StorybookContainer title="Fonts">
      <Fonts />
    </StorybookContainer>
  ));

storiesOf('Buttons', module)
  .add('Primary', () => (
    <StorybookContainer title="Buttons - Primary">
      <ButtonsPrimary />
    </StorybookContainer>
  ))
  .add('Secondary', () => (
    <StorybookContainer title="Buttons - Secondary">
      <ButtonsSecondary />
    </StorybookContainer>
  ))
  .add('Disabled', () => (
    <StorybookContainer title="Buttons - Disabled">
      <ButtonsDisabled />
    </StorybookContainer>
  ));

storiesOf('Dropdown', module).add('Active', () => (
  <StorybookContainer title="Dropdown - Active">
    <DropdownActive />
  </StorybookContainer>
));

storiesOf('Layout', module)
  .add('Admin', () => <CPLayoutAdmin />)
  .add('Grade', () => <CPLayoutGrade />);

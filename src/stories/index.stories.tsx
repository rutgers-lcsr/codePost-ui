import React from 'react';

import { linkTo } from '@storybook/addon-links';
import { storiesOf } from '@storybook/react';

import { Welcome } from '@storybook/react/demo';

import CPButton from '../components/core/CPButton';

import Colors from './Colors';
import Fonts from './Fonts';
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

storiesOf('Buttons', module).add('Primary', () => (
  <StorybookContainer title="Buttons - Primary">
    <CPButton>Primary</CPButton>
  </StorybookContainer>
));

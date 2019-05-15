import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import CPButton from '../components/core/CPButton';

storiesOf('CPButton', module).add('default', () => <CPButton />);

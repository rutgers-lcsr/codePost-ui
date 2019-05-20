import * as React from 'react';

import CPButton from '../components/core/CPButton';
import { StorybookContainer } from './helpers';

import { storiesOf } from '@storybook/react';

import * as fonts from '../styles/abstracts/_fonts.scss';

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

const ButtonsPrimary = () => {
  const captionStyle: React.CSSProperties = {
    color: 'rgba(0, 0, 0, .3)',
    fontSize: '12px',
    lineHeight: 1,
    marginBottom: '1em',
    textTransform: 'uppercase',
    fontFamily: fonts.fontMain,
  };

  return (
    <div>
      <div>
        <div>
          <div style={{ display: 'inline-block', padding: '10px' }}>
            <span style={captionStyle}>default</span>
          </div>
          <div style={{ display: 'inline-block', padding: '10px' }}>
            <CPButton cpType="primary" size="default">
              Primary
            </CPButton>
          </div>
          <div style={{ display: 'inline-block', padding: '10px' }}>
            <CPButton cpType="primary" icon="save" size="default" />
          </div>
          <div style={{ display: 'inline-block', padding: '10px' }}>
            <CPButton cpType="primary" icon="save" size="default">
              Primary
            </CPButton>
          </div>
        </div>
      </div>
    </div>
  );
};

const ButtonsSecondary = () => {
  return (
    <div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="secondary">Secondary</CPButton>
      </div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="danger">Danger</CPButton>
      </div>
    </div>
  );
};

const ButtonsDisabled = () => {
  return (
    <div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="primary" disabled={true}>
          Disabled
        </CPButton>
      </div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="primary" icon="save" disabled={true} />
      </div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="primary" icon="save" disabled={true}>
          Disabled
        </CPButton>
      </div>
      <div style={{ display: 'inline-block', padding: '10px' }}>
        <CPButton cpType="secondary" disabled={true}>
          Secondary
        </CPButton>
      </div>
    </div>
  );
};

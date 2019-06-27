import * as React from 'react';

import { Button, Icon, Tooltip } from 'antd';

const ButtonGroup = Button.Group;

import CPButton from '../../core/CPButton';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

interface IMagnifierProps {
  visible: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
}

export const Magnifier = (props: IMagnifierProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  return (
    <div
      style={{
        ...{ position: 'absolute', top: '5px', right: '5px' },
        visibility: props.visible ? 'visible' : 'hidden',
      }}
    >
      <ButtonGroup>
        <CPButton id="zoom-out" cpType={cpType} size="small" style={{ minWidth: '20px' }} onClick={props.zoomOut}>
          <Icon type="zoom-out" />
        </CPButton>
        <CPButton id="zoom-in" cpType={cpType} size="small" style={{ minWidth: '20px' }} onClick={props.zoomIn}>
          <Icon type="zoom-in" />
        </CPButton>
      </ButtonGroup>
    </div>
  );
};

interface ISizerProps {
  visible: boolean;
  shrink: () => void;
  grow: () => void;
}

export const Sizer = (props: ISizerProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  return (
    <div
      style={{
        ...{ position: 'absolute', top: '5px', right: '68px' },
        visibility: props.visible ? 'visible' : 'hidden',
      }}
    >
      <ButtonGroup>
        <CPButton id="shrink" cpType={cpType} size="small" style={{ minWidth: '20px' }} onClick={props.shrink}>
          <Icon type="double-left" />
        </CPButton>
        <CPButton id="grow" cpType={cpType} size="small" style={{ minWidth: '20px' }} onClick={props.grow}>
          <Icon type="double-right" />
        </CPButton>
      </ButtonGroup>
    </div>
  );
};

interface IResetProps {
  visible: boolean;
  reset: any;
}

export const Reset = (props: IResetProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  return (
    <div
      style={{
        ...{ position: 'absolute', top: '5px', right: '131px' },
        visibility: props.visible ? 'visible' : 'hidden',
      }}
    >
      <Tooltip
        placement="top"
        title={
          <div>
            reset comment alignments
            <br />
            [⌘+click highlights]
          </div>
        }
      >
        <ButtonGroup>
          <CPButton id="reset" cpType={cpType} size="small" style={{ minWidth: '20px' }} onClick={props.reset}>
            <Icon type="redo" />
          </CPButton>
        </ButtonGroup>
      </Tooltip>
    </div>
  );
};

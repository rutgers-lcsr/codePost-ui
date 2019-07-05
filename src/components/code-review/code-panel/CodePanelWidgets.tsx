import * as React from 'react';

import { Button, Icon, Tooltip } from 'antd';

const ButtonGroup = Button.Group;

import CPButton from '../../core/CPButton';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import themeVars from '../../../styles/abstracts/_theme.js';

/**********************************************************************************************************************/

interface IMagnifierProps {
  updateZoom: (newZoom: number) => void;
}

export const Magnifier = (props: IMagnifierProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';
  const [zoom, setZoom] = React.useState(1);

  function zoomOut() {
    const newZoom = Math.max(0.5, zoom - 0.1);
    setZoom(newZoom);
    props.updateZoom(newZoom);
  }

  function zoomIn() {
    const newZoom = Math.min(2, zoom + 0.1);
    setZoom(newZoom);
    props.updateZoom(newZoom);
  }

  // Note: would be nice to let the user set her zoom explicitly
  // Would need to replace the middle button with an input

  return (
    <ButtonGroup>
      <CPButton id="zoom-out" cpType={cpType} onClick={zoomOut} small>
        <Icon type="zoom-out" />
      </CPButton>
      <CPButton cpType={cpType} small>
        {(zoom * 100).toFixed(0)}%
      </CPButton>
      <CPButton id="zoom-in" cpType={cpType} onClick={zoomIn} small>
        <Icon type="zoom-in" />
      </CPButton>
    </ButtonGroup>
  );
};

/**********************************************************************************************************************/

interface ISizerProps {
  updateSplitBasis: (newSplitBasis: number) => void;
}

export const Sizer = (props: ISizerProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';
  const [splitBasis, setSplitBasis] = React.useState(themeVars.grade.splitBasis);

  function shrink() {
    const newSplitBasis = Math.max(200, splitBasis - 100);
    setSplitBasis(newSplitBasis);
    props.updateSplitBasis(newSplitBasis);
  }

  function grow() {
    const codeContainer = document.getElementById('code-container');
    if (codeContainer !== null) {
      // FIXME: need to read window width here
      // const maxWidth = this.props.windowwidth - codeContainer.offsetLeft - themeVars.grade.commentMinWidth;
      const newSplitBasis = Math.min(1000, splitBasis + 100);
      setSplitBasis(newSplitBasis);
      props.updateSplitBasis(newSplitBasis);
    }
  }

  return (
    <ButtonGroup>
      <CPButton id="shrink" cpType={cpType} onClick={shrink} small>
        <Icon type="double-left" />
      </CPButton>
      <CPButton id="grow" cpType={cpType} onClick={grow} small>
        <Icon type="double-right" />
      </CPButton>
    </ButtonGroup>
  );
};

/**********************************************************************************************************************/

interface IResetProps {
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
}

export const Reset = (props: IResetProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  function onClick() {
    props.updateVerticalOffset(() => 0);
  }

  return (
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
        <CPButton id="reset" cpType={cpType} small onClick={onClick}>
          <Icon type="redo" />
        </CPButton>
      </ButtonGroup>
    </Tooltip>
  );
};

/**********************************************************************************************************************/

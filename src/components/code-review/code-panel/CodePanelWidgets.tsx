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

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      if (e.which === 187 && e.metaKey) {
        // [⌘ + +]
        e.preventDefault();
        zoomIn();
      } else if (e.which === 189 && e.metaKey) {
        // [⌘ + -]
        e.preventDefault();
        zoomOut();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  // Note: would be nice to let the user set her zoom explicitly
  // Would need to replace the middle button with an input

  return (
    <ButtonGroup>
      <Tooltip
        placement="top"
        title={
          <div>
            Shrink code
            <br />
            [⌘ + -]
          </div>
        }
      >
        <CPButton id="zoom-out" cpType={cpType} onClick={zoomOut} small={true}>
          <Icon type="zoom-out" />
        </CPButton>
      </Tooltip>
      <CPButton cpType={cpType} small>
        {(zoom * 100).toFixed(0)}%
      </CPButton>
      <Tooltip
        placement="top"
        title={
          <div>
            Magnify code
            <br />
            [⌘ + +]
          </div>
        }
      >
        <CPButton id="zoom-in" cpType={cpType} onClick={zoomIn} small={true}>
          <Icon type="zoom-in" />
        </CPButton>
      </Tooltip>
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

  // Track window width to prevent user from extending code too far to the right and
  // squishing comments
  const [width, setWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  function shrink() {
    const newSplitBasis = Math.max(200, splitBasis - 100);
    setSplitBasis(newSplitBasis);
    props.updateSplitBasis(newSplitBasis);
  }

  function grow() {
    const codeContainer = document.getElementById('code-container');
    if (codeContainer !== null) {
      const maxWidth = width - codeContainer.offsetLeft - themeVars.grade.commentMinWidth;
      const newSplitBasis = Math.min(maxWidth, splitBasis + 100);
      setSplitBasis(newSplitBasis);
      props.updateSplitBasis(newSplitBasis);
    }
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      if (e.which === 37 && e.metaKey) {
        // [⌘ + ←]
        shrink();
      } else if (e.which === 39 && e.metaKey) {
        // [⌘ + →]
        grow();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  return (
    <ButtonGroup>
      <Tooltip
        placement="top"
        title={
          <div>
            Shrink code window
            <br />
            [⌘ + ←]
          </div>
        }
      >
        <CPButton id="shrink" cpType={cpType} onClick={shrink} small={true}>
          <Icon type="double-left" />
        </CPButton>
      </Tooltip>
      <Tooltip
        placement="top"
        title={
          <div>
            Expand code window
            <br />
            [⌘ + →]
          </div>
        }
      >
        <CPButton id="grow" cpType={cpType} onClick={grow} small={true}>
          <Icon type="double-right" />
        </CPButton>
      </Tooltip>
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
        <CPButton id="reset" cpType={cpType} small={true} onClick={onClick}>
          <Icon type="redo" />
        </CPButton>
      </ButtonGroup>
    </Tooltip>
  );
};

/**********************************************************************************************************************/

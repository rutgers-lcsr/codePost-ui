import * as React from 'react';

import { Button, Icon, Tooltip } from 'antd';

const ButtonGroup = Button.Group;

import CPButton from '../../core/CPButton';

interface IMagnifierProps {
  visible: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
}

export const Magnifier = (props: IMagnifierProps) => {
  return (
    <div
      style={{
        ...{ position: 'absolute', top: '5px', right: '5px' },
        visibility: props.visible ? 'visible' : 'hidden',
      }}
    >
      <ButtonGroup>
        <CPButton id="zoom-out" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.zoomOut}>
          <Icon type="zoom-out" />
        </CPButton>
        <CPButton id="zoom-in" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.zoomIn}>
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
  return (
    <div
      style={{
        ...{ position: 'absolute', top: '5px', right: '68px' },
        visibility: props.visible ? 'visible' : 'hidden',
      }}
    >
      <ButtonGroup>
        <CPButton id="shrink" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.shrink}>
          <Icon type="double-left" />
        </CPButton>
        <CPButton id="grow" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.grow}>
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
  return (
    <div
      style={{
        ...{ position: 'absolute', top: '5px', right: '131px' },
        visibility: props.visible ? 'visible' : 'hidden',
      }}
    >
      <Tooltip placement="top" title={'reset comment alignments [⌘+click highlights]'}>
        <ButtonGroup>
          <CPButton id="reset" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.reset}>
            <Icon type="redo" />
          </CPButton>
        </ButtonGroup>
      </Tooltip>
    </div>
  );
};

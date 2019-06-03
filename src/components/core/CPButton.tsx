import * as React from 'react';

import { Button, Tooltip } from 'antd';

import { ButtonProps } from 'antd/lib/button';

import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

export type CPButtonType = 'primary' | 'secondary' | 'dark' | 'danger' | 'highlight' | 'disabled';

interface ICPButtonProps extends IWithWindowWatcherProps {
  cpType: CPButtonType;
  fallback?: string;
}

class CPButton extends React.Component<ButtonProps & ICPButtonProps, {}> {
  public render() {
    const { cpType, fallback, windowWidth, windowHeight, ...props } = this.props;

    const customProps = {};
    customProps['className'] = `cp-button cp-button--${cpType}`;

    if (['primary', 'danger', 'disabled', 'secondary'].includes(cpType)) {
      customProps['type'] = cpType;
    }

    // Optionally resize a button to an icon button if it has fallback defined
    if (this.props.windowWidth < 900 && fallback) {
      const { children, ...withoutChildren } = props;
      return (
        <Tooltip title={children}>
          <Button shape="circle" icon={fallback} {...customProps} {...withoutChildren} />
        </Tooltip>
      );
    }

    if (props.children === undefined) {
      customProps['shape'] = 'circle';
    } else {
      customProps['className'] = customProps['className'].concat(' ', 'cp-button--with-text');
    }

    return (
      <Button {...customProps} {...props}>
        {props.children}
      </Button>
    );
  }
}

export default withWindowWatcher(CPButton);

import * as React from 'react';

import { Button } from 'antd';

import { ButtonProps } from 'antd/lib/button';

import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

import CPTooltip from './CPTooltip';

export type CPButtonType = 'primary' | 'secondary' | 'dark' | 'danger' | 'highlight' | 'disabled' | 'link';

interface ICPButtonProps extends IWithWindowWatcherProps {
  cpType: CPButtonType;
  fallback?: string;
  fallbackWidth?: number; // Optional: window width when the button falls back to icon
}

interface ICPButtonState {
  backgroundColor: string;
  border: string;
}

class CPButton extends React.Component<ButtonProps & ICPButtonProps, ICPButtonState> {
  public constructor(props: ButtonProps & ICPButtonProps, context: any) {
    super(props, context);

    // this.state = {
    //   backgroundColor: this.background(),
    //   border: this.border(),
    // };
  }

  public background = () => {
    if (this.props.cpType === 'danger') {
      return this.context.consoleTheme.buttonDangerBg;
    }

    return '';
  };

  public border = () => {
    if (this.props.cpType === 'danger') {
      return this.context.consoleTheme.buttonDangerBorder;
    }

    return '';
  };

  public render() {
    const { cpType, fallback, windowwidth, windowheight, ...props } = this.props;

    // let onMouseEnter;
    // let onMouseLeave;

    const customProps = {};
    customProps['className'] = `cp-button cp-button--${cpType}`;
    // customProps['style'] = { backgroundColor: 'blue' };

    if (['primary', 'danger', 'disabled', 'secondary', 'link'].includes(cpType)) {
      customProps['type'] = cpType;
    }

    // if (cpType === 'danger') {
    //   customProps['style'] = {
    //     backgroundColor: this.state.backgroundColor,
    //     border: this.state.border,
    //   };
    // }

    if (cpType === 'danger') {
      customProps['style'] = {
        backgroundColor: this.context.consoleTheme.buttonDangerBg,
        border: this.context.consoleTheme.buttonDangerBorder,
      };
    }
    if (cpType === 'secondary') {
      customProps['style'] = {
        backgroundColor: this.context.consoleTheme.buttonSecondaryBg,
        border: this.context.consoleTheme.buttonSecondaryBorder,
        color: this.context.consoleTheme.buttonSecondaryColor,
      };
    }

    // Optionally resize a button to an icon button if it has fallback defined
    const fallbackWidth = this.props.fallbackWidth ? this.props.fallbackWidth : 900;
    if (this.props.windowwidth < fallbackWidth && fallback) {
      const { children, ...withoutChildren } = props;
      return (
        <CPTooltip title={children}>
          <Button shape="circle" icon={fallback} {...customProps} {...withoutChildren} />
        </CPTooltip>
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
CPButton.contextType = ConsoleThemeContext;

export default withWindowWatcher(CPButton);

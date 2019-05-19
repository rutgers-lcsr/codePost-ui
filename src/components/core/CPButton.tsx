import * as React from 'react';

import { Button } from 'antd';

import { ButtonProps } from 'antd/lib/button';

export type CPButtonType = 'primary' | 'secondary' | 'dark' | 'danger' | 'highlight' | 'disabled';

interface ICPButtonProps {
  cpType: CPButtonType;
}

class CPButton extends React.Component<ButtonProps & ICPButtonProps, {}> {
  public render() {
    const { cpType, ...props } = this.props;

    const customProps = {};
    customProps['className'] = `cp-button cp-button--${cpType}`;

    if (['primary', 'danger', 'disabled', 'secondary'].includes(cpType)) {
      customProps['type'] = cpType;
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

export default CPButton;

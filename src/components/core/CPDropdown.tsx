import * as React from 'react';

import { Button, Dropdown, Icon } from 'antd';

import { DropdownButtonProps } from 'antd/lib/dropdown';

type ThemeType = 'light' | 'dark';
type JustifyType = 'space-between' | 'center';

interface ICPDropdownProps {
  value: string;
  theme?: ThemeType;
  justifyContent?: JustifyType;
}

class CPDropdown extends React.Component<DropdownButtonProps & ICPDropdownProps, {}> {
  public render() {
    const { value, theme, ...props } = this.props;
    const justifyType = props.justifyContent === 'space-between' ? 'space-between' : 'center';

    const t = theme ? theme : 'light';

    return (
      <Dropdown className={`cp-dropdown cp-dropdown--${t}`} {...props}>
        <Button
          className="cp-dropdown__button"
          style={{ display: 'flex', justifyContent: justifyType, alignItems: 'center' }}
        >
          {value} <Icon type="down" />
        </Button>
      </Dropdown>
    );
  }
}

export default CPDropdown;

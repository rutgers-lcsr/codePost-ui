import * as React from 'react';

import { Button, Dropdown, Icon } from 'antd';

import { DropdownButtonProps } from 'antd/lib/dropdown';

type ThemeType = 'light' | 'dark';

interface ICPDropdownProps {
  value: string;
  theme?: ThemeType;
}

class CPDropdown extends React.Component<DropdownButtonProps & ICPDropdownProps, {}> {
  public render() {
    const { value, theme, ...props } = this.props;

    const t = theme ? theme : 'light';

    return (
      <Dropdown className={`cp-dropdown cp-dropdown--${t}`} {...props}>
        <Button className="cp-dropdown__button">
          {value} <Icon type="down" />
        </Button>
      </Dropdown>
    );
  }
}

export default CPDropdown;

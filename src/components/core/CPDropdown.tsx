import * as React from 'react';

import { Button, Dropdown, Icon } from 'antd';

import { DropdownButtonProps } from 'antd/lib/dropdown';

interface ICPDropdownProps {
  value: string;
}

class CPDropdown extends React.Component<DropdownButtonProps & ICPDropdownProps, {}> {
  public render() {
    const { value, ...props } = this.props;
    return (
      <Dropdown className="cp-dropdown" style={{}} {...props}>
        <Button style={{ color: 'rgba(0, 0, 0, 0.25)', width: '100%' }}>
          {value} <Icon type="down" />
        </Button>
      </Dropdown>
    );
  }
}

export default CPDropdown;

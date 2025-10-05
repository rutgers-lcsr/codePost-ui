import * as React from 'react';
import { useContext } from 'react';

import { DownOutlined } from '@ant-design/icons';

import { Button, Dropdown, Space } from 'antd';

import { DropdownButtonProps } from 'antd/lib/dropdown';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

type ThemeType = 'light' | 'dark';
type JustifyType = 'space-between' | 'center';

interface ICPDropdownProps {
  value: string;
  theme?: ThemeType;
  justifyContent?: JustifyType;
  label?: string;
}

const CPDropdown: React.FC<DropdownButtonProps & ICPDropdownProps> = (props) => {
  const consoleTheme = useContext(ConsoleThemeContext);

  const { value, theme: _theme, ...restProps } = props;
  const justifyType = props.justifyContent === 'space-between' ? 'space-between' : 'center';

  const t = consoleThemes.light === consoleTheme.consoleTheme ? 'light' : 'dark';

  return (
    <Dropdown className={`cp-dropdown cp-dropdown--${t}`} {...restProps}>
      <Space.Compact style={{ display: 'flex', width: '100%' }}>
        {props.label !== undefined ? (
          <Button
            disabled={true}
            style={{
              backgroundColor: consoleTheme.consoleTheme.commentTitle,
              color: consoleTheme.consoleTheme.buttonDisabledColor,
            }}
          >
            {props.label}
          </Button>
        ) : null}
        <Button style={{ flexGrow: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: justifyType,
              alignItems: 'center',
            }}
          >
            {value} &nbsp; <DownOutlined />
          </div>
        </Button>
      </Space.Compact>
    </Dropdown>
  );
};

export default CPDropdown;

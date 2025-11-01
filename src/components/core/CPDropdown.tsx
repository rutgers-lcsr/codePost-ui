import * as React from 'react';
import { useContext, useState } from 'react';

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
  minWidth?: number;
}

const CPDropdown: React.FC<DropdownButtonProps & ICPDropdownProps> = (props) => {
  const consoleTheme = useContext(ConsoleThemeContext);
  const [open, setOpen] = useState(false);

  const { value, minWidth, ...restProps } = props;
  const justifyType = props.justifyContent === 'space-between' ? 'space-between' : 'center';

  const t = consoleThemes.light === consoleTheme.consoleTheme ? 'light' : 'dark';

  return (
    <Dropdown
      className={`cp-dropdown cp-dropdown--${t}`}
      {...restProps}
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      overlayStyle={{
        minWidth: minWidth || 250,
        ...restProps.overlayStyle,
      }}
    >
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
        <Button
          style={{
            flexGrow: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: justifyType,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <span
              style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginRight: '8px',
              }}
            >
              {value}
            </span>
            <DownOutlined style={{ fontSize: '10px' }} />
          </div>
        </Button>
      </Space.Compact>
    </Dropdown>
  );
};

export default CPDropdown;

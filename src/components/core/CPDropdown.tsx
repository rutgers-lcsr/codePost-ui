import * as React from 'react';

import { DownOutlined } from '@ant-design/icons';

import { Button, Dropdown } from 'antd';

import { DropdownButtonProps } from 'antd/lib/dropdown';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

const ButtonGroup = Button.Group;

type ThemeType = 'light' | 'dark';
type JustifyType = 'space-between' | 'center';

interface ICPDropdownProps {
  value: string;
  theme?: ThemeType;
  justifyContent?: JustifyType;
  label?: string;
}

class CPDropdown extends React.Component<DropdownButtonProps & ICPDropdownProps, {}> {
  public render() {
    const { value, theme, ...props } = this.props;
    const justifyType = props.justifyContent === 'space-between' ? 'space-between' : 'center';

    const t = consoleThemes.light === this.context.consoleTheme ? 'light' : 'dark';

    return (
      <Dropdown className={`cp-dropdown cp-dropdown--${t}`} {...props}>
        <ButtonGroup style={{ display: 'flex', width: '100%' }}>
          {props.label !== undefined ? (
            <Button
              disabled={true}
              style={{
                backgroundColor: this.context.consoleTheme.commentTitle,
                color: this.context.consoleTheme.buttonDisabledColor,
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
        </ButtonGroup>
      </Dropdown>
    );
  }
}
CPDropdown.contextType = ConsoleThemeContext;

export default CPDropdown;

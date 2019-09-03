import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';
const InputGroup = Input.Group;

export type CPPointInputType = 'small' | 'default';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

import ToggleButton from 'react-toggle-button';

// FIXME: these are only optional to prevent breaking the rest of the site.
//         We can generalize this much more elegantly.
interface ICPPointInputProps {
  value: number;
  size: CPPointInputType;
  onChange?: any; // FIXME - seems like Ant Type bug: https://cl.ly/c5094e2c4526
  onPlus?: any;
  onMinus?: any;
  disabled?: boolean;
  onKeyDown?: any;
}

class CPPointInput extends React.Component<ICPPointInputProps, {}> {
  public onChange = () => {
    this.props.onChange(this.props.value);
  };

  public setValue = (value: number) => {
    this.props.onChange(-value);
  };

  public render() {
    let className = 'cp-point-input';
    if (this.props.size === 'default') {
      className = className.concat(' ', 'cp-point-input--default');
    } else if (this.props.size === 'small') {
      className = className.concat(' ', 'cp-point-input--small');
    }

    // tslint:disable
    const style = this.props.disabled
      ? {
          backgroundColor: this.context.consoleTheme.buttonDisabledBg,
          color: this.context.consoleTheme.buttonDisabledColor,
          border: `1px solid ${this.context.consoleTheme.buttonSecondaryBorder}`,
        }
      : {
          backgroundColor: this.context.consoleTheme.commentBody,
          color: this.context.consoleTheme.text,
          border: `1px solid ${this.context.consoleTheme.buttonSecondaryBorder}`,
        };
    // tslint:enable

    const borderRadiusStyle = { borderRadius: 2 };
    const plus = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-8 0 42 42">
        <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
      </svg>
    );

    const minus = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-8 0 42 42">
        <path d="M0 10h24v4h-24z" />
      </svg>
    );

    const checked = this.props.value > 0;

    return (
      <InputGroup compact className={className}>
        <ToggleButton
          value={checked}
          inactiveLabel={''}
          activeLabel={''}
          onToggle={this.onChange}
          thumbStyle={borderRadiusStyle}
          trackStyle={{ ...borderRadiusStyle, width: '40px' }}
          containerStyle={{ display: 'inline-block', verticalAlign: 'middle' }}
          thumbIcon={checked ? plus : minus}
          thumbAnimateRange={[1, 20]}
          colors={{
            active: {
              base: '#24be85',
            },
            inactive: {
              base: '#d4382a',
            },
          }}
        />
        <InputNumber
          value={this.props.value}
          step={0.5}
          size={this.props.size}
          onChange={this.setValue}
          disabled={this.props.disabled}
          onKeyDown={this.props.onKeyDown}
          style={style}
        />
        <Button icon="plus" onClick={this.props.onPlus} disabled={this.props.disabled} style={style} />
        <Button icon="minus" onClick={this.props.onMinus} disabled={this.props.disabled} style={style} />
      </InputGroup>
    );
  }
}
CPPointInput.contextType = ConsoleThemeContext;

export default CPPointInput;

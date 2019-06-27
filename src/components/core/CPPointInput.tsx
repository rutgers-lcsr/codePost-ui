import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';
const InputGroup = Input.Group;

export type CPPointInputType = 'small' | 'default';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

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
  public render() {
    let className = 'cp-point-input';
    if (this.props.size === 'default') {
      className = className.concat(' ', 'cp-point-input--default');
    } else if (this.props.size === 'small') {
      className = className.concat(' ', 'cp-point-input--small');
    }

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

    return (
      <InputGroup compact className={className}>
        <InputNumber
          value={this.props.value}
          step={0.5}
          size={this.props.size}
          onChange={this.props.onChange}
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

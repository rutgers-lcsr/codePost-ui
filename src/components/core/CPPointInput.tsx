import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';
const InputGroup = Input.Group;

export type CPPointInputType = 'small' | 'default';

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

    return (
      <InputGroup compact className={className}>
        <InputNumber
          value={this.props.value}
          step={0.5}
          size={this.props.size}
          onChange={this.props.onChange}
          disabled={this.props.disabled}
          onKeyDown={this.props.onKeyDown}
        />
        <Button icon="plus" onClick={this.props.onPlus} disabled={this.props.disabled} />
        <Button icon="minus" onClick={this.props.onMinus} disabled={this.props.disabled} />
      </InputGroup>
    );
  }
}

export default CPPointInput;

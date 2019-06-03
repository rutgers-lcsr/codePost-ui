import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';
const InputGroup = Input.Group;

export type CPPointInputType = 'small' | 'default';

interface ICPPointInputProps {
  value: number;
  size: CPPointInputType;
  onChange?: any; // FIXME - seems like Ant Type bug: https://cl.ly/c5094e2c4526
  onPlus?: any;
  onMinus?: any;
}

class CPPointInput extends React.Component<ICPPointInputProps, {}> {
  // parser
  // value
  //
  // public parser = (value: string): number => {
  //   return parseFloat(value) ? parseFloat(value) : this.props.value;
  // };

  public render() {
    let className = 'cp-point-input';
    if (this.props.size === 'default') {
      className = className.concat(' ', 'cp-point-input--default');
    } else if (this.props.size === 'small') {
      className = className.concat(' ', 'cp-point-input--small');
    }

    return (
      <InputGroup compact className={className}>
        <InputNumber value={this.props.value} step={0.5} size={this.props.size} onChange={this.props.onChange} />
        <Button icon="plus" onClick={this.props.onPlus} />
        <Button icon="minus" onClick={this.props.onMinus} />
      </InputGroup>
    );
  }
}

export default CPPointInput;

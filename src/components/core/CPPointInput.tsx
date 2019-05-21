import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';
const InputGroup = Input.Group;

export type CPPointInputType = 'small' | 'default';

interface ICPPointInputProps {
  value: number;
  size: CPPointInputType;
  onPlus?: any;
  onMinus?: any;
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
        <InputNumber value={this.props.value} step={0.5} size={this.props.size} />
        <Button icon="plus" />
        <Button icon="minus" />
      </InputGroup>
    );
  }
}

export default CPPointInput;

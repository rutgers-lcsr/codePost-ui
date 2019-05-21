import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';
const InputGroup = Input.Group;

interface ICPPointInputProps {
  value: number;
  onPlus?: any;
  onMinus?: any;
}

class CPPointInput extends React.Component<ICPPointInputProps, {}> {
  public render() {
    return (
      <InputGroup compact className="cp-point-input">
        <InputNumber value={this.props.value} step={0.5} size="small" />
        <Button icon="plus" style={{ height: '24px' }} />
        <Button icon="minus" style={{ height: '24px' }} />
      </InputGroup>
    );
  }
}

export default CPPointInput;

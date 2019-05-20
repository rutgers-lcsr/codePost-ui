import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';
const InputGroup = Input.Group;

class CPPointInput extends React.Component<any, {}> {
  public render() {
    return (
      <InputGroup compact className="cp-point-input">
        <InputNumber defaultValue={0} step={0.5} size="small" />
        <Button icon="plus" style={{ height: '24px' }} />
        <Button icon="minus" style={{ height: '24px' }} />
      </InputGroup>
    );
  }
}

export default CPPointInput;

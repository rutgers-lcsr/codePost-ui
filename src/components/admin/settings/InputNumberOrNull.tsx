import * as React from 'react';

import { Input, InputNumber, Select } from 'antd';

interface IInputNumberOrNullProps {
  value: number | null;
  onChange: any;
}

class InputNumberOrNull extends React.Component<IInputNumberOrNullProps> {
  public handleOnOffChange = (status: any) => {
    if (status === 'On') {
      this.triggerChange(0);
    } else {
      this.triggerChange(null);
    }
  };

  public handleNumberChange = (value: any) => {
    this.triggerChange(value);
  };

  public triggerChange = (changedValue: number | null) => {
    this.props.onChange(changedValue);
  };

  render() {
    const selectValue = this.props.value !== null ? 'On' : 'Off';

    return (
      <span>
        <Input.Group compact>
          <Select onChange={this.handleOnOffChange} value={selectValue}>
            <Select.Option value="Off">Off</Select.Option>
            <Select.Option value="On">On</Select.Option>
          </Select>
          <InputNumber
            min={0}
            onChange={this.handleNumberChange}
            disabled={this.props.value === null}
            value={this.props.value === null ? undefined : this.props.value}
          />
        </Input.Group>
      </span>
    );
  }
}

export default InputNumberOrNull;

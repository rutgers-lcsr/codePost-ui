// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FC } from 'react';

import { Input, InputNumber, Select } from 'antd';

interface IInputNumberOrNullProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const InputNumberOrNull: FC<IInputNumberOrNullProps> = ({ value, onChange }) => {
  const handleOnOffChange = (status: string) => {
    if (status === 'On') {
      onChange(0);
    } else {
      onChange(null);
    }
  };

  const handleNumberChange = (newValue: number | null) => {
    onChange(newValue);
  };

  const selectValue = value !== null ? 'On' : 'Off';

  return (
    <span>
      <Input.Group compact>
        <label htmlFor="late-days-select" className="sr-only">
          Enable Late Days
        </label>
        <Select id="late-days-select" aria-label="Enable Late Days" onChange={handleOnOffChange} value={selectValue}>
          <Select.Option value="Off">Off</Select.Option>
          <Select.Option value="On">On</Select.Option>
        </Select>
        <label htmlFor="late-days-input" className="sr-only">
          Late Days Allowed
        </label>
        <InputNumber
          id="late-days-input"
          aria-label="Late Days Allowed"
          min={0}
          onChange={handleNumberChange}
          disabled={value === null}
          value={value === null ? undefined : value}
        />
      </Input.Group>
    </span>
  );
};

export default InputNumberOrNull;

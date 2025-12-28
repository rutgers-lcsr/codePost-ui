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
        <Select onChange={handleOnOffChange} value={selectValue}>
          <Select.Option value="Off">Off</Select.Option>
          <Select.Option value="On">On</Select.Option>
        </Select>
        <InputNumber
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

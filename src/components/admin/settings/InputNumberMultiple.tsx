import * as React from 'react';

import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';

import { Button, Input, InputNumber, Space } from 'antd';

interface IInputNumberMultipleProps {
  value: number[];
  onChange: any;
  emptyMessage?: string;
}

class InputNumberMultiple extends React.Component<IInputNumberMultipleProps, {}> {
  public addRow = () => {
    const updated = [...this.props.value, 0];
    this.props.onChange(updated);
  };

  public removeRow = () => {
    const updated = this.props.value.slice(0, this.props.value.length - 1);
    this.props.onChange(updated);
  };

  public changeValue = (value: number, index: number) => {
    const updated = [...this.props.value];
    updated[index] = value;
    this.props.onChange(updated);
  };

  render() {
    return (
      <span>
        {this.props.value.map((dayDeduction: number, day: number) => {
          const dayString = `${day + 1}${day === this.props.value.length - 1 ? '+' : ''} day${
            day + 1 === 1 ? '' : 's'
          } late`;

          const onChange = (changedValue: number | null) => {
            this.changeValue(changedValue !== null ? changedValue : 0, day);
          };

          return (
            <div
              key={`day-${day + 1}`}
              style={{ width: '171px', display: day === this.props.value.length - 1 ? 'inline-block' : 'block' }}
            >
              <span>
                <Space.Compact>
                  <Input disabled={true} value={dayString} style={{ width: '110px' }} />
                  <InputNumber min={0} value={dayDeduction} style={{ width: '60px' }} onChange={onChange} />
                </Space.Compact>
              </span>
            </div>
          );
        })}
        {this.props.value.length !== 0 ? (
          <span>
            <MinusCircleOutlined
              style={{ color: '#eb6f00', paddingLeft: '10px', cursor: 'pointer' }}
              onClick={this.removeRow}
            />
          </span>
        ) : null}
        {this.props.value.length === 0 && this.props.emptyMessage ? (
          <Button onClick={this.addRow}>{this.props.emptyMessage}</Button>
        ) : (
          <span>
            <PlusCircleOutlined
              style={{ color: '#24be85', paddingLeft: '10px', cursor: 'pointer' }}
              onClick={this.addRow}
            />
          </span>
        )}
      </span>
    );
  }
}

export default InputNumberMultiple;

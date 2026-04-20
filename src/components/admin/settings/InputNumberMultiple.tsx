// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Button, Input, InputNumber, Space, Tooltip, theme } from 'antd';
import * as React from 'react';

interface IInputNumberMultipleProps {
  value?: number[];
  onChange?: (value: number[]) => void;
  emptyMessage?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * InputNumberMultiple - A component for managing multiple late deduction values
 * Each row represents progressive days late with corresponding point deductions
 */
const InputNumberMultiple: React.FC<IInputNumberMultipleProps> = ({
  value = [],
  onChange,
  emptyMessage = 'Add deduction',
  min = 0,
  max,
  step = 1,
  placeholder = 'Points',
  disabled = false,
}) => {
  const { token } = theme.useToken();
  const handleAddRow = React.useCallback(() => {
    const updated = [...value, 0];
    onChange?.(updated);
  }, [value, onChange]);

  const handleRemoveRow = React.useCallback(() => {
    if (value.length > 0) {
      const updated = value.slice(0, value.length - 1);
      onChange?.(updated);
    }
  }, [value, onChange]);

  const handleChangeValue = React.useCallback(
    (newValue: number | null, index: number) => {
      const updated = [...value];
      updated[index] = newValue !== null ? newValue : 0;
      onChange?.(updated);
    },
    [value, onChange],
  );

  const getDayString = (dayIndex: number, isLast: boolean): string => {
    const dayNumber = dayIndex + 1;
    const suffix = isLast ? '+' : '';
    const plural = dayNumber === 1 ? '' : 's';
    return `${dayNumber}${suffix} day${plural} late`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorder}`,
        maxWidth: 'fit-content',
        margin: '10px 0',
      }}
    >
      {value.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {value.map((dayDeduction: number, index: number) => {
            const isLast = index === value.length - 1;
            const dayString = getDayString(index, isLast);

            return (
              <div
                key={`day-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: token.colorBgLayout,
                  borderRadius: token.borderRadius,
                  transition: 'all 0.3s ease',
                }}
              >
                <Space.Compact style={{ flex: 1 }}>
                  <Input
                    disabled
                    value={dayString}
                    style={{
                      width: '130px',
                      fontWeight: 500,
                      color: token.colorText,
                    }}
                  />
                  <InputNumber
                    min={min}
                    max={max}
                    step={step}
                    value={dayDeduction}
                    onChange={(changedValue) => handleChangeValue(changedValue, index)}
                    style={{ width: '100px' }}
                    placeholder={placeholder}
                    disabled={disabled}
                  />
                  <Button disabled style={{ cursor: 'default' }}>pts</Button>
                </Space.Compact>
                {isLast && (
                  <Tooltip title="Remove this deduction">
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={handleRemoveRow}
                      size="small"
                      disabled={disabled}
                      style={{ flexShrink: 0 }}
                    />
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        {value.length === 0 ? (
          <Button
            type="dashed"
            onClick={handleAddRow}
            icon={<PlusCircleOutlined />}
            disabled={disabled}
            style={{ width: '100%' }}
          >
            {emptyMessage}
          </Button>
        ) : (
          <Tooltip title="Add another day late deduction">
            <Button
              type="primary"
              ghost
              icon={<PlusCircleOutlined />}
              onClick={handleAddRow}
              size="small"
              disabled={disabled}
            >
              Add Day
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default InputNumberMultiple;

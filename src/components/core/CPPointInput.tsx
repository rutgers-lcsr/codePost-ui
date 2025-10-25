import { CaretDownOutlined, CaretUpOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, InputNumber, Segmented, Space, Switch, theme, Tooltip } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

export type PointType = 'positive' | 'negative';
export type CPPointInputType = 'small' | 'default';

interface ICPPointInputProps {
  value: number | undefined;
  size?: CPPointInputType;
  onChange?: (value: number) => void;
  disabled?: boolean;
  defaultToPositive?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: () => void;
  onMouseLeave?: () => void;
  step?: number;
}

// Constants
const DEFAULT_STEP = 0.5;
const TOGGLE_MIN_WIDTH = 30;

/**
 * Helper function to determine initial point type based on value
 */
const getInitialPointType = (value: number | undefined, defaultToPositive?: boolean): PointType => {
  const defaultValue = defaultToPositive ? 'positive' : 'negative';
  if (value !== undefined && value !== 0) {
    return value > 0 ? 'positive' : 'negative';
  }
  return defaultValue;
};

/**
 * CPPointInput Component
 *
 * A specialized input for managing point values with positive/negative toggle.
 *
 * Sign convention:
 * - The component receives and displays signed values
 * - Internally displays absolute value with a toggle switch
 * - Toggle state (positive/negative) determines the sign when calling onChange
 * - Positive (green): Bonus points → sends negative values (e.g., -2)
 * - Negative (red): Penalty points → sends positive values (e.g., 2)
 *
 * This allows the parent component to work with signed values while providing
 * an intuitive UI where users toggle between bonus/penalty and enter magnitudes.
 */
const CPPointInput: React.FC<ICPPointInputProps> = ({
  value,
  size = 'default',
  onChange,
  disabled = false,
  defaultToPositive = false,
  onKeyDown,
  onBlur,
  onMouseLeave,
  step = DEFAULT_STEP,
}) => {
  const consoleTheme = useContext(ConsoleThemeContext);
  const { token } = theme.useToken();

  const { colorBgContainer, colorBorder, colorText, colorError, colorSuccess, colorTextLightSolid } = token;

  const [pointType, setPointType] = useState<PointType>(() => getInitialPointType(value, defaultToPositive));

  useEffect(() => {
    setPointType(getInitialPointType(value, defaultToPositive));
  }, [value, defaultToPositive]);

  const setValue = useCallback(
    (newValue: number | null | undefined) => {
      if (newValue === null || newValue === undefined || Number.isNaN(newValue) || !onChange) {
        return;
      }

      const adjustedValue = pointType === 'positive' ? -newValue : newValue;
      onChange(adjustedValue);
    },
    [onChange, pointType],
  );

  const toggleType = useCallback(() => {
    if (disabled || value === undefined || !onChange) {
      return;
    }

    const nextType = pointType === 'positive' ? 'negative' : 'positive';
    setPointType(nextType);

    const magnitude = Math.abs(value);
    const adjustedValue = nextType === 'positive' ? -magnitude : magnitude;
    onChange(adjustedValue);
  }, [disabled, onChange, pointType, value]);

  const absValue = Math.abs(value ?? 0);

  const precision = useMemo(() => {
    const decimals = step.toString().split('.')[1];
    return decimals ? decimals.length : 0;
  }, [step]);

  const onPlus = useCallback(() => {
    const nextMagnitude = absValue + step;
    setValue(parseFloat(nextMagnitude.toFixed(precision)));
  }, [absValue, precision, setValue, step]);

  const onMinus = useCallback(() => {
    const nextMagnitude = Math.max(0, absValue - step);
    setValue(parseFloat(nextMagnitude.toFixed(precision)));
  }, [absValue, precision, setValue, step]);

  const groupClass = useMemo(
    () =>
      consoleTheme.consoleTheme === consoleThemes.light
        ? 'point-input-group'
        : 'point-input-group point-input-group--dark',
    [consoleTheme.consoleTheme],
  );

  const isPositive = pointType === 'positive';
  const displayValue = value !== undefined ? Math.abs(value) : undefined;
  const isMinusDisabled = disabled || absValue === 0;

  return (
    <Space size={size == 'small' ? 1 : 8} align="center" className={groupClass} wrap={size === 'small' ? true : false}>
      <Switch
        checkedChildren={<PlusOutlined />}
        unCheckedChildren={<MinusOutlined />}
        checked={isPositive}
        disabled={disabled}
        size={size}
        style={{
          backgroundColor: isPositive ? colorSuccess : colorError,
        }}
        onChange={toggleType}
      />

      <Space.Compact size={size === 'small' ? 'small' : 'middle'}>
        <InputNumber
          value={displayValue}
          onChange={setValue}
          disabled={disabled}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onMouseLeave={onMouseLeave}
          min={0}
          style={{
            maxWidth: size === 'small' ? 50 : 70,
          }}
          step={step}
          precision={precision}
          controls={false}
          aria-label="Point value"
        />
        <Button icon={<CaretUpOutlined />} onClick={onPlus} disabled={disabled} aria-label="Increase points" />
        <Button
          icon={<CaretDownOutlined />}
          onClick={onMinus}
          disabled={isMinusDisabled}
          aria-label="Decrease points"
        />
      </Space.Compact>
    </Space>
  );
};

export default CPPointInput;

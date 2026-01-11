import { CaretDownOutlined, CaretUpOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, InputNumber, Space } from 'antd';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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

/**
 * Helper function to determine initial point type based on value
 */
const getTypeFromValue = (value: number | undefined, defaultToPositive?: boolean): PointType => {
  const defaultValue = defaultToPositive ? 'negative' : 'positive';
  if (value !== undefined && value !== 0) {
    // value > 0 means Deduction. Deduction UI is 'negative' (Red Minus).
    // value < 0 means Bonus. Bonus UI is 'positive' (Green Plus).
    return value > 0 ? 'negative' : 'positive';
  }
  return defaultValue;
};

/**
 * CPPointInput Component
 *
 * A specialized input for managing point values with positive/negative toggle.
 *
 * Sign convention:
 * - The component receives signed values and displays absolute value
 * - Toggle state (positive/negative) determines the sign when calling onChange
 * - Positive (green): Bonus points → sends negative values (e.g., -2)
 * - Negative (red): Penalty points → sends positive values (e.g., 2)
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

  // Track the type as stable state - only changes on explicit user toggle or when value identity changes
  const [pointType, setPointType] = useState<PointType>(() => getTypeFromValue(value, defaultToPositive));

  // Track the previous value to detect when navigating to a different item
  const prevValueRef = useRef<number | undefined>(value);

  // When value changes from external source (navigation), sync the type
  useEffect(() => {
    const prevValue = prevValueRef.current;

    // Only sync if value changed AND has a different sign (indicating navigation to different item)
    if (value !== undefined && prevValue !== undefined) {
      const prevSign = Math.sign(prevValue);
      const newSign = Math.sign(value);

      // If signs are different (or one is zero and other isn't), this is likely a navigation
      if ((prevSign !== newSign) || (prevValue === 0 && value !== 0)) {
        setPointType(getTypeFromValue(value, defaultToPositive));
      }
    } else if (value !== undefined && prevValue === undefined) {
      // First time receiving a value
      setPointType(getTypeFromValue(value, defaultToPositive));
    }

    prevValueRef.current = value;
  }, [value, defaultToPositive]);

  const precision = useMemo(() => {
    const decimals = step.toString().split('.')[1];
    return decimals ? decimals.length : 0;
  }, [step]);

  const handleValueChange = useCallback(
    (newDisplayValue: number | null | undefined) => {
      if (!onChange) return;

      let magnitude = newDisplayValue;
      if (magnitude === null || magnitude === undefined || Number.isNaN(magnitude)) {
        magnitude = 0;
      }

      // Apply sign based on current type
      const signedValue = pointType === 'positive' ? -magnitude : magnitude;
      onChange(signedValue);
    },
    [onChange, pointType],
  );

  const handleTypeChange = useCallback(
    (newType: PointType) => {
      if (disabled || !onChange || newType === pointType) {
        return;
      }

      setPointType(newType);

      // Convert current value to new sign
      const magnitude = Math.abs(value ?? 0);
      const signedValue = newType === 'positive' ? -magnitude : magnitude;
      onChange(signedValue);
    },
    [disabled, onChange, pointType, value],
  );

  const handleIncrement = useCallback(() => {
    if (!onChange) return;
    const magnitude = Math.abs(value ?? 0);
    const newMagnitude = parseFloat((magnitude + step).toFixed(precision));
    const signedValue = pointType === 'positive' ? -newMagnitude : newMagnitude;
    onChange(signedValue);
  }, [onChange, value, step, precision, pointType]);

  const handleDecrement = useCallback(() => {
    if (!onChange) return;
    const magnitude = Math.abs(value ?? 0);
    const newMagnitude = parseFloat(Math.max(0, magnitude - step).toFixed(precision));
    const signedValue = pointType === 'positive' ? -newMagnitude : newMagnitude;
    onChange(signedValue);
  }, [onChange, value, step, precision, pointType]);

  const groupClass = useMemo(
    () =>
      consoleTheme.consoleTheme === consoleThemes.light
        ? 'point-input-group'
        : 'point-input-group point-input-group--dark',
    [consoleTheme.consoleTheme],
  );

  const displayValue = value !== undefined ? Math.abs(value) : undefined;
  const isBonus = pointType === 'positive';
  const isDecrementDisabled = disabled || (displayValue === 0 || displayValue === undefined);

  return (
    <div className={`${groupClass} cp-point-input--${size}`}>
      <div className="cp-point-input__toggle">
        <Button
          type="text"
          size={size === 'small' ? 'small' : 'middle'}
          className={`cp-point-input__toggle-btn ${!isBonus ? 'cp-point-input__toggle-btn--active-deduction' : ''}`}
          onClick={() => handleTypeChange('negative')}
          disabled={disabled}
          icon={<MinusOutlined />}
          aria-label="Deduction"
          title="Deduction"
        />
        <Button
          type="text"
          size={size === 'small' ? 'small' : 'middle'}
          className={`cp-point-input__toggle-btn ${isBonus ? 'cp-point-input__toggle-btn--active-bonus' : ''}`}
          onClick={() => handleTypeChange('positive')}
          disabled={disabled}
          icon={<PlusOutlined />}
          aria-label="Bonus"
          title="Bonus"
        />
      </div>

      <div className="cp-point-input__divider" />

      <Space.Compact size={size === 'small' ? 'small' : 'middle'} className="cp-point-input__controls">
        <InputNumber
          value={displayValue}
          onChange={handleValueChange}
          disabled={disabled}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onMouseLeave={onMouseLeave}
          min={0}
          step={step}
          precision={precision}
          controls={false}
          aria-label="Point value"
          className="cp-point-input__number"
        />
        <div className="cp-point-input__steppers">
          <Button
            className="cp-point-input__stepper-btn"
            icon={<CaretUpOutlined />}
            onClick={handleIncrement}
            disabled={disabled}
            size="small"
            type="text"
            aria-label="Increase points"
          />
          <Button
            className="cp-point-input__stepper-btn"
            icon={<CaretDownOutlined />}
            onClick={handleDecrement}
            disabled={isDecrementDisabled}
            size="small"
            type="text"
            aria-label="Decrease points"
          />
        </div>
      </Space.Compact>
    </div>
  );
};

export default CPPointInput;

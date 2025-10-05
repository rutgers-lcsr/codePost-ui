import { CaretDownOutlined, CaretUpOutlined, MinusCircleFilled, PlusCircleFilled } from '@ant-design/icons';
import { Button, Input, InputNumber } from 'antd';
import { useContext, useEffect, useState } from 'react';
import ToggleButton from 'react-toggle-button';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

export type PointType = 'positive' | 'negative';
export type CPPointInputType = 'small' | 'default';

const InputGroup = Input.Group;

interface ICPPointInputProps {
  value: number | undefined;
  size: CPPointInputType;
  onChange?: (value: number) => void;
  disabled?: boolean;
  defaultToPositive?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: () => void;
  onMouseLeave?: () => void;
  step?: number;
}

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
const CPPointInput: React.FC<ICPPointInputProps> = (props) => {
  const consoleTheme = useContext(ConsoleThemeContext);

  const getInitialPointType = (value: number | undefined, defaultToPositive?: boolean): PointType => {
    const defaultValue = defaultToPositive ? 'positive' : 'negative';
    if (value !== undefined && value !== 0) {
      return value > 0 ? 'positive' : 'negative';
    }
    return defaultValue;
  };

  const [pointType, setPointType] = useState<PointType>(() =>
    getInitialPointType(props.value, props.defaultToPositive),
  );

  useEffect(() => {
    const newPointType = getInitialPointType(props.value, props.defaultToPositive);
    setPointType(newPointType);
  }, [props.value, props.defaultToPositive]);

  /**
   * Updates the point value with proper sign based on the current pointType toggle.
   * - Positive (green/bonus): Sends negative value (e.g., -2 means +2 bonus)
   * - Negative (red/penalty): Sends positive value (e.g., 2 means -2 penalty)
   */
  const setValue = (value: number | undefined | null) => {
    if (value === undefined || value === null || !props.onChange) {
      return;
    }

    const adjustedValue = pointType === 'positive' ? -value : value;
    props.onChange(adjustedValue);
  };

  /**
   * Handles toggling between positive (bonus) and negative (penalty) modes.
   * Important: We calculate the adjusted value using the NEW pointType immediately,
   * rather than calling setValue(), to avoid using stale state from the closure.
   */
  const toggleType = () => {
    if (props.disabled || props.value === undefined || !props.onChange) {
      return;
    }

    const newPointType = pointType === 'positive' ? 'negative' : 'positive';
    setPointType(newPointType);

    const absValue = Math.abs(props.value);
    const adjustedValue = newPointType === 'positive' ? -absValue : absValue;
    props.onChange(adjustedValue);
  };

  const step = props.step ?? 0.5;
  const absValue = Math.abs(props.value ?? 0);

  const onPlus = () => {
    setValue(parseFloat((absValue + step).toFixed(2)));
  };

  const onMinus = () => {
    setValue(parseFloat((absValue - step).toFixed(2)));
  };

  const className = `cp-point-input cp-point-input--${props.size}`;

  const style = props.disabled
    ? {
        backgroundColor: consoleTheme.consoleTheme.buttonDisabledBg,
        color: consoleTheme.consoleTheme.buttonDisabledColor,
        border: `1px solid ${consoleTheme.consoleTheme.buttonSecondaryBorder}`,
      }
    : {
        backgroundColor: consoleTheme.consoleTheme.commentBody,
        color: consoleTheme.consoleTheme.text,
        border: `1px solid ${consoleTheme.consoleTheme.buttonSecondaryBorder}`,
      };

  const groupClass =
    consoleTheme.consoleTheme === consoleThemes.light
      ? 'point-input-group'
      : 'point-input-group point-input-group--dark';

  const iconStyle: React.CSSProperties = {
    height: '10px',
    width: '10px',
    fill: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  const isPositive = pointType === 'positive';
  const thumbIcon = isPositive ? (
    <PlusCircleFilled key="plus" style={iconStyle} />
  ) : (
    <MinusCircleFilled key="minus" style={iconStyle} />
  );

  return (
    <div className={groupClass}>
      <ToggleButton
        value={isPositive}
        inactiveLabel=""
        activeLabel=""
        onToggle={toggleType}
        thumbStyle={{
          borderRadius: 4,
          boxShadow: 'none',
        }}
        trackStyle={{ borderRadius: 5, width: '32px' }}
        containerStyle={{
          display: 'inline-block',
          verticalAlign: 'middle',
          width: '40px',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
        }}
        thumbIcon={thumbIcon}
        thumbAnimateRange={[1, 13]}
        colors={{
          activeThumb: {
            base: consoleTheme.consoleTheme.commentBody,
          },
          inactiveThumbe: {
            base: consoleTheme.consoleTheme.commentBody,
          },
          active: {
            base: '#24be85',
          },
          inactive: {
            base: '#d4382a',
          },
        }}
      />
      <InputGroup
        compact
        className={className}
        style={{ display: 'flex', justifyContent: 'flex-end' }}
        onBlur={props.onBlur}
        onMouseLeave={props.onMouseLeave}
      >
        <InputNumber
          value={props.value !== undefined ? Math.abs(props.value) : undefined}
          size={props.size === 'default' ? 'middle' : 'small'}
          onChange={setValue}
          disabled={props.disabled}
          onKeyDown={props.onKeyDown}
          style={style}
          min={0}
        />
        <Button icon={<CaretUpOutlined />} onClick={onPlus} disabled={props.disabled} style={style} />
        <Button
          icon={<CaretDownOutlined />}
          onClick={onMinus}
          disabled={props.disabled || props.value === 0}
          style={style}
        />
      </InputGroup>
    </div>
  );
};

export default CPPointInput;

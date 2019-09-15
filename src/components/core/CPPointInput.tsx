import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

import ToggleButton from 'react-toggle-button';

import { ReactComponent as MinusSvg } from '../../img/icons/minus.svg';
import { ReactComponent as PlusSvg } from '../../img/icons/plus.svg';

export type PointType = 'positive' | 'negative';

export type CPPointInputThemeType = 'light' | 'dark';

export type CPPointInputType = 'small' | 'default';

const InputGroup = Input.Group;

// FIXME: these are only optional to prevent breaking the rest of the site.
//         We can generalize this much more elegantly.
interface ICPPointInputProps {
  value: number | undefined;
  size: CPPointInputType;
  onChange?: any; // FIXME - seems like Ant Type bug: https://cl.ly/c5094e2c4526
  disabled?: boolean;
  defaultToPositive?: boolean;
  onKeyDown?: any;
  onBlur?: () => void;
  onMouseLeave?: () => void;
  theme?: CPPointInputThemeType;
  step?: number;
}

interface IState {
  pointType: PointType;
}

class CPPointInput extends React.Component<ICPPointInputProps, IState> {
  public constructor(props: ICPPointInputProps) {
    super(props);
    const defaultValue = props.defaultToPositive ? 'positive' : 'negative';
    let pointType: PointType = defaultValue;
    if (props.value !== undefined && props.value !== 0) {
      pointType = props.value > 0 ? 'positive' : 'negative';
    }

    this.state = {
      pointType,
    };
  }

  public componentDidUpdate(prevProps: ICPPointInputProps) {
    if (prevProps.value !== this.props.value) {
      const defaultValue = this.props.defaultToPositive ? 'positive' : 'negative';
      let pointType: PointType = defaultValue;
      if (this.props.value !== undefined && this.props.value !== 0) {
        pointType = this.props.value > 0 ? 'positive' : 'negative';
      }

      this.setState({
        pointType,
      });
    }
  }

  public toggleType = () => {
    if (this.props.disabled || this.props.value === undefined) {
      return;
    }

    this.setState(
      (oldState) => {
        return {
          pointType: oldState.pointType === 'positive' ? 'negative' : 'positive',
        };
      },
      () => {
        this.setValue(Math.abs(this.props.value!));
      },
    );
  };

  public setValue = (value: number | undefined) => {
    if (value === undefined) {
      return;
    }

    if (this.state.pointType === 'positive') {
      this.props.onChange(-value);
    } else {
      this.props.onChange(value);
    }
  };

  public onPlus = () => {
    const step = this.props.step !== undefined ? this.props.step : 0.5;
    this.setValue(Math.abs(this.props.value !== undefined ? this.props.value : 0) + step);
  };

  public onMinus = () => {
    const step = this.props.step !== undefined ? this.props.step : 0.5;
    this.setValue(Math.abs(this.props.value !== undefined ? this.props.value : 0) - step);
  };

  public render() {
    let className = 'cp-point-input';
    if (this.props.size === 'default') {
      className = className.concat(' ', 'cp-point-input--default');
    } else if (this.props.size === 'small') {
      className = className.concat(' ', 'cp-point-input--small');
    }

    // tslint:disable
    const style = this.props.disabled
      ? {
          backgroundColor: this.context.consoleTheme.buttonDisabledBg,
          color: this.context.consoleTheme.buttonDisabledColor,
          border: `1px solid ${this.context.consoleTheme.buttonSecondaryBorder}`,
        }
      : {
          backgroundColor: this.context.consoleTheme.commentBody,
          color: this.context.consoleTheme.text,
          border: `1px solid ${this.context.consoleTheme.buttonSecondaryBorder}`,
        };
    // tslint:enable

    const groupClass =
      consoleThemes.light === this.context.consoleTheme
        ? 'point-input-group'
        : 'point-input-group point-input-group--dark';

    const plus = (
      <PlusSvg
        key="plus"
        style={{
          height: '8px',
          width: '8px',
          fill: 'rgba(0, 0, 0, 0.8)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    );

    const minus = (
      <MinusSvg
        key="minus"
        style={{
          height: '8px',
          width: '8px',
          fill: 'rgba(0, 0, 0, 0.8)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    );

    const checked = this.state.pointType === 'positive';

    return (
      <div className={groupClass}>
        <ToggleButton
          value={checked}
          inactiveLabel={''}
          activeLabel={''}
          onToggle={this.toggleType}
          thumbStyle={{
            borderRadius: 4,
            boxShadow: 'none',
          }}
          trackStyle={{ borderRadius: 5, width: '32px' }}
          containerStyle={{
            display: 'inline-block',
            verticalAlign: 'middle',
            width: '40px',
            cursor: this.props.disabled ? 'not-allowed' : 'pointer',
          }}
          thumbIcon={checked ? plus : minus}
          thumbAnimateRange={[1, 13]}
          colors={{
            activeThumb: {
              base: this.context.consoleTheme.commentBody,
            },
            inactiveThumbe: {
              base: this.context.consoleTheme.commentBody,
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
          onBlur={this.props.onBlur ? this.props.onBlur : undefined}
          onMouseLeave={this.props.onMouseLeave ? this.props.onMouseLeave : undefined}
        >
          <InputNumber
            value={this.props.value !== undefined ? Math.abs(this.props.value) : undefined}
            size={this.props.size}
            onChange={this.setValue}
            disabled={this.props.disabled}
            onKeyDown={this.props.onKeyDown}
            style={style}
            min={0}
          />
          <Button icon="caret-up" onClick={this.onPlus} disabled={this.props.disabled} style={style} />
          <Button
            icon="caret-down"
            onClick={this.onMinus}
            disabled={this.props.disabled || this.props.value === 0}
            style={style}
          />
        </InputGroup>
      </div>
    );
  }
}
CPPointInput.contextType = ConsoleThemeContext;

export default CPPointInput;

import * as React from 'react';

import { Button, Input, InputNumber } from 'antd';
const InputGroup = Input.Group;

export type CPPointInputType = 'small' | 'default';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

import ToggleButton from 'react-toggle-button';

export type PointType = 'positive' | 'negative';

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

  public setValue = (value: number) => {
    if (this.state.pointType === 'positive') {
      this.props.onChange(-value);
    } else {
      this.props.onChange(value);
    }
  };

  public onPlus = () => {
    this.setValue(Math.abs(this.props.value !== undefined ? this.props.value : 0) + 0.5);
  };

  public onMinus = () => {
    this.setValue(Math.abs(this.props.value !== undefined ? this.props.value : 0) - 0.5);
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

    const borderRadiusStyle = { borderRadius: 2 };
    const plus = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-8 0 42 42">
        <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
      </svg>
    );

    const minus = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-8 0 42 42">
        <path d="M0 10h24v4h-24z" />
      </svg>
    );

    const checked = this.state.pointType === 'positive';

    return (
      <InputGroup
        compact
        className={className}
        onBlur={this.props.onBlur ? this.props.onBlur : undefined}
        onMouseLeave={this.props.onMouseLeave ? this.props.onMouseLeave : undefined}
      >
        <ToggleButton
          value={checked}
          inactiveLabel={''}
          activeLabel={''}
          onToggle={this.toggleType}
          thumbStyle={borderRadiusStyle}
          trackStyle={{ ...borderRadiusStyle, width: '40px' }}
          containerStyle={{
            display: 'inline-block',
            verticalAlign: 'middle',
            cursor: this.props.disabled ? 'not-allowed' : undefined,
          }}
          thumbIcon={checked ? plus : minus}
          thumbAnimateRange={[1, 20]}
          colors={{
            active: {
              base: '#24be85',
            },
            inactive: {
              base: '#d4382a',
            },
          }}
        />
        <InputNumber
          value={this.props.value !== undefined ? Math.abs(this.props.value) : undefined}
          step={0.5}
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
    );
  }
}
CPPointInput.contextType = ConsoleThemeContext;

export default CPPointInput;

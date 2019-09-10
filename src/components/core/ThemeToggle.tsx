import * as React from 'react';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

import { ReactComponent as MoonSvg } from '../../img/icons/moon.svg';
import { ReactComponent as SunSvg } from '../../img/icons/sun.svg';

import ToggleButton from 'react-toggle-button';

import useHotkeys, { L_KEY } from '../code-review/useHotkeys';

import CPTooltip from './CPTooltip';
import { tooltips } from './tooltips';

interface IProps {
  small?: boolean;
}

const ThemeToggle = (props: IProps) => {
  const { toggleConsoleTheme } = React.useContext(ConsoleThemeContext);
  const [checked, setChecked] = React.useState(false);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange();
  };

  const onChange = () => {
    if (checked) {
      setChecked(false);
      toggleConsoleTheme('light');
    } else {
      setChecked(true);
      toggleConsoleTheme('dark');
    }
  };

  useHotkeys(L_KEY, onChange, true);

  // @ts-ignore
  const Moon = (
    <MoonSvg
      onClick={onClick}
      style={{
        height: props.small ? '12px' : '16px',
        fill: 'white',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );

  const Sun = (
    <SunSvg
      onClick={onClick}
      key="sun"
      style={{
        height: props.small ? '12px' : '16px',
        fill: '#e5dc8d',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );

  const icon = checked ? Moon : Sun;

  const border = checked ? '1px solid #494d4f' : '1px solid rgb(220, 220, 220)';

  return (
    <CPTooltip title={tooltips.grade.header.darkMode} hideThisOnHideTips={true}>
      <ToggleButton
        inactiveLabel={''}
        activeLabel={''}
        colors={{
          activeThumb: {
            base: '#212325',
          },
          inactiveThumb: {
            base: '#fff',
          },
          active: {
            base: '#494d4f',
          },
          inactive: {
            base: 'rgb(220, 220, 220)',
          },
        }}
        trackStyle={{ width: props.small ? '25px' : '30px', height: props.small ? '10px' : '12px' }}
        thumbStyle={{
          width: props.small ? '20px' : '25px',
          height: props.small ? '20px' : '25px',
          border,
          boxShadow: 'rgba(0, 0, 0, 0.0) 0px 0px 0px 1px',
        }}
        thumbAnimateRange={[-12, 16]}
        thumbIcon={icon}
        value={checked}
        onToggle={onChange}
        containerStyle={{ width: props.small ? '25px' : '30px' }}
      />
    </CPTooltip>
  );
};

export default ThemeToggle;

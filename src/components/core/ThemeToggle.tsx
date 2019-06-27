import * as React from 'react';

import { Icon } from 'antd';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

import { ReactComponent as MoonSvg } from '../../img/icons/moon.svg';
import { ReactComponent as SunSvg } from '../../img/icons/sun.svg';

import ToggleButton from 'react-toggle-button';

const ThemeToggle = (props: any) => {
  const { toggleConsoleTheme } = React.useContext(ConsoleThemeContext);
  const [checked, setChecked] = React.useState(false);

  const onChange = () => {
    if (checked) {
      setChecked(false);
      toggleConsoleTheme('light');
    } else {
      setChecked(true);
      toggleConsoleTheme('dark');
    }
  };

  const Moon = () => {
    return <MoonSvg style={{ height: '16px', fill: 'white' }} />;
  };
  const Sun = () => {
    return <SunSvg key="sun" style={{ height: '16px', fill: '#e5dc8d' }} />;
  };

  const icon = checked ? (
    <Icon
      component={Moon}
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    />
  ) : (
    <Icon
      component={Sun}
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    />
  );

  const border = checked ? '1px solid #494d4f' : '1px solid rgb(220, 220, 220)';
  return (
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
      trackStyle={{ width: '30px', height: '12px' }}
      thumbStyle={{ width: '25px', height: '25px', border, boxShadow: 'rgba(0, 0, 0, 0.0) 0px 0px 0px 1px' }}
      thumbAnimateRange={[-12, 16]}
      thumbIcon={icon}
      value={checked}
      onToggle={onChange}
      containerStyle={{ width: '30px' }}
    />
  );
};

export default ThemeToggle;

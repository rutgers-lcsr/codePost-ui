// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ReactComponent as MoonSvg } from '../../img/icons/moon.svg';
import { ReactComponent as SunSvg } from '../../img/icons/sun.svg';
import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

import useHotkeys, { L_KEY } from '@code-review/useHotkeys';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import { Switch, theme } from 'antd';
import CPTooltip from './CPTooltip';
import { tooltips } from './tooltips';
interface IProps {
  small?: boolean;
}

// Constants
const LARGE_ICON_SIZE = 16;
const SMALL_ICON_SIZE = 12;

const ThemeToggle: React.FC<IProps> = ({ small = false }) => {
  const { toggleConsoleTheme } = useContext(ConsoleThemeContext);
  const [checked, setChecked] = useState(LOCAL_SETTINGS.darkMode.getter());
  const { token } = theme.useToken();

  useEffect(() => {
    const isDarkMode = LOCAL_SETTINGS.darkMode.getter();
    toggleConsoleTheme(isDarkMode ? 'dark' : 'light');
  }, [toggleConsoleTheme]);

  const onChange = useCallback(() => {
    const newChecked = !checked;
    setChecked(newChecked);
    toggleConsoleTheme(newChecked ? 'dark' : 'light');
    LOCAL_SETTINGS.darkMode.setter(newChecked);
  }, [checked, toggleConsoleTheme]);

  useHotkeys(L_KEY, onChange, true);

  // Memoized styles
  const iconSize = useMemo(() => (small ? SMALL_ICON_SIZE : LARGE_ICON_SIZE), [small]);

  return (
    <CPTooltip title={tooltips.grade.header.darkMode} hideThisOnHideTips={true}>
      <Switch
        aria-label={checked ? 'Switch to light mode' : 'Switch to dark mode'}
        checked={checked}
        onChange={onChange}
        style={{
          backgroundColor: checked ? token.colorBgContainerDisabled : token.colorFillSecondary,
        }}
        checkedChildren={<MoonSvg style={{ height: `${iconSize}px`, fill: token.colorTextLightSolid }} />}
        unCheckedChildren={<SunSvg style={{ height: `${iconSize}px`, fill: token.colorWarning }} />}
      />
    </CPTooltip>
  );
};

export default ThemeToggle;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ReactComponent as HighlighterSvg } from '../../img/icons/highlighter.svg';
import { ReactComponent as HighlighterSelectedSvg } from '../../img/icons/highlighterselected.svg';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import CPTooltip from './CPTooltip';
import { tooltips } from './tooltips';

import { Switch, theme } from 'antd';

interface CursorToggleProps {
  toggleCursorMode: (cursorMode: boolean) => void;
  cursorMode: boolean;
  small?: boolean;
}

// Constants
const LARGE_ICON_SIZE = 16;
const SMALL_ICON_SIZE = 12;

const CursorToggle: React.FC<CursorToggleProps> = ({ toggleCursorMode, cursorMode, small = false }) => {
  const [checked, setChecked] = useState(cursorMode);
  const { token } = theme.useToken();

  useEffect(() => {
    setChecked(cursorMode);
  }, [cursorMode]);

  const onChange = useCallback(() => {
    const newChecked = !checked;
    setChecked(newChecked);
    toggleCursorMode(newChecked);
    LOCAL_SETTINGS.cursorMode.setter(newChecked);
  }, [checked, toggleCursorMode]);

  // Memoized styles
  const iconSize = useMemo(() => (small ? SMALL_ICON_SIZE : LARGE_ICON_SIZE), [small]);

  return (
    <CPTooltip title={tooltips.grade.header.cursorMode} hideThisOnHideTips={false}>
      <Switch
        checked={checked}
        onChange={onChange}
        aria-label={checked ? 'Switch to normal cursor' : 'Switch to line mode'}
        style={{
          backgroundColor: token.colorFillSecondary,
        }}
        checkedChildren={<HighlighterSelectedSvg style={{ height: `${iconSize}px`, fill: token.colorInfo }} />}
        unCheckedChildren={<HighlighterSvg style={{ height: `${iconSize}px` }} />}
      />
    </CPTooltip>
  );
};

export default CursorToggle;

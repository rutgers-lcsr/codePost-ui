import * as React from 'react';

import { ReactComponent as HighlighterSvg } from '../../img/icons/highlighter.svg';
import { ReactComponent as HighlighterSelectedSvg } from '../../img/icons/highlighterselected.svg';
// import { ReactComponent as SunSvg } from '../../img/icons/sun.svg';

import ToggleButton from 'react-toggle-button';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import CPTooltip from './CPTooltip';
import { tooltips } from './tooltips';

interface IProps {
  toggleCursorMode: (cursorMode: boolean) => void;
  cursorMode: boolean;
  small?: boolean;
}

const CursorToggle = (props: IProps) => {
  // const { toggleConsoleTheme } = React.useContext(ConsoleThemeContext);
  // const [checked, setChecked] = React.useState(LOCAL_SETTINGS.darkMode.getter());
  const [checked, setChecked] = React.useState(props.cursorMode);

  React.useEffect(() => {
    setChecked(props.cursorMode);

    // Should implement useCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.cursorMode]);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange();
  };

  const onChange = () => {
    if (checked) {
      setChecked(false);
      props.toggleCursorMode(false);
      LOCAL_SETTINGS.cursorMode.setter(false);
    } else {
      setChecked(true);
      props.toggleCursorMode(true);
      LOCAL_SETTINGS.cursorMode.setter(true);
    }
  };

  // useHotkeys(L_KEY, onChange, true);

  // @ts-ignore
  const HighlighterLight = (
    <HighlighterSvg
      onClick={onClick}
      style={{
        height: props.small ? '12px' : '16px',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );

  const HighlighterDark = (
    <HighlighterSelectedSvg
      onClick={onClick}
      key="highlighter-dark"
      style={{
        height: props.small ? '12px' : '16px',
        fill: 'rgba(0, 0, 255, 0.5)',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );

  const icon = checked ? HighlighterDark : HighlighterLight;

  const border = checked ? '1px solid rgb(220, 220, 220)' : '1px solid rgb(220, 220, 220)';

  return (
    <CPTooltip title={tooltips.grade.header.cursorMode} hideThisOnHideTips={false}>
      <ToggleButton
        inactiveLabel={''}
        activeLabel={''}
        colors={{
          activeThumb: {
            base: '#fff',
          },
          inactiveThumb: {
            base: '#fff',
          },
          active: {
            base: 'rgb(220, 220, 220)',
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
        containerStyle={{ width: props.small ? '25px' : '30px', marginRight: '12px' }}
      />
    </CPTooltip>
  );
};

export default CursorToggle;

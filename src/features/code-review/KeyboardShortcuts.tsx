import * as React from 'react';
import { OS, getOperatingSystem, osControlKey } from '../../components/core/operatingSystem';
import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';
import shortcuts from './keyboard_shortcuts.tsx';

import { Drawer, Tabs, Tooltip, ConfigProvider, theme } from 'antd';
const { TabPane } = Tabs;

interface IKeyboardShortCutsProps {
  visible: boolean;
  onClose: () => void;
  isStudent: boolean;
}

interface IShortcut {
  name: string;
  keys: string[];
}

export interface IShortcutCategory {
  category: string;
  graderOnly: boolean;
  shortcuts: IShortcut[];
}

interface IKeyIconProps {
  keyString: string;
}

const KeyIcon = (props: IKeyIconProps) => {
  if (props.keyString === 'SLASH') {
    return <div className="keyboard-shortcuts__key--slash">/</div>;
  }

  let keyString = props.keyString;
  let tooltip = null;

  switch (keyString) {
    case 'COMMAND':
      keyString = osControlKey();
      tooltip = getOperatingSystem() === OS.WINDOWS ? 'Control' : 'Command';
      break;
    case 'SHIFT':
      keyString = '⇧';
      tooltip = 'Shift';
      break;
    case 'LEFT':
      keyString = '←';
      tooltip = 'Left';
      break;
    case 'RIGHT':
      keyString = '→';
      tooltip = 'Right';
      break;
    case 'DOWN':
      keyString = '↓';
      tooltip = 'Down';
      break;
    case 'UP':
      keyString = '↑';
      tooltip = 'Up';
      break;
    default:
      break;
  }

  return (
    <Tooltip title={tooltip}>
      <div className="keyboard-shortcuts__key">{keyString}</div>
    </Tooltip>
  );
};

const KeyboardShortcuts = (props: IKeyboardShortCutsProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const isLight = consoleTheme === consoleThemes.light;

  const filteredShortcuts = shortcuts.filter((category: IShortcutCategory) => {
    return props.isStudent ? !category.graderOnly : category;
  });

  const tabs = filteredShortcuts.map((category: IShortcutCategory) => {
    return (
      <TabPane tab={category.category} key={category.category}>
        <div style={{ width: '80%', margin: '0px auto', fontSize: '12px', color: isLight ? '#000' : '#fff' }}>
          <div className="keyboard-shortcuts__grid">
            {category.shortcuts.map((shortcut: IShortcut, idx: number) => {
              return (
                <div key={`${category.category}-${idx}`} className="keyboard-shortcuts__shortcut">
                  <div>{shortcut.name}</div>
                  <div className="keyboard-shortcuts__keys">
                    {shortcut.keys.map((keyString: string, keyIdx: number) => {
                      return <KeyIcon key={`${keyString}-${keyIdx}`} keyString={keyString} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TabPane>
    );
  });

  const crawlerBg = isLight ? '#fff' : '#1f1f1f';
  const crawlerTextColor = isLight ? 'rgba(0, 0, 0, 0.85)' : '#fff';

  return (
    <ConfigProvider
      theme={{
        algorithm: isLight ? theme.defaultAlgorithm : theme.darkAlgorithm,
      }}
    >
      <Drawer
        {...props}
        placement="bottom"
        closable={true}
        mask={false}
        open={props.visible}
        onClose={props.onClose}
        style={{ color: crawlerTextColor }}
        styles={{
          header: { backgroundColor: crawlerBg, color: crawlerTextColor },
          body: { padding: '0px 24px', backgroundColor: crawlerBg, color: crawlerTextColor },
          wrapper: { backgroundColor: crawlerBg, color: crawlerTextColor },
        }}
      >
        <div style={{ textAlign: 'center' }} className="keyboard-shortcuts">
          <Tabs type="card">{tabs}</Tabs>
        </div>
      </Drawer>
    </ConfigProvider>
  );
};

// General
//// Dark mode
//// View as Student
//// Download

// View
//// Zoom
//// Resize

// Manage
//// Finalize
//// Assign
//// Edit rubric
//// Claim Another

// Navigate
//// Change File
//// Search rubric

//// Command click highlight
//// Click line number number
//// Command to start on comments

//// Escape (clear currsor)

// Annotate
////

// Edit (Active Comment)

export default KeyboardShortcuts;

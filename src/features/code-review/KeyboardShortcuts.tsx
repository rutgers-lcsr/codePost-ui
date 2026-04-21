// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { OS, getOperatingSystem, osControlKey } from '../../components/core/operatingSystem';
import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';
import shortcuts from './keyboard_shortcuts.tsx';
import { usePermissionsStore, selectCaps } from '../../stores/usePermissionsStore';

import { Drawer, Tabs, Tooltip, ConfigProvider, theme } from 'antd';

interface IKeyboardShortCutsProps {
  open: boolean;
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
    case 'ALT':
      keyString = getOperatingSystem() === OS.WINDOWS ? 'Alt' : '⌥';
      tooltip = 'Alt';
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

  // Overlay isStudent with capability from store
  const capGradeSubmission = usePermissionsStore((s) => {
    const subKey = Object.keys(s.cache).find((k) => k.startsWith('submission:'));
    if (!subKey) return undefined;
    return selectCaps(s, subKey).grade_submission;
  });
  const isStudent = capGradeSubmission !== undefined ? !capGradeSubmission : props.isStudent;

  const filteredShortcuts = shortcuts.filter((category: IShortcutCategory) => {
    return isStudent ? !category.graderOnly : category;
  });

  const tabItems = filteredShortcuts.map((category: IShortcutCategory) => ({
    key: category.category,
    label: category.category,
    children: (
      <div style={{ width: '80%', margin: '0px auto', fontSize: '12px', color: isLight ? '#000' : '#fff' }}>
        <div className="keyboard-shortcuts__grid">
          {category.shortcuts.map((shortcut: IShortcut, idx: number) => (
            <div key={`${category.category}-${idx}`} className="keyboard-shortcuts__shortcut">
              <div>{shortcut.name}</div>
              <div className="keyboard-shortcuts__keys">
                {shortcut.keys.map((keyString: string, keyIdx: number) => (
                  <KeyIcon key={`${keyString}-${keyIdx}`} keyString={keyString} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  }));

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
        open={props.open}
        onClose={props.onClose}
        style={{ color: crawlerTextColor }}
        styles={{
          header: { backgroundColor: crawlerBg, color: crawlerTextColor },
          body: { padding: '0px 24px', backgroundColor: crawlerBg, color: crawlerTextColor },
          wrapper: { backgroundColor: crawlerBg, color: crawlerTextColor },
        }}
      >
        <div style={{ textAlign: 'center' }} className="keyboard-shortcuts">
          <Tabs type="card" items={tabItems} />
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

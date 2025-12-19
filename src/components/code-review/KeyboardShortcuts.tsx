import { OS, getOperatingSystem, osControlKey } from '../core/operatingSystem';
import shortcuts from './keyboard_shortcuts.tsx';

import { Drawer, Tabs, Tooltip } from 'antd';
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
  const filteredShortcuts = shortcuts.filter((category: IShortcutCategory) => {
    return props.isStudent ? !category.graderOnly : category;
  });

  const tabs = filteredShortcuts.map((category: IShortcutCategory) => {
    return (
      <TabPane tab={category.category} key={category.category}>
        <div style={{ width: '80%', margin: '0px auto', fontSize: '12px' }}>
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

  return (
    <Drawer
      title={null}
      className="keyboard-shortcuts-drawer"
      placement="bottom"
      closable={true}
      onClose={props.onClose}
      open={props.visible}
      mask={false}
      style={{ color: 'rgba(255, 255, 255, 0.65)' }}
      styles={{
        header: { backgroundColor: 'rgb(33, 35, 37)', color: 'rgba(255, 255, 255, 0.65)' },
        body: { padding: '0px 24px', backgroundColor: 'rgb(33, 35, 37)', color: 'rgba(255, 255, 255, 0.65)' },
        wrapper: { backgroundColor: 'rgb(33, 35, 37)', color: 'rgba(255, 255, 255, 0.65)' },
      }}
    >
      <div style={{ textAlign: 'center' }} className="keyboard-shortcuts">
        <Tabs type="card">{tabs}</Tabs>
      </div>
    </Drawer>
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

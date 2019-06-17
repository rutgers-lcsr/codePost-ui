import * as React from 'react';

import CPDropdown from './CPDropdown';

import { Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import { IOption } from '../../types/common';

type ThemeType = 'light' | 'dark';

interface IProps {
  title?: string;
  // callback when a selector item is selected
  onSelectorClick: (e: ClickParam) => void;
  // active selector item - controlled
  activeSelector?: IOption;
  // selector items
  selectorItems: IOption[];
  // call back when a menu panel is selected
  onMenuClick: (e: ClickParam) => void;
  // active menu item - controlled
  activeMenuItem?: number;
  // menu items
  menuItems: IOption[];
  theme?: ThemeType;
}

const SelectorSider = (props: IProps) => {
  const theme = props.theme ? props.theme : 'light';

  const selectorOverlay = (
    <Menu onClick={props.onSelectorClick}>
      {props.selectorItems.map((item: IOption, index: number) => {
        return <Menu.Item key={item.value}>{item.label}</Menu.Item>;
      })}
    </Menu>
  );

  let title;
  if (props.title) {
    title = <div className="cp-label cp-label--medium cp-label--bold">{props.title}</div>;
  }

  return (
    <div>
      <div style={{ padding: '18px 20px 22px 16px' }}>
        {title}
        <CPDropdown
          key="selector"
          value={props.activeSelector ? props.activeSelector.label : 'Select...'}
          overlay={selectorOverlay}
          overlayStyle={{ maxHeight: '300px', overflowY: 'scroll' }}
          theme="dark"
        />
      </div>
      <Menu
        key="menu"
        className={`sider-menu sider-menu-${theme}`}
        onClick={props.onMenuClick}
        selectedKeys={props.activeMenuItem ? [props.activeMenuItem.toString()] : []}
        mode="inline"
        theme="dark"
      >
        {props.menuItems.map((item: IOption) => {
          return <Menu.Item key={item.value}>{item.label}</Menu.Item>;
        })}
      </Menu>
    </div>
  );
};

export default SelectorSider;

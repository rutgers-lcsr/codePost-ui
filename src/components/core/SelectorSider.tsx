/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Divider, Icon, Menu, Spin, Tooltip } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost imports */
import CPDropdown from './CPDropdown';

import { AssignmentType } from '../../infrastructure/assignment';

import { IOption } from '../../types/common';

/**********************************************************************************************************************/

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
  assignments: AssignmentType[];
  theme?: ThemeType;
  isLoadingMenu?: boolean;
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
    <div style={{ padding: '18px 20px 0 16px' }}>
      <CPDropdown
        key="selector"
        value={props.activeSelector ? props.activeSelector.label : 'Select...'}
        overlay={selectorOverlay}
        overlayStyle={{ maxHeight: '300px', overflowY: 'scroll' }}
        theme={theme}
      />
      <Divider style={{ margin: '20 0 20 0' }} />
      {title}
      {props.isLoadingMenu ? (
        <Spin />
      ) : (
        <Menu
          key="menu"
          className={`sider-menu sider-menu-${theme}`}
          onClick={props.onMenuClick}
          selectedKeys={props.activeMenuItem ? [props.activeMenuItem.toString()] : []}
          mode="inline"
          theme={theme}
          inlineIndent={12}
          overflowedIndicator
        >
          {props.assignments.map((assignment) => {
            if (assignment.isReleased) {
              return (
                <Menu.Item key={assignment.id}>
                  <Icon type="right" /> {assignment.name}
                </Menu.Item>
              );
            } else {
              return (
                <Menu.Item key={assignment.id} disabled>
                  <Tooltip title="Not published yet" placement="right">
                    <Icon type="right" /> {assignment.name}
                  </Tooltip>
                </Menu.Item>
              );
            }
          })}
        </Menu>
      )}
    </div>
  );
};

export default SelectorSider;

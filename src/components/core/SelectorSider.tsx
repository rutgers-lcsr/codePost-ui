// This component is a generic controlled sider component with a selector and a menu
import * as React from 'react';

import { Layout, Menu, Select } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import { IOption } from '../../types/common';

import { OptionProps, SelectedValue } from 'antd/lib/select';
const { Option } = Select;
const { Header, Content } = Layout;

type themeType = 'light' | 'dark';

interface IProps {
  // callback when a selector item is selected
  onSelect: (val: SelectedValue, option: React.ReactElement<OptionProps>) => void;
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
  // theme: light or dark
  theme: themeType;
}

class SelectorSider extends React.Component<IProps, {}> {
  public render() {
    const { activeMenuItem, theme } = this.props;

    const background = theme === 'light' ? '#fff' : '#1b1b1b';
    const color = theme === 'light' ? '#000' : '#fff';

    return (
      <Layout style={{ minHeight: '100%', background: `${background}` }}>
        <Header style={{ background: `${background}`, color: `${color}`, paddingLeft: 10 }}>
          <Select
            placeholder="Select a course"
            value={this.props.activeSelector ? this.props.activeSelector.label : undefined}
            onSelect={this.props.onSelect}
            style={{ width: 180 }}
          >
            {this.props.selectorItems.map((item: IOption) => {
              return <Option key={item.value}>{item.label}</Option>;
            })}
          </Select>
        </Header>
        <Content>
          <Menu
            onClick={this.props.onMenuClick}
            theme={theme}
            selectedKeys={activeMenuItem ? [activeMenuItem.toString()] : []}
            mode="inline"
          >
            {this.props.menuItems.map((item: IOption) => {
              return <Menu.Item key={item.value}>{item.label}</Menu.Item>;
            })}
          </Menu>
        </Content>
      </Layout>
    );
  }
}

export default SelectorSider;

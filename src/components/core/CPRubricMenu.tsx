import * as React from 'react';

import { Input, Menu } from 'antd';

const SubMenu = Menu.SubMenu;

const Search = Input.Search;

class CPRubricMenu extends React.Component<any, {}> {
  public render() {
    return (
      <div>
        <div style={{ padding: '18px 20px 20px 16px' }}>
          <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
            Rubric
          </div>
          <Search placeholder="Search..." onSearch={(value) => console.log(value)} />
        </div>
        <Menu defaultOpenKeys={['category-1']} mode="inline" className="cp-rubric-menu">
          <SubMenu key="category-1" title={<span>Style</span>}>
            <Menu.Item key="1">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
            <Menu.Item key="2">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
            <Menu.Item key="3">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
            <Menu.Item key="4">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
          </SubMenu>
          <SubMenu key="category-2" title={<span>Algorithms</span>}>
            <Menu.Item key="5">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
            <Menu.Item key="6">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
          </SubMenu>
          <SubMenu key="category-3" title={<span>Data Structures</span>}>
            <Menu.Item key="9">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
            <Menu.Item key="10">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
            <Menu.Item key="11">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
            <Menu.Item key="12">
              <span>Option 1</span>
              <span style={{ position: 'absolute', right: '20px' }}>-2</span>
            </Menu.Item>
          </SubMenu>
        </Menu>
      </div>
    );
  }
}

export default CPRubricMenu;

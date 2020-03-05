import * as React from 'react';

import SplitPane from 'react-split-pane';

import { Icon, Menu } from 'antd';

const PseudoIDE = (props: any) => {
  return (
    <div style={{ border: '2px solid blue', height: '400px' }} className="pseudo-ide">
      <SplitPane split="vertical" defaultSize="20%">
        <div>
          <div style={{ backgroundColor: '#fafafa', padding: '8px 16px', fontSize: '20px', fontWeight: 500 }}>
            Files
          </div>
          <Menu defaultSelectedKeys={['2']} defaultOpenKeys={['1']} mode="inline" style={{ height: '100%' }}>
            <Menu.SubMenu
              key={'1'}
              title={
                <span>
                  <Icon type="folder" />
                  folder1{' '}
                </span>
              }
            >
              <Menu.Item key={'2'}>hello.java &nbsp;</Menu.Item>
              <Menu.Item key={'3'}>loops.java &nbsp;</Menu.Item>
              <Menu.Item key={'4'}>recursion.java &nbsp;</Menu.Item>
            </Menu.SubMenu>
          </Menu>
        </div>
        <SplitPane split="vertical" defaultSize="50%">
          <div>pane 2 size: 50% (of remaining space)</div>
          <div>pane 3</div>
        </SplitPane>
      </SplitPane>
    </div>
  );
};

export default PseudoIDE;

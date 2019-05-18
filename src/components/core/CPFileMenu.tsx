import * as React from 'react';

import { Badge, Menu, Typography } from 'antd';

const { Title } = Typography;

class CPFileMenu extends React.Component<any, {}> {
  public render() {
    return (
      <div>
        <div style={{ padding: '13px 20px 0px 16px' }}>
          <Title level={4} style={{ fontWeight: 500 }}>
            Files
          </Title>
        </div>
        <Menu defaultSelectedKeys={['1']} mode="inline" className="cp-file-menu">
          <Menu.Item key="1">
            <span>hello.java</span>
            <span style={{ position: 'absolute', right: '60px' }}>
              <Badge count={1} style={{ minWidth: '33px', backgroundColor: 'rgba(0,0,0,0.5)' }} />
            </span>
            <span style={{ position: 'absolute', right: '20px' }}>
              <Badge count={-3} style={{ minWidth: '33px', backgroundColor: '#f64852' }} />
            </span>
          </Menu.Item>
          <Menu.Item key="2">hello.java</Menu.Item>
          <Menu.Item key="3">hello.java</Menu.Item>
          <Menu.Item key="4">hello.java</Menu.Item>
          <Menu.Item key="5">hello.java</Menu.Item>
          <Menu.Item key="6">hello.java</Menu.Item>
          <Menu.Item key="7">hello.java</Menu.Item>
        </Menu>
      </div>
    );
  }
}

export default CPFileMenu;

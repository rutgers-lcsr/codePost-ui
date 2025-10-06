import * as React from 'react';

import { DashboardOutlined, LineChartOutlined } from '@ant-design/icons';

import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';

import { Link } from 'react-router-dom';

import CPLogo from '../core/CPLogo';
import useFixedWindow from '../core/useFixedWindow';

import Dashboard from './Dashboard';

const { Content, Sider } = Layout;

const DashboardLayout: React.FC = () => {
  useFixedWindow();

  const [siderKey, setSiderKey] = React.useState('1');

  const onClick: MenuProps['onClick'] = (info) => {
    setSiderKey(info.key);
  };

  let content: React.ReactNode = null;

  if (siderKey === '1') {
    content = <Dashboard />;
  }

  if (siderKey === '2') {
    content = (
      <a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener noreferrer">
        analytics.google.com
      </a>
    );
  }

  return (
    <Layout>
      <Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
        }}
      >
        <div style={{ padding: '10px 0px' }}>
          <Link to="/">
            <CPLogo cpType="main" />
          </Link>
          <div
            style={{
              textAlign: 'center',
              color: '#24be85',
              lineHeight: 1,
              paddingTop: 10,
            }}
          >
            SuperAdmin Console
          </div>
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={[siderKey]} onClick={onClick}>
          <Menu.Item key="1">
            <DashboardOutlined />
            <span className="nav-text">dashboard</span>
          </Menu.Item>
          <Menu.Item key="2">
            <LineChartOutlined />
            <span className="nav-text">google analytics</span>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ marginLeft: 200, height: '100vh' }}>
        <Content style={{ padding: '24px 16px 30px' }}>{content}</Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;

import * as React from 'react';

import { Button, Divider, Dropdown, Icon, Layout, Menu, Tag, Typography } from 'antd';
const { Text } = Typography;

const { Content, Header, Sider } = Layout;

import CPLogo from './CPLogo';

import CPFileMenu from './CPFileMenu';
import CPRubricMenu from './CPRubricMenu';

class CPLayoutGrade extends React.Component<any, {}> {
  public render() {
    const menu = (
      <Menu>
        <Menu.Item key="1">1st menu item</Menu.Item>
        <Menu.Item key="2">2nd menu item</Menu.Item>
        <Menu.Item key="3">3rd item</Menu.Item>
      </Menu>
    );

    const dropdown = (
      <Dropdown overlay={menu}>
        <Button>
          grader: vinay@princeton.edu <Icon type="down" />
        </Button>
      </Dropdown>
    );

    return (
      <Layout className="layout--grade">
        <Header className="layout--grade__header">
          <div
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              justifyContent: 'flex-start',
              overflowX: 'scroll',
            }}
          >
            <div style={{ flex: '0 0 content', margin: '0 20px 0 0' }}>
              <CPLogo />
            </div>
            <div style={{ flex: '1 1 auto', margin: '0 -20px 0 0' }} />
            <div style={{ flex: '0 0 content', margin: '0 0 0 20px' }}>
              <Text style={{ whiteSpace: 'nowrap', color: '#fff', fontWeight: 500 }}>hello@andreacg.com!</Text>
            </div>
            <div style={{ flex: '0 0 content', margin: '0 0 0 20px' }}>
              <Button
                style={{
                  minWidth: '127px',
                  borderRadius: '3px',
                  border: 'solid 1px #5e5e5e',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255,255,255,0.5',
                }}
              >
                Log Out
              </Button>
            </div>
          </div>
        </Header>
        <Layout>
          <Sider width={300} className="layout--grade__sider">
            <CPFileMenu />
            <CPRubricMenu />
          </Sider>
          <Layout>
            <Header className="layout--grade__subheader">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflowX: 'scroll',
                }}
              >
                <div style={{ flex: '0 0 content', margin: '0 6px 0 0' }}>
                  <span style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(0,0,0,0.85)', lineHeight: 1.17 }}>
                    Loops
                  </span>
                </div>
                <div style={{ flex: '0 0 content', margin: '0 6px 0 0' }}>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(0,0,0,0.3)', lineHeight: 1.56 }}>
                    17/20
                  </span>
                </div>
                <div style={{ flex: '0 0 content', margin: '0 6px 0 0' }}>
                  <Icon type="question-circle" style={{ fontSize: '20px', color: '#1890ff' }} />
                </div>
                <div style={{ flex: '1 1 auto', margin: '0 -6px 0 0' }} />
                <div style={{ flex: '0 0 content', margin: '0 0 0 10px' }}>{dropdown}</div>
                <div style={{ flex: '0 0 content', margin: '0 0 0 10px' }}>
                  <Button style={{ minWidth: '127px' }}>Unfinalize</Button>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflowX: 'scroll',
                }}
              >
                <div style={{ flex: '0 0 content', margin: '0 6px 0 0' }}>
                  <Tag color="red" style={{ marginRight: '0px' }}>
                    not finalized
                  </Tag>
                </div>
                <div style={{ flex: '0 0 content', margin: '0 6px 0 0' }}>
                  <Divider type="vertical" />
                </div>
                <div style={{ flex: '0 0 content', margin: '0 6px 0 0' }}>
                  <span>hello@andreacg.com</span>
                </div>
                <div style={{ flex: '1 1 auto', margin: '0 -6px 0 0' }} />
                <div style={{ flex: '0 0 content', margin: '0 0 0 6px' }}>
                  <span style={{ fontWeight: 500 }}>Last Edited: May 01, 2019 6:09 PM</span>
                </div>
              </div>
            </Header>
            <Content className="layout--grade__content">
              <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>.</div>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default CPLayoutGrade;

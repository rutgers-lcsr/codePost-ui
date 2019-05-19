import * as React from 'react';

import { Button, Dropdown, Icon, Layout, Menu, Switch, Table } from 'antd';

import CPLogo from './CPLogo';

const { Header, Content, Sider } = Layout;

import withWindowWatcher from './withWindowWatcher';

import CPButton from './CPButton';
import CPMainNav from './CPMainNav';

// const SubMenu = Menu.SubMenu;

// interface ICPLayoutAdminProps {

// }

interface ICPLayoutAdminState {
  collapsed: boolean;
}

class CPLayoutAdmin extends React.Component<any, {}> {
  public state: Readonly<ICPLayoutAdminState> = {
    collapsed: false,
  };

  public onCollapse = (collapsed: boolean) => {
    console.log(collapsed);
    this.setState({ collapsed });
  };

  public render() {
    const menu = (
      <Menu>
        <Menu.Item key="1">1st menu item</Menu.Item>
        <Menu.Item key="2">2nd menu item</Menu.Item>
        <Menu.Item key="3">3rd item</Menu.Item>
      </Menu>
    );

    const dropdown = (
      <Dropdown className="cp-dropdown" overlay={menu}>
        <Button style={{ color: 'rgba(0, 0, 0, 0.25)' }}>
          COS126 | Spring 2019 <Icon type="down" />
        </Button>
      </Dropdown>
    );

    const createButton = <CPButton cpType="secondary">Create Course</CPButton>;
    console.log('width', this.props.windowWidth);

    const columns = [
      {
        title: 'Assignment',
        dataIndex: 'assignment',
        key: 'assignment',
        render: (text: string) => <a href="javascript:;">{text}</a>,
      },
      {
        title: 'Published',
        dataIndex: 'published',
        key: 'published',
        render: (published: boolean) => <Switch defaultChecked={published} />,
      },
      {
        title: 'Submissions',
        dataIndex: 'submissions',
        key: 'submissions',
      },
      {
        title: 'Finalized',
        dataIndex: 'finalized',
        key: 'finalized',
      },
      {
        title: 'In progress',
        dataIndex: 'inProgress',
        key: 'inProgress',
      },
      {
        title: 'Unclaimed',
        dataIndex: 'unclaimed',
        key: 'submissiunclaimedons',
      },
      {
        title: 'Missing',
        dataIndex: 'missing',
        key: 'missing',
      },
      {
        title: 'Mean Grade',
        dataIndex: 'mean',
        key: 'mean',
      },
      {
        title: 'Median Grade',
        dataIndex: 'median',
        key: 'median',
      },
      {
        title: '',
        key: 'action',
        render: (text: string, record: any) => <Icon type="more" />,
      },
    ];

    const data = [
      {
        key: '1',
        assignment: 'Hello World',
        published: true,
        submissions: 20,
        finalized: 15,
        inProgress: 2,
        unclaimed: 2,
        missing: 1,
        mean: 19.1,
        median: 19,
      },
      {
        key: '2',
        assignment: 'Loops',
        published: true,
        submissions: 20,
        finalized: 15,
        inProgress: 2,
        unclaimed: 2,
        missing: 1,
        mean: 19.1,
        median: 19,
      },
      {
        key: '3',
        assignment: 'Nbody',
        published: false,
        submissions: 20,
        finalized: 15,
        inProgress: 2,
        unclaimed: 2,
        missing: 1,
        mean: 19.1,
        median: 19,
      },
      {
        key: '4',
        assignment: 'Sierpinsky',
        published: false,
        submissions: 20,
        finalized: 15,
        inProgress: 2,
        unclaimed: 2,
        missing: 1,
        mean: 19.1,
        median: 19,
      },
      {
        key: '5',
        assignment: 'Guitar Hero',
        published: false,
        submissions: 20,
        finalized: 15,
        inProgress: 2,
        unclaimed: 2,
        missing: 1,
        mean: 19.1,
        median: 19,
      },
      {
        key: '6',
        assignment: 'Atomic',
        published: false,
        submissions: 20,
        finalized: 15,
        inProgress: 2,
        unclaimed: 2,
        missing: 1,
        mean: 19.1,
        median: 19,
      },
    ];
    return (
      <Layout className="layout--admin">
        <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
          <Header className="layout--admin__sider__header">
            {this.state.collapsed ? (
              <Icon type="fire" theme="twoTone" twoToneColor="#52c41a" style={{ fontSize: '30px' }} />
            ) : (
              <CPLogo />
            )}
          </Header>
          <CPMainNav isCollapsed={this.state.collapsed} />
        </Sider>
        <Layout>
          <Header className="layout--admin__header">
            <div className="cp-flex--normal">
              <div className="left">{dropdown}</div>
              <div className="left">{createButton}</div>
              <div className="gap" />
              <div className="right">
                <span className="cp-label cp-label--bold">Hello, hello@andreacg.com!</span>
              </div>
              <div className="right">
                <CPButton cpType="secondary" icon="setting" size="small" />
              </div>
              <div className="right">
                <CPButton cpType="secondary" icon="logout" size="small" />
              </div>
            </div>
          </Header>
          <Content className="layout--admin__content">
            <Layout>
              <Header className="layout--admin__subheader">
                <div className="cp-flex--normal">
                  <div className="left">
                    <span className="cp-label cp-label--large cp-label--bold">Assignments</span>
                  </div>
                  <div className="gap" />
                  <div className="right">
                    <CPButton cpType="primary">Create Assignment</CPButton>
                  </div>
                  <div className="right">
                    <CPButton cpType="secondary">Download All Grades</CPButton>
                  </div>
                </div>
              </Header>
              <div style={{ overflowX: 'scroll' }}>
                <Table
                  columns={columns}
                  dataSource={data}
                  pagination={false}
                  onRow={(record, rowIndex) => {
                    return {
                      style: { backgroundColor: '#fff' },
                    };
                  }}
                />
              </div>
            </Layout>
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default withWindowWatcher(CPLayoutAdmin);

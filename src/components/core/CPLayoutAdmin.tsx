import * as React from 'react';

import { Button, Dropdown, Icon, Layout, Menu, Switch, Table, Typography } from 'antd';

import CPLogo from './CPLogo';

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

import withWindowWatcher from './withWindowWatcher';

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
      <Dropdown overlay={menu}>
        <Button>
          COS126 | Spring 2019 <Icon type="down" />
        </Button>
      </Dropdown>
    );

    const createButton = <Button>Create Course</Button>;
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
    // <div style={{ display: 'flex' }}>
    //           <div style={{ display: 'flex', flex: 1 }}>
    //             <div style={{ display: 'inline-block', marginRight: '10px' }}>{dropdown}</div>
    //             <div style={{ display: 'inline-block', marginRight: '10px' }}>{createButton}</div>
    //           </div>
    //           <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
    //             <div style={{ display: 'inline-block', marginLeft: '10px' }}>
    //               <Text strong style={{ whiteSpace: 'nowrap' }}>
    //                 Hello, hello@andreacg.com!
    //               </Text>
    //             </div>
    //             <div style={{ display: 'inline-block', marginLeft: '26px' }}>
    //               <Button shape="circle" icon="setting" />
    //             </div>
    //             <div style={{ display: 'inline-block', marginLeft: '26px' }}>
    //               <Button shape="circle" icon="logout" />
    //             </div>
    //           </div>
    //         </div>

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
            <div
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                justifyContent: 'flex-start',
                overflowX: 'scroll',
              }}
            >
              <div style={{ flex: '0 0 content', margin: '0 10px 0 0' }}>{dropdown}</div>
              <div style={{ flex: '0 0 content', margin: '0 10px 0 0' }}>{createButton}</div>
              <div style={{ flex: '1 1 auto', margin: '0 -10px 0 0' }} />
              <div style={{ flex: '0 0 content', margin: '0 0 0 10px' }}>
                <Text strong style={{ whiteSpace: 'nowrap' }}>
                  Hello, hello@andreacg.com!
                </Text>
              </div>
              <div style={{ flex: '0 0 content', margin: '0 0 0 10px' }}>
                <Button shape="circle" icon="setting" />
              </div>
              <div style={{ flex: '0 0 content', margin: '0 0 0 10px' }}>
                <Button shape="circle" icon="logout" />
              </div>
            </div>
          </Header>
          <Content className="layout--admin__content">
            <div style={{ backgroundColor: '#f2f2f2', padding: '0px', marginBottom: '36px' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflowX: 'scroll',
                }}
              >
                <div style={{ flex: '0 0 content', margin: '0 10px 0 0' }}>
                  <Title level={1} style={{ fontWeight: 500, margin: 'auto 0' }}>
                    Assignments
                  </Title>
                </div>
                <div style={{ flex: '1 1 auto', margin: '0 -10px 0 0' }} />
                <div style={{ flex: '0 0 content', margin: '0 0 0 10px' }}>
                  <Button type="primary">Create Assignment</Button>
                </div>
                <div style={{ flex: '0 0 content', margin: '0 0 0 10px' }}>
                  <Button>Download All Grades</Button>
                </div>
              </div>
            </div>
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
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default withWindowWatcher(CPLayoutAdmin);

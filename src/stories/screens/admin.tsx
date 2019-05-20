import React from 'react';

import { Icon, Layout, Menu, Switch, Table } from 'antd';

const { Header, Content } = Layout;

import CPLayoutAdmin from '../../components/core/CPLayoutAdmin';

import CPButton from '../../components/core/CPButton';
import CPDropdown from '../../components/core/CPDropdown';

const menu = (
  <Menu>
    <Menu.Item key="1">1st menu item</Menu.Item>
    <Menu.Item key="2">2nd menu item</Menu.Item>
    <Menu.Item key="3">3rd item</Menu.Item>
  </Menu>
);

const dropdown = <CPDropdown value="COS126 | Spring 2019" overlay={menu} />;

const createButton = <CPButton cpType="secondary">Create Course</CPButton>;

const header = (
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
);

const subheader = (
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
);

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

const onRow = (record: any, rowIndex: number) => {
  return {
    style: { backgroundColor: '#fff' },
  };
};

const content = <Table columns={columns} dataSource={data} pagination={false} onRow={onRow} />;

const detail = (
  <Layout>
    <Header className="layout--admin__subheader">{subheader}</Header>
    <Content className="layout--admin__content">{content}</Content>
  </Layout>
);

export const AdminAssignments = () => {
  return <CPLayoutAdmin header={header} detail={detail} />;
};

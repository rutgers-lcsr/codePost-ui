import React from 'react';

import { Icon, Input, Menu, Switch, Table } from 'antd';

import CPLayoutAdmin from '../../components/core/CPLayoutAdmin';

import CPAdminDetail from '../../components/core/CPAdminDetail';

import CPButton from '../../components/core/CPButton';
import CPDropdown from '../../components/core/CPDropdown';

const Search = Input.Search;

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
    render: (text: string, record: any) => <Icon type="ellipsis" className="cp-label--highlight" />,
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

export const Admin = (goback: any, title: string, actionsGroup: string) => {
  let actions: React.ReactNode[] = [];
  if (actionsGroup === 'assignments') {
    actions = [
      <CPButton key="action-1" cpType="primary">
        Create Assignment
      </CPButton>,
      <CPButton key="action-2" cpType="secondary">
        Download All Grades
      </CPButton>,
    ];
  } else if (actionsGroup === 'graders' || actionsGroup === 'students') {
    actions = [<Search key="action-1" placeholder="Search..." />];
  } else if (actionsGroup === 'detail') {
    actions = [
      <CPButton key="action-1" cpType="primary">
        Upload Submission
      </CPButton>,
    ];
  } else {
    actions = [];
  }

  const adminDetail = <CPAdminDetail goBack={goback} title={title} actions={actions} content={content} />;
  return <CPLayoutAdmin header={header} detail={adminDetail} isRubric={false} />;
};

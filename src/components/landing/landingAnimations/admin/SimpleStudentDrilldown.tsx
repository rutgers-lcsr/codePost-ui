import { Badge, Icon, Input, Table } from 'antd';

import React from 'react';
import { animated, useSpring } from 'react-spring';

const Search = Input.Search;

type alignType = 'left' | 'right' | 'center';

const SimpleStudentDrilldown = (props: { student: string }) => {
  const props1 = useSpring({
    height: 500,
    width: 640,
    top: 0,
    left: 0,
    opacity: 1,
    from: { width: 1, height: 1, top: 250, left: 250, opacity: 0 },
    delay: 100,
    config: { duration: 100 },
  });
  const centerAlign: alignType = 'center';
  const columns = [
    {
      title: 'Name',
      dataIndex: 'assignment',
      key: 'assignment',
      width: 60,
    },
    {
      title: 'Partner',
      dataIndex: 'partners',
      key: 'partners',
      width: 50,
      align: centerAlign,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: centerAlign,
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      align: centerAlign,
    },
    {
      title: 'Grader',
      dataIndex: 'grader',
      key: 'grader',
      align: centerAlign,
    },
    {
      title: 'Viewed',
      dataIndex: 'viewed',
      key: 'viewed',
      width: 70,
      align: centerAlign,
    },
    {
      title: '',
      dataIndex: 'actions',
      key: 'actions',
      width: 40,
      align: centerAlign,
    },
  ];

  const data = [
    {
      key: '1',
      open: <Icon type="code" />,
      assignment: 'Hello World',
      status: (
        <div>
          <Badge status="success" />
          Graded
        </div>
      ),
      partners: '--',
      grade: '50/50',
      grader: 'Jack',
      viewed: <Icon type="eye" theme="filled" />,
      actions: <Icon type="menu" />,
    },
    {
      key: '2',
      open: <Icon type="code" />,
      assignment: 'Loops',
      status: (
        <div>
          <Badge status="success" />
          Graded
        </div>
      ),
      partners: 'student3',
      grade: '50/50',
      grader: 'Jill',
      viewed: <Icon type="eye-invisible" />,
      actions: <Icon type="menu" />,
    },
    {
      key: '3',
      open: <Icon type="code" />,
      assignment: 'TCP/IP',
      status: (
        <div>
          <Badge status="default" />
          Missing
        </div>
      ),
      partners: '--',
      grade: '--',
      grader: '--',
      viewed: '--',
      actions: <Icon type="menu" />,
    },
  ];

  const content = <Table columns={columns} dataSource={data} pagination={false} />;

  return (
    <animated.div
      style={{
        width: props1.width,
        height: props1.height,
        top: props1.top,
        left: props1.left,
        opacity: props1.opacity,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          marginLeft: 20,
          marginRight: 20,
          marginTop: 20,
          marginBottom: 20,
          backgroundColor: '#FFFFFF',
          padding: 20,
          maxHeight: 500,
          overflow: 'auto',
        }}
      >
        <div key="title" className="cp-label cp-label--large cp-label--bold" style={{ marginBottom: 20 }}>
          {`Submissions: ${props.student}`}
        </div>
        <Search placeholder="Search..." style={{ width: 200, marginBottom: 15 }} />
        <div style={{ fontSize: 12 }}>{content}</div>
      </div>
    </animated.div>
  );
};

export { SimpleStudentDrilldown };

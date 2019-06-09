import { Icon, Input, Table } from 'antd';

import React from 'react';
import { animated, useSpring } from 'react-spring';

const Search = Input.Search;

const SimpleStudentSubmissions = (props: { mouseOver: boolean }) => {
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
  const columns = [
    {
      title: 'Expand',
      dataIndex: 'expand',
      key: 'expand',
      render: (text: string) => <div>{text}</div>,
    },
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
    },
    {
      title: 'Hello World',
      dataIndex: 'helloWorld',
      key: 'helloWorld',
    },
    {
      title: 'Loops',
      dataIndex: 'loops',
      key: 'loops',
    },
    {
      title: 'TCP/IP',
      dataIndex: 'tcp',
      key: 'tcp',
    },
  ];

  const data = [
    {
      key: '1',
      expand: <Icon type="zoom-in" />,
      student: 'student0',
      helloWorld: 50,
      loops: 48,
      tcp: '--',
    },
    {
      key: '2',
      expand: <Icon type="zoom-in" />,
      student: 'student1',
      helloWorld: 46,
      loops: 48,
      tcp: 37,
    },
    {
      key: '3',
      expand: <Icon type="zoom-in" />,
      student: 'student2',
      helloWorld: 50,
      loops: 47,
      tcp: 49,
    },
    {
      key: '4',
      expand: <Icon type="zoom-in" />,
      student: 'student3',
      helloWorld: 48,
      loops: 48,
      tcp: 50,
    },
    {
      key: '5',
      expand: <Icon type="zoom-in" />,
      student: 'student4',
      helloWorld: 50,
      loops: 50,
      tcp: 50,
    },
    {
      key: '6',
      expand: <Icon type="zoom-in" />,
      student: 'student5',
      helloWorld: 48,
      loops: 48,
      tcp: 47,
    },
    {
      key: '7',
      expand: <Icon type="zoom-in" />,
      student: 'student6',
      helloWorld: 38,
      loops: 40,
      tcp: 42,
    },
    {
      key: '8',
      expand: <Icon type="zoom-in" />,
      student: 'student7',
      helloWorld: 50,
      loops: 50,
      tcp: 49,
    },
    {
      key: '9',
      expand: <Icon type="zoom-in" />,
      student: 'student8',
      helloWorld: 48,
      loops: 47,
      tcp: 46,
    },
    {
      key: '10',
      expand: <Icon type="zoom-in" />,
      student: 'student9',
      helloWorld: 44,
      loops: 49,
      tcp: 48,
    },
  ];

  const rowClassName = (record: any, index: number) => {
    if (props.mouseOver && index === 0) {
      return 'animation-row-active';
    } else return 'animation-row';
  };

  const content = <Table columns={columns} dataSource={data} pagination={false} rowClassName={rowClassName} />;

  return (
    <animated.div
      style={{
        width: props1.width,
        height: props1.height,
        top: props1.top,
        left: props1.left,
        opacity: props1.opacity,
        overflow: 'scroll',
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
          overflow: 'scroll',
        }}
      >
        <div key="title" className="cp-label cp-label--large cp-label--bold" style={{ marginBottom: 20 }}>
          Student Submissions
        </div>
        <Search placeholder="Search..." style={{ width: 200, marginBottom: 15 }} />
        <div style={{ fontSize: 12 }}>{content}</div>
      </div>
    </animated.div>
  );
};

export { SimpleStudentSubmissions };

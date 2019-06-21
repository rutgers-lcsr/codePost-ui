import { Icon, Switch, Table } from 'antd';

import React from 'react';
import { animated, useSpring } from 'react-spring';

import CPButton from '../../../../components/core/CPButton';

type alignType = 'left' | 'right' | 'center';

const SimpleAssignments = (props: { mouseOver: boolean }) => {
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
      title: 'Assignment',
      dataIndex: 'assignment',
      key: 'assignment',
      render: (text: string) => <div>{text}</div>,
    },
    {
      title: 'Published',
      dataIndex: 'published',
      key: 'published',
      render: (published: boolean) => <Switch defaultChecked={published} />,
      align: centerAlign,
    },
    {
      title: 'Finalized',
      dataIndex: 'finalized',
      key: 'finalized',
      align: centerAlign,
    },
    {
      title: 'In progress',
      dataIndex: 'inProgress',
      key: 'inProgress',
      align: centerAlign,
    },
    {
      title: 'Missing',
      dataIndex: 'missing',
      key: 'missing',
      align: centerAlign,
    },
    {
      title: 'Actions',
      key: 'actions',
      dataIndex: 'actions',
      align: centerAlign,
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
      actions: <Icon type="menu" />,
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
      actions: <Icon type="menu" />,
    },
    {
      key: '3',
      assignment: 'Sierpinsky',
      published: false,
      submissions: 20,
      finalized: 15,
      inProgress: 2,
      unclaimed: 2,
      missing: 1,
      mean: 19.1,
      median: 19,
      actions: <Icon type="menu" />,
    },
  ];
  const rowClassName = (record: any, index: number) => {
    if (props.mouseOver && index === 0) {
      return 'animation-row-active';
    } else return 'animation-row';
  };

  const content = <Table columns={columns} rowClassName={rowClassName} dataSource={data} pagination={false} />;
  const actions = [
    <CPButton key="action-1" cpType="primary" style={{ marginRight: 15 }}>
      Create Assignment
    </CPButton>,
    <CPButton key="action-2" cpType="secondary">
      Download All Grades
    </CPButton>,
  ];

  return (
    <animated.div
      style={{
        width: props1.width,
        height: props1.height,
        top: props1.top,
        left: props1.left,
        opacity: props1.opacity,
        overflow: 'hidden',
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
        }}
      >
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>{actions}</div>
        <div style={{ fontSize: 12 }}>{content}</div>
      </div>
    </animated.div>
  );
};

export { SimpleAssignments };

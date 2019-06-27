import { Button, Icon, Input, Table } from 'antd';

import React from 'react';
import { animated, useSpring } from 'react-spring';

const Search = Input.Search;
type alignType = 'left' | 'right' | 'center';

const SimpleGraderRoster = () => {
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
      title: 'Grader',
      dataIndex: 'grader',
      key: 'grader',
    },
    {
      title: 'Action',
      dataIndex: 'actions',
      key: 'actions',
      align: centerAlign,
    },
  ];
  const data = [
    { grader: 'Jill', actions: <Icon type="menu" /> },
    { grader: 'Jack', actions: <Icon type="menu" /> },
    { grader: 'Martha', actions: <Icon type="menu" /> },
    { grader: 'Ravi', actions: <Icon type="menu" /> },
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
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
          <div key="title" className="cp-label cp-label--large cp-label--bold">
            Roster: Graders
          </div>
          <div>
            <Button key="action-1" type="ghost" icon="download" style={{ marginRight: 5 }}>
              Download
            </Button>
            <Button key="action-2" type="ghost" icon="upload" style={{ marginRight: 10 }}>
              Upload
            </Button>
            <Button key="action-3" type="primary" icon="plus-circle" style={{}}>
              Add
            </Button>
          </div>
        </div>
        <Search placeholder="Search..." style={{ width: 200, marginBottom: 15 }} />
        <div style={{ fontSize: 12 }}>{content}</div>
      </div>
    </animated.div>
  );
};

export { SimpleGraderRoster };

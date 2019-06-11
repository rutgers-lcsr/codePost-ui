import { Badge, Menu } from 'antd';
import React from 'react';
import { animated } from 'react-spring';

function getFileItem(name: string, points: number) {
  let pointsBadge;

  if (points < 0) {
    pointsBadge = <Badge count={points} className="cp-badge" style={{ backgroundColor: '#f64852' }} />;
  }
  if (points > 0) {
    pointsBadge = <Badge count={`+${points}`} className="cp-badge" style={{ backgroundColor: '#24be85' }} />;
  }

  return (
    <div>
      <span>{name}</span>
      <span style={{ position: 'absolute', right: '20px' }}>{pointsBadge}</span>
    </div>
  );
}

const SimpleGradeMenu = (props: { selectedKeys: string[] }) => {
  const AnimatedMenu = animated(Menu);
  return (
    <AnimatedMenu
      theme="light"
      style={{ width: 150, maxWidth: 150, minWidth: 150, height: 500, borderRadius: 5 }}
      selectedKeys={props.selectedKeys}
      mode="inline"
    >
      <Menu.Item key="1">{getFileItem('file1.java', -1)}</Menu.Item>
      <Menu.Item key="2">{getFileItem('file2.txt', 0)}</Menu.Item>
      <Menu.Item key="3">{getFileItem('file3.ipynb', 1)}</Menu.Item>
    </AnimatedMenu>
  );
};

export { SimpleGradeMenu };

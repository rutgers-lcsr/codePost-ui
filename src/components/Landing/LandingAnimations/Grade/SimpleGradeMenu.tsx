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

const SimpleGradeMenu = (props: { selectedKeys: string[]; secondFileDeduction: any }) => {
  const AnimatedMenu = animated(Menu);
  const AnimatedItem = animated(Menu.Item);
  return (
    <div className="SimpleGradeMenu">
      <div style={{ padding: '13px 20px 0px 16px' }}>
        <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
          Files
        </div>
      </div>
      <AnimatedMenu
        theme="light"
        style={{ width: 150, maxWidth: 150, minWidth: 150, height: 500, borderRadius: 5 }}
        selectedKeys={props.selectedKeys}
        mode="inline"
        className="sider-menu"
      >
        <Menu.Item key="1">{getFileItem('file1.java', -1)}</Menu.Item>
        <AnimatedItem key="2">
          {props.secondFileDeduction.interpolate((x: number) => {
            return getFileItem('file2.java', x);
          })}
        </AnimatedItem>
        <Menu.Item key="3">{getFileItem('file3.ipynb', 1)}</Menu.Item>
      </AnimatedMenu>
    </div>
  );
};

export { SimpleGradeMenu };

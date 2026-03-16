// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Badge, Menu } from 'antd';
import { animated } from 'react-spring';
import { colors } from '../../../../theme/colors';
const SubMenu = Menu.SubMenu;

function getFileItem(name: string, points: number) {
  let pointsBadge;

  if (points < 0) {
    pointsBadge = (
      <Badge count={points} className="badge badge--standard" style={{ backgroundColor: colors.actionRed }} />
    );
  }
  if (points > 0) {
    pointsBadge = (
      <Badge count={`+${points}`} className="badge badge--standard" style={{ backgroundColor: colors.green9 }} />
    );
  }

  return (
    <div>
      <span>{name}</span>
      <span style={{ position: 'absolute', right: '20px' }}>{pointsBadge}</span>
    </div>
  );
}

const AnimatedMenu = animated(Menu);
const AnimatedItem = animated(Menu.Item);

const SimpleGradeMenu = (props: { selectedKeys: string[]; secondFileDeduction: React.ReactNode }) => {
  return (
    <div className="SimpleGradeMenu" style={{ height: 530 }}>
      <div style={{ padding: '13px 20px 0px 16px' }}>
        <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
          Files
        </div>
      </div>

      <AnimatedMenu
        theme="light"
        style={{ width: 150, maxWidth: 150, minWidth: 150, borderRadius: 5 }}
        selectedKeys={props.selectedKeys}
        mode="inline"
        className="sider-menu"
      >
        <Menu.Item key="1">{getFileItem('file1.java', -1)}</Menu.Item>
        <AnimatedItem key="2">{props.secondFileDeduction}</AnimatedItem>
        <Menu.Item key="3">{getFileItem('file3.ipynb', 1)}</Menu.Item>
      </AnimatedMenu>
      <div style={{ padding: '40px 20px 0px 16px' }}>
        <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
          Rubric
        </div>
      </div>
      <Menu defaultOpenKeys={['1', '2']} selectedKeys={[]} mode="inline" className="rubric-menu" id="rubric-menu">
        <SubMenu key="1" title={<span>1. General</span>} style={{ paddingLeft: 10 }}>
          <Menu.Item key="A">
            <div style={{ alignItems: 'center', display: 'flex', left: 10 }}>
              <span style={{ fontSize: 12 }}>No Readme</span>
              <span style={{ position: 'absolute', right: '20px', fontSize: 12 }}>{-1}</span>
            </div>
          </Menu.Item>
          <Menu.Item key="B">
            <div style={{ alignItems: 'center', display: 'flex' }}>
              <span style={{ fontSize: 12 }}>Doesn't compile</span>
              <span style={{ position: 'absolute', right: '20px', fontSize: 12 }}>{-2}</span>
            </div>
          </Menu.Item>
        </SubMenu>
        <SubMenu key="2" title={<span>{'  '}2. Algorithms</span>} style={{ paddingLeft: 10 }}>
          <Menu.Item key="C">
            <div style={{ alignItems: 'center', display: 'flex' }}>
              <span style={{ fontSize: 12 }}>O(N^2) time </span>
              <span style={{ position: 'absolute', right: '20px', fontSize: 12 }}>{-1}</span>
            </div>
          </Menu.Item>
        </SubMenu>
      </Menu>
    </div>
  );
};

export { getFileItem, SimpleGradeMenu };

import * as React from 'react';

import { Icon, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

interface IProps {
  onClick: (e: ClickParam) => void;
  selectedPanel: number;
  collapsed: boolean;
  isSuperGrader: boolean;
  isSectionLeader: boolean;
}

class GraderNav extends React.Component<IProps, {}> {
  public render() {
    return (
      <div>
        <div>
          <Menu
            onClick={this.props.onClick}
            theme="dark"
            selectedKeys={[this.props.selectedPanel.toString()]}
            mode="inline"
          >
            <Menu.Item key="0">
              <Icon type="container" />
              <span>My submissions</span>
            </Menu.Item>
            {this.props.isSectionLeader ? (
              <Menu.Item key="1">
                <Icon type="cluster" />
                <span>My sections</span>
              </Menu.Item>
            ) : null}
            {this.props.isSuperGrader ? (
              <Menu.Item key="2">
                <Icon type="inbox" />
                <span>All submissions</span>
              </Menu.Item>
            ) : null}
          </Menu>
        </div>
        <div style={{ height: '100%' }}>
          <Menu theme="dark" mode="inline" style={{ position: 'absolute', bottom: 75 }} selectedKeys={[]}>
            <Menu.Item key="docs">
              <Icon type="pushpin" />
              <span>
                <a href="https://help.codepost.io" target="_blank" className="internal-link">
                  Docs
                </a>
              </span>
            </Menu.Item>
          </Menu>
        </div>
      </div>
    );
  }
}

export default GraderNav;

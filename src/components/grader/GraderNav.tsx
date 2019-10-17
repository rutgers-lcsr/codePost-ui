import * as React from 'react';

import { Icon, Menu } from 'antd';

import { generatePath, RouteComponentProps } from 'react-router';

import { Link } from 'react-router-dom';

interface IProps extends RouteComponentProps<{ panel: string }> {
  collapsed: boolean;
  isSuperGrader: boolean;
  isSectionLeader: boolean;
  regradesAllowed: boolean;
}

class GraderNav extends React.Component<IProps, {}> {
  public openLink = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) {
      w.focus();
    }
  };

  public getDefaultOpenKey = () => {
    const routes = ['my_submissions', 'my_sections', 'all_submissions', 'regrades'];

    const match = routes.indexOf(this.props.match.params.panel).toString();

    // default to /assignments
    if (match === '-1') {
      return '0';
    } else {
      return match;
    }
  };

  public render() {
    return (
      <div>
        <div>
          <Menu theme="dark" mode="inline" defaultSelectedKeys={[this.getDefaultOpenKey()]}>
            <Menu.Item key="0">
              <Link to={generatePath(this.props.match.path, { panel: 'my_submissions' })}>
                <Icon type="container" />
                <span>Claimed by Me</span>
              </Link>
            </Menu.Item>
            {this.props.isSectionLeader ? (
              <Menu.Item key="1">
                <Link to={generatePath(this.props.match.path, { panel: 'my_sections' })}>
                  <Icon type="cluster" />
                  <span>My Sections</span>
                </Link>
              </Menu.Item>
            ) : null}
            {this.props.isSuperGrader ? (
              <Menu.Item key="2">
                <Link to={generatePath(this.props.match.path, { panel: 'all_submissions' })}>
                  <Icon type="inbox" />
                  <span>All Submissions</span>
                </Link>
              </Menu.Item>
            ) : null}
            {this.props.regradesAllowed ? (
              <Menu.Item key="3">
                <Link to={generatePath(this.props.match.path, { panel: 'regrades' })}>
                  <Icon type="message" />
                  <span>Regrade Requests</span>
                </Link>
              </Menu.Item>
            ) : null}
          </Menu>
        </div>
        <div style={{ height: '100%' }}>
          <Menu theme="dark" mode="inline" style={{ position: 'absolute', bottom: 75 }} selectedKeys={[]}>
            <Menu.Item key="docs" onClick={this.openLink.bind(this, 'https://help.codepost.io')}>
              <Icon type="pushpin" />
              <span>Docs</span>
            </Menu.Item>
          </Menu>
        </div>
      </div>
    );
  }
}

export default GraderNav;

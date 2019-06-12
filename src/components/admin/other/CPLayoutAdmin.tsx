/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Layout } from 'antd';
import { ClickParam } from 'antd/lib/menu';
const { Header, Sider } = Layout;

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import CPLogo from '../../core/CPLogo';
import CPMainNav from '../../core/CPMainNav';

/**********************************************************************************************************************/

interface ICPLayoutAdminProps {
  header: React.ReactNode;
  detail: React.ReactNode;
  onClick: (e: ClickParam) => void;
  selectedPanel: number;
  className?: string;
}

interface ICPLayoutAdminState {
  collapsed: boolean;
}

class CPLayoutAdmin extends React.Component<ICPLayoutAdminProps, {}> {
  public state: Readonly<ICPLayoutAdminState> = {
    collapsed: false,
  };

  public onCollapse = (collapsed: boolean) => {
    this.setState({ collapsed });
  };

  public render() {
    return (
      <Layout id="Admin" className="layout--admin">
        <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
          <Header className="layout--admin__sider__header">
            {this.state.collapsed ? (
              <Link to="/">
                <CPLogo cpType="icon" />
              </Link>
            ) : (
              <Link to="/">
                <CPLogo cpType="main" />
              </Link>
            )}
          </Header>
          <CPMainNav selectedPanel={this.props.selectedPanel} onClick={this.props.onClick} />
        </Sider>
        <Layout>
          <Header className="layout--admin__header">{this.props.header}</Header>
          {this.props.detail}
        </Layout>
      </Layout>
    );
  }
}

export default CPLayoutAdmin;

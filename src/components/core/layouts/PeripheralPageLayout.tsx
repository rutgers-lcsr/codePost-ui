// This is a simple layout for the post-auth peripheral pages (Home, Settings, etc.)

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import PreAuthFooter from '../../pre-auth/PreAuthFooter';
import PeripheralPageHeader from './PeripheralPageHeader';

import type { UserType } from '../../../types/models';

/* ant imports */
import { Layout, theme } from 'antd';

const { Content, Footer } = Layout;

interface IProps {
  children: React.ReactNode;
  user: UserType;
  handleLogout: () => void;
  subtitle?: string;
}

const PeripheralPageLayout = (props: IProps) => {
  const { token } = theme.useToken();
  return (
    <Layout id="PreAuth" style={{ backgroundColor: token.colorBgLayout, minHeight: '100vh' }}>
      <PeripheralPageHeader user={props.user} handleLogout={props.handleLogout} subtitle={props.subtitle} />
      <Content>
        <div
          style={{
            background: token.colorBgContainer,
            padding: '25px 50px',
            maxWidth: 1200,
            margin: '0 auto',
          }}
        >
          {props.children}
        </div>
      </Content>
      <Footer
        style={{
          background: token.colorFillSecondary,
          width: '100%',
          padding: 0,
          marginTop: 50,
        }}
      >
        <PreAuthFooter />
      </Footer>
    </Layout>
  );
};

export default PeripheralPageLayout;

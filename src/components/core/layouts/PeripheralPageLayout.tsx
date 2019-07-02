// This is a simple layout for the post-auth peripheral pages (Home, Settings, etc.)

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import PreAuthFooter from '../../pre-auth/PreAuthFooter';
import PeripheralPageHeader from './PeripheralPageHeader';

import { UserType } from '../../../infrastructure/user';

/* ant imports */
import { Layout } from 'antd';

const { Content, Footer } = Layout;

interface IProps {
  children: React.ReactChild;
  user: UserType;
  handleLogout: () => void;
}

const PeripheralPageLayout = (props: IProps) => {
  return (
    <Layout id="PreAuth" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <PeripheralPageHeader user={props.user} handleLogout={props.handleLogout} />
      <Content>
        <div
          style={{
            background: '#fff',
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
          background: 'rgb(234,234,234)',
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

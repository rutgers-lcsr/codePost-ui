/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */

import LandingHeader from '../landing/LandingHeader';
import PreAuthFooter from './PreAuthFooter';

/* ant imports */
import { Layout } from 'antd';

const { Content, Footer } = Layout;

/**********************************************************************************************************************/

interface IProps {
  children: React.ReactChild;
  isLoggedIn: boolean;
}

class PreAuthLayout extends React.Component<IProps, {}> {
  public componentDidMount() {
    // Calendly widget setup
    const head = document.querySelector('head');
    const script = document.createElement('script');
    script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js');
    const link = document.createElement('link');
    link.setAttribute('href', 'https://assets.calendly.com/assets/external/widget.css');
    link.setAttribute('rel', 'stylesheet');
    head!.appendChild(script);
    head!.appendChild(link);
  }

  public render() {
    return (
      <Layout id="PreAuth" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
        <Content>
          <div
            style={{
              background: 'red',
              padding: '22px',
              fontSize: '24px',
              fontWeight: 500,
              color: 'white',
              textAlign: 'center',
            }}
          >
            codePost is making some updates to the site and is temporarily unavailable. Please check back in 20 minutes.
          </div>
          <LandingHeader />
          <div
            style={{
              background: '#fff',
              padding: '25px 50px',
              maxWidth: 1200,
              margin: '0 auto',
            }}
          >
            {this.props.children}
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
  }
}

export default PreAuthLayout;

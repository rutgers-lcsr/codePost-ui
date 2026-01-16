/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import qs from 'query-string';
/* other library imports */

import LandingHeader from '../landing/LandingHeader';
import PreAuthFooter from './PreAuthFooter';

/* ant imports */
import { Layout } from 'antd';



/**********************************************************************************************************************/

interface IProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
}

class PreAuthLayout extends React.Component<IProps> {
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
    const { token, redirect } = qs.parse(window.location.search);
    if (token && redirect) {
      window.localStorage.setItem('token', token as string);
      window.location = redirect as string & Location;
    }
  }

  public render() {
    return (
      <Layout id="PreAuth" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
        <LandingHeader />
        <main
          style={{
            background: '#fff',
            padding: '25px 50px',
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
            flex: 1,
            boxSizing: 'border-box',
          }}
        >
          {this.props.children}
        </main>
        <footer
          style={{
            background: 'rgb(234,234,234)',
            width: '100%',
            padding: 0,
            marginTop: 50,
          }}
        >
          <PreAuthFooter />
        </footer>
      </Layout>
    );
  }
}

export default PreAuthLayout;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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

// Only allow redirects to same-origin paths. Reject protocol-relative ("//evil.com"),
// absolute URLs, and anything else that could land the user on a third-party site
// with their newly-stored token.
const isSameOriginPath = (value: string): boolean =>
  value.startsWith('/') && !value.startsWith('//');

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
    if (token && typeof redirect === 'string' && isSameOriginPath(redirect)) {
      window.localStorage.setItem('token', token as string);
      window.location.assign(redirect);
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

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Link } from 'react-router-dom';

import PreAuthFooter from './PreAuthFooter';

/* ant imports */
import { Button, Layout } from 'antd';

const { Header, Content, Footer } = Layout;

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

    const calendlyDiv = document.getElementById('calendly-button');
    calendlyDiv!.setAttribute('onclick', "Calendly.showPopupWidget('https://calendly.com/codepost/');return false;");
  }

  public render() {
    return (
      <Layout id="PreAuth" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
        <Header
          style={{
            background: '#fff',
            width: '100%',
            padding: '25px 0',
            marginBottom: 30,
            fontSize: 17,
            fontWeight: 'bold',
            color: '#808080',
          }}
        >
          <div
            style={{
              margin: '0 auto',
              maxWidth: 1100,
              minWidth: 690,
              padding: '0 50px',
            }}
            className="header"
          >
            <span style={{ float: 'right', marginTop: '3px' }}>
              {this.props.isLoggedIn ? (
                <Link to="/logout">Logout</Link>
              ) : (
                <span>
                  <Link to="/login">Login</Link> &nbsp; &nbsp;
                  <Link to="/signup/staff/create">
                    <Button
                      style={{
                        borderRadius: 5,
                        backgroundColor: '#24be85',
                        color: '#fff',
                        fontSize: 17,
                        padding: '0 20px',
                      }}
                    >
                      Sign up
                    </Button>
                  </Link>
                </span>
              )}
            </span>
            <span>
              <Link to="/">
                <span style={{ fontSize: 30, color: '#062a22' }}>codePost</span>
              </Link>
              {this.props.isLoggedIn ? null : (
                <span>
                  &nbsp; &nbsp; &nbsp; <a href="https://help.codepost.io">Docs</a> &nbsp; &nbsp;{' '}
                  <a href="/pricing#faqs">FAQs</a> &nbsp; &nbsp;
                  <Link to="/pricing">Pricing</Link>
                </span>
              )}
            </span>
          </div>
        </Header>
        <Content>
          <div
            style={{
              background: '#fff',
              padding: '25px 50px',
              maxWidth: 1100,
              minWidth: 690,
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

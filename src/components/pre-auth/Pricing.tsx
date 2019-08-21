/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Icon } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import useWindowSize from '../core/useWindowSize';
import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

const textStyle = {
  maxWidth: 600,
  fontSize: 30,
  textAlign: 'center',
  color: '#062a22',
  fontWeight: 'bold',
} as React.CSSProperties;

const optionStyle = {
  borderRadius: 5,
  boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.15)',
  display: 'inline-block',
  textAlign: 'left',
  verticalAlign: 'middle',
  fontSize: '16px',
} as React.CSSProperties;

const freeButtonStyle = {
  borderRadius: 5,
  backgroundColor: '#fff',
  color: '#24be85',
};

const premiumButtonStyle = {
  borderRadius: 5,
  backgroundColor: '#4a4a4a',
  color: '#fff',
};

const Pricing = (props: IProps) => {
  const breakpoint = 700;
  const windowSize = useWindowSize();
  const flexDirection = windowSize.width < breakpoint ? 'column' : 'row';

  const freeStyle = {
    ...optionStyle,
    maxWidth: 237,
    width: 250,
    backgroundColor: '#24be85',
    padding: '35px 35px 35px 35px',
    color: '#fff',
  } as React.CSSProperties;

  const premiumStyle = {
    ...optionStyle,
    marginTop: windowSize.width < breakpoint ? -10 : 25,
    maxWidth: 250,
    backgroundColor: '#1b1b1b',
    marginLeft: windowSize.width < breakpoint ? 0 : 50,
    padding: '35px 35px 35px 35px',
    color: '#fff',
  } as React.CSSProperties;

  const featureStyle = {
    ...optionStyle,
    zIndex: 2,
    backgroundColor: '#fff',
    width: 600,
    maxWidth: windowSize.width < breakpoint ? 250 : 600,
    padding: windowSize.width < breakpoint ? '25px 15px' : '35px',
    display: 'flex',
    justifyContent: 'center',
  };

  // const freeTextPadding = windowSize.width < breakpoint ? '0 20px 10px 20px' : '0 20px 30px 20px';

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <span style={textStyle}>codePost is 100% free for colleges. No credit card required.</span>
          </div>
          <div
            style={{ display: 'flex', flexDirection, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}
          >
            <div style={freeStyle}>
              <h3 style={{ fontWeight: 'bold', fontSize: 24, color: '#fff' }}>Colleges</h3>
              <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Free</p>
              <Link to="/signup/create">
                <Button style={freeButtonStyle}>
                  Get started <Icon type="arrow-right" />
                </Button>
              </Link>
            </div>
            <div style={premiumStyle}>
              <h3 style={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}>For-profits</h3>
              <p style={{ fontSize: '18px' }}>$5 / student / month </p>
              <a href="mailto:team@codepost.io">
                <Button style={premiumButtonStyle}>
                  Get in touch <Icon type="arrow-right" />
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div style={{ width: '100%' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                marginTop: -15,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                top: -15,
              }}
            >
              <div style={featureStyle}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Features:</p>
                  <div style={{ display: 'flex', flexDirection, justifyContent: 'center' }}>
                    <ul style={{ maxWidth: 210, marginBottom: 0 }}>
                      <li>Unlimited students</li>
                      <li>Unlimited course staff</li>
                      <li>Unlimited submissions</li>
                    </ul>
                    <ul style={{ maxWidth: 210, marginLeft: windowSize.width < breakpoint ? 0 : 20 }}>
                      <li>Full API access: Unlimited requests</li>
                      <li>&lt;48 hour support response time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PreAuthLayout>
  );
};

export default Pricing;

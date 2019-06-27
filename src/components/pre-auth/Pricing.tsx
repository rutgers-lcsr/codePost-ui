/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Divider, Icon } from 'antd';

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
  backgroundColor: '#24be85',
  color: '#fff',
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
    maxWidth: 409,
    backgroundColor: '#fff',
    marginTop: 60,
    padding: '35px 35px',
  } as React.CSSProperties;

  const premiumStyle = {
    ...optionStyle,
    maxWidth: 391,
    backgroundColor: '#1b1b1b',
    marginTop: 50,
    padding: windowSize.width < breakpoint ? '35px 35px' : '20px 35px',
    color: '#fff',
  } as React.CSSProperties;

  const freeTextPadding = windowSize.width < breakpoint ? '0 20px 10px 20px' : '0 20px 30px 20px';
  const premiumTextPadding = windowSize.width < breakpoint ? '0 20px 10px 20px' : '0 20px 10px 20px';

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <span style={textStyle}>codePost is free for all the courses and people you need.</span>
          </div>
          <div style={{ display: 'flex', flexDirection, justifyContent: 'center', alignItems: 'center' }}>
            <div style={freeStyle}>
              <h3 style={{ fontWeight: 'bold', fontSize: 24 }}>Free</h3>
              <p style={{ fontSize: '18px' }}>$0</p>
              <p>Full access to codePost for free.</p>
              <Divider />
              <ul style={{ padding: freeTextPadding }}>
                <li>Unlimited students</li>
                <li>Unlimited course staff</li>
                <li>Unlimited submissions</li>
                <li>Full API access: up to 1000 requests/day</li>
                <li>&lt;48 hour support response time</li>
              </ul>
              <Link to="/signup/create">
                <Button style={freeButtonStyle}>
                  Get started <Icon type="arrow-right" />
                </Button>
              </Link>
            </div>
            <div style={premiumStyle}>
              <h3 style={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}>Pro</h3>
              <p style={{ fontSize: '18px' }}>$5 / student / month </p>
              <p>Ideal for large departments that want enterprise-grade support.</p>
              <Divider />
              <ul style={{ padding: premiumTextPadding }}>
                <li>Unlimited students</li>
                <li>Unlimited course staff</li>
                <li>Unlimited submissions</li>
                <li>
                  Full API access: <span style={{ color: '#24be85' }}>unlimited requests</span>
                </li>
                <li>
                  <span style={{ color: '#24be85' }}>&lt;12 hour</span> support response time
                </li>
              </ul>
              <Button style={premiumButtonStyle}>
                Get in touch <Icon type="arrow-right" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PreAuthLayout>
  );
};

export default Pricing;

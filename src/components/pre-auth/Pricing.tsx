/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';

import { colors } from '../../theme/colors';

/* ant imports */
import { Button, Divider } from 'antd';

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
  height: 550,
} as React.CSSProperties;

const freeButtonStyle = {
  borderRadius: 5,
  backgroundColor: '#fff',
  color: colors.brandPrimary,
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
    width: 275,
    backgroundColor: colors.brandPrimary,
    padding: '35px 35px 35px 35px',
    color: '#fff',
  } as React.CSSProperties;

  const premiumStyle = {
    ...optionStyle,
    width: 275,
    backgroundColor: colors.brandBlack,
    marginLeft: windowSize.width < breakpoint ? 0 : 50,
    padding: '35px 35px 35px 35px',
    color: '#fff',
    fontSize: '16px',
  } as React.CSSProperties;

  // const freeTextPadding = windowSize.width < breakpoint ? '0 20px 10px 20px' : '0 20px 30px 20px';

  const freeFeatures = [
    'Unlimited students',
    'Unlimited instructors',
    'Unlimited assignments',
    'codePost Autograder',
    'codePost API',
    'FERPA compliance',
  ];

  const enterpriseFeatures = [
    <span>
      Everything in <b>Teach</b>
    </span>,
    'Tools for managing large, high-velocity courses + training sessions',
    'Custom system integration',
    'Live chat support',
  ];

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div className="display-flex flex-direction-column" style={{ textAlign: 'center', position: 'relative' }}>
        <div className="display-flex justify-content-center" style={{ width: '100%' }}>
          <span style={textStyle}>codePost is 100% free for educators.</span>
        </div>
        <div
          className={`display-flex justify-content-center align-items-center flex-direction-${flexDirection}`}
          style={{ paddingTop: 50 }}
        >
          <div style={freeStyle}>
            <h3 style={{ fontWeight: 'bold', fontSize: 24, color: '#fff' }}>Teach</h3>
            <em>For higher ed, non-profits, and high schools</em>
            <br />
            <br />
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Free</p>
            <Link to="/signup/create">
              <Button style={freeButtonStyle}>
                Sign up <ArrowRightOutlined />
              </Button>
            </Link>
            <Divider />
            {freeFeatures.map((el) => (
              <div style={{ margin: '10px 0' }}>{el}</div>
            ))}
          </div>
          <div style={premiumStyle}>
            <h3 style={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}>Enterprise</h3>
            <em>For bootcamps, for-profits, and large departments</em>
            <br />
            <br />
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>$15 / student / course</p>
            <a href="mailto:codepost@cs.rutgers.edu">
              <Button style={premiumButtonStyle}>
                Coming soon <ArrowRightOutlined />
              </Button>
            </a>
            <Divider />
            {enterpriseFeatures.map((el) => (
              <div style={{ margin: '10px 0' }}>{el}</div>
            ))}
          </div>
        </div>
      </div>
    </PreAuthLayout>
  );
};

export default Pricing;

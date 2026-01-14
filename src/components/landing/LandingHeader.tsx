import { Link } from 'react-router-dom';

import { MenuOutlined } from '@ant-design/icons';

import type { CollapseProps } from 'antd';
import { Collapse } from 'antd';

import landingVars from '../../styles/pages/_landingVars';

import CPButton from '../core/CPButton';
import useWindowSize from '../core/useWindowSize';
import { colors } from '../../theme/colors';

function LandingHeader() {
  const windowSize = useWindowSize();
  const smallScreen = windowSize.width < landingVars.breakpoints.header;

  const linkStyle = {
    fontSize: smallScreen ? 14 : 18,
    fontWeight: 600,
    color: '#313131',
    paddingLeft: smallScreen ? 15 : 40,
    paddingTop: smallScreen ? 15 : 0,
    paddingBottom: smallScreen ? 15 : 10,
    cursor: 'pointer',
  };

  const expandIcon = (_: any) => {
    return <MenuOutlined style={{ marginRight: 10 }} />;
  };

  const logo = (
    <Link
      style={{
        fontSize: smallScreen ? 24 : 34,
        color: 'black',
        paddingLeft: 10,
      }}
      className="link--header"
      to={'/'}
    >
      code<b>Post</b>
    </Link>
  );
  const docs = (
    <Link style={{ ...linkStyle }} className="link--header" to="/docs">
      Docs
    </Link>
  );
  const faqs = (
    <Link style={{ ...linkStyle }} className="link--header" to="/faqs">
      FAQs
    </Link>
  );
  const login = (
    <Link
      style={{ ...linkStyle, paddingRight: 30, paddingTop: smallScreen ? 15 : 20 }}
      className="link--header"
      to="/login"
    >
      Login
    </Link>
  );
  const features = (
    <Link style={{ ...linkStyle }} className="link--header" to="/why-use-codePost">
      Features
    </Link>
  );

  if (windowSize.width < landingVars.breakpoints.header) {
    // Small Screen View
    const collapseItems: CollapseProps['items'] = [
      {
        key: '1',
        label: logo,
        style: { paddingBottom: 5, paddingTop: 5 },
        children: (
          <div className="display-flex flex-direction-column align-items-left justify-content-space-between">
            {docs}
            {faqs}
            {features}
            {login}
            <Link
              style={{ ...linkStyle, background: colors.brandPrimary, color: 'white' }}
              className="link--header"
              to="/signup"
            >
              Sign Up
            </Link>
          </div>
        ),
      },
    ];

    return (
      <Collapse
        bordered={false}
        expandIconPosition="end"
        expandIcon={expandIcon}
        style={{ backgroundColor: 'white' }}
        items={collapseItems}
      />
    );
  } else {
    // Normal View
    return (
      <div style={{ width: '100%' }} className="display-flex justify-content-center">
        <div
          style={{
            background: 'none',
            maxWidth: landingVars.maxWidths.header,
            width: '100%',
            paddingRight: 40,
            paddingLeft: 40,
            paddingTop: 30,
            paddingBottom: 30,
          }}
          className="display-flex justify-content-space-between align-items-flex-end"
        >
          <div className="display-flex align-items-flex-end">
            {logo}
            {docs}
            {faqs}
            {features}
          </div>
          <div style={{ paddingBottom: 4 }}>
            {login}
            <Link to="/signup">
              <CPButton style={{ width: 120, height: 40, fontSize: 17, marginLeft: 15 }} cpType="primary" key="SignUp">
                Sign Up
              </CPButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default LandingHeader;

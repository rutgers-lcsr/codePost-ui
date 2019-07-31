/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

// /* other library imports */
// import { Link } from 'react-router-dom';

/* codePost imports */
// import useWindowSize from '../core/useWindowSize';
import PreAuthLayout from './PreAuthLayout';

import Integrations, { IntegrationDescription, INTEGRATIONS } from '../landing/Integrations';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

const IntegrationsPage = (props: IProps) => {
  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: 30, color: '#062a22', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
          <span>Integrations</span>
        </div>
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.67,
            fontWeight: 400,
            color: '#606060',
            textAlign: 'center',
            marginBottom: '30px',
          }}
        >
          codePost users use it alongside all sorts of various administrative and technical tools.
        </div>
        <div>
          <div style={{ display: 'inline-block', width: '400px' }}>
            <Integrations integrations={['github', 'blackboard', 'jupyter', 'moss', 'canvas', 'homegrown']} />
          </div>
          <div style={{ display: 'inline-block' }}>
            <IntegrationDescription integration={INTEGRATIONS.jupyter} />
          </div>
        </div>
      </div>
    </PreAuthLayout>
  );
};

export default IntegrationsPage;

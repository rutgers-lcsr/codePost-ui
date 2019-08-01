/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

// /* other library imports */
// import { Link } from 'react-router-dom';

/* codePost imports */
import useWindowSize from '../core/useWindowSize';
import PreAuthLayout from './PreAuthLayout';

import Integrations, { IntegrationDescription, INTEGRATIONS } from '../landing/Integrations';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

const IntegrationsPage = (props: IProps) => {
  const windowSize = useWindowSize();

  const [currentIntegration, setCurrentIntegration] = React.useState(INTEGRATIONS.jupyter);

  const onClick = (integration: string) => {
    setCurrentIntegration(INTEGRATIONS[integration]);
  };

  let content;
  if (windowSize.width < 1060) {
    content = (
      <div style={{ margin: '0px 0px' }}>
        <div style={{ marginBottom: '20px' }}>
          <IntegrationDescription integration={currentIntegration} />
        </div>
        <div style={{ maxWidth: '659px' }}>
          <Integrations
            integrations={[
              'github',
              'blackboard',
              'jupyter',
              'moss',
              'canvas',
              'submitty',
              'moodle',
              'replit',
              'revel',
              'homegrown',
            ]}
            onClick={onClick}
          />
        </div>
      </div>
    );
  } else {
    content = (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignContent: 'center', margin: '0px 100px' }}>
        <div style={{ flexGrow: 1, paddingRight: '20px' }}>
          <Integrations
            integrations={[
              'github',
              'blackboard',
              'jupyter',
              'moss',
              'canvas',
              'submitty',
              'moodle',
              'replit',
              'revel',
              'homegrown',
            ]}
            onClick={onClick}
          />
        </div>
        <div style={{ borderLeft: '2px solid #eaeaea', paddingLeft: '35px', width: '375px' }}>
          <IntegrationDescription integration={currentIntegration} />
        </div>
      </div>
    );
  }

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
            margin: '0px 0px 30px 0px',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          codePost users use it alongside all sorts of various administrative and technical tools. Here are some
          examples.
        </div>
        {content}
      </div>
    </PreAuthLayout>
  );
};

export default IntegrationsPage;

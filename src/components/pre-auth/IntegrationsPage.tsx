/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

// /* other library imports */
// import { Link } from 'react-router-dom';

/* ant imports */
import { Typography } from 'antd';

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

  const integrations = (
    <Integrations
      integrations={[
        'canvas',
        'blackboard',
        'jupyter',
        'github',
        'jsfiddle',
        'brightspace',
        'codepen',
        'replit',
        'revel',
        'homegrown',
      ]}
      onClick={onClick}
    />
  );
  if (windowSize.width < 1060) {
    content = (
      <div style={{ margin: '0px 0px' }}>
        <div style={{ marginBottom: '20px' }}>
          <IntegrationDescription integration={currentIntegration} />
        </div>
        <div style={{ maxWidth: '659px' }}>{integrations}</div>
      </div>
    );
  } else {
    content = (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignContent: 'center', margin: '0px 100px' }}>
        <div style={{ flexGrow: 1, paddingRight: '20px' }}>{integrations}</div>
        <div style={{ borderLeft: '2px solid #eaeaea', paddingLeft: '35px', width: '375px' }}>
          <IntegrationDescription integration={currentIntegration} />
        </div>
      </div>
    );
  }

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div style={{ width: '100%' }}>
        <div style={{ marginBottom: '10px', textAlign: 'center' }}>
          <Typography.Title level={1} style={{ fontSize: 30, color: '#062a22', margin: 0 }}>
            Integrations
          </Typography.Title>
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
          <div style={{ maxWidth: '675px', margin: '0 auto' }}>
            codePost integrates natively with many common educational tools, so you can get data into codePost easily
            and export to wherever you need.
          </div>
        </div>
        {content}
      </div>
    </PreAuthLayout>
  );
};

export default IntegrationsPage;

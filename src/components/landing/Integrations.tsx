import * as React from 'react';

import { Card } from 'antd';

// import { Link } from 'react-router-dom';

export const INTEGRATIONS: { [id: string]: IntegrationType } = {
  github: {
    name: 'Github',
    logo: require('./../../img/integrations/github.png'),
    description: 'Github does source control.',
  },
  jupyter: {
    name: 'Jupyter',
    logo: require('./../../img/integrations/jupyter.png'),
    description: 'Jupyter does IPython Notebooks. Typically used in data science courses.',
  },
  canvas: {
    name: 'Canvas',
    logo: require('./../../img/integrations/canvas.png'),
    description: 'Canvas is an LMS.',
  },
  blackboard: {
    name: 'Blackboard',
    logo: require('./../../img/integrations/blackboard.jpeg'),
    description: 'Blackboard is an LMS.',
  },
  moss: {
    name: 'Moss',
    logo: require('./../../img/integrations/moss.png'),
    description: 'MOSS is an open-source plagiarism detection service.',
  },
  homegrown: {
    name: 'Homegrown',
    logo: require('./../../img/integrations/homegrown.png'),
    description: 'Lots of schools have their own software.',
  },
  more: {
    name: '+ more',
    logo: require('./../../img/integrations/more.png'),
    description: 'See more integrations...',
  },
  submitty: {
    name: 'Submitty',
    logo: require('./../../img/integrations/submitty.png'),
    description: `Submitty is an open-source student submission system \
    developed by the Rensselaer Center for Open Source Software.`,
  },
  revel: {
    name: 'Pearson|Revel',
    logo: require('./../../img/integrations/revel.png'),
    description: `Revel provides interactive programming \
    exercises`,
  },
  replit: {
    name: 'Repl.it',
    logo: require('./../../img/integrations/replit.png'),
    description: `Repl.it is an online compiler and \
    IDE.`,
  },
  moodle: {
    name: 'Moodle',
    logo: require('./../../img/integrations/moodle.png'),
    description: `Moodle is an open source \
    LMS.`,
  },
};

export type IntegrationType = {
  name: string;
  logo: any;
  description: string;
};

interface IIntegrationsProps {
  integrations: string[];
  onClick?: any;
}

const Integrations = (props: IIntegrationsProps) => {
  const cards = props.integrations
    .map((integration: string) => {
      if (INTEGRATIONS[integration]) {
        const onClick = () => {
          if (props.onClick !== undefined) {
            props.onClick(integration);
          }
        };

        return <IntegrationCard key={integration} integration={INTEGRATIONS[integration]} onClick={onClick} />;
      } else {
        return null;
      }
    })
    .filter((card: any) => {
      return card !== null;
    });

  return <div className="integrations">{cards}</div>;
};

interface IIntegrationCardProps {
  integration: IntegrationType;
  onClick: any;
}

const IntegrationCard = (props: IIntegrationCardProps) => {
  return (
    <Card hoverable={true} className="integration">
      <table style={{ height: '100%', width: '100%', margin: 0, padding: 0, border: 0 }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'middle', textAlign: 'center' }} onClick={props.onClick}>
              <img src={props.integration.logo} style={{ width: '55px' }} />
            </td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td
              style={{
                verticalAlign: 'middle',
                textAlign: 'center',
                color: '#7f7f7f',
                fontSize: '14px',
                fontWeight: 600,
                overflowX: 'hidden',
              }}
              onClick={props.onClick}
            >
              {props.integration.name}
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
};

interface IIntegrationDescriptionProps {
  integration: IntegrationType;
}

export const IntegrationDescription = (props: IIntegrationDescriptionProps) => {
  return (
    <div>
      <div style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600, color: '#7f7f7f' }}>
        {props.integration.name}
      </div>
      <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{props.integration.description}</div>
    </div>
  );
};

export default Integrations;

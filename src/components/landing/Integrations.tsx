import * as React from 'react';

import { Card, Tooltip } from 'antd';

import { Link } from 'react-router-dom';

export const INTEGRATIONS: { [id: string]: IntegrationType } = {
  github: {
    key: 'github',
    name: 'GitHub',
    logo: require('./../../img/integrations/github.png'),
    description: (
      <span>
        <a href="https://github.com">GitHub</a> is a development platform that provides version-controlled software
        hosting using git.
        <br />
        <br /> Do your students use GitHub for version control and to submit their work? You can import student work
        from GitHub to codePost for code review and higher resolution feedback.
        <br />
        <br /> See more detailed instructions for how to{' '}
        <a href="https://github.com/codepost-io/integration-github">import submissions here.</a>.
      </span>
    ),
  },
  jupyter: {
    key: 'jupyter',
    name: 'Jupyter',
    logo: require('./../../img/integrations/jupyter.png'),
    description: (
      <span>
        <a href="https://jupyter.org/">Project Jupyter</a> is a non-profit, open-source project born out of the{' '}
        <a href="https://ipython.org/">IPython Project</a> in 2014. It provides an open standard for interactive
        computing, and Jupyter Notebooks have become especially popular in university data science courses.
        <br />
        <br />
        codePost allows instructors to annotate fully-rendered Jupyter Notebooks. You can include .ipynb files in
        codePost submissions, just like any other code file.
        <br />
        <br />
        See how easy it is to comment on a Jupyter notebook in codePost{' '}
        <a href="https://codepost.io/why-use-codePost">here</a>.
      </span>
    ),
  },
  canvas: {
    key: 'canvas',
    name: 'Canvas',
    logo: require('./../../img/integrations/canvas.png'),
    description: (
      <span>
        <a href="https://www.instructure.com/canvas/">Canvas</a> is a learning management system (LMS) used widely in
        higher ed. <br /> <br />
        codePost makes it easy to:
        <br /> <br />
        <ul>
          <li>Import course rosters from Canvas, and subsequently keep rosters in sync</li>
          <li>Import submissions uploaded to Canvas into codePost</li>
          <li>Export grades from codePost back to Canvas</li>
        </ul>
        Courses using both codePost and Canvas often use this grading workflow:
        <br /> <br />
        <ol>
          <li>Students submit their programming assignments through Canvas</li>
          <li>
            An instructor runs correctness tests, and then imports submissions and test output (as .txts) to codePost
            using codePost's native Canvas import feature
          </li>
          <li>Instructors / TAs review and grade submissions in codePost</li>
          <li>Students receive their feedback through codePost</li>
          <li>(Optional) An instructor can export scores back to Canvas</li>
        </ol>{' '}
        See more detailed instructions for how to{' '}
        <a href="https://github.com/codepost-io/integration-canvas">import submissions here</a>.
      </span>
    ),
  },
  blackboard: {
    key: 'blackboard',
    name: 'Blackboard',
    logo: require('./../../img/integrations/blackboard.jpeg'),
    description: (
      <span>
        <a href="https://www.blackboard.com/blackboard-learn/index.html">Blackboard</a> is a learning management system
        (LMS) used widely in higher ed. <br /> <br /> codePost makes it easy to: <br /> <br />
        <ul>
          <li>Import course rosters from Blackboard, and subsequently keep rosters in sync</li>
          <li>Import submissions uploaded to Blackboard into codePost</li>
          <li>export grades from codePost back to Blackboard</li>
        </ul>{' '}
        Courses using both codePost and Blackboard often use this grading workflow: <br /> <br />
        <ol>
          <li>Students submit their programming assignments through Blackboard</li>
          <li>
            An instructor runs correctness tests, and then imports submissions and test output (as .txts) to codePost
            using codePost's native Blackboard import feature
          </li>
          <li>Instructors / TAs review and grade submissions in codePost</li>
          <li>Students receive their feedback through codePost</li>
          <li>(Optional) An instructor can export scores back to Blackboard</li>
        </ol>{' '}
        See more detailed instructions for how to{' '}
        <a href="https://github.com/codepost-io/integration-blackboard">import submissions here</a>.
      </span>
    ),
  },
  brightspace: {
    key: 'brightspace',
    name: 'Brightspace',
    logo: require('./../../img/integrations/brightspace.png'),
    description: (
      <span>
        <a href="https://www.d2l.com/products/learning-environment/">Brightspace by D2L</a> is a learning management
        system (LMS) used widely in higher ed.
        <br /> <br /> codePost makes it easy to: <br />
        <br />
        <ul>
          <li>Import course rosters from Brightspace, and subsequently keep rosters in sync</li>
          <li>Import submissions uploaded to Brightspace into codePost</li>
          <li>export grades from codePost back to Brightspace</li>
        </ul>
        Courses using both codePost and Brightspace often use this grading workflow: <br />
        <br />
        <ol>
          <li>Students submit their programming assignments through Brightspace</li>
          <li>
            An instructor runs correctness tests, and then imports submissions and test output (as .txts) to codePost
            using codePost's native Brightspace import feature
          </li>
          <li>Instructors / TAs review and grade submissions in codePost</li>
          <li> Students receive their feedback through codePost</li>
          <li>(Optional) An instructor can export scores back to Brightspace</li>
        </ol>
        See more detailed instructions for how to{' '}
        <a href="https://github.com/codepost-io/integration-brightspace">import submissions here</a>.
      </span>
    ),
  },
  homegrown: {
    key: 'homegrown',
    name: 'Homegrown',
    logo: require('./../../img/integrations/homegrown.png'),
    description: (
      <span>
        Many courses have built their own tools that are part of the grading and review process. Whatever the tools do
        -- automated testing, structured quizzing or anything else -- you can use the codePost API to integrate what
        you've built with codePost.
        <br /> <br />
        Common use cases include: <br /> <br />
        <ul>
          <li>
            Including tool output as .txt or .md file in a codePost submission (making it available during grading)
          </li>
          <li>
            <a href="https://docs.codepost.io/docs/programmatically-place-comments">
              Programmatically placing comments
            </a>{' '}
            on code
          </li>
        </ul>
      </span>
    ),
  },
  more: {
    key: 'more',
    name: '+ more',
    logo: require('./../../img/integrations/more.png'),
    description: <span>See more integrations...</span>,
  },
  submitty: {
    key: 'submitty',
    name: 'Submitty',
    logo: require('./../../img/integrations/submitty.png'),
    description: (
      <span>
        Submitty is an open-source student submission system developed by the Rensselaer Center for Open Source
        Software.
      </span>
    ),
  },
  revel: {
    key: 'revel',
    name: 'Pearson|Revel',
    logo: require('./../../img/integrations/revel.png'),
    description: (
      <span>
        <a href="https://www.pearsonhighered.com/revel/">Revel</a> provides interactive programming exercises.
        <br />
        <br />
        Email team@codepost.io to learn how to integrate Revel with codePost.
      </span>
    ),
  },
  replit: {
    key: 'replit',
    name: 'Repl.it',
    logo: require('./../../img/integrations/replit.png'),
    description: (
      <span>
        <a href="https://repl.it">Repl.it</a> is an online compiler and IDE.
        <br />
        <br />
        Email team@codepost.io to learn how to integrate Repl.it with codePost.
      </span>
    ),
  },
  moodle: {
    key: 'moodle',
    name: 'Moodle',
    logo: require('./../../img/integrations/moodle.png'),
    description: <span>Moodle is an open source LMS.</span>,
  },
  jsfiddle: {
    key: 'jsfiddle',
    name: 'JS Fiddle',
    logo: require('./../../img/integrations/jsfiddle.png'),
    description: (
      <span>
        <a href="https://jsfiddle.net/">JS Fiddle</a> is a lightweight code playground for running and sharing code.
        <br />
        <br />
        Import code snippets from JS Fiddle into codePost to allow graders and peer reviewers to give inline feedback.
        <br />
        <br />
        Email team@codepost.io to learn how to integrate JS Fiddle with codePost.
      </span>
    ),
  },
  codepen: {
    key: 'codepen',
    name: 'CodePen',
    logo: require('./../../img/integrations/codepen.png'),
    description: (
      <span>
        <a href="https://codepen.io">CodePen</a> is a lightweight code playground for running and sharing code. <br />
        <br />
        Import code from Codepen into codePost to allow graders and peer reviewers to give inline feedback.
        <br />
        <br />
        Email team@codepost.io to learn how to integrate Codepen with codePost.
      </span>
    ),
  },
  codio: {
    key: 'codio',
    name: 'Codio',
    logo: require('./../../img/integrations/codio.png'),
    description: <span>Moodle is an open source LMS.</span>,
  },
};

export type IntegrationType = {
  key: string;
  name: string;
  logo: any;
  description: React.ReactElement;
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
    <Link to="/integrations">
      <Card hoverable={true} className="integration integration--card">
        <table style={{ height: '100%', width: '100%', margin: 0, padding: 0, border: 0 }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }} onClick={props.onClick}>
                <img src={props.integration.logo} style={{ width: '55px' }} alt="" />
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
    </Link>
  );
};

interface IIntegrationButtonProps {
  integration: IntegrationType;
  active: boolean;
  onClick: any;
}

export const IntegrationButton = (props: IIntegrationButtonProps) => {
  const onClick = () => {
    props.onClick(props.integration.key);
  };

  return (
    <Tooltip title={props.integration.name}>
      <Card
        hoverable={true}
        className={`integration integration--button ${props.active ? 'integration--active' : null}`}
        onClick={onClick}
      >
        <table style={{ height: '100%', width: '100%', margin: 0, padding: 0, border: 0 }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle', textAlign: 'center' }} onClick={onClick}>
                <img src={props.integration.logo} style={{ width: '45px' }} alt="" />
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </Tooltip>
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
      <div>{props.integration.description}</div>
    </div>
  );
};

export default Integrations;

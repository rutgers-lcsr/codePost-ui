import * as React from 'react';

import { Card, Tooltip } from 'antd';

import { Link } from 'react-router-dom';

import BlockMarkdown from '../core/BlockMarkdown';

export const INTEGRATIONS: { [id: string]: IntegrationType } = {
  github: {
    key: 'github',
    name: 'Github',
    logo: require('./../../img/integrations/github.png'),
    description: `[Github](https://github.com) is a development platform
that provides hosting for software version control using Git.

Courses that use Github for student submissions can get all the value of
codePost course management and standardized code feedback by cloning the
repositories and uploading them to codePost.

Email team@codepost.io for details on how to automate this process.
`,
  },
  jupyter: {
    key: 'jupyter',
    name: 'Jupyter',
    logo: require('./../../img/integrations/jupyter.png'),
    description: `[Project Jupyter](https://jupyter.org/) is a non-profit, open-source project
born out of the [IPython Project](https://ipython.org/) in 2014. It provides
an open standard for interactive computing, and Jupyter Notebooks have become
an especially popular tool in university data science courses.

codePost provides an intuitive way to give inline feedback on fully-rendered
Jupyter Notebooks. You can include \`.ipynb\` files in submissions just
like any other code file.

See the commenting in action [here](https://codepost.io/why-use-codePost).
`,
  },
  canvas: {
    key: 'canvas',
    name: 'Canvas',
    logo: require('./../../img/integrations/canvas.png'),
    description: `[Canvas](https://www.instructure.com/canvas/)
is a learning management system (LMS) used widely in higher ed.

codePost makes it easy to:
- Import course rosters from Canvas and keep rosters in sync
- Import submissions uploaded to Canvas into codePost
- Export grades from codePost back to Canvas

Here is a summary of a typical process:

1. Students will submit their programming assignments on
Canvas
2. An Admin will run tests and import the submissions and test output to codePost
3. Code will be graded and reviewed on codePost
4. Students will receive their feedback on codePost
5. An Admin will export final grades back to Canvas

See more detailed instructions for how to
[import submissions here](https://github.com/codepost-io/integration-canvas).
`,
  },
  blackboard: {
    key: 'blackboard',
    name: 'Blackboard',
    logo: require('./../../img/integrations/blackboard.jpeg'),
    description: `[Blackboard](https://www.blackboard.com/blackboard-learn/index.html)
is a learning management system (LMS) used widely in higher ed.

codePost makes it easy to:
- Import course rosters from Blackboard and keep rosters in sync
- Import submissions uploaded to Blackboard into codePost
- Export grades from codePost back to Blackboard

Here is a summary of a typical process:

1. Students will submit their programming assignments on
Blackboard
2. An Admin will run tests and import the submissions and test output to codePost
3. Code will be graded and reviewed on Blackboard
4. Students will receive their feedback on Blackboard
5. An Admin will export final grades back to Blackboard
`,
  },
  moss: {
    key: 'moss',
    name: 'Moss',
    logo: require('./../../img/integrations/moss.png'),
    description: `[Moss](https://theory.stanford.edu/~aiken/moss/)
(for a Measure Of Software Similarity) is a system for determining
the similarity of programs and detecting plagiarism in programming classes. It was
developed at Stanford in 1994.

codePost can integrate student submissions with the Moss servers at the
run of a script. The codePost API can then automatically flag submissions-in-question.
See the [full instructions on Github](https://github.com/codepost-io/Moss-Integration).

And watch the full process in action [here](https://codepost.wistia.com/medias/4fe8oc5ijg).
`,
  },
  homegrown: {
    key: 'homegrown',
    name: 'Homegrown',
    logo: require('./../../img/integrations/homegrown.png'),
    description: `Many courses have their own homegrown tools that are part of the
grading and review process. Whether the tools are for automated testing or structured quizzing
or otherwise, the tools can neatly integrate with the codePost review process.

Common use cases are:

- Including tool outputs as \`.txt\` or \`.md\` files in a submission, and
- [Programmatically placing comments](https://docs.codepost.io/docs/programmatically-place-comments)
on code
`,
  },
  more: {
    key: 'more',
    name: '+ more',
    logo: require('./../../img/integrations/more.png'),
    description: 'See more integrations...',
  },
  submitty: {
    key: 'submitty',
    name: 'Submitty',
    logo: require('./../../img/integrations/submitty.png'),
    description: `Submitty is an open-source student submission system \
    developed by the Rensselaer Center for Open Source Software.`,
  },
  revel: {
    key: 'revel',
    name: 'Pearson|Revel',
    logo: require('./../../img/integrations/revel.png'),
    description: `[Revel](https://www.pearsonhighered.com/revel/)
provides interactive programming exercises.

Email team@codepost.io for details on how to integrate with codePost.
`,
  },
  replit: {
    key: 'replit',
    name: 'Repl.it',
    logo: require('./../../img/integrations/replit.png'),
    description: `[Repl.it](https://repl.it) is an online compiler and
IDE.

Email team@codepost.io for details on how to integrate with codePost.
`,
  },
  moodle: {
    key: 'moodle',
    name: 'Moodle',
    logo: require('./../../img/integrations/moodle.png'),
    description: `Moodle is an open source \
    LMS.`,
  },
  jsfiddle: {
    key: 'jsfiddle',
    name: 'JS Fiddle',
    logo: require('./../../img/integrations/jsfiddle.png'),
    description: `[JS Fiddle](https://jsfiddle.net/) is a lightweight
code playground for running and sharing code.

Import the code snippets into codePost to allow graders and peer
reviewers to give inline feedback.

Email team@codepost.io for details on how to integrate with codePost.
 `,
  },
  codepen: {
    key: 'codepen',
    name: 'CodePen',
    logo: require('./../../img/integrations/codepen.png'),
    description: `[CodePen](https://codepen.io) is a lightweight
code playground for running and sharing code.

Import the code snippets into codePost to allow graders and peer
reviewers to give inline feedback.

Email team@codepost.io for details on how to integrate with codePost.
`,
  },
  codio: {
    key: 'codio',
    name: 'Codio',
    logo: require('./../../img/integrations/codio.png'),
    description: `Moodle is an open source \
    LMS.`,
  },
};

export type IntegrationType = {
  key: string;
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
    <Link to="/integrations">
      <Card hoverable={true} className="integration integration--card">
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
                <img src={props.integration.logo} style={{ width: '45px' }} />
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
      <BlockMarkdown source={props.integration.description} />
    </div>
  );
};

export default Integrations;

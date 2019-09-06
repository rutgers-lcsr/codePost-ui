/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Button, Card, Icon, Input, message, Progress } from 'antd';

const ButtonGroup = Button.Group;
const { Search } = Input;
// const { Title } = Typography;

// import CPButton from '../../../../../components/core/CPButton';
// import CPTooltip from '../../../../../components/core/CPTooltip';
// import { tooltips } from '../../../../../components/core/tooltips';

import CPFlex from '../../../../components/core/CPFlex';

import CPAdminDetail from '../../other/CPAdminDetail';

import MossResults from './MossResults';

/* other library imports */
// import memoizeOne from 'memoize-one';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { UserType } from '../../../../infrastructure/user';
// import { SubmissionType } from '../../../../../infrastructure/submission';

/**********************************************************************************************************************/

export interface IProps {
  /* assignment data */
  assignment: AssignmentType;

  user: UserType;

  onCancel: () => void;
}
/**********************************************************************************************************************/

const Moss = (props: any) => {
  const [submit, setSubmit] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [url, setUrl] = React.useState('http://moss.stanford.edu/results/783191722');

  const mockResults = [
    {
      file1: {
        timestamp: '1567581291836253',
        course: 'richardscourse',
        assignment: 'HelloWorld',
        sub_id: '25641',
        email: 'student0@codepost.io',
        similarity: '98',
      },
      file2: {
        timestamp: '1567581291836253',
        course: 'richardscourse',
        assignment: 'HelloWorld',
        sub_id: '25705',
        email: 'student1@codepost.io',
        similarity: '98',
      },
      linesMatched: 84,
      matchURL: 'http://moss.stanford.edu/results/783191722/match0.html',
    },
  ];

  // @ts-ignore
  const [results, setResults] = React.useState(mockResults);

  const toggleSubmit = async () => {
    const payload = {
      moss_url: 'http://moss.stanford.edu/results/783191722',
    };

    console.log('requesting here ---->');

    const res = await fetch('https://6yvun70md8.execute-api.us-east-2.amazonaws.com/default/process-moss', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log(await res.json());
    setSubmit(true);
  };

  const toggleParse = () => {
    setSubmit(false);
  };

  const toggleType = (t: boolean) => {
    return t ? 'primary' : 'default';
  };

  const processMoss = async (mossURL: string) => {
    // const payload = {
    //   course_name: this.props.currentCourse!['name'],
    //   course_period: this.props.currentCourse!['period'],
    //   assignment_name: assignment['name'],
    //   api_key: '175b9ff8cf47feec6557b74781a8fb9cda79510d',
    // };

    const payload = {
      moss_url: mossURL,
    };
    console.log('++++++', payload, JSON.stringify(payload));
    const res = await fetch('https://i9d9zcmvh9.execute-api.us-east-2.amazonaws.com/default/process-moss', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log('res', res);
    const data = await res.json();

    console.log('data', data);
    console.log('asdf', data['statusCode']);

    if (data['statusCode'] === '200') {
      console.log('ddd', data);
      if (data.hasOwnProperty('errorMessage')) {
        return Promise.reject(data['errorMessage']);
      }
      return JSON.parse(data['body']);
    } else {
      const error = JSON.stringify(data['body']);
      return Promise.reject(error);
    }
  };

  const checkMoss = async () => {
    // const payload = {
    //   course_name: this.props.currentCourse!['name'],
    //   course_period: this.props.currentCourse!['period'],
    //   assignment_name: assignment['name'],
    //   api_key: '175b9ff8cf47feec6557b74781a8fb9cda79510d',
    // };

    const payload = {
      course_name: "richard's course",
      course_period: 'demo',
      assignment_name: 'Hello World',
      api_key: '175b9ff8cf47feec6557b74781a8fb9cda79510d',
    };
    const res = await fetch('https://6yvun70md8.execute-api.us-east-2.amazonaws.com/default/send-to-moss', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log('res', res);
    const data = await res.json();

    console.log('data', data);
    console.log('asdf', data['statusCode']);

    if (data['statusCode'] === '200') {
      console.log('ddd', data);
      if (data.hasOwnProperty('errorMessage')) {
        return Promise.reject(data['errorMessage']);
      }
      return JSON.parse(data['body']);
    } else {
      const error = JSON.stringify(data['body']);
      return Promise.reject(error);
    }
  };

  const onSubmit = async (value: string) => {
    setLoading(true);
    try {
      const data = await checkMoss();
      setUrl(data);
    } catch (err) {
      message.error(err);
    }

    // message.success(data['body']);
    console.log(value);
    setLoading(false);
  };

  const onParse = async (value: string) => {
    setLoading(true);
    try {
      const data = await processMoss(value);
      console.log('dat', data);
    } catch (err) {
      message.error(err);
    }

    // message.success(data['body']);
    console.log(value);
    setLoading(false);
  };

  const title = <div style={{ fontSize: '24px', fontWeight: 500 }}>Moss Plagiarism Detection </div>;
  const help = (
    <div>
      <Icon type="info-circle" />
    </div>
  );

  const toggle = (
    <ButtonGroup>
      <Button type={toggleType(!submit)} onClick={toggleParse}>
        Parse
      </Button>
      <Button type={toggleType(submit)} onClick={toggleSubmit}>
        Submit
      </Button>
    </ButtonGroup>
  );

  console.log('url', url);

  // Should be refactored to use Form once this feature is built out
  const action = submit ? (
    <div style={{ padding: '80px 100px' }}>
      <Search
        key="submit-input"
        placeholder="Programming language"
        enterButton="Go"
        size="large"
        onSearch={onSubmit}
        disabled={loading}
      />
      {loading ? (
        <div style={{ padding: '40px 0px 0px 0px' }}>
          <ProgressBar />
        </div>
      ) : null}
      {url !== null ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <a href={url} target="_blank">
            {url}
          </a>
        </div>
      ) : null}
    </div>
  ) : (
    <div style={{ padding: '80px 100px' }}>
      <Search key="parse-input" placeholder="Moss results URL" enterButton="Go" size="large" onSearch={onParse} />
    </div>
  );

  const actionCard = (
    <Card style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 15px 0px', padding: '10px', margin: '15px', border: '0px' }}>
      <CPFlex left={[title, help]} right={[toggle]} gutterSize={10} />
      {action}
    </Card>
  );

  const resultsCard = results === undefined ? null : <MossResults results={mockResults} />;

  const content = (
    <div>
      <div style={{ marginBottom: '30px' }}>{actionCard}</div>
      <div>{resultsCard}</div>
    </div>
  );

  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item onClick={props.onCancel}>
            <a>Assignments</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{props.assignment.name}</Breadcrumb.Item>
          <Breadcrumb.Item>Moss</Breadcrumb.Item>
        </Breadcrumb>
      }
      goBack={null}
      title={`${props.assignment.name} | Moss`}
      actions={[]}
      content={content}
    />
  );
};

const ProgressBar = (props: any) => {
  const timerTime = 20000; // milliseconds, AWS timeout

  const [counter, setCounter] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCounter((ctr) => {
        return ctr + 1;
      });
    }, timerTime / 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return <Progress percent={counter} showInfo={false} />;
};

export default Moss;

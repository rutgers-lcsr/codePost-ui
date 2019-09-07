/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Button, Card, Icon, Input, message, Progress, Typography } from 'antd';

const { Paragraph } = Typography;

const ButtonGroup = Button.Group;
const { Search } = Input;

import CPFlex from '../../../../components/core/CPFlex';

import CPAdminDetail from '../../other/CPAdminDetail';

import MossResults from './MossResults';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { UserType } from '../../../../infrastructure/user';

/**********************************************************************************************************************/

export interface IProps {
  /* assignment data */
  assignment: AssignmentType;

  user: UserType;

  onCancel: () => void;
}
/**********************************************************************************************************************/

const Moss = (props: any) => {
  const [submit, setSubmit] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [url, setUrl] = React.useState(null);

  // const mockResults = [
  //   {
  //     file1: {
  //       timestamp: '1567581291836253',
  //       course: 'richardscourse',
  //       assignment: 'HelloWorld',
  //       sub_id: '25641',
  //       email: 'student0@codepost.io',
  //       similarity: '98',
  //     },
  //     file2: {
  //       timestamp: '1567581291836253',
  //       course: 'richardscourse',
  //       assignment: 'HelloWorld',
  //       sub_id: '25705',
  //       email: 'student1@codepost.io',
  //       similarity: '98',
  //     },
  //     linesMatched: 84,
  //     matchURL: 'http://moss.stanford.edu/results/783191722/match0.html',
  //   },
  //   {
  //     file1: {
  //       timestamp: '1567581291836254',
  //       course: 'richardscourse',
  //       assignment: 'HelloWorld',
  //       sub_id: '25634',
  //       email: 'student2@codepost.io',
  //       similarity: '90',
  //     },
  //     file2: {
  //       timestamp: '1567581291836253',
  //       course: 'richardscourse',
  //       assignment: 'HelloWorld',
  //       sub_id: '257044',
  //       email: 'student3@codepost.io',
  //       similarity: '90',
  //     },
  //     linesMatched: 77,
  //     matchURL: 'http://moss.stanford.edu/results/783191722/match1.html',
  //   },
  // ];

  const [results, setResults] = React.useState(undefined);

  const toggleSubmit = async () => {
    setSubmit(true);
  };

  const toggleParse = () => {
    setSubmit(false);
  };

  const toggleType = (t: boolean) => {
    return t ? 'primary' : 'default';
  };

  const processMoss = async (mossURL: string) => {
    const payload = {
      moss_url: mossURL,
    };

    const res = await fetch('https://6yvun70md8.execute-api.us-east-2.amazonaws.com/default/process-moss', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res['status'] === 200) {
      return await res.json();
    } else {
      return Promise.reject(await res.json());
    }
  };

  const checkMoss = async (language: string) => {
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
      language,
    };

    const res = await fetch('https://6yvun70md8.execute-api.us-east-2.amazonaws.com/default/send-to-moss', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res['status'] === 200) {
      return await res.json();
    } else {
      return Promise.reject(await res.json());
    }
  };

  const onSubmit = async (value: string) => {
    setLoading(true);
    try {
      const data = await checkMoss(value);
      setUrl(data);
      const mossResults = await processMoss(data);
      setResults(mossResults);
    } catch (err) {
      message.error(err);
    }

    setLoading(false);
  };

  const onParse = async (value: string) => {
    setLoading(true);
    try {
      const data = await processMoss(value);
      setResults(data);
    } catch (err) {
      message.error(err);
    }
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
      <Button type={toggleType(submit)} onClick={toggleSubmit}>
        Submit this assignment
      </Button>
      <Button type={toggleType(!submit)} onClick={toggleParse}>
        Parse link
      </Button>
    </ButtonGroup>
  );

  // Should be refactored to use Form once this feature is built out
  const action = submit ? (
    <div style={{ padding: '80px 100px 40px 100px' }}>
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
          <ProgressBar time={20000} />
        </div>
      ) : null}
      {url !== null ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Paragraph copyable>{url}</Paragraph>
        </div>
      ) : null}
    </div>
  ) : (
    <div style={{ padding: '80px 100px 40px 100px' }}>
      <Search key="parse-input" placeholder="Moss results URL" enterButton="Go" size="large" onSearch={onParse} />
      {loading ? (
        <div style={{ padding: '40px 0px 0px 0px' }}>
          <ProgressBar time={10000} />
        </div>
      ) : null}
    </div>
  );

  const actionCard = (
    <Card style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 15px 0px', padding: '10px', margin: '15px', border: '0px' }}>
      <CPFlex left={[title, help]} right={[toggle]} gutterSize={10} />
      {action}
    </Card>
  );

  const resultsCard = results === undefined ? null : <MossResults results={results} />;

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
  const timerTime = props.time; // milliseconds, AWS timeout

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

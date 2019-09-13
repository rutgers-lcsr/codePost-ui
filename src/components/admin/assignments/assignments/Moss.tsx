/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Button, Card, Icon, Input, message, Progress, Select, Spin, Statistic, Typography } from 'antd';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';
import { SubmissionType } from '../../../../infrastructure/submission';
import { UserType } from '../../../../infrastructure/user';

import invokeAWSLambda from '../../../../components/core/invokeAWSLambda';

import CPFlex from '../../../../components/core/CPFlex';

import CPAdminDetail from '../../other/CPAdminDetail';

import CPTooltip from '../../../core/CPTooltip';

import MossResults from './MossResults';

import { sendSlack } from '../../../core/slack';

import queryString from 'query-string';

const { Option } = Select;

const { Paragraph } = Typography;

const ButtonGroup = Button.Group;
const { Search } = Input;

/**********************************************************************************************************************/

export interface IMossProps {
  /* assignment data */
  assignment: AssignmentType;
  course: CourseType;
  submissions: SubmissionType[];

  user: UserType;

  onCancel: () => void;
  location: any;
}
/**********************************************************************************************************************/

export const MOSS_LANGUAGES = [
  'no specified programming language',
  'c',
  'cc',
  'java',
  'ml',
  'pascal',
  'ada',
  'lisp',
  'scheme',
  'haskell',
  'fortran',
  'ascii',
  'vhdl',
  'perl',
  'matlab',
  'python',
  'mips',
  'prolog',
  'spice',
  'vb',
  'csharp',
  'modula2',
  'a8086',
  'javascript',
  'plsql',
  'verilog',
];

const msToString = (ms: number) => {
  const showWith0 = (value: number) => (value < 10 ? `0${value}` : `${value}`);
  const hours = showWith0(Math.floor((ms / (1000 * 60 * 60)) % 60));
  const minutes = showWith0(Math.floor((ms / (1000 * 60)) % 60));
  const seconds = showWith0(Math.floor((ms / 1000) % 60));
  return `${parseInt(hours) ? `${hours}hr` : ''}${minutes}m ${seconds}s`;
};

const Moss = (props: IMossProps) => {
  const [submit, setSubmit] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [url, setUrl] = React.useState(null);
  const [language, setLanguage] = React.useState('');
  const [mossID, setMossID] = React.useState('');
  const [hanging, setHanging] = React.useState(false);

  const estimate = props.submissions.length * props.submissions.length * 80;
  const submitTime = Math.min(Math.ceil(estimate / 30000) * 30000, 100000);

  let testMode = false;
  const values = queryString.parse(props.location.search);
  if (values.test !== undefined) {
    testMode = true;
  }

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

  const onLanguageChange = (value: string) => {
    if (value === MOSS_LANGUAGES[0]) {
      setLanguage('');
    } else {
      setLanguage(value);
    }
  };

  const onMossIDChange = (e: any) => {
    setMossID(e.currentTarget.value);
  };

  const languageSelectData = MOSS_LANGUAGES.map((lang: string) => {
    return (
      <Option key={lang} value={lang}>
        {lang}
      </Option>
    );
  });

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

  const checkMoss = async () => {
    sendSlack(
      'Moss submission',
      `${testMode ? 'TEST MODE\n' : ''} ${props.course.name} ${props.course.period} | ${props.assignment.name} `,
    );

    const payload = {
      course_id: props.course['id'],
      assignment_id: props.assignment['id'],
      api_key: `JWT ${localStorage.getItem('token')} `,
      language,
      moss_id: mossID,
      email: props.user.email,
      test_mode: testMode,
    };

    const res: any = await invokeAWSLambda({
      accessKey: 'AKIAV22BSJSCXXWUPZUD',
      secretAccessKey: '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',
      arn: 'arn:aws:lambda:us-east-2:401180085381:function:send-to-moss:Production',
      payload,
    });

    if (res === 'DELAY') {
      return Promise.reject("This is taking a while. We'll email you when this is done.");
    } else {
      // Uncaught Lambda Error
      if (res.StatusCode !== 200) {
        return Promise.reject('An unknown error occurred. Please try again or contact team@codepost.io.');
      } else {
        const resPayload = await JSON.parse(res['Payload']);
        // Completed Running Function
        if (resPayload.hasOwnProperty('errorMessage')) {
          const error = resPayload['errorMessage'];
          return Promise.reject(error);
        } else if (resPayload['statusCode'] !== '200') {
          return Promise.reject(resPayload['body']);
        } else {
          return resPayload['body'];
        }
      }
    }
  };

  const showHang = () => {
    setHanging(true);
  };

  const hideHang = () => {
    setHanging(false);
  };

  const onSubmit = async () => {
    if (mossID === '') {
      message.warning('Moss ID cannot be blank. You can get yours at moss.stanford.edu');
    } else {
      setLoading(true);

      const timer = setTimeout(showHang, submitTime);

      try {
        const data = await checkMoss();
        setUrl(data);
        clearTimeout(timer);
        hideHang();
        const mossResults = await processMoss(data);
        setResults(mossResults);
      } catch (err) {
        message.info(JSON.stringify(err));
        clearTimeout(timer);
        hideHang();
      }

      setLoading(false);
    }
  };

  const onParse = async (value: string) => {
    setLoading(true);
    try {
      const data = await processMoss(value);
      setResults(data);
    } catch (err) {
      message.error(JSON.stringify(err));
    }
    setLoading(false);
  };

  const title = <div style={{ fontSize: '24px', fontWeight: 500 }}>Moss Plagiarism Detection </div>;
  const help = (
    <CPTooltip
      infoIcon={true}
      iconStyle={{ cursor: 'pointer' }}
      title={
        <span>
          Want help getting started with Moss? Check out our guide{' '}
          <a
            target="_blank"
            href="https://help.codepost.io/en/articles/3324264-faq-does-codepost-do-plagiarism-detection"
          >
            here
          </a>
          .
        </span>
      }
    />
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

  // Source for email format: http://theory.stanford.edu/~aiken/moss/
  const requestEmail = 'moss@moss.stanford.edu';
  const requestEmailSubject = 'New%20Moss%20Account';
  const requestEmailBody = `registeruser${escape('\r\n')} mail ${props.user.email} `;

  // Should be refactored to use Form once this feature is built out
  const action = submit ? (
    <div style={{ padding: '40px 100px 0px 100px' }}>
      <div>
        <Statistic
          title="# Submissions"
          value={props.submissions.length}
          style={{ display: 'inline-block', marginRight: '60px' }}
        />
        <Statistic title="Estimated Time" value={msToString(submitTime)} style={{ display: 'inline-block' }} />
      </div>
      <div style={{ padding: '10px 0px' }}>
        <Input
          addonBefore="Moss ID Number"
          value={mossID}
          onChange={onMossIDChange}
          style={{ width: '100%' }}
          addonAfter={
            <CPTooltip
              title={
                <span>
                  You can obtain a Moss ID by clicking{' '}
                  <a
                    href={`mailto: ${requestEmail}?subject=${requestEmailSubject}&body=${requestEmailBody} `}
                    style={{ cursor: 'pointer' }}
                  >
                    here
                  </a>{' '}
                  and sending the email as it appears.
                </span>
              }
            >
              <Icon type="question-circle" />
            </CPTooltip>
          }
        />
      </div>
      <div style={{ padding: '10px 0px' }}>
        <Select
          placeholder="Programming Language (Moss supported)"
          disabled={loading}
          onChange={onLanguageChange}
          style={{ width: '100%' }}
        >
          {languageSelectData}
        </Select>
      </div>
      <div style={{ padding: '10px 0px', textAlign: 'center' }}>
        <Button type="primary" disabled={loading || props.submissions.length === 0} onClick={onSubmit}>
          Go
        </Button>
      </div>
      {loading ? (
        <div style={{ padding: '40px 0px 0px 0px', textAlign: 'center' }}>
          <ProgressBar time={submitTime} />
          <Paragraph>We'll also send you an email when this is done...</Paragraph>
        </div>
      ) : null}
      {hanging ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Paragraph>
            Hang tight, this is taking longer than expected... <Spin size="small" />
          </Paragraph>
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
      {testMode ? <div style={{ fontSize: '40px', fontWeight: 600, textAlign: 'center' }}>TEST MODE</div> : null}
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

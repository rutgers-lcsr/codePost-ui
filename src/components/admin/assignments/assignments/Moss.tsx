/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Button, Divider, Icon, Input, message, Progress, Select, Spin, Statistic, Typography } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';
import { SubmissionType } from '../../../../infrastructure/submission';
import { UserType } from '../../../../infrastructure/user';

import invokeAWSLambda from '../../../../components/core/invokeAWSLambda';

import CPAdminDetail from '../../other/CPAdminDetail';

import CPTooltip from '../../../core/CPTooltip';

import MossResults from './MossResults';

import { sendSlack } from '../../../core/slack';

import queryString from 'query-string';

import { encodeForLink } from '../../../core/URLutils';

import { trackFeature } from '../../../../components/utils/Fullstory';

const { Option } = Select;

const { Paragraph } = Typography;

const ButtonGroup = Button.Group;
const { Search, TextArea } = Input;

/**********************************************************************************************************************/

export interface IMossProps {
  /* assignment data */
  assignment?: AssignmentType;
  assignments: AssignmentType[];

  course: CourseType;
  submissions: SubmissionType[];

  user: UserType;

  breadcrumbs?: React.ReactElement[];
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

const Moss = (props: IMossProps & RouteComponentProps) => {
  const [submit, setSubmit] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [url, setUrl] = React.useState(null);
  const [language, setLanguage] = React.useState('');
  const [mossID, setMossID] = React.useState('');
  const [excludedFiles, setExcludedFiles] = React.useState('');

  let testMode = false;
  const values = queryString.parse(props.location.search);
  if (values.test !== undefined) {
    testMode = true;
  }

  React.useEffect(() => {
    trackFeature('Moss', {});
  }, []);

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
    if (props.assignment) {
      sendSlack(
        'Moss submission',
        `${testMode ? 'TEST MODE\n' : ''} ${props.course.name} ${props.course.period} | ${props.assignment.name} `,
      );

      const payload = {
        // course_id: props.course['id'],
        course_id: 899,
        // assignment_id: props.assignment['id'],
        assignment_id: 3903,
        api_key: `JWT ${localStorage.getItem('token')} `,
        language,
        moss_id: mossID,
        email: props.user.email,
        test_mode: testMode,
        excluded_files: excludedFiles,
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
    }
  };

  const loadingBar = () => {};

  const onSubmit = async () => {
    if (mossID === '') {
      message.warning('Moss ID cannot be blank. You can get yours at moss.stanford.edu');
    } else {
      loadingBar();

      setLoading(true);

      setTimeout(() => {
        setLoading(false);
        try {
          checkMoss();
          message.success('Submitted! Please check your email in a few minutes.');
        } catch (err) {
          message.info(JSON.stringify(err));
        }
      }, 2800);
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

  const onChangeExcludedFiles = (e: any) => {
    setExcludedFiles(e.target.value);
  };

  const help = (
    <CPTooltip
      infoIcon={true}
      iconStyle={{ cursor: 'pointer' }}
      title={
        <span>
          Want help getting started with Moss? Check out our guide{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
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

  const changeAssignment = (assignment: string) => {
    props.history.push(
      `/admin/${encodeForLink(props.course.name)}/${encodeForLink(
        props.course.period,
      )}/assignments/plagiarism/${encodeForLink(assignment)}`,
    );
  };

  const excludedFilesPlaceholder = 'Excluded file names (line separated)';

  // Should be refactored to use Form once this feature is built out
  const action = submit ? (
    <div style={{ padding: '40px 100px 0px 100px' }}>
      <div>
        <Typography.Title level={3}>Select an assignment</Typography.Title>
        <Select
          placeholder="Select an assignment"
          defaultValue={props.assignment ? props.assignment.name : undefined}
          disabled={loading}
          style={{ width: '350px' }}
          onChange={changeAssignment}
        >
          {props.assignments.map((assignment) => (
            <Option key={assignment.id} value={assignment.name}>
              {assignment.name}
            </Option>
          ))}
        </Select>
        <div style={{ padding: '10px 0px' }}>
          <Input
            addonBefore="Moss ID Number"
            value={mossID}
            onChange={onMossIDChange}
            style={{ width: '350px' }}
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
        <TextArea
          placeholder={excludedFilesPlaceholder}
          style={{ width: '350px' }}
          autoSize
          value={excludedFiles}
          onChange={onChangeExcludedFiles}
        />
        <Divider />
        <Statistic
          title="# Submissions"
          value={props.assignment ? props.submissions.length : '--'}
          style={{ display: 'inline-block', marginRight: '60px' }}
        />
      </div>
      <div style={{ padding: '10px 0px' }}>
        <Select
          placeholder="Programming Language (Moss supported)"
          disabled={loading || !props.assignment}
          onChange={onLanguageChange}
          style={{ width: '350px' }}
        >
          {languageSelectData}
        </Select>
      </div>
      <div style={{ padding: '10px 0px', textAlign: 'center' }}>
        <Button
          type="primary"
          disabled={loading || props.submissions.length === 0 || !props.assignment}
          onClick={onSubmit}
        >
          Submit
        </Button>
      </div>
      {loading ? (
        <div style={{ padding: '40px 0px 0px 0px', textAlign: 'center' }}>
          <ProgressBar time={2400} />
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
          <ProgressBar time={1000} />
        </div>
      ) : null}
    </div>
  );

  const resultsCard = results === undefined ? null : <MossResults results={results} />;

  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          {props.breadcrumbs}
          <Breadcrumb.Item>Plagiarism Detection</Breadcrumb.Item>
          {props.assignment ? <Breadcrumb.Item>{props.assignment.name}</Breadcrumb.Item> : null}
        </Breadcrumb>
      }
      goBack={null}
      title={<span>Plagiarism Detection &nbsp; {help}</span>}
      actions={[toggle]}
      content={
        <div>
          {action}
          {resultsCard}
        </div>
      }
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
    // Should implement useCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Progress percent={counter} showInfo={false} />;
};

export default Moss;

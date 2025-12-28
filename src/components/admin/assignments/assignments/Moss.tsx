/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */

import { QuestionCircleOutlined } from '@ant-design/icons';

/* ant imports */
import {
  Breadcrumb,
  Button,
  Checkbox,
  Divider,
  Input,
  message,
  Progress,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';

/* other library imports */
import { useLocation, useNavigate } from 'react-router-dom';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';
import { FileTemplate, FileTemplateType } from '../../../../infrastructure/fileTemplate';
import { SubmissionInfoType } from '../../../../infrastructure/submission';
import { UserType } from '../../../../infrastructure/user';

import FileExploror from '../../../../components/core/FileExplorer';
import invokeAWSLambda from '../../../../components/core/invokeAWSLambda';

import CPAdminDetail from '../../other/CPAdminDetail';

import CPTooltip from '../../../core/CPTooltip';

import MossResults, { IMossResult } from './MossResults';

import { sendSlack } from '../../../core/slack';

import queryString from 'query-string';

import { encodeForLink } from '../../../core/URLutils';

import { ChangeEvent, ReactNode, useEffect, useState } from 'react';
import { trackFeature } from '../../../../components/utils/Fullstory';

const { Option } = Select;

const { TextArea } = Input;

/**********************************************************************************************************************/

export interface IMossProps {
  /* assignment data */
  assignment?: AssignmentType;
  assignments: AssignmentType[];

  course: CourseType;
  submissions: SubmissionInfoType[];

  user: UserType;

  breadcrumbs?: Array<{ title: ReactNode }>;
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

const Moss = (props: IMossProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  return false;
  const [submit, setSubmit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [urlID, setUrlID] = useState('');
  const [language, setLanguage] = useState('');
  const [mossID, setMossID] = useState('');
  const [excludedFiles, setExcludedFiles] = useState('');

  const [fileTemplates, setFileTemplates] = useState<FileTemplateType[]>([]);
  const [includeFileTemplates, setIncludeFileTemplates] = useState(false);
  const [fileExplorerVisible, setFileExplorerVisible] = useState(false);

  let testMode = false;
  const values = queryString.parse(location.search);
  if (values.test !== undefined) {
    testMode = true;
  }

  useEffect(() => {
    const fetch = async () => {
      if (props.assignment !== undefined) {
        const ret = await Promise.all(
          (props.assignment.fileTemplates ?? []).map(async (id: number) => {
            return await FileTemplate.read(id);
          }),
        );
        setFileTemplates(ret);
        if (ret.length > 0) {
          setIncludeFileTemplates(true);
        }
      }
    };

    fetch();
  }, [props.assignment]);

  useEffect(() => {
    const values = queryString.parse(location.search);
    if (values.resultsid !== undefined && typeof values.resultsid === 'string') {
      const formattedUrlID = values.resultsid.replace('%2F', '/');
      setUrlID(formattedUrlID);
      setSubmit(false);

      onParse(formattedUrlID);
    }
  }, []);

  useEffect(() => {
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

  const [results, setResults] = useState<IMossResult[] | undefined>(undefined);

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

  const onChangeMossID = (e: any) => {
    setMossID(e.currentTarget.value);
  };

  const onChangeUrlID = (e: any) => {
    setUrlID(e.currentTarget.value);
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
        '#f5e51b',
        '#user_notifications_moss',
        props.course.id,
      );

      const payload = {
        course_id: props.course['id'],
        assignment_id: props.assignment['id'],
        api_key: `Bearer ${localStorage.getItem('token')} `,
        language,
        moss_id: mossID,
        email: props.user.email,
        test_mode: testMode,
        excluded_files: excludedFiles,
        include_file_templates: includeFileTemplates,
        from_url: window.location.href.split('?')[0],
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
          if (Object.prototype.hasOwnProperty.call(resPayload, 'errorMessage')) {
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

  const onSubmit = async () => {
    if (mossID === '') {
      message.warning('Moss ID cannot be blank. You can get yours at moss.stanford.edu');
    } else {
      setLoading(true);

      setTimeout(async () => {
        try {
          const resp = await checkMoss();
          message.success(resp, 6);
        } catch (err) {
          message.info(JSON.stringify(err));
        }

        setLoading(false);
      }, 800);
    }
  };

  const onParse = async (overrideID?: string) => {
    const url = `http://moss.stanford.edu/results/${overrideID !== undefined ? overrideID : urlID}`;

    setLoading(true);
    try {
      const data = await processMoss(url);
      setResults(data);
    } catch (err) {
      message.error(JSON.stringify(err));
    }
    setLoading(false);
  };

  const onChangeExcludedFiles = (e: ChangeEvent<HTMLTextAreaElement>) => {
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
    <Space.Compact>
      <Button type={toggleType(submit)} onClick={toggleSubmit}>
        Submit this assignment
      </Button>
      <Button type={toggleType(!submit)} onClick={toggleParse}>
        Parse link
      </Button>
    </Space.Compact>
  );

  // Source for email format: http://theory.stanford.edu/~aiken/moss/
  const requestEmail = 'moss@moss.stanford.edu';
  const requestEmailSubject = 'New%20Moss%20Account';
  const requestEmailBody = `registeruser${escape('\r\n')} mail ${props.user.email} `;

  const changeAssignment = (assignment: string) => {
    navigate(
      `/admin/${encodeForLink(props.course.name)}/${encodeForLink(
        props.course.period,
      )}/assignments/plagiarism/${encodeForLink(assignment)}`,
    );
  };

  const excludedFilesPlaceholder = 'Excluded file names (line separated)';

  const parseButton = loading ? (
    <Spin size="small" />
  ) : (
    <div onClick={() => onParse()} style={{ cursor: 'pointer', fontWeight: 600 }}>
      Go ➜
    </div>
  );

  const onChangeFileTemplateCheckbox = (e: any) => {
    setIncludeFileTemplates(e.target.checked);
  };

  const fileTemplateTooltip =
    fileTemplates.length === 0
      ? "You don't have any File Templates defined for this assignment. Add them from your assignment settings."
      : null;

  const toggleFileExplorerVisible = () => {
    setFileExplorerVisible(!fileExplorerVisible);
  };

  const fileTemplatesCheckbox = (
    <div style={{ padding: '10px 0px' }}>
      <span>
        <Tooltip title={fileTemplateTooltip}>
          <Checkbox
            checked={includeFileTemplates}
            disabled={fileTemplates.length === 0}
            onChange={onChangeFileTemplateCheckbox}
          >
            Omit file template code from detection
          </Checkbox>
        </Tooltip>
      </span>
      <Tooltip
        title={'If checked, submission code that also appears in a file template will not be counted in matches.'}
      >
        <QuestionCircleOutlined style={{ cursor: 'pointer' }} />
      </Tooltip>
      {fileTemplates.length > 0 && (
        <span>
          <Tag style={{ cursor: 'pointer', marginLeft: '7px' }} onClick={toggleFileExplorerVisible}>
            View file templates
          </Tag>
        </span>
      )}
    </div>
  );

  // Should be refactored to use Form once this feature is built out
  const action = submit ? (
    <div style={{ padding: '40px 100px 0px 100px' }}>
      <FileExploror visible={fileExplorerVisible} toggleVisible={toggleFileExplorerVisible} files={fileTemplates} />
      <div>
        <Typography.Title level={3}>Select an assignment</Typography.Title>
        <Select
          placeholder="Select an assignment"
          defaultValue={props.assignment?.name}
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
            onChange={onChangeMossID}
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
                <QuestionCircleOutlined />
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
        {props.assignment && fileTemplatesCheckbox}
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
    </div>
  ) : (
    <div style={{ padding: '80px 100px 40px 100px' }}>
      <Input
        key="parse-input"
        addonBefore="http://moss.stanford.edu/results/"
        addonAfter={parseButton}
        value={urlID}
        placeholder="Moss results ID"
        onChange={onChangeUrlID}
        size="large"
      />
      {loading ? (
        <div style={{ padding: '40px 0px 0px 0px' }}>
          <ProgressBar time={1000} />
        </div>
      ) : null}
    </div>
  );

  let resultsCard: ReactNode = null;
  if (Array.isArray(results)) {
    const safeResults = results as IMossResult[];
    if (safeResults.length > 0) {
      resultsCard = <MossResults results={safeResults} />;
    }
  }

  const breadcrumbItems = [...(props.breadcrumbs || []), { title: 'Plagiarism Detection' }];
  const assignmentName = props.assignment?.name;
  if (assignmentName) {
    breadcrumbItems.push({ title: assignmentName });
  }

  return (
    <CPAdminDetail
      breadcrumbs={<Breadcrumb items={breadcrumbItems} />}
      goBack={null}
      title={<span>Plagiarism Detection &nbsp; {help}</span>}
      actions={[toggle]}
      content={
        <div id="moss">
          {action}
          {resultsCard}
        </div>
      }
    />
  );
};

const ProgressBar = (props: any) => {
  const timerTime = props.time; // milliseconds, AWS timeout

  const [counter, setCounter] = useState(0);

  useEffect(() => {
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

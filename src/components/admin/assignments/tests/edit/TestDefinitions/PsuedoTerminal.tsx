/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports  */
import React from 'react';

/* antd imports  */
import { Button, Tag, Select } from 'antd';

/* other library imports */
import { animateScroll } from 'react-scroll';

/* codePost imports  */
import { SubmissionType } from '../../../../../../infrastructure/submission';

/**********************************************************************************************************************/

export enum RESULT_TYPE {
  PASSED,
  FAILED,
  ERROR,
  NONE,
}

export interface ILogType {
  log: string;
  result: RESULT_TYPE;
  target: string;
  testCaseName: string;
}

interface IResultProps {
  log?: ILogType | ILogType[];
  isRunning?: boolean;
  runTest?: () => void;
  submissions: SubmissionType[];
  files?: string[];
  defaultFile?: string;
  setTestSubject: (id: string) => void;
  updateFile?: (file: string) => void;
}

const getResultSpan = (resultType: RESULT_TYPE) => {
  switch (resultType) {
    case RESULT_TYPE.PASSED:
      return <span style={{ color: 'green' }}>PASSED</span>;
    case RESULT_TYPE.FAILED:
      return <span style={{ color: 'red' }}>FAILED</span>;
    case RESULT_TYPE.ERROR:
      return <span style={{ color: 'blue' }}>ERROR</span>;
  }
};

const getResultTag = (results: RESULT_TYPE[]) => {
  if (results.length === 0) {
    return <span />;
  }

  const allPassed = results.every((el) => el === RESULT_TYPE.PASSED || el === RESULT_TYPE.NONE);
  const noErrors = results.every((el) => el !== RESULT_TYPE.ERROR);
  if (allPassed) {
    return <Tag color="green">PASSED</Tag>;
  } else if (noErrors) {
    return <Tag color="volcano">FAILED</Tag>;
  } else {
    return <Tag color="geekblue">ERROR</Tag>;
  }
};

export const PsuedoTerminal = (props: IResultProps) => {
  const [logs, setLogs] = React.useState([] as ILogType[][]);

  React.useEffect(() => {
    if (props.log !== undefined) {
      if (Array.isArray(props.log)) {
        if (props.log.length > 0) {
          setLogs([...logs, props.log]);
        }
      } else {
        if (logs.length > 0 && logs[logs.length - 1][0] === props.log) {
          return;
        }
        setLogs([...logs, [props.log]]);
      }
    }
  }, [props.log]);

  /* build pseudo-terminal */
  const scrollToBottom = () => {
    animateScroll.scrollToBottom({
      containerId: 'pseudoterminal',
      animate: false,
    });
  };

  React.useEffect(scrollToBottom, [logs]);

  let resultTag;
  if (props.log) {
    if (Array.isArray(props.log)) {
      resultTag = getResultTag(props.log.map((el) => el.result));
    } else {
      resultTag = getResultTag([props.log.result]);
    }
  }

  const logElem = (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: '35px',
          background: '#6b6b6b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ marginRight: '5px' }}>
          {props.files && props.files.length > 0 ? (
            <Select
              style={{ height: '25px', minWidth: '200px', fontSize: '12px' }}
              size="small"
              showSearch
              defaultValue={props.defaultFile || undefined}
              onChange={props.updateFile || undefined}
            >
              <Select.Option key="main.sh" value="main.sh">
                main.sh
              </Select.Option>
              {props.files.map((file, i) => (
                <Select.Option key={i} value={file}>
                  {file}
                </Select.Option>
              ))}
            </Select>
          ) : null}
          &nbsp; &nbsp;
          <Select
            onChange={props.setTestSubject}
            style={{ height: '25px', minWidth: '200px', fontSize: '12px' }}
            size="small"
            showSearch
            defaultValue="0"
            filterOption={(input, option: any) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
          >
            {props.submissions.map((sub, i) => (
              <Select.Option key={i} value={sub.id}>
                {sub.students[0]}
              </Select.Option>
            ))}
            <Select.Option key="0" value="0">
              Solution code
            </Select.Option>
          </Select>
        </div>
        <div style={{ marginRight: '5px' }}>{resultTag}</div>
        {props.runTest ? (
          <Button
            onClick={props.runTest}
            loading={props.isRunning}
            style={{ background: 'gray', height: '25px', marginTop: '2px', marginRight: '10px' }}
          >
            Run
          </Button>
        ) : (
          undefined
        )}
      </div>
      <div
        id="pseudoterminal"
        style={{
          height: 200,
          background: 'black',
          width: '100%',
          padding: '15px 5px 5px 15px',
          color: 'white',
          overflowY: 'scroll',
          fontSize: '13px',
        }}
      >
        {logs.map((logList, i) => (
          <span key={i}>
            Running...
            <br />
            {logList.length > 1 ? (
              logList.map((log) => (
                <span>
                  {log.testCaseName.length > 0 ? (
                    <span>
                      ################################################### <br />
                      Logs: {log.testCaseName}
                    </span>
                  ) : null}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{log.log}</div>
                  {log.testCaseName.length > 0 ? (
                    <span>
                      {getResultSpan(log.result)} on {log.target} <br />
                    </span>
                  ) : null}
                  <br />
                </span>
              ))
            ) : (
              <div>
                {' '}
                <div style={{ whiteSpace: 'pre-wrap' }}>{logList[0].log}</div>
                {logList[0].testCaseName.length > 0 ? (
                  <span>
                    {getResultSpan(logList[0].result)} on {logList[0].target} <br />
                  </span>
                ) : null}
              </div>
            )}
          </span>
        ))}
        {props.isRunning ? 'Running...' : null}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 4,
        margin: 5,
      }}
    >
      {logElem}
    </div>
  );
};

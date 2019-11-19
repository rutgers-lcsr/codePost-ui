/* react imports  */
import React from 'react';

/* library imports  */
import { Button, Tag, Select } from 'antd';

import { animateScroll } from 'react-scroll';

/* codePost imports  */
import { SubmissionType } from '../../../../../../infrastructure/submission';

export enum RESULT_TYPE {
  PASSED,
  FAILED,
  ERROR,
}

export interface ILogType {
  log: string;
  result: RESULT_TYPE;
  target: string;
}

interface IResultProps {
  log?: ILogType;
  isRunning?: boolean;
  runTest?: () => void;
  submissions: SubmissionType[];
  setTestSubject: (id: string) => void;
}

const getResultTag = (resultType: RESULT_TYPE) => {
  switch (resultType) {
    case RESULT_TYPE.PASSED:
      return <span style={{ color: 'green' }}>PASSED</span>;
    case RESULT_TYPE.FAILED:
      return <span style={{ color: 'red' }}>FAILED</span>;
    case RESULT_TYPE.ERROR:
      return <span style={{ color: 'blue' }}>ERROR</span>;
  }
};

export const PsuedoTerminal = (props: IResultProps) => {
  const [logs, setLogs] = React.useState([] as ILogType[]);

  React.useEffect(() => {
    if (props.log !== undefined) {
      setLogs([...logs, props.log]);
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

  let resultType;
  if (props.log) {
    resultType = props.log.result;
  }

  let resultTag;
  switch (resultType) {
    case RESULT_TYPE.PASSED:
      resultTag = <Tag color="green">PASSED</Tag>;
      break;
    case RESULT_TYPE.FAILED:
      resultTag = <Tag color="volcano">FAILED</Tag>;
      break;
    case RESULT_TYPE.ERROR:
      resultTag = <Tag color="geekblue">ERROR</Tag>;
      break;
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
        {logs.map((log, i) => (
          <span key={i}>
            Running...
            <br />
            <div style={{ whiteSpace: 'pre-wrap' }}>{log.log}</div>
            {log.log.length > 0 ? <br /> : null}
            {getResultTag(log.result)} on {log.target}
            <br />
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

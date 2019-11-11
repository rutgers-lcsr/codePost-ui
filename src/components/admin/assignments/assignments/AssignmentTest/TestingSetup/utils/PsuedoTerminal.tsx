/* react imports  */
import React from 'react';

/* library imports  */
import { Icon, Popover, Button, Tag, Select, Divider } from 'antd';

import { animateScroll } from 'react-scroll';

/* codePost other imports  */
import { CodeWindow } from './CodeWindow';

import { SubmissionType } from '../../../../../../../infrastructure/submission';

enum RESULT_TYPE {
  PASSED,
  FAILED,
  ERROR,
}

interface ILogType {
  log: string;
  result: RESULT_TYPE;
}

interface IResultProps {
  passed: boolean | null;
  log: string | null;
  isError: boolean;
  isRunning?: boolean;
  runTest?: () => void;
  submissions: SubmissionType[];
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
  const [selectedSubmission, setSelectedSubmission] = React.useState('Solution code');

  React.useEffect(() => {
    // FIXME: replace this convoluted calculation with a prop of type RESULT_TYPE
    let resultType;
    if (props.passed) {
      resultType = RESULT_TYPE.PASSED;
    } else if (props.isError) {
      resultType = RESULT_TYPE.ERROR;
    } else if (props.passed === false) {
      resultType = RESULT_TYPE.FAILED;
    }

    if (props.log !== null && resultType !== undefined) {
      setLogs([...logs, { log: props.log, result: resultType }]);
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
  if (props.passed) {
    resultType = RESULT_TYPE.PASSED;
  } else if (props.isError) {
    resultType = RESULT_TYPE.ERROR;
  } else if (props.passed === false) {
    resultType = RESULT_TYPE.FAILED;
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
            value={selectedSubmission}
            onChange={setSelectedSubmission}
            style={{ height: '25px', minWidth: '200px', fontSize: '12px' }}
            size="small"
            showSearch
            filterOption={(input, option: any) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            dropdownRender={(menu) => (
              <div>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                <div
                  style={{ padding: '4px 8px', cursor: 'pointer' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedSubmission('Solution code');
                  }}
                >
                  <Icon type="solution" /> Use solution code
                </div>
              </div>
            )}
          >
            {props.submissions.map((sub, i) => (
              <Select.Option key={i} value={i}>
                {sub.students[0]}
              </Select.Option>
            ))}
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
            Running....
            <br />
            {log.log}
            {log.log.length > 0 ? <br /> : null}
            {getResultTag(log.result)}
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

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable react-refresh/only-export-components */
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports  */
import React from 'react';

import { CopyOutlined, DeleteOutlined, FontColorsOutlined, LoadingOutlined } from '@ant-design/icons';

/* antd imports  */
import { Tag, Select, Tooltip } from 'antd';

/* other library imports */
import { Resizable } from 're-resizable';

/* codePost imports  */
import { EnvironmentType, SubmissionInfoType } from '../../../../../../types/models';
import { colors } from '../../../../../../theme/colors';
import CPFlex from '../../../../../core/CPFlex';
import { copyTextToClipboard } from '../../../../../utils/Browser';

import locale from '../utils/languageLocale';

/**********************************************************************************************************************/

export enum RESULT_TYPE {
  PASSED,
  FAILED,
  ERROR,
  NONE,
}

export interface ILogType {
  log: string | React.ReactElement;
  result: RESULT_TYPE;
  target: string;
  testCaseName: string;
}

interface IResultProps {
  log?: ILogType | ILogType[];
  isRunning?: boolean;
  runTest?: () => void;
  submissions: SubmissionInfoType[];
  files?: string[];
  defaultFile?: string;
  setTestSubject: (id: string) => void;
  updateFile?: (file: string) => void;
  overrideText?: string;
  env?: EnvironmentType;
  activeSubmission?: SubmissionInfoType;
  resizable: boolean;
  testSelectComponent?: React.ReactNode;
}

const getResultSpan = (resultType: RESULT_TYPE) => {
  switch (resultType) {
    case RESULT_TYPE.PASSED:
      return <span style={{ color: colors.brandPrimary, fontWeight: 600, fontSize: 16 }}>PASSED</span>;
    case RESULT_TYPE.FAILED:
      return <span style={{ color: colors.actionRed, fontWeight: 600, fontSize: 16 }}>FAILED</span>;
    case RESULT_TYPE.ERROR:
      return <span style={{ color: colors.actionYellow, fontWeight: 600, fontSize: 16 }}>ERROR</span>;
  }
};

const getResultTag = (results: RESULT_TYPE[]) => {
  if (results.length === 0) {
    return <span />;
  }

  const allPassed = results.every((el) => el === RESULT_TYPE.PASSED || el === RESULT_TYPE.NONE);
  const noErrors = results.every((el) => el !== RESULT_TYPE.ERROR);
  if (allPassed) {
    return <Tag color={colors.brandPrimary}>PASSED</Tag>;
  } else if (noErrors) {
    return <Tag color={colors.actionRed}>FAILED</Tag>;
  } else {
    return <Tag color={colors.actionYellow}>ERROR</Tag>;
  }
};

export const PseudoTerminal = (props: IResultProps) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.log]);

  /* build pseudo-terminal */
  const scrollToBottom = () => {
    const element = document.getElementById('pseudoterminal-body');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  };

  React.useEffect(scrollToBottom, [logs, props.isRunning]);

  let resultTag;
  if (props.log) {
    if (Array.isArray(props.log)) {
      resultTag = getResultTag(props.log.map((el) => el.result));
    } else {
      resultTag = getResultTag([props.log.result]);
    }
  }

  const lookupValue =
    props.env === undefined
      ? 'undefined'
      : props.env.buildType === 'default'
        ? props.env.language
        : props.env.buildType;
  const envSpecText: React.ReactNode =
    lookupValue && locale[lookupValue] !== undefined ? locale[lookupValue].pseudoterminal : null;

  const logElem = (
    <div
      id="pseudoterminal"
      style={{
        height: '100%',
        width: '100%',
        padding: '8px 5px 5px 15px',
        color: 'white',
        fontSize: '13px',
      }}
    >
      <div style={{ paddingBottom: '6px', color: '#A9A9A9' }}>{envSpecText}</div>
      {logs.map((logList, i) => (
        <span key={i}>
          <span style={{ color: '#A9A9A9' }}>
            ___________________________________________________________________________
            <br />
            Running...
          </span>
          <br />
          <br />
          {logList.length > 1 ? (
            logList.map((log) => (
              <span>
                {log.testCaseName.length > 0 ? (
                  <span style={{ color: '#A9A9A9' }}>
                    ################################################### <br />
                    Result: {log.testCaseName}
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
      {props.isRunning ? (
        <div>
          <span style={{ color: '#A9A9A9' }}>
            ___________________________________________________________________________
            <br />
            Running...
          </span>
        </div>
      ) : null}
    </div>
  );

  const clearCommand = () => {
    setLogs([]);
  };

  const copyCommand = () => {
    copyTextToClipboard(JSON.stringify(logs));
  };

  const selectFile =
    props.files && props.files.length > 0 ? (
      <Select
        style={{ height: '24px', minWidth: '180px', fontSize: '12px', marginRight: '5px' }}
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
    ) : null;

  const selectTarget =
    props.testSelectComponent !== undefined ? (
      props.testSelectComponent
    ) : (
      <Select
        onChange={props.setTestSubject}
        style={{ height: '24px', minWidth: '180px', fontSize: '12px' }}
        size="small"
        showSearch
        defaultValue={props.activeSubmission !== undefined ? props.activeSubmission.id.toString() : '0'}
        filterOption={(input, option) =>
          String(option?.label ?? '')
            .toLowerCase()
            .indexOf(input.toLowerCase()) >= 0
        }
      >
        {props.submissions.map((sub, i) => (
          <Select.Option key={i} value={sub.id.toString()}>
            {sub.students[0]}
          </Select.Option>
        ))}
        <Select.Option key="0" value="0">
          Solution code
        </Select.Option>
      </Select>
    );

  const runButton = props.runTest ? (
    <div
      className="pseudo-terminal__run pseudo-terminal--button"
      onClick={props.isRunning ? undefined : props.runTest}
      style={{ cursor: props.isRunning ? 'not-allowed' : 'pointer' }}
    >
      {props.isRunning ? (
        <div>
          <LoadingOutlined />
        </div>
      ) : null}
      <div style={{ fontSize: '16px', transform: 'translateY(2px)' }}>{props.overrideText || 'Run'}</div>
    </div>
  ) : null;

  const clear = (
    <div
      onClick={clearCommand}
      style={{
        padding: '0px 12px',
        cursor: 'pointer',
      }}
      className="pseudo-terminal--button"
    >
      <Tooltip title="clear">
        <DeleteOutlined />
      </Tooltip>
    </div>
  );

  const copy = (
    <div
      onClick={copyCommand}
      style={{
        padding: '0px 12px',
        cursor: 'pointer',
      }}
      className="pseudo-terminal--button"
    >
      <Tooltip title="copy">
        <CopyOutlined />
      </Tooltip>
    </div>
  );

  const colorInfo = (
    <Tooltip
      title={
        <div style={{ padding: 5 }}>
          <div style={{ fontWeight: 600, color: colors.brandPrimary, marginBottom: 5 }}>Color Key:</div>
          <div style={{ color: 'white', marginBottom: 3 }}>[White] Test logs (shown to student)</div>
          <div style={{ color: '#678CAB', marginBottom: 3 }}>
            [Blue] Outputs (only shown to student if "dump outputs" setting is turned on)
          </div>
          <div style={{ color: '#A9A9A9' }}>[Grey] System info (never shown to student)</div>
        </div>
      }
      overlayStyle={{ minWidth: 300, backgroundColor: 'rgba(25,25,25,1)' }}
    >
      <FontColorsOutlined
        style={{
          padding: '4px 12px',
          color: 'grey',
          fontSize: 14,
        }}
      />
    </Tooltip>
  );

  const header = (
    <CPFlex
      style={{
        backgroundColor: 'rgb( 34, 34,34)',
        width: '100%',
        height: '32px',
        color: 'rgb(36, 190, 133)',
        borderBottom: '1px solid rgb(101,101,101)',
        overflowX: 'auto',
      }}
      left={[clear, copy, colorInfo]}
      right={[selectFile, selectTarget, resultTag, runButton]}
      gutterSize={5}
    />
  );

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'black' }}>
      <div>{header}</div>
      <div id="pseudoterminal-body" style={{ flexGrow: 1, overflow: 'auto' }}>
        {logElem}
      </div>
    </div>
  );

  if (props.resizable) {
    return (
      <div className="pseudo-terminal">
        <Resizable
          defaultSize={{
            height: 350,
            width: '100%',
          }}
          minHeight={180}
          style={{ marginBottom: '10px' }}
          enable={{
            top: false,
            right: false,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
        >
          {content}
        </Resizable>
      </div>
    );
  } else {
    return (
      <div className="pseudo-terminal" style={{ height: '100%' }}>
        {content}
      </div>
    );
  }
};

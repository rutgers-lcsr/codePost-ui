/* react imports  */
import React from 'react';

/* library imports  */
import { Icon, Popover } from 'antd';

/* codePost other imports  */
import { CodeWindow } from './CodeWindow';

interface IResultProps {
  passed: boolean | null;
  log: string | null;
  isError: boolean;
  minimalMode?: boolean;
  iconMode?: boolean;
}

export const TestResult = (props: IResultProps) => {
  // ************************** Return utils  ******************************

  const color = props.passed ? '#24be85' : props.isError ? 'red' : 'orange';
  const iconStyle = { color: color, fontSize: 16 };
  const icon = props.passed ? (
    <Icon style={iconStyle} type="check-circle" />
  ) : props.isError ? (
    <Icon style={iconStyle} type="exclamation-circle" />
  ) : (
    <Icon style={iconStyle} type="close-circle" />
  );
  const text = props.passed ? 'Passed' : props.isError ? 'Error' : 'Failed';

  const passElem = (
    <div style={{ color: color, fontSize: 20 }}>
      {icon} {text}
    </div>
  );

  const logElem = props.log && (
    <div style={{ maxHeight: 300 }}>
      <CodeWindow code={props.log} name={'.txt'} theme="dark" />
    </div>
  );

  // ************************** Return   ******************************
  if (props.iconMode) {
    return (
      <Popover
        content={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {passElem}
            {logElem}
          </div>
        }
        placement="left"
      >
        <div>{icon}</div>
      </Popover>
    );
  }

  if (props.minimalMode) {
    return (
      <Popover content={text}>
        <div>{passElem}</div>
      </Popover>
    );
  }

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
      {passElem}
      {!props.minimalMode && logElem}
    </div>
  );
};

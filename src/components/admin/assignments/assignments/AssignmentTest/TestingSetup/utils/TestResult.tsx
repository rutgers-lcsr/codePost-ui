import React from 'react';
import { Icon, Input, Popover } from 'antd';

interface IResultProps {
  passed: boolean | null;
  log: string | null;
  minimalMode?: boolean;
  iconMode?: boolean;
}

export const TestResult = (props: IResultProps) => {
  const color = props.passed ? '#24be85' : 'red';
  const icon = props.passed ? (
    <Icon style={{ color: color, fontSize: 16 }} type="check-circle" />
  ) : (
    <Icon style={{ color: 'red', fontSize: 16 }} type="exclamation-circle" />
  );
  const text = props.passed ? 'Passed' : 'Failed';

  const passElem = (
    <div style={{ color: color, fontSize: 20 }}>
      {icon} {text}
    </div>
  );

  const logElem = props.log !== null && <Input.TextArea value={props.log} autosize={{ minRows: 4, maxRows: 8 }} />;

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

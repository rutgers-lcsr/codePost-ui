import React from 'react';
import { Icon, Input, Popover } from 'antd';

interface IResultProps {
  passed: boolean | null;
  log: string | null;
  minimalMode?: boolean;
}

export const TestResult = (props: IResultProps) => {
  const passElem = props.passed ? (
    <div style={{ color: '#24be85', fontSize: 20, marginTop: 15 }}>
      <Icon type="check-circle" /> Passed
    </div>
  ) : (
    <div style={{ color: 'red', fontSize: 20, marginTop: 15 }}>
      <Icon type="exclamation-circle" /> Failed
    </div>
  );

  const logElem = props.log !== null && (
    <Input.TextArea value={props.log} autosize={{ minRows: 4, maxRows: 8 }} style={{ marginTop: 15 }} />
  );

  return (
    <Popover content={props.minimalMode && logElem}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 4,
          width: '100%',
          margin: 5,
        }}
      >
        {passElem}
        {!props.minimalMode && logElem}
      </div>
    </Popover>
  );
};

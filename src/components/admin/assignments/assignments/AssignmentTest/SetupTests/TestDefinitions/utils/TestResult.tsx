import React from 'react';
import { Icon, Input } from 'antd';

interface IResultProps {
  passed: boolean | undefined;
  log: string | undefined;
}

export const TestResult = (props: IResultProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {props.log && (
        <Input.TextArea value={props.log} autosize={{ minRows: 4, maxRows: 8 }} style={{ marginTop: 15 }} />
      )}
      {props.passed ? (
        <div style={{ color: '#24be85', fontSize: 20, marginTop: 15 }}>
          <Icon type="check-circle" /> Passed
        </div>
      ) : (
        <div style={{ color: 'red', fontSize: 20, marginTop: 15 }}>
          <Icon type="exclamation-circle" /> Failed
        </div>
      )}
    </div>
  );
};

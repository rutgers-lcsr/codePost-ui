// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports  */

import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

/* library imports  */
import { Popover } from 'antd';

/* codePost other imports  */
import { colors } from '../../../../../../theme/colors';
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

  const color = props.passed ? colors.brandPrimary : props.isError ? 'red' : 'orange';
  const iconStyle = { color: color, fontSize: 16 };
  const icon = props.passed ? (
    <CheckCircleOutlined style={iconStyle} />
  ) : props.isError ? (
    <ExclamationCircleOutlined style={iconStyle} />
  ) : (
    <CloseCircleOutlined style={iconStyle} />
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

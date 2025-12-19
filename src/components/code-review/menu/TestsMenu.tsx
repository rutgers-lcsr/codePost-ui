import * as React from 'react';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';
import { Alert } from 'antd';

interface IProps {
  [key: string]: any;
}

const TestsMenu = (props: IProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  return (
    <div
      id="tests-info"
      style={{
        paddingLeft: '15px',
        paddingBottom: '10px',
        paddingRight: '15px',
        paddingTop: '10px',
      }}
    >
      <Alert title="Tests coming soon" type="info" showIcon />
    </div>
  );
};

export default TestsMenu;

import * as React from 'react';
import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';
import { Alert } from 'antd';
interface IProps {
  [key: string]: any;
}

const TestsList = (props: IProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  return <Alert title="Tests coming soon" type="info" showIcon />;
};

export default TestsList;

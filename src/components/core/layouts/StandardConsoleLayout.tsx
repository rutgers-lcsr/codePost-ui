import * as React from 'react';

import { Layout } from 'antd';

const { Content, Header, Sider } = Layout;

import themeVars from '../../../styles/abstracts/_theme.js';

import { useGradeResizer } from '../../code-review/useGradeResizer';

import useFixedWindow from '../useFixedWindow';

export type ConsoleType = 'grade' | 'subheader';

type ConsoleTheme = 'light' | 'dark';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

interface IStandardConsoleLayoutProps {
  consoleTypes?: ConsoleType[];
  header: React.ReactNode;
  subheader: React.ReactNode;
  sider: React.ReactNode[];
  content: React.ReactNode;
  children?: React.ReactNode;
}

const StandardConsoleLayout = (props: IStandardConsoleLayoutProps) => {
  const [consoleTheme, setConsoleTheme] = React.useState(consoleThemes.light);
  const toggleConsoleTheme = (toTheme: ConsoleTheme) => {
    toTheme === 'light' ? setConsoleTheme(consoleThemes.light) : setConsoleTheme(consoleThemes.dark);
  };

  useFixedWindow();
  if (props.consoleTypes && props.consoleTypes.includes('grade')) {
    useGradeResizer();
  }

  return (
    <ConsoleThemeContext.Provider value={{ consoleTheme, toggleConsoleTheme }}>
      <Layout className="layout--standard-console">
        <Header className="layout--standard-console__header">{props.header}</Header>
        <Layout>
          <Sider width={300} className="layout--standard-console__sider">
            {props.sider.map((siderNode: React.ReactNode) => {
              return siderNode;
            })}
          </Sider>
          <Layout style={{ backgroundColor: consoleTheme.mainBg }}>
            {props.consoleTypes && props.consoleTypes.includes('subheader') ? (
              <Header
                className="layout--standard-console__subheader"
                style={{ height: themeVars.grade.subheaderHeight }}
              >
                {props.subheader}
              </Header>
            ) : null}
            <Content className="layout--standard-console__content">{props.content}</Content>
            {props.children}
          </Layout>
        </Layout>
      </Layout>
    </ConsoleThemeContext.Provider>
  );
};

export default StandardConsoleLayout;

import * as React from 'react';

import { Layout } from 'antd';

const { Content, Header, Sider } = Layout;

import themeVars from '../../styles/abstracts/_theme.js';

import { useGradeResizer } from './useGradeResizer';

type ConsoleType = 'grade' | 'student' | 'grader';

interface IStandardConsoleLayoutProps {
  consoleType?: ConsoleType;
  header: React.ReactNode;
  subheader: React.ReactNode;
  sider: React.ReactNode[];
  content: React.ReactNode;
}

const StandardConsoleLayout = (props: IStandardConsoleLayoutProps) => {
  useFixedWindow();

  if (props.consoleType === 'grade') {
    useGradeResizer();
  }

  return (
    <Layout id="Grade" className="layout--standard-console">
      <Header className="layout--standard-console__header">{props.header}</Header>
      <Layout>
        <Sider width={300} className="layout--standard-console__sider">
          {props.sider.map((siderNode: React.ReactNode) => {
            console.log('sider', siderNode);
            return siderNode;
          })}
        </Sider>
        <Layout>
          <Header className="layout--standard-console__subheader" style={{ height: themeVars.grade.subheaderHeight }}>
            {props.subheader}
          </Header>
          <Content className="layout--standard-console__content">{props.content}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const useFixedWindow = () => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []); // only run on mount, unmount
};

export default StandardConsoleLayout;

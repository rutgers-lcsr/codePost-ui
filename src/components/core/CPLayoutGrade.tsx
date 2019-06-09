import * as React from 'react';

import { Layout } from 'antd';

const { Content, Header, Sider } = Layout;

import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

import themeVars from '../../styles/abstracts/_theme.js';

interface ICPLayoutGradeProps extends IWithWindowWatcherProps {
  header: React.ReactNode;
  subheader: React.ReactNode;
  files: React.ReactNode;
  rubric: React.ReactNode;
  content: React.ReactNode;
}

class CPLayoutGrade extends React.Component<ICPLayoutGradeProps, {}> {
  public componentDidMount() {
    this.resizeComponents();
  }

  public componentDidUpdate(prevProps: ICPLayoutGradeProps) {
    if (this.props.windowHeight !== prevProps.windowHeight) {
      this.resizeComponents();
    }
  }

  // Set the scroll heights for FileMenu and RubricMenu
  public resizeComponents = () => {
    if (this.props.windowHeight !== 0) {
      const fileMenu = document.getElementById('cp-file-menu');
      const rubricMenu = document.getElementById('cp-rubric-menu');
      const rubricMenuTitle = document.getElementById('cp-rubric-menu-title');

      if (fileMenu !== null && rubricMenu !== null && rubricMenuTitle !== null) {
        // Don't let the file menu take up more than half of the vertical space
        // allowable for files and rubric
        const fileMenuMaxHeight =
          (this.props.windowHeight - themeVars.grade.headerHeight) / 2 - themeVars.grade.subheaderHeight;
        fileMenu.style.setProperty('max-height', `${fileMenuMaxHeight}px`);

        const fileMenuBottom = fileMenu.getBoundingClientRect().bottom;
        const rubricMenuTitleHeight = rubricMenuTitle.offsetHeight;
        const rubricMenuMaxHeight = this.props.windowHeight - fileMenuBottom - rubricMenuTitleHeight;
        rubricMenu.style.setProperty('max-height', `${rubricMenuMaxHeight}px`);
      }
    }
  };

  public render() {
    return (
      <Layout id="Grade" className="layout--grade">
        {this.props.children}
        <Header className="layout--grade__header">{this.props.header}</Header>
        <Layout>
          <Sider width={300} className="layout--grade__sider">
            {this.props.files}
            {this.props.rubric}
          </Sider>
          <Layout>
            <Header className="layout--grade__subheader" style={{ height: themeVars.grade.subheaderHeight }}>
              {this.props.subheader}
            </Header>
            <Content className="layout--grade__content">{this.props.content}</Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default withWindowWatcher(CPLayoutGrade);

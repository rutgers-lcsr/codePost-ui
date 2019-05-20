import * as React from 'react';

import { Layout } from 'antd';

const { Content, Header, Sider } = Layout;

import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

interface ICPLayoutGradeProps extends IWithWindowWatcherProps {
  header: React.ReactNode;
  subheader: React.ReactNode;
  files: React.ReactNode;
  rubric: React.ReactNode;
  content: React.ReactNode;
}

class CPLayoutGrade extends React.Component<ICPLayoutGradeProps, {}> {
  public componentDidMount() {
    this.resizeSidebar();
  }

  public componentDidUpdate(prevProps: ICPLayoutGradeProps) {
    if (this.props.windowHeight !== prevProps.windowHeight) {
      this.resizeSidebar();
    }
  }

  // Assert that the max-height of the rubric menu fits within the the space between
  // the bottom of the viewport and the bottom of the files
  public resizeSidebar = () => {
    if (this.props.windowHeight !== 0) {
      const fileMenu = document.getElementById('cp-file-menu');
      const rubricMenu = document.getElementById('cp-rubric-menu');
      const rubricMenuTitle = document.getElementById('cp-rubric-menu-title');
      if (fileMenu !== null && rubricMenu !== null && rubricMenuTitle !== null) {
        const fileMenuBottom = fileMenu.getBoundingClientRect().bottom;
        const rubricMenuTitleHeight = rubricMenuTitle.getBoundingClientRect().height;
        const rubricMenuMaxHeight = this.props.windowHeight - fileMenuBottom - rubricMenuTitleHeight;
        rubricMenu.style.setProperty('max-height', `${rubricMenuMaxHeight}px`);
      }

      const codeContainer = document.getElementById('cp-grade-code-container');
      if (codeContainer !== null) {
        console.log('height', this.props.windowHeight);
        const codeContainerTop = codeContainer.getBoundingClientRect().top;
        console.log('codeContainerTop', codeContainerTop);
        const codeContainerMaxHeight = this.props.windowHeight - codeContainerTop - 48 - 20;
        console.log('codeContainerMaxHeight', codeContainerMaxHeight);
        codeContainer.style.setProperty('max-height', `${codeContainerMaxHeight}px`);
      }
    }
  };

  public render() {
    return (
      <Layout className="layout--grade">
        <Header className="layout--grade__header">{this.props.header}</Header>
        <Layout>
          <Sider width={300} className="layout--grade__sider">
            {this.props.files}
            {this.props.rubric}
          </Sider>
          <Layout>
            <Header className="layout--grade__subheader">{this.props.subheader}</Header>
            <Content className="layout--grade__content">{this.props.content}</Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default withWindowWatcher(CPLayoutGrade);

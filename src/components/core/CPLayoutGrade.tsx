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
    this.resizeComponents();
  }

  public componentDidUpdate(prevProps: ICPLayoutGradeProps) {
    if (this.props.windowHeight !== prevProps.windowHeight) {
      this.resizeComponents();
    }
  }

  public resizeComponents = () => {
    if (this.props.windowHeight !== 0) {
      // Set the max-height of the rubric menu to fit within the the space between
      // the bottom of the viewport and the bottom of the files
      const fileMenu = document.getElementById('cp-file-menu');
      const rubricMenu = document.getElementById('cp-rubric-menu');
      const rubricMenuTitle = document.getElementById('cp-rubric-menu-title');
      if (fileMenu !== null && rubricMenu !== null && rubricMenuTitle !== null) {
        const fileMenuBottom = fileMenu.getBoundingClientRect().bottom;
        const rubricMenuTitleHeight = rubricMenuTitle.getBoundingClientRect().height;
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
            <Header className="layout--grade__subheader">{this.props.subheader}</Header>
            <Content className="layout--grade__content">{this.props.content}</Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default withWindowWatcher(CPLayoutGrade);

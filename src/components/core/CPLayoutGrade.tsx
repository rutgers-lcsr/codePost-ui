import * as React from 'react';

import { Button, Divider, Dropdown, Icon, Layout, Menu, Tag } from 'antd';

const { Content, Header, Sider } = Layout;

import CPLogo from './CPLogo';

import CPButton from './CPButton';
import CPComment from './CPComment';

import CPFileMenu from './CPFileMenu';
import CPRubricMenu from './CPRubricMenu';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import { CommentMock } from '../../infrastructure/comment';
import { RubricCommentMock } from '../../infrastructure/rubricComment';

class CPLayoutGrade extends React.Component<any, {}> {
  public render() {
    const codeString = `/******************************************************************
 *  Student: student1@andreacg.com
 *  Section: Section 1
 *
 *  Partner: none
 *  Partner section: N/A
 *
 *  Description:  Prints 'Hello, World' to the terminal.
 *                By tradition, this is everyone's first program.
 *                Brian Kernighan initiated this tradition in 1974.
 *
 ***************************************************************/

public class HelloWorld {
    public static void main(String[] args) {
        System.out.print("Hello, World");

    }
}`;

    const menu = (
      <Menu>
        <Menu.Item key="1">1st menu item</Menu.Item>
        <Menu.Item key="2">2nd menu item</Menu.Item>
        <Menu.Item key="3">3rd item</Menu.Item>
      </Menu>
    );

    const dropdown = (
      <Dropdown className="cp-dropdown" overlay={menu}>
        <Button style={{ color: 'rgba(0, 0, 0, 0.25)' }}>
          grader: vinay@princeton.edu <Icon type="down" />
        </Button>
      </Dropdown>
    );

    return (
      <Layout className="layout--grade">
        <Header className="layout--grade__header">
          <div className="cp-flex--wide">
            <div className="left">
              <CPLogo />
            </div>
            <div className="gap" />
            <div className="right">
              <span className="cp-label cp-label--white cp-label--bold">hello@andreacg.com!</span>
            </div>
            <div className="right">
              <CPButton cpType="dark">Log Out </CPButton>
            </div>
          </div>
        </Header>
        <Layout>
          <Sider width={300} className="layout--grade__sider">
            <CPFileMenu />
            <CPRubricMenu />
          </Sider>
          <Layout>
            <Header className="layout--grade__subheader">
              <div className="cp-flex--tight">
                <div className="left">
                  <span className="cp-label cp-label--very-bold cp-label--large cp-label--title">Loops</span>
                </div>
                <div className="left">
                  <span className="cp-label cp-label--very-bold cp-label--medium cp-label--subtitle">17/20</span>
                </div>
                <div className="left">
                  <CPButton cpType="highlight" size="small" icon="question" />
                </div>
                <div className="gap" />
                <div className="right">{dropdown}</div>
                <div className="right">
                  <CPButton cpType="secondary">Unfinalize</CPButton>
                </div>
              </div>
              <div className="cp-flex--tight">
                <div className="left">
                  <Tag color="red" style={{ marginRight: '0px' }}>
                    not finalized
                  </Tag>
                </div>
                <div className="left">
                  <Divider type="vertical" />
                </div>
                <div className="left">
                  <span className="cp-label">hello@andreacg.com</span>
                </div>
                <div className="gap" />
                <div className="right">
                  <span className="cp-label cp-label--bold">Last Edited: May 01, 2019 6:09 PM</span>
                </div>
              </div>
            </Header>
            <Content className="layout--grade__content">
              <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                <div style={{ flex: '0 0 600px', marginRight: '10px' }}>
                  <div
                    id="code__underlay-pre"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #e3e3e3',
                      borderRadius: '5px',
                      minHeight: '380px',
                      padding: '25px 40px 20px 20px',
                      lineHeight: '20px',
                    }}
                  >
                    <SyntaxHighlighter language={'java'} style={googlecode} showLineNumbers={true} wrapLines={false}>
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                </div>
                <div style={{ flex: '1 1 auto', minWidth: '250px', position: 'relative' }}>
                  <CPComment commentType="readonly" comment={CommentMock} rubricComment={RubricCommentMock} />
                </div>
              </div>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }
}

export default CPLayoutGrade;

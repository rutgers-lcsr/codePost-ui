import React from 'react';

import { Divider, Menu, Tag } from 'antd';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import CPLayoutGrade from '../../components/core/CPLayoutGrade';

import CPButton from '../../components/core/CPButton';
import CPComment from '../../components/core/CPComment';
import CPDropdown from '../../components/core/CPDropdown';
import CPFileMenu from '../../components/core/CPFileMenu';
import CPLogo from '../../components/core/CPLogo';
import CPRubricMenu from '../../components/core/CPRubricMenu';

import { CommentMock } from '../../infrastructure/comment';
import { RubricCategoryMock } from '../../infrastructure/rubricCategory';
import { RubricCommentMock } from '../../infrastructure/rubricComment';

const rubricCategories = [RubricCategoryMock];
const rubricComments = { 1: [RubricCommentMock] };

const header = (
  <div className="cp-flex--wide">
    <div className="left">
      <CPLogo cpType="main" />
    </div>
    <div className="gap" />
    <div className="right">
      <span className="cp-label cp-label--white cp-label--bold">hello@andreacg.com!</span>
    </div>
    <div className="right">
      <CPButton cpType="dark">Log Out </CPButton>
    </div>
  </div>
);

const menu = (
  <Menu>
    <Menu.Item key="1">1st menu item</Menu.Item>
    <Menu.Item key="2">2nd menu item</Menu.Item>
    <Menu.Item key="3">3rd item</Menu.Item>
  </Menu>
);

const dropdown = <CPDropdown value="grader: vinay@princeton.edu" overlay={menu} />;

const subheader = (
  <div>
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
  </div>
);

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

const content = (
  <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
    <div style={{ flex: '0 0 600px', marginRight: '10px' }}>
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e3e3e3',
          borderRadius: '5px',
          padding: '25px 40px 20px 20px',
          lineHeight: '20px',
          fontSize: '12px',
        }}
      >
        <div style={{ overflowY: 'scroll' }} id="cp-grade-code-container">
          <SyntaxHighlighter language={'java'} style={googlecode} showLineNumbers={true} wrapLines={false}>
            {codeString}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
    <div style={{ flex: '1 1 auto', minWidth: '250px', position: 'relative' }}>
      <CPComment commentType="readonly" comment={CommentMock} rubricComment={RubricCommentMock} />
    </div>
  </div>
);

export const Grade = () => {
  return (
    <CPLayoutGrade
      header={header}
      subheader={subheader}
      files={<CPFileMenu />}
      rubric={<CPRubricMenu rubricCategories={rubricCategories} rubricComments={rubricComments} />}
      content={content}
    />
  );
};

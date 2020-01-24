/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* ant imports */
import { Button, Radio, Icon, Divider, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import useWindowSize from '../core/useWindowSize';
import PreAuthLayout from './PreAuthLayout';

import LandingPanel from '../landing/newlanding/LandingPanel';

const result_plainText = require('../landing/landingAnimations/autograder/result_plaintext.jpg');
const result_codePost_summary = require('../landing/landingAnimations/autograder/result_codePost.jpg');
const result_codePost_exposedTests = require('../landing/landingAnimations/autograder/result_codePost_exposedTests.jpg');
const run_codePost_fileMode = require('../landing/landingAnimations/autograder/FileMode.jpg');
const run_user_upload = require('../landing/landingAnimations/autograder/run_user.jpg');
const run_codePost_editor = require('../landing/landingAnimations/autograder/IO.jpg');

interface IProps {
  isLoggedIn: boolean;
}

const AutograderDetail = (props: IProps) => {
  const [runCP, setRunCP] = useState(true);
  const [resultCP, setResultCP] = useState(true);

  const breakpoint = 700;
  const windowSize = useWindowSize();
  const flexDirection = windowSize.width < breakpoint ? 'column' : 'row';

  const isMobile = windowSize.width < breakpoint;

  const radioGroupStyle: React.CSSProperties = { display: 'flex', margin: 10 };

  const radioButtonStyle: React.CSSProperties = {
    fontSize: 14,
    wordBreak: 'break-word',
    textAlign: 'center',
    height: 60,
    padding: '4px 5px',
    width: 100,
    maxWidth: 100,
    lineHeight: '50px',
  };

  const runGroup = (
    <Radio.Group value={runCP ? 0 : 1} onChange={() => setRunCP(!runCP)} buttonStyle="solid" style={radioGroupStyle}>
      <Radio.Button key={'run-0'} value={0} style={{ ...radioButtonStyle }}>
        codePost
      </Radio.Button>
      <Radio.Button key={'run-1'} value={1} style={{ ...radioButtonStyle, paddingTop: 8, lineHeight: '20px' }}>
        My own system
      </Radio.Button>
    </Radio.Group>
  );

  const resultGroup = (
    <Radio.Group
      value={resultCP ? 0 : 1}
      onChange={() => setResultCP(!resultCP)}
      buttonStyle="solid"
      style={radioGroupStyle}
    >
      <Radio.Button key={'result-0'} value={0} style={{ ...radioButtonStyle, paddingTop: 8, lineHeight: '20px' }}>
        codePost objects
      </Radio.Button>
      <Radio.Button key={'result-1'} value={1} style={{ ...radioButtonStyle }}>
        Plaintext file
      </Radio.Button>
    </Radio.Group>
  );

  const title = (
    <div>
      <Typography.Title level={2}>codePost Autograder</Typography.Title>
      <div style={{ marginTop: 15, fontSize: 24 }}>
        Flexible to your desired set up, powerful enough for your needs.
      </div>
    </div>
  );

  // ****************************** Modules ********************************

  const imgstyle = { maxWidth: 550 };
  const divStyle = { borderRadius: 8 };

  const module_result_plainText = (
    <LandingPanel
      text={
        <div>
          <div>Store test results in a plaintext file that is appended to a student submission.</div>
          <ul style={{ paddingBottom: 15 }}>
            <li>Highlightable and commentable</li>
            <li>Viewable to students and graders</li>
          </ul>
        </div>
      }
      title="Plaintext test results"
      subTitle=""
      type="left"
      moduleMaxWidth={595}
      moduleMaxHeight={550}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={result_plainText} style={imgstyle} />
        </div>
      }
      gutterSize={100}
    />
  );

  const module_run_fileMode = (
    <LandingPanel
      text={
        <div>
          <div>Run your files directly in codePost's servers</div>
          <ul style={{ paddingBottom: 15 }}>
            <li>No customization required, jusy import your files and run them</li>
            <li>Languages supported</li>
          </ul>
        </div>
      }
      title="Import scripts as is"
      subTitle=""
      type="right"
      moduleMaxWidth={595}
      moduleMaxHeight={550}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={run_codePost_fileMode} style={imgstyle} />
        </div>
      }
      gutterSize={100}
    />
  );

  const module_result_codePost_summary = (
    <LandingPanel
      text={
        <div>
          <ul style={{ paddingBottom: 15 }}>
            <li>Structured results</li>
            <li>Optional explanations</li>
            <li>Automatically add or deduct points</li>
            <li>Student performance insights, by test</li>
          </ul>
        </div>
      }
      title="codePost test results"
      subTitle=""
      type="left"
      moduleMaxWidth={595}
      moduleMaxHeight={550}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={result_codePost_summary} style={imgstyle} />
        </div>
      }
      gutterSize={100}
    />
  );

  const module_result_codePost_exposedTests = (
    <LandingPanel
      text={
        <div>
          <ul style={{ paddingBottom: 15 }}>
            <li>Expose a subset of tests to be run on student submit</li>
            <li>Avoid situations where students submit code that doesn't work or compile</li>
            <li>Set limits on the amount of tests runs</li>
            <li>Set requirements on the files that need to be uploaded</li>
          </ul>
        </div>
      }
      title="Tests on student submit"
      subTitle=""
      type="right"
      moduleMaxWidth={595}
      moduleMaxHeight={550}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={result_codePost_exposedTests} style={imgstyle} />
        </div>
      }
      gutterSize={100}
    />
  );

  const module_run_codePost_editor = (
    <LandingPanel
      text={
        <div>
          <ul style={{ paddingBottom: 15 }}>
            <li>Ease to use test editor</li>
            <li>Can write tests with no code, or code snippets</li>
            <li>Tests run in isolation, so one failed test wont impact other tests</li>
          </ul>
        </div>
      }
      title="User-friendly test editor"
      subTitle=""
      type="left"
      moduleMaxWidth={595}
      moduleMaxHeight={550}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={run_codePost_editor} style={imgstyle} />
        </div>
      }
      gutterSize={100}
    />
  );

  const module_run_user_upload = (
    <LandingPanel
      text={
        <div>
          <ul style={{ paddingBottom: 15 }}>
            <li>Run your tests on your own infrastructure</li>
            <li>Write test results to a text file</li>
            <li>Upload tests automatically via our API or with our UI</li>
          </ul>
        </div>
      }
      title="Run your tests and upload them"
      subTitle=""
      type="right"
      moduleMaxWidth={595}
      moduleMaxHeight={550}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={run_user_upload} style={imgstyle} />
        </div>
      }
      gutterSize={100}
    />
  );

  const module_run_api = (
    <LandingPanel
      text={
        <div>
          <ul style={{ paddingBottom: 15 }}>
            <li>Run your tests on your own infrastructure</li>
            <li>Use the codePost API to set test results in structured models</li>
          </ul>
        </div>
      }
      title="Set test results with the codePost API"
      subTitle=""
      type="right"
      moduleMaxWidth={595}
      moduleMaxHeight={550}
      removeModelSmallScreen={false}
      module={
        <div>
          <span style={{ fontSize: 40 }}>
            codePost <span style={{ color: '#24be85' }}>API</span>
          </span>
        </div>
      }
      gutterSize={100}
    />
  );

  const panelMargin = 75;

  const cpServer_cPresults = (
    <div>
      <div style={{ marginTop: panelMargin }} />
      {module_result_codePost_summary}
      <div style={{ marginTop: panelMargin }} />
      {module_result_codePost_exposedTests}
      <div style={{ marginTop: panelMargin }} />
      {module_run_codePost_editor}
    </div>
  );

  const cpServer_plainText = (
    <div>
      <div style={{ marginTop: panelMargin }} />
      {module_result_plainText}
      <div style={{ marginTop: panelMargin }} />
      {module_run_fileMode}
    </div>
  );

  const ownServer_cPresults = (
    <div>
      <div style={{ marginTop: panelMargin }} />
      {module_result_codePost_summary}
      <div style={{ marginTop: panelMargin }} />
      {module_run_api}
    </div>
  );

  const ownServer_plaintext = (
    <div>
      <div style={{ marginTop: panelMargin }} />
      {module_result_plainText}
      <div style={{ marginTop: panelMargin }} />
      {module_run_user_upload}
    </div>
  );

  let moduleToShow = <div />;

  switch (true) {
    case runCP && resultCP:
      moduleToShow = cpServer_cPresults;
      break;
    case runCP && !resultCP:
      moduleToShow = cpServer_plainText;
      break;
    case !runCP && resultCP:
      moduleToShow = ownServer_cPresults;
      break;
    case !runCP && !resultCP:
      moduleToShow = ownServer_plaintext;
      break;
    default:
  }

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {title}
        <div style={{ display: 'flex', marginTop: 40, marginBottom: 20, fontSize: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            I want to <b style={{ fontWeight: 600, marginLeft: 4, marginRight: 4 }}> run tests </b> on {runGroup}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 30 }}>
            I want to see <b style={{ fontWeight: 600, marginLeft: 4, marginRight: 4 }}> test results </b> in{' '}
            {resultGroup}
          </div>
        </div>
        <div>{moduleToShow}</div>
      </div>
    </PreAuthLayout>
  );
};

export default AutograderDetail;

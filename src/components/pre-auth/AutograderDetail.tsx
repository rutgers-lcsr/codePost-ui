/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* ant imports */
import { Radio, Typography } from 'antd';

import { colors } from '../../theme/colors';

/* codePost imports */
import useWindowSize from '../core/useWindowSize';
import PreAuthLayout from './PreAuthLayout';

import LandingPanel from '../landing/newlanding/LandingPanel';

import run_codePost_fileMode from '../landing/landingAnimations/autograder/FileMode.jpg';
import run_codePost_editor from '../landing/landingAnimations/autograder/IO.jpg';
import result_codePost_summary from '../landing/landingAnimations/autograder/result_codePost.jpg';
import result_codePost_exposedTests from '../landing/landingAnimations/autograder/result_codePost_exposedTests.jpg';
import result_plainText from '../landing/landingAnimations/autograder/result_plaintext.jpg';
import run_user_upload from '../landing/landingAnimations/autograder/run_user.jpg';

interface IProps {
  isLoggedIn: boolean;
}

const AutograderDetail = (props: IProps) => {
  const [runCP, setRunCP] = useState(true);
  const [resultCP, setResultCP] = useState(true);

  const breakpoint = 700;
  const windowSize = useWindowSize();
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

  // ****************************** Header ********************************

  const runGroup = (
    <Radio.Group value={runCP ? 0 : 1} onChange={() => setRunCP(!runCP)} buttonStyle="solid" style={radioGroupStyle}>
      <Radio.Button key={'run-0'} value={0} style={{ ...radioButtonStyle, fontWeight: runCP ? 600 : 400 }}>
        codePost
      </Radio.Button>
      <Radio.Button
        key={'run-1'}
        value={1}
        style={{ ...radioButtonStyle, fontWeight: runCP ? 400 : 600, paddingTop: 8, lineHeight: '20px' }}
      >
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
      <Radio.Button
        key={'result-0'}
        value={0}
        style={{ ...radioButtonStyle, paddingTop: 8, lineHeight: '20px', fontWeight: resultCP ? 600 : 400 }}
      >
        codePost objects
      </Radio.Button>
      <Radio.Button key={'result-1'} value={1} style={{ ...radioButtonStyle, fontWeight: resultCP ? 400 : 600 }}>
        Basic text file
      </Radio.Button>
    </Radio.Group>
  );

  const title = (
    <div>
      <Typography.Title level={2}>codePost Autograder</Typography.Title>
      <div style={{ marginTop: 15, fontSize: 24, color: colors.brandPrimary }}>
        Easy to use, flexible, and powerful.
      </div>
    </div>
  );

  // ****************************** Module Creation ********************************
  const imgstyle = { maxWidth: 550 };
  const divStyle = { borderRadius: 8 };
  const moduleMaxWidth = 550;
  const moduleMaxHeight = 550;
  const gutterSize = 100;

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
      moduleMaxWidth={moduleMaxWidth}
      moduleMaxHeight={moduleMaxHeight}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={result_plainText} style={imgstyle} alt="Autograder plaintext test results" />
        </div>
      }
      gutterSize={gutterSize}
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
      moduleMaxWidth={moduleMaxWidth}
      moduleMaxHeight={moduleMaxHeight}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={run_codePost_fileMode} style={imgstyle} alt="Import scripts as is in file mode" />
        </div>
      }
      gutterSize={gutterSize}
    />
  );

  const module_result_codePost_summary = (
    <LandingPanel
      text={
        <div>
          <ul style={{ paddingBottom: 15 }}>
            <li>Automatically add or deduct points per test</li>
            <li>Add explanations to each test</li>
            <li>Pass/fail insights, by test</li>
          </ul>
        </div>
      }
      title="Structured test results"
      subTitle=""
      type="left"
      moduleMaxWidth={moduleMaxWidth}
      moduleMaxHeight={moduleMaxHeight}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={result_codePost_summary} style={imgstyle} alt="Structured test results" />
        </div>
      }
      gutterSize={gutterSize}
    />
  );

  const module_result_codePost_exposedTests = (
    <LandingPanel
      text={
        <div>
          <ul style={{ paddingBottom: 15 }}>
            <li>
              Expose a subset of tests to be run on student submit: avoid situations where students submit code that
              doesn't work or compile
            </li>
            <li>Set limits on the amount of tests runs</li>
            <li>Set requirements for the file names that need to be uploaded</li>
          </ul>
        </div>
      }
      title="Tests on student submit"
      subTitle=""
      type="right"
      moduleMaxWidth={moduleMaxWidth}
      moduleMaxHeight={moduleMaxHeight}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img
            src={result_codePost_exposedTests}
            style={imgstyle}
            alt="Exposed autograder tests when a student submits"
          />
        </div>
      }
      gutterSize={gutterSize}
    />
  );

  const module_run_codePost_editor = (
    <LandingPanel
      text={
        <div>
          <ul style={{ paddingBottom: 15 }}>
            <li>Easy to use test editor</li>
            <li>Multiple test options: No code tests, Unit tests, Bash scripts, etc.</li>
            <li>Tests run in isolation, so one failed test wont impact other tests</li>
          </ul>
        </div>
      }
      title="User-friendly test editor"
      subTitle=""
      type="left"
      moduleMaxWidth={moduleMaxWidth}
      moduleMaxHeight={moduleMaxHeight}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={run_codePost_editor} style={imgstyle} alt="User-friendly test editor" />
        </div>
      }
      gutterSize={gutterSize}
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
      moduleMaxWidth={moduleMaxWidth}
      moduleMaxHeight={moduleMaxHeight}
      removeModelSmallScreen={false}
      module={
        <div style={divStyle} className="display-flex justify-content-center align-items-center bevel">
          <img src={run_user_upload} style={imgstyle} alt="Run your tests and upload them" />
        </div>
      }
      gutterSize={gutterSize}
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
      moduleMaxWidth={moduleMaxWidth}
      moduleMaxHeight={moduleMaxHeight}
      removeModelSmallScreen={false}
      module={
        <div style={{ minHeight: 200, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 40 }}>
            code<b>Post</b> <span style={{ color: colors.brandPrimary }}>API</span>
          </span>
        </div>
      }
      gutterSize={gutterSize}
    />
  );

  // ****************************** Module Groupings ********************************
  const panelMargin = 100;

  // codePost server; codePost results
  const cpServer_cPresults = (
    <div>
      {module_result_codePost_summary}
      <div style={{ marginTop: panelMargin }} />
      {module_result_codePost_exposedTests}
      <div style={{ marginTop: panelMargin }} />
      {module_run_codePost_editor}
    </div>
  );

  // codePost server; plaintext results
  const cpServer_plainText = (
    <div>
      {module_result_plainText}
      <div style={{ marginTop: panelMargin }} />
      {module_run_fileMode}
    </div>
  );

  // user server; codePost results
  const ownServer_cPresults = (
    <div>
      {module_result_codePost_summary}
      <div style={{ marginTop: panelMargin }} />
      {module_run_api}
    </div>
  );

  // user server; plaintext results
  const ownServer_plaintext = (
    <div>
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

  // ****************************** render ********************************
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
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            marginTop: 60,
            marginBottom: 50,
            fontSize: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
            I want to <b style={{ fontWeight: 600, marginLeft: 4, marginRight: 4 }}> run tests </b> on {runGroup}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              marginLeft: isMobile ? 0 : 30,
              marginTop: isMobile ? 15 : 0,
            }}
          >
            I want to view <b style={{ fontWeight: 600, marginLeft: 4, marginRight: 4 }}> test results </b> as{' '}
            {resultGroup}
          </div>
        </div>
        <div style={{ width: '100%' }}>{moduleToShow}</div>
      </div>
    </PreAuthLayout>
  );
};

export default AutograderDetail;

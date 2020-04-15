import React, { useState } from 'react';

import { Modal } from 'antd';

const TestGIF = require('../../img/gifs/AdminTestCreation.gif');
const SubmitGIF = require('../../img/gifs/StudentSubmit.gif');

export const AutograderInfoModal = () => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <a onClick={() => setVisible((prevState) => !prevState)}>How are these tests created?</a>
      <Modal
        visible={visible}
        title="How are these tests created?"
        onCancel={() => setVisible(false)}
        cancelText={'Close'}
        footer={[]}
        style={{ minWidth: 800 }}
      >
        <div style={{ fontSize: 18, maxHeight: 650, overflow: 'auto' }}>
          Tests are created in the <b style={{ color: '#24be85' }}>Admin console</b>. From here, course admins:
          <ul style={{ fontSize: 17, marginTop: 10, marginBottom: 20 }}>
            <li>
              Specify the <span style={{ fontWeight: 600 }}>code environment</span> (e.g., language, packages)
            </li>
            <li>
              Define <span style={{ fontWeight: 600 }}>test code</span>, either through the codePost test writing
              interface or by uploading existing test scripts
            </li>
            <li>
              Run tests on <span style={{ fontWeight: 600 }}>solution code</span>
            </li>
            <li>
              View <span style={{ fontWeight: 600 }}>test results</span> across the course
            </li>
            <li>
              Enable other options, like exposing tests on student submit, limiting the amount of student runs, etc.
            </li>
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={TestGIF} style={{ maxWidth: '75%' }} alt="" />
            <div style={{ marginTop: 15 }}>
              To learn more,{' '}
              <a href="https://codepost.io/autograder" target="_blank">
                click here
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const SubmissionInfoModal = () => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <a onClick={() => setVisible((prevState) => !prevState)}>How do students submit code?</a>
      <Modal
        visible={visible}
        title="How do students submit code?"
        onCancel={() => setVisible(false)}
        cancelText={'Close'}
        footer={[]}
        style={{ minWidth: 800 }}
      >
        <div style={{ fontSize: 18, maxHeight: 650, overflow: 'auto' }}>
          In the <b style={{ color: '#24be85' }}>Student console</b>, students see a table of all their assignments and
          can:
          <ul style={{ fontSize: 17, marginTop: 10, marginBottom: 20 }}>
            <li>
              <span style={{ fontWeight: 600 }}>Submit code</span> for open assignments
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>See real-time test results</span>
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>View feedback</span> and grades for finalized submissions
            </li>
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={SubmitGIF} style={{ maxWidth: '90%' }} alt="" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

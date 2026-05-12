// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useState } from 'react';

import { Button, Modal } from 'antd';

import { CLIENT_URL } from '../../config';

import { colors } from '../../theme/colors';
import TestGIF from '../../img/gifs/AdminTestCreation.gif';
import SubmitGIF from '../../img/gifs/StudentSubmit.gif';

export const AutograderInfoModal = () => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <a onClick={() => setVisible((prevState) => !prevState)}>How are these tests created?</a>
      <Modal
        open={visible}
        title={
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.2px' }}>How are these tests created?</span>
        }
        onCancel={() => setVisible(false)}
        cancelText={'Close'}
        footer={<Button onClick={() => setVisible(false)}>Close</Button>}
        style={{ minWidth: 800 }}
      >
        <div style={{ fontSize: 14, maxHeight: 650, overflow: 'auto', lineHeight: 1.7 }}>
          Tests are created in the <b style={{ color: colors.brandPrimary }}>Admin Console</b> by course admins. From
          here, course admins can:
          <ul style={{ fontSize: 14, marginTop: 12, marginBottom: 24, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>
              Specify an environment (language, dependencies) in which student code and tests can run. Every assignment
              on codePost gets its own Docker container.
            </li>
            <li style={{ marginBottom: 6 }}>
              Define test code, either through the codePost test editor (shown below) or by uploading existing test
              scripts.
            </li>
            <li style={{ marginBottom: 6 }}>Run tests against solution code to verify correctness.</li>
            <li style={{ marginBottom: 6 }}>
              Run tests against all uploaded submissions. Tests also run automatically when students submit code to
              codePost.
            </li>
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={TestGIF} style={{ maxWidth: '75%', borderRadius: 8 }} alt="" />
            <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(0, 0, 0, 0.6)' }}>
              To learn more about the codePost autograder,{' '}
              <a href={`${CLIENT_URL}/autograder`} target="_blank">
                check out this overview
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
        open={visible}
        title={
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.2px' }}>How do students submit code?</span>
        }
        onCancel={() => setVisible(false)}
        cancelText={'Close'}
        footer={<Button onClick={() => setVisible(false)}>Close</Button>}
        style={{ minWidth: 800 }}
      >
        <div style={{ fontSize: 14, maxHeight: 650, overflow: 'auto', lineHeight: 1.7 }}>
          Students use the <b style={{ color: colors.brandPrimary }}>Student Console</b> to interact with codePost. From
          there, they can can:
          <ul style={{ fontSize: 14, marginTop: 12, marginBottom: 24, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>
              Submit code for assignments (so long as a specified due date hasn't passed).
            </li>
            <li style={{ marginBottom: 6 }}>
              View test results in real-time, immediately when they submit. (Instructors can choose which tests students
              see on submit.)
            </li>
            <li style={{ marginBottom: 6 }}>
              View personalized feedback (comments) and grades for reviewed submissions.
            </li>
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={SubmitGIF} style={{ maxWidth: '90%', borderRadius: 8 }} alt="" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

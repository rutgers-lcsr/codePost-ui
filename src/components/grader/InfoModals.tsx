import { useState } from 'react';

import { Button, Modal } from 'antd';

import TestGIF from '../../img/gifs/AdminTestCreation.gif';
import SubmitGIF from '../../img/gifs/StudentSubmit.gif';

export const AutograderInfoModal = () => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <a onClick={() => setVisible((prevState) => !prevState)}>How are these tests created?</a>
      <Modal
        open={visible}
        title="How are these tests created?"
        onCancel={() => setVisible(false)}
        cancelText={'Close'}
        footer={<Button onClick={() => setVisible(false)}>Close</Button>}
        style={{ minWidth: 800 }}
      >
        <div style={{ fontSize: 15, maxHeight: 650, overflow: 'auto' }}>
          Tests are created in the <b style={{ color: '#24be85' }}>Admin Console</b> by course admins. From here, course
          admins can:
          <ul style={{ fontSize: 15, marginTop: 10, marginBottom: 20 }}>
            <li>
              Specify an environment (language, dependencies) in which student code and tests can run. Every assignment
              on codePost gets its own Docker container.
            </li>
            <li>
              Define test code, either through the codePost test editor (shown below) or by uploading existing test
              scripts.
            </li>
            <li>Run tests against solution code to verify correctness.</li>
            <li>
              Run tests against all uploaded submissions. Tests also run automatically when students submit code to
              codePost.
            </li>
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={TestGIF} style={{ maxWidth: '75%' }} alt="" />
            <div style={{ marginTop: 15 }}>
              To learn more about the codePost autograder,{' '}
              <a href="https://codepost.cs.rutgers.edu/autograder" target="_blank">
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
        title="How do students submit code?"
        onCancel={() => setVisible(false)}
        cancelText={'Close'}
        footer={<Button onClick={() => setVisible(false)}>Close</Button>}
        style={{ minWidth: 800 }}
      >
        <div style={{ fontSize: 15, maxHeight: 650, overflow: 'auto' }}>
          Students use the <b style={{ color: '#24be85' }}>Student Console</b> to interact with codePost. From there,
          they can can:
          <ul style={{ fontSize: 15, marginTop: 10, marginBottom: 20 }}>
            <li>Submit code for assignments (so long as a specified due date hasn't passed).</li>
            <li>
              View test results in real-time, immediately when they submit. (Instructors can choose which tests students
              see on submit.)
            </li>
            <li>View personalized feedback (comments) and grades for reviewed submissions.</li>
          </ul>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={SubmitGIF} style={{ maxWidth: '90%' }} alt="" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

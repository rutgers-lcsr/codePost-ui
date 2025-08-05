/* react imports */
import * as React from 'react';

import { CopyOutlined, QrcodeOutlined, RedoOutlined } from '@ant-design/icons';

import { Button, Modal, Input, Tooltip, Checkbox, message } from 'antd';

import { CourseType } from '../../../../infrastructure/types';
import { Course } from '../../../../infrastructure/course';

interface IProps {
  course: CourseType;
}

const ShareInviteCode = (props: IProps) => {
  const [visible, setVisible] = React.useState(false);
  const [usingWhitelist, setUsingWhitelist] = React.useState(props.course.emailWhitelist.length > 0);
  const [whitelist, setWhitelist] = React.useState(props.course.emailWhitelist);
  const [inviteCode, setInviteCode] = React.useState(props.course.inviteCode);
  const [enabled, setEnabled] = React.useState(props.course.inviteCodeEnabled);

  React.useEffect(() => {
    if (!usingWhitelist) {
      setWhitelist('');
    }
  }, [usingWhitelist]);

  const resetCode = () => {
    Modal.confirm({
      title: "Are you sure you want to reset this course's invite code?",
      content: "The old code will no longer work, and you won't be able to undo this.",
      onOk() {
        return fetch(`${process.env.REACT_APP_API_URL}/courses/${props.course.id}/changeInviteCode/`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        })
          .then((res) => {
            if (res.status === 200) {
              return res.json();
            } else {
              return Promise.reject(res.status);
            }
          })
          .then((res) => {
            props.course.inviteCode = res;
            setInviteCode(res);
          })
          .catch((err) => {
            console.log(err);
          });
      },
    });
  };

  const inviteLink = inviteCode === null ? '' : `https://codepost.cs.rutgers.edu/signup/join?code=${inviteCode}`;

  const copyToClipboard = () => {
    const element = document.createElement('textarea');
    element.value = inviteLink;
    document.body.appendChild(element);
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
    message.info('Invite code copied to clipboard.');
  };

  const saveSettings = () => {
    Course.update({ ...props.course, emailWhitelist: whitelist, inviteCodeEnabled: enabled });
    setVisible(false);
  };

  const inputValue =
    inviteCode === null
      ? 'None set; generate here -->'
      : `https://codepost.cs.rutgers.edu/signup/join?code=${inviteCode}`;

  return (
    <div>
      <Button icon={<QrcodeOutlined />} onClick={() => setVisible(true)}>
        Share invite code
      </Button>
      <Modal
        title="Share invite code"
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={saveSettings}
        okText="Save"
        width={600}
      >
        Share this invite link with your students. Anyone with this link can join this course as a student.
        <br />
        <br />
        Enable: <Checkbox defaultChecked={enabled} onChange={() => setEnabled(!enabled)} />
        <br />
        <br />
        <Input
          disabled={!enabled}
          className="input--disabled-normal"
          id="api-key"
          value={inputValue}
          style={{ width: '65%' }}
        />
        &nbsp;
        <Tooltip title="Copy to clipboard">
          <Button icon={<CopyOutlined />} onClick={copyToClipboard} type="primary" disabled={!enabled}>
            Copy
          </Button>
        </Tooltip>
        &nbsp;
        <Tooltip title="Reset your invite code.">
          <Button icon={<RedoOutlined />} onClick={resetCode} disabled={!enabled}>
            Reset
          </Button>
        </Tooltip>
        <br />
        <br />
        Restrict the emails students can use to sign up (for example, to prevent usage of personal emails):{' '}
        <Checkbox
          defaultChecked={usingWhitelist}
          onChange={() => setUsingWhitelist(!usingWhitelist)}
          disabled={!enabled}
        />
        <br />
        <br />
        {usingWhitelist && (
          <Input.TextArea
            defaultValue={whitelist}
            onChange={(e) => setWhitelist(e.target.value)}
            placeholder="List of domains (gmail.com, princeton.edu), one per line"
            disabled={!enabled}
          />
        )}
      </Modal>
    </div>
  );
};

export default ShareInviteCode;

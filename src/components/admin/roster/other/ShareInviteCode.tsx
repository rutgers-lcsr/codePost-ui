/* react imports */
import * as React from 'react';

import { Button, Modal, Input, Tooltip, Icon, Checkbox, message } from 'antd';

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
            Authorization: `JWT ${localStorage.getItem('token') || ''}`,
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

  const copyToClipboard = () => {
    const element = document.createElement('textarea');
    element.value = inviteCode === null ? '' : inviteCode;
    document.body.appendChild(element);
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
    message.info('Invite code copied to clipboard.');
  };

  const saveWhitelist = () => {
    Course.update({ ...props.course, emailWhitelist: whitelist });
    setVisible(false);
  };

  const inputValue =
    inviteCode === null ? 'None set; generate here -->' : `https://codepost.io/signup/join?code=${inviteCode}`;

  return (
    <div>
      <Button icon="qrcode" onClick={() => setVisible(true)}>
        Share invite code
      </Button>
      <Modal
        title="Share invite code"
        visible={visible}
        onCancel={() => setVisible(false)}
        onOk={saveWhitelist}
        okText="Save"
        width={600}
      >
        Share this invite link with your students. Anyone with this link can join this course as a student.
        <br />
        <br />
        <Input
          addonBefore="Invite code"
          className="input--disabled-normal"
          id="api-key"
          value={inputValue}
          prefix={
            <Tooltip title="Copy to clipboard">
              <Icon type="copy" style={{ cursor: 'pointer' }} onClick={copyToClipboard} />
            </Tooltip>
          }
          addonAfter={
            <Tooltip title="Reset your invite code.">
              <Icon type="redo" onClick={resetCode} style={{ cursor: 'pointer' }} />
            </Tooltip>
          }
        />
        <br />
        <br />
        Restrict the emails students can use to sign up (for example, to prevent usage of personal emails):{' '}
        <Checkbox defaultChecked={usingWhitelist} onChange={() => setUsingWhitelist(!usingWhitelist)} />
        <br />
        <br />
        {usingWhitelist && (
          <Input.TextArea
            defaultValue={whitelist}
            onChange={(e) => setWhitelist(e.target.value)}
            placeholder="List of domains (gmail.com, princeton.edu), one per line"
          />
        )}
      </Modal>
    </div>
  );
};

export default ShareInviteCode;

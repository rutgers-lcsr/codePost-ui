// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import * as React from 'react';

import { CopyOutlined, QrcodeOutlined, RedoOutlined } from '@ant-design/icons';

import { Button, Modal, Input, Tooltip, Checkbox, message } from 'antd';

import { coursesApi } from '../../../../api-client/clients';
import type { Course } from '../../../../api-client';
import { CLIENT_URL } from '../../../../config';
import { useCourseCapabilities } from '../../../../stores/usePermissionsStore';

interface IProps {
  course: Course;
}

const ShareInviteCode = (props: IProps) => {
  const [visible, setVisible] = React.useState(false);
  const [usingWhitelist, setUsingWhitelist] = React.useState((props.course.emailWhitelist || []).length > 0);
  const [whitelist, setWhitelist] = React.useState(props.course.emailWhitelist);
  const [inviteCode, setInviteCode] = React.useState(props.course.inviteCode);
  const [enabled, setEnabled] = React.useState(props.course.inviteCodeEnabled);
  const courseCaps = useCourseCapabilities(props.course.id);
  const canChangeInviteCode = courseCaps.change_invite_code !== false;

  // Sync state with props if needed, but primarily relying on local state for the modal
  React.useEffect(() => {
    if (!usingWhitelist) {
      setWhitelist('');
    }
  }, [usingWhitelist]);

  const resetCode = () => {
    const api = coursesApi;
    Modal.confirm({
      title: "Are you sure you want to reset this course's invite code?",
      content: "The old code will no longer work, and you won't be able to undo this.",
      onOk() {
        return api
          .changeInviteCodePartialUpdate({ id: props.course.id })
          .then((res: unknown) => {
            // Check return type; assuming string based on legacy
            const newCode = res as unknown as string;
            // Legacy mutation to keep parent in sync without refetch
            (props.course as unknown as { inviteCode: string }).inviteCode = newCode;
            setInviteCode(newCode);
            message.success('Invite code reset');
          })
          .catch((err: unknown) => {
            console.error(err);
            message.error('Failed to reset invite code');
          });
      },
    });
  };

  const saveSettings = async () => {
    const api = coursesApi;
    try {
      await api.partialUpdate({
        id: props.course.id,
        patchedCourse: {
          emailWhitelist: whitelist,
          inviteCodeEnabled: enabled,
        },
      });
      message.success('Settings updated');
      setVisible(false);
    } catch (e) {
      message.error('Failed to update settings');
      console.error(e);
    }
  };

  const inviteLink = inviteCode === null ? '' : `${CLIENT_URL}/signup/join?code=${inviteCode}`;

  const copyToClipboard = () => {
    const element = document.createElement('textarea');
    element.value = inviteLink;
    document.body.appendChild(element);
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
    message.info('Invite code copied to clipboard.');
  };

  const inputValue =
    inviteCode === null ? 'None set; generate here -->' : `${CLIENT_URL}/signup/join?code=${inviteCode}`;

  return (
    <div>
      <Button icon={<QrcodeOutlined />} onClick={() => setVisible(true)}>
        Share invite code
      </Button>
      <Modal
        title="Share invite code"
        open={visible}
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
          <Button icon={<RedoOutlined />} onClick={resetCode} disabled={!enabled || !canChangeInviteCode}>
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

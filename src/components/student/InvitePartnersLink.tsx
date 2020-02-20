import * as React from 'react';

import { Icon, Input, message, Tooltip } from 'antd';

import { AssignmentType, AssignmentStudentType } from '../../infrastructure/assignment';

interface IInvitePartnersLinkProps {
  assignment: AssignmentType | AssignmentStudentType;
}

const InvitePartnersLink = (props: IInvitePartnersLinkProps) => {
  if (props.assignment === undefined || !props.assignment.allowStudentUploadWithPartners) {
    return null;
  }

  const copyToClipboard = () => {
    const copyText = document.getElementById('invite-link') as HTMLInputElement;
    if (copyText) {
      const element = document.createElement('textarea');
      element.value = copyText.value;
      document.body.appendChild(element);
      element.select();
      document.execCommand('copy');
      document.body.removeChild(element);
      message.info('Invite link copied to clipboard.');
    }
  };

  return (
    <div style={{ padding: '24px 0px' }}>
      <Input
        id="invite-link"
        addonBefore="Partner Invite Link"
        prefix={<Icon type="copy" style={{ color: '#1890ff' }} onClick={copyToClipboard} />}
        addonAfter={
          <Tooltip title="Reset link">
            <Icon type="redo" style={{ cursor: 'pointer' }} />
          </Tooltip>
        }
        defaultValue="https://asldkjalsfd"
      />
    </div>
  );
};

export default InvitePartnersLink;

import * as React from 'react';

import { Icon, Input, message, Tooltip } from 'antd';

import { AssignmentType, AssignmentStudentType } from '../../infrastructure/assignment';

import { PartnerLinkType, Submission, StudentSubmissionType } from '../../infrastructure/submission';

interface IInvitePartnersLinkProps {
  assignment?: AssignmentType | AssignmentStudentType;
  submission?: StudentSubmissionType;
}

const InvitePartnersLink = (props: IInvitePartnersLinkProps) => {
  const [link, setLink] = React.useState<PartnerLinkType | undefined>(undefined);

  React.useEffect(() => {
    const getPartnerLink = async () => {
      if (
        props.assignment !== undefined &&
        props.assignment.allowStudentUploadWithPartners &&
        props.submission !== undefined
      ) {
        setLink(undefined);
        const data = await Submission.readPartnerLink(props.submission.id);
        setLink(data);
      }
    };

    getPartnerLink();
  }, [props.assignment, props.submission]);

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

  if (
    props.assignment === undefined ||
    !props.assignment.allowStudentUploadWithPartners ||
    props.submission === undefined ||
    link === undefined
  ) {
    return null;
  }

  return (
    <div style={{ padding: '24px 0px' }}>
      <Input
        id="invite-link"
        addonBefore="Partner Invite Link"
        addonAfter={
          <Tooltip title="Copy link">
            <Icon type="copy" style={{ color: '#1890ff', cursor: 'pointer' }} onClick={copyToClipboard} />
          </Tooltip>
        }
        value={`https://codepost.io/invite/${link['token']}`}
      />
    </div>
  );
};

export default InvitePartnersLink;

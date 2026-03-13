// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { CopyOutlined } from '@ant-design/icons';

import { colors } from '../../theme/colors';
import { Button, Input, message, Popconfirm, Tooltip } from 'antd';

import { hostname } from '../../serviceWorker';

import type {
  AssignmentStudentType,
  AssignmentType,
  StudentSubmissionType,
  SubmissionInfoType,
} from '../../types/models';

import type { SubmissionPartnerLinkResponse } from '../../api-client';
import { Submission } from '../../services/submission';

interface IInvitePartnersLinkProps {
  assignment?: AssignmentType | AssignmentStudentType | { allowStudentUploadWithPartners?: boolean };
  submission?: StudentSubmissionType | SubmissionInfoType;
}

const InvitePartnersLink = (props: IInvitePartnersLinkProps) => {
  const [link, setLink] = React.useState<SubmissionPartnerLinkResponse | undefined>(undefined);
  const host = hostname();

  React.useEffect(() => {
    const getPartnerLink = async () => {
      if (
        props.assignment !== undefined &&
        props.assignment.allowStudentUploadWithPartners &&
        props.submission !== undefined
      ) {
        setLink(undefined);
        try {
          const data = await Submission.readPartnerLink(props.submission.id);
          setLink(data);
        } catch {
          setLink(undefined);
        }
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

  const cancel = () => {
    return;
  };

  const confirm = async () => {
    if (props.submission === undefined || props.submission.students === undefined) {
      return;
    }

    await Submission.removePartner(props.submission.id);

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const hasPartners = props.submission.students !== undefined && props.submission.students.length > 1;

  return (
    <div>
      <div style={{ padding: '24px 0px' }}>
        <Input
          id="invite-link"
          addonBefore="Partner Invite Link"
          addonAfter={
            <Tooltip title="Copy link">
              <CopyOutlined style={{ color: colors.actionBlue, cursor: 'pointer' }} onClick={copyToClipboard} />
            </Tooltip>
          }
          value={`${host}/invite/${props.submission.id}/${link['token']}`}
        />
      </div>
      {hasPartners ? (
        <div style={{ padding: '0px 0px' }}>
          <Popconfirm
            title="Are you sure you want to remove yourself from this submission?"
            onConfirm={confirm}
            onCancel={cancel}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button danger>Remove myself</Button>
          </Popconfirm>
        </div>
      ) : null}
    </div>
  );
};

export default InvitePartnersLink;

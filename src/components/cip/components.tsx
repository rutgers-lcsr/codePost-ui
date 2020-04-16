/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Modal, Input, Checkbox, Popover } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

/* other library imports */
import Select from 'react-select';

/* internal imports */
import Video from '../landing/Video';
import universities from '../pre-auth/universities';

interface IProps {
  visible: boolean;
  onClose: () => void;
  email: string;
}

const CIPAdminModal = (props: IProps) => {
  const [p1, setp1] = React.useState('');
  const [p2, setp2] = React.useState('');
  const [terms, setTerms] = React.useState(false);
  const [panel, setPanel] = React.useState(0);

  const onContinue = () => {
    if (panel < 2) {
      setPanel(panel + 1);
    } else {
      props.onClose();
    }
  };

  let detail;
  switch (panel) {
    case 0:
      detail = (
        <span>
          First, to use codePost independently of Code in Place, you'll need to set a codePost account.
          <br />
          <br />
          <Input style={{ width: 500 }} addonBefore="Your email" value={props.email} disabled={true} /> &nbsp;{' '}
          <Popover content={<a>Close</a>}>
            <a>Want to use a different email?</a>
          </Popover>
          <br />
          <br />
          <div style={{ width: 500 }}>
            <Select
              placeholder={
                <div>
                  <TeamOutlined style={{ color: 'rgba(0,0,0,.25)' }} />
                  &nbsp; Select your organization (type to search)
                </div>
              }
              options={universities}
            />
          </div>
          <br />
          <br />
          <Checkbox checked={terms} onChange={() => setTerms(!terms)} /> &nbsp; I agree to the codePost{' '}
          <a href="/terms" target="_blank">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank">
            Privacy Policy
          </a>
          <br />
          <br />
        </span>
      );
      break;
    case 1:
      detail = (
        <span>
          Check out the video below to learn the basis of codePost. You can skip around to sections that interest you on
          the right. <br />
          <br /> <Video containerWidth={1100} location="" />
        </span>
      );
      break;
    case 2:
      detail = (
        <span>
          Now you're ready to get started with codePost! <br />
          <br /> <Button type="primary">Create your first course</Button> &nbsp; OR &nbsp;{' '}
          <Button>Create a demo course</Button>
        </span>
      );
      break;
  }

  let canContinue = true;
  if (panel === 0) {
    if (!(p1 === p2 && terms)) {
      canContinue = false;
    }
  }

  return (
    <Modal
      width={1000}
      title="Create a new course"
      visible={props.visible}
      onCancel={props.onClose}
      footer={[
        <Button disabled={!canContinue} onClick={onContinue}>
          Continue
        </Button>,
      ]}
    >
      {detail}
    </Modal>
  );
};

export { CIPAdminModal };

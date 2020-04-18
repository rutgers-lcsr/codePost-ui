/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Modal, notification, Input, Checkbox, Popover } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

/* other library imports */
import Select from 'react-select';

/* internal imports */
import Video from '../landing/Video';
import universities from '../pre-auth/universities';
import { createDemoCourse } from '../utils/DemoCourse';
import { CourseType } from '../../infrastructure/types';
import { IOption } from '../../types/common';

/**********************************************************************************************************************/

interface IAdminModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateCourse: () => void;
  onCreateDemoCourse: (course?: CourseType) => void;
  email: string;
}

const CIPAdminModal = (props: IAdminModalProps) => {
  const [p1, setp1] = React.useState('');
  const [p2, setp2] = React.useState('');
  const [terms, setTerms] = React.useState(false);
  const [panel, setPanel] = React.useState(0);
  const [loadingDemo, setLoadingDemo] = React.useState(false);
  const [org, setOrg] = React.useState<IOption | undefined>(undefined);

  const onContinue = () => {
    if (panel === 0) {
      setCreds();
    }

    if (panel < 2) {
      setPanel(panel + 1);
    } else {
      props.onClose();
    }
  };

  const onBack = () => {
    setPanel(Math.max(1, panel - 1));
  };

  const setCreds = () => {
    const payload = {
      password1: p1,
      password2: p2,
      organization: org!.value,
    };

    fetch(`${process.env.REACT_APP_API_URL}/registration/setCredentials/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')} `,
      },
      body: JSON.stringify(payload),
      method: 'POST',
    })
      .then((res) => {
        if (res.ok || res.status === 400) {
          return res.json();
        } else {
          return Promise.reject();
        }
      })
      .then((json) => {
        console.log(json);
      });
  };

  const handleDemoCourse = () => {
    setLoadingDemo(true);
    createDemoCourse(props.email, `${props.email.split('@')[0]}'s course`, props.email.split('@')[1]).then(
      (course: CourseType) => {
        setLoadingDemo(false);
        props.onCreateDemoCourse(course);
      },
    );

    // call prop function which triggers tour here
  };

  let detail;
  let modalSize = 1000;
  switch (panel) {
    case 0:
      detail = (
        <span>
          First, to use codePost independently of Code in Place, you'll need to set a codePost account.
          <br />
          <br />
          <Input style={{ width: 500 }} addonBefore="Your email" value={props.email} disabled={true} /> &nbsp;{' '}
          <Popover
            title="Use a different email"
            content={
              <span>
                <span>Using a different email will dissociate your</span>
                <br />
                <span>Code in Place codePost account from your new codePost</span>
                <br />
                <span>account.</span>
                <br />
                <br />
                <span>
                  If you want to do this, create a new account <a href="/signup/create">here</a>.
                </span>
              </span>
            }
          >
            <a>Want to use a different email?</a>
          </Popover>
          <br />
          <br />
          <Input.Password style={{ width: 500 }} addonBefore="Password" onChange={(e) => setp1(e.target.value)} />
          &nbsp; You'll use this password to login into codePost directly. &nbsp; <br />
          <br />
          <Input.Password style={{ width: 500 }} addonBefore="Confirm" onChange={(e) => setp2(e.target.value)} /> &nbsp;
          {p2.length > 0 && p1 !== p2 && <span style={{ color: 'red' }}>Passwords don't match</span>}
          <br />
          <br />
          <div style={{ width: 500, display: 'inline-block' }}>
            <Select
              placeholder={
                <div>
                  <TeamOutlined style={{ color: 'rgba(0,0,0,.25)' }} />
                  &nbsp; Select your organization (type to search)
                </div>
              }
              options={universities}
              onChange={(newVal: IOption) => setOrg(newVal)}
            />
          </div>{' '}
          &nbsp; Use your permanent institution, not Stanford or Code in Place.
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
      modalSize = 1000;
      break;
    case 1:
      detail = (
        <span>
          Check out the video below to learn the basis of codePost. You can skip around to sections that interest you on
          the right. <br />
          <br /> <Video containerWidth={1600} location="" />
        </span>
      );
      modalSize = 1600;
      break;
    case 2:
      detail = (
        <span>
          Now you're ready to get started with codePost! <br />
          <br />{' '}
          <Button disabled={loadingDemo} type="primary" onClick={props.onCreateCourse}>
            Create your first course
          </Button>{' '}
          &nbsp; OR &nbsp;{' '}
          <Button loading={loadingDemo} onClick={handleDemoCourse}>
            Create a demo course
          </Button>
        </span>
      );
      modalSize = 600;
      break;
  }

  let canContinue = true;
  if (panel === 0) {
    if (!(p1 === p2 && terms && org)) {
      canContinue = false;
    }
  }

  return (
    <Modal
      width={modalSize}
      title="Create a new course"
      visible={props.visible}
      onCancel={props.onClose}
      footer={[
        panel > 1 && <Button onClick={onBack}>Back</Button>,
        <Button disabled={!canContinue} onClick={onContinue}>
          Continue
        </Button>,
      ]}
    >
      {detail}
    </Modal>
  );
};

interface IGraderModalProps {
  visible: boolean;
  onClose: () => void;
}

const CIPGraderModal = (props: IGraderModalProps) => {
  const goToAdminConsole = () => {
    // window.open(`https://codepost.io/admin?source=j348d&token=${localStorage.getItem('token')}`);
    window.open(`http://localhost:3000/admin?source=j348d&token=${localStorage.getItem('token')}`);
  };

  const elevateStatusAndGo = () => {
    fetch(`${process.env.REACT_APP_API_URL}/registration/graderToAdmin/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${localStorage.getItem('token')} `,
      },
      body: JSON.stringify({}),
      method: 'POST',
    })
      .then((res) => {
        if (res.ok || res.status === 400) {
          return res.json();
        } else {
          return Promise.reject();
        }
      })
      .then((json) => {
        notification.success({
          message: 'Course created',
          description: 'Vist the newly opened codePost tab to check it out.',
          duration: null,
        });
        props.onClose();
        goToAdminConsole();
      });
  };

  return (
    <Modal
      visible={props.visible}
      title="Using codePost for your course"
      onCancel={props.onClose}
      footer={[<Button onClick={props.onClose}>Maybe later</Button>]}
      width={700}
    >
      <div style={{ fontSize: 17 }}>
        If you want to use codePost for a course outside of Code in Place, you can!
        <span style={{ fontWeight: 500 }}> It's freely available for not-for-profit universities and high schools</span>
        .
        <br />
        <br />
        When you click the button below, you'll be taken to another screen where you can set up your own course or play
        around with a demo course.
        <br />
        <br />
        It takes {`<`} 5 minutes to set up, and{' '}
        <a href="https://www.codepost.io/testimonials" target="_blank">
          instructors seem to love it!
        </a>
        <br />
        <br />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button onClick={elevateStatusAndGo} type="primary" size="large">
          Create a course
        </Button>
      </div>
    </Modal>
  );
};

export { CIPAdminModal, CIPGraderModal };

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Modal, notification, Input, Checkbox, Select, Switch, message, Popover } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

/* other library imports */
// import Select from 'react-select';

/* internal imports */
import Video from '../landing/Video';
import universities from '../pre-auth/universities';
import { createDemoCourse } from '../utils/DemoCourse';
import { CourseType } from '../../infrastructure/types';
import { IOption } from '../../types/common';

import { sendSlack } from '../core/slack';

import { UserType } from '../../infrastructure/user';
import useWindowSize from '../core/useWindowSize';

/**********************************************************************************************************************/

interface IAdminModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateCourse: () => void;
  onCreateDemoCourse: (course?: CourseType) => void;
  user: UserType;
}

enum CIP_NOTIFICATION {
  inProgress,
  error,
  success,
}

const slackCIPNotification = (email: string, message: string, type: CIP_NOTIFICATION) => {
  let color;
  switch (type) {
    case CIP_NOTIFICATION.inProgress:
      color = '#f7f7f7';
      break;
    case CIP_NOTIFICATION.error:
      color = '#fc4903';
      break;
    case CIP_NOTIFICATION.success:
      color = '#24be85';
      break;
  }
  sendSlack(email, message, color, '#cip-sl-notifications');
};

const CIPAdminModal = (props: IAdminModalProps) => {
  const [p1, setp1] = React.useState('');
  const [p2, setp2] = React.useState('');
  const [terms, setTerms] = React.useState(false);
  const [panel, setPanel] = React.useState(props.user.hasCredentials ? 1 : 0);
  const [loadingDemo, setLoadingDemo] = React.useState(false);
  const [org, setOrg] = React.useState<string | undefined>(undefined);
  const [createOrg, setCreateOrg] = React.useState(false);
  const [errors, setErrors] = React.useState<{ [key: string]: string[] }>({});

  const windowSize = useWindowSize();

  const onContinue = async () => {
    if (panel === 0) {
      const didSucceed = await setCreds();
      if (didSucceed) {
        slackCIPNotification(props.user.email, 'Successfully set up account!', CIP_NOTIFICATION.success);
        setPanel(1);
      }
    } else if (panel == 1) {
      setPanel(2);
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
      organization: org,
    };

    return fetch(`${process.env.REACT_APP_API_URL}/registration/setCredentials/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')} `,
      },
      body: JSON.stringify(payload),
      method: 'POST',
    })
      .then((res) => {
        if (res.ok || res.status === 400) {
          return res.json();
        } else {
          return Promise.reject(res);
        }
      })
      .then((json) => {
        if (json.isValid) {
          return true;
        } else {
          setErrors(json.errors);
          return false;
        }
      })
      .catch(async (err) => {
        const errorMessage = await err.json();
        slackCIPNotification(props.user.email, `ERROR: ${JSON.stringify(errorMessage)}`, CIP_NOTIFICATION.error);
        message.error(
          `An error occured: ${JSON.stringify(
            errorMessage,
          )}. The codePost team has been notified and will be in touch shortly. Thank you for your patience!`,
          25,
        );
        return false;
      });
  };

  const handleDemoCourse = () => {
    setLoadingDemo(true);
    createDemoCourse(
      props.user.email,
      `${props.user.email.split('@')[0]}'s course`,
      props.user.email.split('@')[1],
    ).then((course: CourseType) => {
      setLoadingDemo(false);
      props.onCreateDemoCourse(course);
    });

    // call prop function which triggers tour here
  };

  const toggleCreateOrg = (e: boolean) => {
    setCreateOrg(e);
    setOrg(undefined);
  };

  let detail;
  let modalSize = 1000;
  switch (panel) {
    case 0:
      detail = (
        <span>
          First, to use codePost independently of Code in Place, you'll need to set a codePost password.
          <br />
          <br />
          <Input style={{ width: 500 }} addonBefore="Your email" value={props.user.email} disabled={true} /> &nbsp;{' '}
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
          {
            <ul>
              {Object.keys(errors).map((el, i) => {
                return errors[el].map((el2) => <li key={i}>{el2}</li>);
              })}
            </ul>
          }
          <br />
          <div style={{ width: 500, display: 'inline-block' }}>
            <Select
              placeholder={
                <div>
                  <TeamOutlined style={{ color: 'rgba(0,0,0,.25)' }} />
                  &nbsp; Select your organization (type to search)
                </div>
              }
              disabled={createOrg}
              value={createOrg ? undefined : org}
              onChange={(newVal: string) => setOrg(newVal)}
              style={{ width: '100%' }}
            >
              {universities.map((university: any) => (
                <Select.Option value={university.value}>{university.label}</Select.Option>
              ))}
            </Select>
          </div>
          &nbsp; Use your permanent institution, not Stanford or Code in Place.
          <br />
          <br />
          <span>
            Can't find your organization? Create a new one. <Switch onChange={toggleCreateOrg} />
          </span>
          {createOrg ? (
            <div>
              <br />
              <Input
                style={{ width: 500 }}
                placeholder="Your organization"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
              />
            </div>
          ) : null}
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
      modalSize = windowSize.width < 1000 ? windowSize.width : 1000;
      break;
    case 1:
      modalSize = windowSize.width < 1600 ? windowSize.width : 1600;
      detail = (
        <span>
          Check out the video below to learn the basis of codePost. You can skip around to sections that interest you on
          the right. <br />
          <br /> <Video containerWidth={modalSize} location="" />
        </span>
      );
      break;
    case 2:
      detail = (
        <span>
          Now you're ready to get started with codePost! <br />
          <br />{' '}
          <Button
            disabled={loadingDemo}
            type="primary"
            onClick={() => {
              slackCIPNotification(props.user.email, 'Course creation started.', CIP_NOTIFICATION.success);
              props.onCreateCourse();
            }}
          >
            Create your first course
          </Button>{' '}
          &nbsp; OR &nbsp;{' '}
          <Button
            loading={loadingDemo}
            onClick={() => {
              slackCIPNotification(props.user.email, 'Demo course created.', CIP_NOTIFICATION.success);
              handleDemoCourse();
            }}
          >
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
      onCancel={panel === 0 ? undefined : props.onClose}
      closable={panel !== 0}
      footer={[
        panel > 1 && <Button onClick={onBack}>Back</Button>,
        <Button disabled={!canContinue} onClick={onContinue} type="primary">
          {panel === 0 ? 'Set password' : 'Continue'}
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
  email: string;
}

const CIPGraderModal = (props: IGraderModalProps) => {
  const goToAdminConsole = () => {
    window.open(`https://codepost.io/admin?source=j348d`);
  };

  const elevateStatusAndGo = () => {
    slackCIPNotification(props.email, 'Clicked on create a course...', CIP_NOTIFICATION.inProgress);

    fetch(`${process.env.REACT_APP_API_URL}/registration/graderToAdmin/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')} `,
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
          description: `Vist the newly opened codePost tab to check it out. If you don't see a new tab open, visit www.codepost.io/admin in your browser.`,
          duration: null,
        });
        props.onClose();
        goToAdminConsole();
      });
  };

  return (
    <Modal
      visible={props.visible}
      title="Create your own course"
      onCancel={props.onClose}
      footer={[<Button onClick={props.onClose}>Maybe later</Button>]}
      width={700}
    >
      <div style={{ fontSize: 15 }}>
        <span style={{ fontWeight: 500 }}>
          {' '}
          codePost is freely available for not-for-profit universities and high schools.
        </span>
        <br />
        <br />
        When you click the button below, you'll be taken to another screen where you can set up your own course or
        explore a demo course to famliliarize yourself with codePost's functionality.
        <br />
        <br />
        If you want to learn more, you can check out what other instructors{' '}
        <a href="https://codepost.io/testimonials" target="_blank">
          have said about codePost
        </a>
        .
        <br />
        <br />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button onClick={elevateStatusAndGo} type="primary" size="large">
          Create your own course (free)
        </Button>
      </div>
    </Modal>
  );
};

export { CIPAdminModal, CIPGraderModal };

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Icon, Table, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import useWindowSize from '../core/useWindowSize';
import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

const columns = [
  {
    key: 'feature',
    title: '',
    dataIndex: 'feature',
  },
  {
    key: 'free',
    title: (
      <span>
        <Typography.Title level={4}>Standard</Typography.Title>
        <span>For courses large and small</span>
      </span>
    ),
    dataIndex: 'free',
  },
  {
    key: 'enterprise',
    title: (
      <span>
        <Typography.Title level={4}>Enterprise</Typography.Title>
        <span>For large businesses with custom requirements</span>
      </span>
    ),
    dataIndex: 'enterprise',
  },
];

const data = [
  {
    feature: 'Users (students, graders, admins)',
    free: 'Unlimited',
    gold: 'Unlimited',
    enterprise: 'Unlimited',
  },
  {
    feature: 'Rubrics',
    free: <Icon type="check" />,
    gold: <Icon type="check" />,
    enterprise: <Icon type="check" />,
  },
  {
    feature: 'Autograder',
    free: 'Standard machines (1x CPU, 1GB memory)',
    gold: <Icon type="check" />,
    enterprise: 'Faster machines (2x CPU, 4GB memory)',
  },
  {
    feature: 'codePost API Access',
    free: 'Up to 1000 requests / day',
    gold: <Icon type="check" />,
    enterprise: <Icon type="check" />,
  },
  {
    feature: 'Support',
    free: 'Email and chat (24 hour response)',
    gold: 'Dedicated (4 hour response)',
    enterprise: 'Dedicated (4 hour response)',
  },
  {
    feature: 'On-premise deployment',
    free: '',
    gold: '',
    enterprise: <Icon type="check" />,
  },
  {
    feature: 'Custom system integration',
    free: '',
    gold: '',
    enterprise: <Icon type="check" />,
  },
  {
    feature: 'Price',
    free: 'Free!',
    gold: '$3 / student',
    enterprise: 'Starts at $3 / student / month †',
  },
  {
    feature: 'Get started',
    free: <Button type="primary">Sign up</Button>,
    gold: <Button>Contact us</Button>,
    enterprise: <Button>Contact us</Button>,
  },
];

const Pricing = (props: IProps) => {
  const breakpoint = 700;
  const windowSize = useWindowSize();
  const flexDirection = windowSize.width < breakpoint ? 'column' : 'row';

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div>
        <div className="display-flex justify-content-center" style={{ width: '100%' }}>
          <Typography.Title level={3}>
            codePost is free for as many students as you need. No credit card required.
          </Typography.Title>
        </div>
        <br />
        <div className="display-flex flex-direction-column" style={{ textAlign: 'center', position: 'relative' }}>
          <Table columns={columns} dataSource={data} pagination={false} />
          <br />
          <span style={{ display: 'flex', alignItems: 'left', textAlign: 'left' }}>
            † Students will be counted towards your monthly bill if they login to codePost in that month. Each student
            is only counted for billing once (they can be a member of any number of courses).
          </span>
        </div>
      </div>
    </PreAuthLayout>
  );
};

export default Pricing;

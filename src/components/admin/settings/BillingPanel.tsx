/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { RedoOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Input, message, Select, Statistic, Switch, Table, Tag, Typography } from 'antd';
import { FormComponentProps } from '@ant-design/compatible/lib/form';

import CPButton from '../../../components/core/CPButton';
import CPAdminDetail from '../other/CPAdminDetail';

/* codePost imports */
import { CoursePatchType, CourseType } from '../../../infrastructure/course';
import InputNumberOrNull from './InputNumberOrNull';

import { timezones } from '../other/timezones';

type alignType = 'left' | 'right' | 'center';

const { Text, Title } = Typography;

/**********************************************************************************************************************/

interface IProps {
  currentCourse: CourseType;
}

const BillingPanel = (props: IProps) => {
  const [details, setDetails] = React.useState<any>({});

  React.useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const urlSession = urlParams.get('session_id');
    if (urlSession) {
      if (!!urlSession) {
        if (urlSession === 'cancel') {
          message.error('Payment cancelled.');
        } else {
          message.success('Payment submitted successfully. Please wait for it to appear in the billing history.');
        }
        window.history.replaceState({ page: window.location.pathname }, document.title, window.location.pathname);
      }
    }
  }, []);

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/billing/${props.currentCourse.id}/details/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })
      .then((res) => {
        console.log(res);
        if (res.ok) {
          return res.json();
        }
        return {};
      })
      .then((data) => {
        setDetails(data);
        console.log(data);
      });
  }, []);

  const createCheckoutSession = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/billing/${props.currentCourse.id}/create_checkout_session/`,
      {
        headers: {
          Authorization: `JWT ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      },
    );

    if ((await res.status) === 200) {
      const data = await res.json();

      if (data.url) {
        window.open(data.url, '_self');
      } else {
        message.error('Something went wrong.');
      }

      return Promise.resolve(data);
    } else {
      const data = await res.json();
      message.error(JSON.stringify(data));
      return Promise.reject(data);
    }
  };

  let action = null;

  if (details && details.total_paid_students) {
    if (details.total_paid_students >= details.total_active_students && details.total_paid_students > 0) {
      action = (
        <CPButton loading={false} cpType="primary" onClick={() => {}} disabled={true}>
          Thank you for supporting codePost!
        </CPButton>
      );
    } else if (details.total_paid_students < details.total_active_students && details.total_paid_students > 0) {
      action = (
        <CPButton loading={false} cpType="primary" onClick={createCheckoutSession} disabled={false}>
          Click here to pay
        </CPButton>
      );
    } else {
      action = null;
    }
  }
  action = (
    <CPButton loading={false} cpType="primary" onClick={createCheckoutSession} disabled={false}>
      Click here to pay
    </CPButton>
  );

  const content = (
    <div>
      <div style={{ display: 'flex' }}>
        <Statistic title="Total Active Students" value={details && details.total_active_students} />
        <div style={{ width: 20 }} />
        <Statistic title="Total Paid Students" value={details && details.total_paid_students} />
      </div>
      <br />
      {action}
      <br />
      <br />
      {details && details.payment_intents && details.payment_intents.length > 0 ? (
        <Table
          title={() => <Title level={4}>Billing History</Title>}
          bordered={true}
          columns={[
            {
              title: 'Amount',
              dataIndex: 'amount',
              key: 'amount',
              align: 'center' as alignType,
              render: (amount: number) => {
                return <Text>${amount / 100}</Text>;
              },
            },
            {
              title: 'Students',
              dataIndex: 'students',
              key: 'students',
              align: 'center' as alignType,
              render: (students: number) => {
                return <Text>{students}</Text>;
              },
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              align: 'center' as alignType,
              render: (status: string) => {
                return <Tag>{status}</Tag>;
              },
            },
            {
              title: 'Date',
              dataIndex: 'created',
              key: 'created',
              align: 'center' as alignType,
              render: (created: string) => {
                return <Text>{created}</Text>;
              },
            },
            {
              title: 'Receipt sent to',
              dataIndex: 'receipt_email',
              key: 'receipt_email',
              align: 'center' as alignType,
              render: (receipt_email: string) => {
                return <Text>{receipt_email}</Text>;
              },
            },
          ]}
          dataSource={details.payment_intents}
          pagination={false}
        />
      ) : null}
    </div>
  );

  return (
    <CPAdminDetail
      goBack={null}
      title={`Billing details for course: ${props.currentCourse.name} | ${props.currentCourse.period}`}
      actions={[]}
      content={content}
    />
  );
};

export default BillingPanel;

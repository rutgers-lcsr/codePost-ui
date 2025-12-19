/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Alert, message, Modal, Statistic, Table, Tag, Tooltip, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';
import CPAdminDetail from '../other/CPAdminDetail';

/* codePost imports */
import { CourseType } from '../../../infrastructure/course';

type alignType = 'left' | 'right' | 'center';

const { Text, Title } = Typography;

/**********************************************************************************************************************/

interface IProps {
  currentCourse: CourseType;
}

const BillingPanel = (props: IProps) => {
  const [details, setDetails] = React.useState<any>({});
  // const [showWaiver, setShowWaiver] = React.useState(false);

  React.useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const urlSession = urlParams.get('session_id');
    if (urlSession) {
      if (urlSession) {
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
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return {};
      })
      .then((data) => {
        setDetails(data);
      });
  }, []);

  const requestWaiver = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/billing/${props.currentCourse.id}/request_waiver/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if ((await res.status) === 200) {
      message.success('Waiver requested successfully.');
    } else {
      message.error('Something went wrong.');
    }
  };

  const createCheckoutSession = async (plan_type: string) => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/billing/${props.currentCourse.id}/create_checkout_session/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ plan_type: plan_type }),
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

  const createCheckoutSessionCore = async () => {
    await createCheckoutSession('core');
  };

  const createCheckoutSessionPro = async () => {
    await createCheckoutSession('pro');
  };

  let action = null;

  if (details) {
    if (details.show_payment_buttons === false) {
      action = (
        <CPButton loading={false} cpType="primary" onClick={() => {}} disabled={true}>
          Thank you for supporting codePost!
        </CPButton>
      );
    } else {
      action = (
        <div>
          <div>
            {details.waiver_requested ? (
              <Text strong>Payment waiver approved.</Text>
            ) : details.total_paid_cents > 0 ? (
              <Text>Please choose your plan. You will only be billed for students added since the last payment.</Text>
            ) : (
              <Text strong>Please choose your plan.</Text>
            )}
          </div>
          <div style={{ display: 'flex' }}>
            <Tooltip title={'Includes all features except for the autograder.'}>
              <CPButton loading={false} cpType="primary" onClick={createCheckoutSessionCore} disabled={false}>
                $1 per student for codePost core
              </CPButton>
            </Tooltip>
            <div style={{ width: '20px' }}></div>
            <Tooltip title={'Includes all features including the autograder.'}>
              <CPButton loading={false} cpType="primary" onClick={createCheckoutSessionPro} disabled={false}>
                $4 per student for codePost autograder
              </CPButton>
            </Tooltip>
          </div>
        </div>
      );
    }
  }

  const info = () => {
    Modal.info({
      title: "codePost's new pricing",
      content: (
        <div>
          <p>
            Over the last five years, codePost has supported thousands of courses and instructors teach programming
            better. As codePost has grown, so have the costs associated with running it.
          </p>
          <p>
            To that end, we are introducing what we believe is the simplest and fairest pricing model going forward for
            codePost:{' '}
            <ul>
              <li>
                <b>$1 per student per course</b> for courses that don't use the autograder, and
              </li>
              <li>
                <b>$4 per student per course</b> for those that do
              </li>
            </ul>
          </p>
          <p>
            As the best teaching tool on the market, codePost's goal is to remain accessible to as many students and
            instructors as possible. If your class or institution is unable to pay, please request a waiver:
          </p>
          <p>
            <span style={{ color: 'blue', cursor: 'pointer' }} onClick={waiver}>
              One-click waiver request
            </span>
          </p>
          <p>We will be happy to automatically waive the fee.</p>
          <p>Thank you for being a codePost user and supporter!</p>
          <p>Sincerely,</p>
          <p>The codePost Team</p>
        </div>
      ),
      onOk() {},
    });
  };

  const waiver = () => {
    Modal.info({
      title: 'Request waiver',
      okText: 'Request waiver',
      cancelText: 'Cancel',
      okCancel: true,
      content: (
        <div>
          <p>
            At codePost, our mission is to make our platform accessible to all educators and students, regardless of
            financial constraints. We are committed to supporting diversity, equity, and inclusion in education.
          </p>
          <p>
            For your convenience, we offer a streamlined waiver process. By clicking the "Request Waiver" button below,
            your waiver will be automatically approved, ensuring that you can set up your course without any delays.
          </p>
          <p>
            Please note that we may track and share the names of institutions benefiting from our waiver program to
            showcase our commitment to accessibility and to inspire others to support equitable access to educational
            resources. In rare cases where we identify a pattern of waiver misuse, we may need to limit future waivers
            to ensure the program's sustainability and fairness for all users.
          </p>
          <p>By proceeding with the waiver request, you agree to these terms.</p>
          <p>Thank you for using codePost!</p>
        </div>
      ),
      onOk() {
        requestWaiver();
      },
      onCancel() {},
    });
  };

  const content = (
    <div>
      <Alert
        style={{ width: 'fit-content', cursor: 'pointer' }}
        onClick={info}
        message="Read more about codePost's new pricing"
        type="info"
        showIcon
      />
      <br />
      <div style={{ display: 'flex' }}>
        <Statistic title="Total Active Students" value={details && details.total_active_students} />
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

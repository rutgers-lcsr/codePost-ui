/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useState } from 'react';

import { CheckCircleOutlined } from '@ant-design/icons';

/* ant imports */
import { Button, Form, Input } from 'antd';

/* codePost imports */

export const EmailSubscribe: React.FC = () => {
  const [form] = Form.useForm();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribe = (email: string) => {
    const payload = {
      email,
    };

    fetch(`${process.env.REACT_APP_API_URL}/subscribe/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        } else {
          return Promise.reject(res.status);
        }
      })
      .catch((_err) => {
        console.log('.');
      });
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        subscribe(values.email);
        setTimeout(() => {
          setSubscribed(true);
          setLoading(false);
        }, 1000);
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  const input = subscribed ? (
    <div style={{ flexGrow: 1, fontSize: '14px', fontWeight: 500 }}>Welcome! Stay tuned...</div>
  ) : (
    <div style={{ flexGrow: 1 }}>
      <Form.Item
        name="email"
        rules={[
          {
            type: 'email',
            message: 'The input is not valid email',
          },
          {
            required: true,
            message: 'Please input your email',
          },
        ]}
      >
        <Input style={{ width: '285px' }} placeholder="email" />
      </Form.Item>
    </div>
  );

  const submit = subscribed ? (
    <div style={{ paddingLeft: '14px' }}>
      <Button type="primary" icon={<CheckCircleOutlined />} disabled={true} style={{ width: '100px' }} />
    </div>
  ) : (
    <div style={{ paddingLeft: '14px' }}>
      <Form.Item>
        <Button htmlType="submit" loading={loading}>
          Subscribe
        </Button>
      </Form.Item>
    </div>
  );

  return (
    <Form form={form} onFinish={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '22px', color: '#666666' }}>Want to stay in touch?</div>
          <div style={{ fontSize: '18px', color: '#666666' }}>Subscribe for new feature announcements.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {input}
          {submit}
        </div>
      </div>
    </Form>
  );
};

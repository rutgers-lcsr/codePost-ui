/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { CheckCircleOutlined } from '@ant-design/icons';

import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';

/* ant imports */
import { Input, Button } from 'antd';

/* codePost imports */

interface IEmailSubscribeFormState {
  subscribed: boolean;
  loading: boolean;
}

class EmailSubscribeForm extends React.Component<any, IEmailSubscribeFormState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      subscribed: false,
      loading: false,
    };
  }

  public subscribe = (email: string) => {
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
      .catch((err) => {
        console.log('.');
      });
  };

  public handleSubmit = (e: any) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err: any, values: any) => {
      if (!err) {
        this.setState({ loading: true });
        this.subscribe(values.email);
        setTimeout(() => {
          this.setState({ subscribed: true, loading: false });
        }, 1000);
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    const input = this.state.subscribed ? (
      <div style={{ flexGrow: 1, fontSize: '14px', fontWeight: 500 }}>Welcome! Stay tuned...</div>
    ) : (
      <div style={{ flexGrow: 1 }}>
        <Form.Item>
          {getFieldDecorator('email', {
            rules: [
              {
                type: 'email',
                message: 'The input is not valid email',
              },
              {
                required: true,
                message: 'Please input your email',
              },
            ],
          })(<Input style={{ width: '285px' }} placeholder="email" />)}
        </Form.Item>
      </div>
    );

    const submit = this.state.subscribed ? (
      <div style={{ paddingLeft: '14px' }}>
        <Button type="primary" icon={<CheckCircleOutlined />} disabled={true} style={{ width: '100px' }} />
      </div>
    ) : (
      <div style={{ paddingLeft: '14px' }}>
        <Form.Item>
          <Button htmlType="submit" loading={this.state.loading}>
            Subscribe
          </Button>
        </Form.Item>
      </div>
    );

    return (
      <Form onSubmit={this.handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '22px', color: '#8a8a8a' }}>Want to stay in touch?</div>
            <div style={{ fontSize: '18px', color: '#A3A3A3' }}>Subscribe for new feature announcements.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {input}
            {submit}
          </div>
        </div>
      </Form>
    );
  }
}

export const EmailSubscribe = Form.create({ name: 'subscribe' })(EmailSubscribeForm);

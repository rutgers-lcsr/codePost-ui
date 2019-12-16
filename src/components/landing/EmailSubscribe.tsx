/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Form, Input, Button } from 'antd';

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
        console.log('values', values);
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
          })(<Input placeholder="email" />)}
        </Form.Item>
      </div>
    );

    const submit = this.state.subscribed ? (
      <div style={{ paddingLeft: '14px' }}>
        <Button type="primary" icon="check-circle" disabled={true} style={{ width: '100px' }} />
      </div>
    ) : (
      <div style={{ paddingLeft: '14px' }}>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={this.state.loading}>
            Subscribe!
          </Button>
        </Form.Item>
      </div>
    );

    return (
      <Form onSubmit={this.handleSubmit}>
        <div style={{ fontWeight: 500 }}>Enter your email to receive codePost product updates:</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {input}
          {submit}
        </div>
      </Form>
    );
  }
}

export const EmailSubscribe = Form.create({ name: 'subscribe' })(EmailSubscribeForm);

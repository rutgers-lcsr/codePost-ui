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

  public handleSubmit = (e: any) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err: any, values: any) => {
      if (!err) {
        this.setState({ loading: true });
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
          })(<Input placeholder="Enter your email to receive codePost product updates" />)}
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {input}
          {submit}
        </div>
      </Form>
    );
  }
}

export const EmailSubscribe = Form.create({ name: 'subscribe' })(EmailSubscribeForm);

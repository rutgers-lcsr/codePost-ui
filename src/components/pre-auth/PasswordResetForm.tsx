/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Form, Input } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

/**********************************************************************************************************************/

interface IProps extends FormComponentProps {
  handleSubmit: (password: string) => void;
}

const ForgotPasswordForm: any = Form.create({ name: 'form' })(
  class extends React.Component<IProps, {}> {
    public handleSubmit = (e: any) => {
      e.preventDefault();
      this.props.form.validateFields((err, values) => {
        if (!err) {
          this.props.handleSubmit(values.password1);
        }
      });
    };

    public doPasswordsMatch = (rule: any, value: any, callback: any) => {
      // Test 1: Do the passwords match?
      if (this.props.form.getFieldValue('password1') !== value) {
        callback("Passwords don't match!");
      }

      // Call callback with no arguments to signal that value passed validation
      callback();
    };

    public render() {
      const { form } = this.props;
      const { getFieldDecorator } = form;
      return (
        <Form layout="horizontal" hideRequiredMark={true} onSubmit={this.handleSubmit}>
          <Form.Item label="Password">
            {getFieldDecorator('password1', {
              validateTrigger: 'onBlur',
              validateFirst: true,
              rules: [
                { required: true, message: 'Please enter a password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ],
            })(<Input.Password />)}
          </Form.Item>
          <Form.Item label="Confirm password">
            {getFieldDecorator('password2', {
              validateFirst: true,
              rules: [
                { required: true, message: 'Please confirm your password' },
                { validator: this.doPasswordsMatch },
              ],
            })(<Input.Password />)}
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              disabled={
                this.props.form.getFieldValue('password1') !== this.props.form.getFieldValue('password2') ||
                this.props.form.getFieldValue('password1') === undefined
              }
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      );
    }
  },
);

export default ForgotPasswordForm;

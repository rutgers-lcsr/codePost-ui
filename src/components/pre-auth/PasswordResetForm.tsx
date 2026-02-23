// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Form, Input } from 'antd';

/**********************************************************************************************************************/

interface IProps {
  handleSubmit: (password: string) => void;
}

const ForgotPasswordForm: React.FC<IProps> = ({ handleSubmit }) => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    handleSubmit(values.password1);
  };

  const doPasswordsMatch = (_: any, value: string) => {
    // Test 1: Do the passwords match?
    if (form.getFieldValue('password1') !== value) {
      return Promise.reject(new Error("Passwords don't match!"));
    }
    return Promise.resolve();
  };

  const password1 = Form.useWatch('password1', form);
  const password2 = Form.useWatch('password2', form);

  return (
    <Form form={form} layout="horizontal" requiredMark={false} onFinish={onFinish}>
      <Form.Item
        label="Password"
        name="password1"
        validateTrigger="onBlur"
        validateFirst
        rules={[
          { required: true, message: 'Please enter a password' },
          { min: 8, message: 'Password must be at least 8 characters' },
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="Confirm password"
        name="password2"
        validateFirst
        rules={[{ required: true, message: 'Please confirm your password' }, { validator: doPasswordsMatch }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" disabled={password1 !== password2 || password1 === undefined}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ForgotPasswordForm;

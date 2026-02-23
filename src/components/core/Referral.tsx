// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useState } from 'react';

import { HeartFilled } from '@ant-design/icons';

import { Form, Input, message, Modal, Radio, theme } from 'antd';

import { colors } from '../../theme/colors';
import { sendSlack } from './slack';

import type { UserType } from '../../types/models';

import { trackFeature } from '../utils/Fullstory';

import CPTooltip from './CPTooltip';

type ThemeType = 'light' | 'dark';

interface IProps {
  user: UserType;
  theme: ThemeType;
}

interface IFormValues {
  course: string;
  instructor: string;
  email?: string;
  description?: string;
  canUseReferralName: string;
}

const Referral = (props: IProps) => {
  const { token } = theme.useToken();
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (visible) {
      trackFeature('Referral', {});
    }
  }, [visible]);

  const isGrader = props.user.graderCourses.length > 0;
  const isAdmin = props.user.courseadminCourses.length > 0;

  let text;
  if (isAdmin) {
    text = (
      <div>
        If you've enjoyed using codePost, please consider recommending us to any of your colleagues whom you think could
        benefit from our tool. Referrals are our best way to reach new users, and we really appreciate the support :)
      </div>
    );
  } else if (isGrader) {
    text = (
      <div>
        If you like using codePost to review student work and wish another of your courses used our tool, please let us
        know! Referrals mean the world to us :)
      </div>
    );
  } else {
    text = (
      <div>
        If you like the quality of feedback that your instructors can provide with codePost and wish another of your
        courses used our tool, please let us know! Referrals from students mean so much to us :)
      </div>
    );
  }

  const changeVisible = () => {
    setVisible(!visible);
  };

  const submitReferral = () => {
    form
      .validateFields()
      .then((values: IFormValues) => {
        sendSlack(
          `Course referral from ${props.user.email}`,
          `Course: ${values.course}\nInstructor: ${values.instructor}\nEmail: ${
            values.email || ''
          }\nDescription: ${values.description || ''}\nCan use name in referral: ${values.canUseReferralName}`,
          colors.brandPrimary,
          '#user_referrals',
        );
        setVisible(false);
        form.resetFields();
        message.success('Thank you for your support! The codePost team will reach out to the course you suggested.');
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <div>
      <ReferralForm form={form} open={visible} submit={submitReferral} onCancel={changeVisible} text={text} />
      <CPTooltip title="Know another course that might find codePost useful? Let us know!">
        <HeartFilled
          onClick={changeVisible}
          style={{
            color: props.theme === 'light' ? token.colorTextSecondary : token.colorTextLightSolid,
            cursor: 'pointer',
          }}
        />
      </CPTooltip>
    </div>
  );
};

interface IFormProps {
  form: any;
  open: boolean;
  submit: () => void;
  onCancel: () => void;
  text: React.ReactNode;
}

const ReferralForm: React.FC<IFormProps> = ({ form, open, onCancel, submit, text }) => {
  const { token } = theme.useToken();
  return (
    <Modal width={525} open={open} title="Refer a course to codePost" okText="Submit" onCancel={onCancel} onOk={submit}>
      <div style={{ fontSize: 14, color: token.colorTextSecondary }}>{text}</div>
      <br />
      <Form form={form} layout="vertical">
        <Form.Item
          label="Course name"
          name="course"
          rules={[{ required: true, message: 'Please let us know which course you think would find codePost useful.' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Who should we reach out to?">
          <div className="display-flex align-items-center">
            <Form.Item
              name="instructor"
              noStyle
              rules={[{ required: true, message: 'Please let us know the person we should reach out to!' }]}
            >
              <Input placeholder="Name" />
            </Form.Item>
            <Form.Item name="email" noStyle>
              <Input style={{ marginLeft: 10 }} placeholder="Email (optional)" />
            </Form.Item>
          </div>
        </Form.Item>
        <Form.Item label="Why do you think codePost might be helpful for this course? (optional)" name="description">
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          label="Can we let this person know that you referred him/her to codePost?"
          name="canUseReferralName"
          style={{ textAlign: 'center' }}
          rules={[{ required: true, message: "Please let us know if you'd like us to keep this anonymous." }]}
        >
          <Radio.Group className="display-flex justify-content-center">
            <Radio value="Yes">Yes!</Radio>
            <Radio value="No">No. Please keep me anonymous.</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Referral;

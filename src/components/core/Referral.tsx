import React, { useState } from 'react';

import { HeartFilled } from '@ant-design/icons';

import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';

import { Input, message, Modal, Radio } from 'antd';
import { FormComponentProps } from '@ant-design/compatible/lib/form';

import { sendSlack } from './slack';

import { UserType } from '../../infrastructure/user';

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
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    if (visible) {
      trackFeature('Referral', {});
    }
  }, [visible]);

  let formRef: any = React.createRef();

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
    const form = formRef.props.form;
    form.validateFields((err: any, values: IFormValues) => {
      if (err) {
        return;
      }

      sendSlack(
        `Course referral from ${props.user.email}`,
        `Course: ${values.course}\nInstructor: ${values.instructor}\nEmail: ${values.email ||
          ''}\nDescription: ${values.description || ''}\nCan use name in referral: ${values.canUseReferralName}`,
        '#24be85',
        '#user_referrals',
      );
      setVisible(false);
      form.resetFields();
      message.success('Thank you for your support! The codePost team will reach out to the course you suggested.');
    });
  };

  const saveFormRef = (fRef: React.RefObject<FormComponentProps>) => {
    formRef = fRef;
  };

  return (
    <div>
      <WrappedReferralForm
        visible={visible}
        submit={submitReferral}
        wrappedComponentRef={saveFormRef}
        onCancel={changeVisible}
        text={text}
      />
      <CPTooltip title="Know another course that might find codePost useful? Let us know!">
        <HeartFilled
          onClick={changeVisible}
          style={{ color: props.theme === 'light' ? 'grey' : 'white', cursor: 'pointer' }}
        />
      </CPTooltip>
    </div>
  );
};

interface IFormProps extends FormComponentProps {
  visible: boolean;
  submit: () => void;
  onCancel: () => void;
  text: React.ReactNode;
}

class ReferralForm extends React.Component<IFormProps, {}> {
  public constructor(props: IFormProps) {
    super(props);
  }

  render() {
    const { visible, onCancel, form, submit, text } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
        width={525}
        visible={visible}
        title="Refer a course to codePost"
        okText="Submit"
        onCancel={onCancel}
        onOk={submit}
      >
        <div style={{ fontSize: 14, color: 'grey' }}>{text}</div>
        <br />
        <Form layout="vertical">
          <Form.Item label="Course name">
            {getFieldDecorator('course', {
              rules: [
                { required: true, message: 'Please let us know which course you think would find codePost useful.' },
              ],
            })(<Input />)}
          </Form.Item>
          <Form.Item label="Who should we reach out to?">
            <div className="display-flex align-items-center">
              {getFieldDecorator('instructor', {
                rules: [{ required: true, message: 'Please let us know the person we should reach out to!' }],
              })(<Input placeholder="Name" />)}
              {getFieldDecorator('email')(<Input style={{ marginLeft: 10 }} placeholder="Email (optional)" />)}
            </div>
          </Form.Item>
          <Form.Item label="Why do you think codePost might be helpful for this course? (optional)">
            {getFieldDecorator('description')(<Input type="textarea" />)}
          </Form.Item>
          <Form.Item
            label="Can we let this person know that you referred him/her to codePost?"
            style={{ textAlign: 'center' }}
          >
            {getFieldDecorator('canUseReferralName', {
              rules: [{ required: true, message: "Please let us know if you'd like us to keep this anonymous." }],
            })(
              <Radio.Group className="display-flex justify-content-center">
                <Radio value="Yes">Yes!</Radio>
                <Radio value="No">No. Please keep me anonymous.</Radio>
              </Radio.Group>,
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

const WrappedReferralForm: any = Form.create()(ReferralForm);

export default Referral;

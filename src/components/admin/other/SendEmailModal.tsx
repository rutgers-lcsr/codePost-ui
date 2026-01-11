import React, { FC, useState, useCallback, useEffect } from 'react';
import { MailOutlined } from '@ant-design/icons';
import { Button, List, message, Modal } from 'antd';
import { AssignmentType } from '../../../infrastructure/assignment';
import { CourseType } from '../../../infrastructure/course';
import CPButton from '../../core/CPButton';
import CPTooltip from '../../core/CPTooltip';

interface IProps {
  buttonText: string;
  title: string;
  emails: string[];
  template: string;
  course: CourseType;
  assignment?: AssignmentType;
  me: string;
  body: React.ReactNode;
  button?: (toggleDialog: () => void) => React.ReactNode;
}

const MAX_USERS_IN_INITIAL_LIST = 5;

const SendEmailModal: FC<IProps> = ({ buttonText, title, emails, template, course, assignment, me, body, button }) => {
  const [isSending, setIsSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [usersToShow, setUsersToShow] = useState(MAX_USERS_IN_INITIAL_LIST);

  // Reset users list when modal closes
  useEffect(() => {
    if (!modalVisible) {
      setUsersToShow(MAX_USERS_IN_INITIAL_LIST);
    }
  }, [modalVisible]);

  const toggleDialog = useCallback(() => {
    setModalVisible((prev) => !prev);
  }, []);

  const sendEmails = useCallback(
    (toSend: string[], livemode: boolean) => {
      setIsSending(true);

      const promises = toSend.map((user) =>
        fetch(`${process.env.REACT_APP_API_URL}/users/${user}/email/`, {
          body: JSON.stringify({
            token: localStorage.getItem('token'),
            template: template,
            assignment: assignment?.id,
            course: course.id,
            livemode,
          }),
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }),
      );

      Promise.all(promises)
        .then(() => {
          setIsSending(false);
          message.success(`Email${livemode ? 's' : ''} successfully sent.`);
        })
        .catch(() => {
          setIsSending(false);
          message.error('Failed to send some emails.');
        });
    },
    [template, assignment, course.id],
  );

  const sendTestEmail = useCallback(() => {
    sendEmails([me], false);
  }, [me, sendEmails]);

  const sendLiveEmails = useCallback(() => {
    sendEmails(emails, true);
    toggleDialog();
  }, [emails, sendEmails, toggleDialog]);

  const showMore = useCallback(() => {
    setUsersToShow((prev) => prev + 5);
  }, []);

  return (
    <span>
      {button !== undefined ? (
        button(toggleDialog)
      ) : (
        <CPButton cpType="secondary" icon={<MailOutlined />} loading={isSending} onClick={toggleDialog}>
          {buttonText}
        </CPButton>
      )}
      <Modal
        open={modalVisible}
        onCancel={toggleDialog}
        title={title}
        width={600}
        footer={[
          <Button key="back" onClick={toggleDialog}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" disabled={false} onClick={sendLiveEmails}>
            Send
          </Button>,
        ]}
      >
        {body}
        <br />
        <div>
          <CPButton onClick={sendTestEmail} cpType="secondary">
            Send myself a test email
          </CPButton>
          &nbsp;{' '}
          <CPTooltip title="This will send you an email example of what the recipients will receive." infoIcon={true} />
        </div>
        {emails !== undefined ? (
          <div>
            <br />
            <h3>{emails.length} users will be emailed</h3>
            <List
              itemLayout="horizontal"
              loadMore={
                emails.length > usersToShow ? (
                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: 12,
                      height: 32,
                      lineHeight: '32px',
                    }}
                  >
                    <Button onClick={showMore}>show more</Button>
                  </div>
                ) : null
              }
              dataSource={emails.slice(0, Math.min(usersToShow, emails.length))}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </div>
        ) : null}
      </Modal>
    </span>
  );
};

export default SendEmailModal;

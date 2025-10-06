/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { MailOutlined } from '@ant-design/icons';
import { Button, List, message, Modal } from 'antd';

/* codePost imports */

// type definitions
import { AssignmentType } from '../../../infrastructure/assignment';
import { CourseType } from '../../../infrastructure/course';

import CPButton from '../../core/CPButton';
import CPTooltip from '../../core/CPTooltip';

/**********************************************************************************************************************/

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

interface IState {
  /* are we in the middle of sending an email? */
  isSending: boolean;
  /* number of recipients to show in list */
  usersToShow: number;

  modalVisible: boolean;
}

const MAX_USERS_IN_INITIAL_LIST = 5;

class SendEmailModal extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      isSending: false,
      modalVisible: false,
      usersToShow: MAX_USERS_IN_INITIAL_LIST,
    };
  }

  public componentDidUpdate(_oldProps: IProps, oldState: IState) {
    if (oldState.modalVisible && !this.state.modalVisible) {
      this.setState({
        usersToShow: MAX_USERS_IN_INITIAL_LIST,
      });
    }
  }

  public sendTestEmail = () => {
    this.sendEmails([this.props.me], false);
  };

  public sendLiveEmails = () => {
    this.setState({ isSending: true }, () => {
      this.sendEmails(this.props.emails, true);
    });
    this.toggleDialog();
  };

  public showMore = () => {
    this.setState((oldState: IState) => {
      return {
        usersToShow: oldState.usersToShow + 5,
      };
    });
  };

  public sendEmails = (toSend: string[], livemode: boolean) => {
    this.setState({ isSending: true }, () => {
      toSend.forEach((users) => {
        fetch(`${process.env.REACT_APP_API_URL}/users/${users}/email/`, {
          body: JSON.stringify({
            token: localStorage.getItem('token'),
            template: this.props.template,
            assignment: this.props.assignment !== undefined ? this.props.assignment.id : undefined,
            course: this.props.course.id,
            livemode,
          }),
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });
      });
    });

    this.setState({ isSending: false });
    message.success(`Email${livemode ? 's' : ''} successfully sent.`);
  };

  public toggleDialog = () => {
    this.setState({
      modalVisible: !this.state.modalVisible,
    });
  };

  public render() {
    return (
      <span>
        {this.props.button !== undefined ? (
          this.props.button(this.toggleDialog)
        ) : (
          <CPButton
            cpType="secondary"
            icon={<MailOutlined />}
            loading={this.state.isSending}
            onClick={this.toggleDialog}
          >
            {this.props.buttonText}
          </CPButton>
        )}
        <Modal
          open={this.state.modalVisible}
          onCancel={this.toggleDialog}
          title={this.props.title}
          width={600}
          footer={[
            <Button key="back" onClick={this.toggleDialog}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" disabled={false} onClick={this.sendLiveEmails}>
              Send
            </Button>,
          ]}
        >
          {this.props.body}
          <br />
          <div>
            <CPButton onClick={this.sendTestEmail} cpType="secondary">
              Send myself a test email
            </CPButton>
            &nbsp;{' '}
            <CPTooltip
              title="This will send you an email example of what the recipients will receive."
              infoIcon={true}
            />
          </div>
          {this.props.emails !== undefined ? (
            <div>
              <br />
              <h3>{this.props.emails.length} users will be emailed</h3>
              <List
                itemLayout="horizontal"
                loadMore={
                  this.props.emails.length > this.state.usersToShow ? (
                    <div
                      style={{
                        textAlign: 'center',
                        marginTop: 12,
                        height: 32,
                        lineHeight: '32px',
                      }}
                    >
                      <Button onClick={this.showMore}>show more</Button>
                    </div>
                  ) : null
                }
                dataSource={this.props.emails.slice(0, Math.min(this.state.usersToShow, this.props.emails.length))}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </div>
          ) : null}
        </Modal>
      </span>
    );
  }
}
export default SendEmailModal;

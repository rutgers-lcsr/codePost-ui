/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Button, message, Modal } from 'antd';

/* codePost imports */

// type definitions
import { AssignmentType } from '../../../infrastructure/assignment';
import { CourseType } from '../../../infrastructure/course';

import CPButton from '../../core/CPButton';

/**********************************************************************************************************************/

interface IProps {
  buttonText: string;
  title: string;
  filterFunction: () => string[];
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

  modalVisible: boolean;
}

class SendEmailModal extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      isSending: false,
      modalVisible: false,
    };
  }

  public sendTestEmail = () => {
    this.sendEmails([this.props.me], false);
  };

  public sendLiveEmails = () => {
    this.setState({ isSending: true }, () => {
      const toEmail = this.props.filterFunction();
      this.sendEmails(toEmail, true);
    });
    this.toggleDialog();
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
            Authorization: `JWT ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });
      });
    });

    this.setState({ isSending: false });
    message.success('Emails successfully sent.');
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
          <CPButton cpType="secondary" icon="mail" loading={this.state.isSending} onClick={this.toggleDialog}>
            {this.props.buttonText}
          </CPButton>
        )}
        <Modal
          visible={this.state.modalVisible}
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
            To see what this email will look like, send yourself a test email.
            <CPButton onClick={this.sendTestEmail} cpType="secondary">
              Send myself a test email
            </CPButton>
          </div>
        </Modal>
      </span>
    );
  }
}
export default SendEmailModal;

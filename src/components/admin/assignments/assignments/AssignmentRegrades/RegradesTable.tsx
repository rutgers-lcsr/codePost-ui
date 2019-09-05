import React, { useState } from 'react';

import { Divider, Dropdown, Icon, Input, Menu, Modal, Table, Tag, Typography } from 'antd';
const { TextArea } = Input;
const { Paragraph, Text } = Typography;
const { confirm } = Modal;

/* codePost imports */
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { AnonymousSubmissionType, SubmissionType } from '../../../../../infrastructure/submission';

import { UserType } from '../../../../../infrastructure/user';

import CPButton from '../../../../../components/core/CPButton';

import { openSubmission } from '../../../other/AdminUtils';

import { formatDate } from '../../../../utils/DateUtils';

interface IStudentQuestionsProps {
  /* assignment data */
  assignment: AssignmentType;
  submissions: SubmissionType[] | AnonymousSubmissionType[];

  /* Refresh Course data */
  refreshCourseData: () => void | undefined;

  user: UserType;
  updateSubmission: (submission: SubmissionType) => Promise<void>;

  isAnonymous?: boolean;
  isLoading?: boolean;

  isAdmin: boolean;
}

enum RESPONSE_STATUS {
  EDIT_NOT_ALLOWED,
  EDIT_ALLOWED_EXISTING_RESPONSE,
  EDIT_ALLOWED_NEW_RESPONSE,
}

const RegradesTable = (props: IStudentQuestionsProps) => {
  // *********************** STATE VARIABLES *************************
  const [modalVisible, setModalVisibility] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionType | undefined>(undefined);
  const [responseText, setResponseText] = useState('');
  const [modalReadOnly, setModalReadOnly] = useState(true);

  // *********************** STATE CHANGE FUNCTIONS *************************
  const toggleModal = (readOnly: boolean, submission?: SubmissionType) => {
    setModalReadOnly(readOnly);
    setActiveSubmission(submission);
    setModalVisibility(!modalVisible);
    setResponseText(submission && submission.questionResponse ? submission.questionResponse : '');
  };

  const changeRegradeText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseText(event.target.value);
  };

  const updateSubmissionField = (submission: SubmissionType, field: string, newValue: any) => {
    const newSubmission = JSON.parse(JSON.stringify(submission));
    newSubmission[field] = newValue;
    props.updateSubmission(newSubmission);
  };

  const releaseRegrade = (submission: SubmissionType) => {
    const newSubmission = JSON.parse(JSON.stringify(submission));
    newSubmission['questionResponder'] = null;
    newSubmission['questionResponse'] = '';
    props.updateSubmission(newSubmission);
  };

  const confirmRelease = (submission: SubmissionType) => {
    confirm({
      title: 'Are you sure you want to release this regrade?',
      content: 'Releasing this will delete any draft response.',
      onOk() {
        releaseRegrade(submission);
      },
      onCancel() {
        return;
      },
    });
  };

  const submitResponse = () => {
    if (activeSubmission) {
      updateSubmissionField(activeSubmission, 'questionResponse', responseText);
    }
    toggleModal(true, undefined);
  };

  // *********************** TABLE HELPER FUNCTIONS *************************
  const getResponseStatus = (submission: SubmissionType | AnonymousSubmissionType) => {
    if (submission.questionResponder !== props.user.email || !submission.questionIsOpen) {
      return RESPONSE_STATUS.EDIT_NOT_ALLOWED;
    } else if (submission.questionResponse) {
      return RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE;
    } else return RESPONSE_STATUS.EDIT_ALLOWED_NEW_RESPONSE;
  };

  const getResponseContent = (submission: SubmissionType | AnonymousSubmissionType) => {
    const responseStatus = getResponseStatus(submission);

    switch (responseStatus) {
      case RESPONSE_STATUS.EDIT_NOT_ALLOWED:
        return (
          <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }} ellipsis={{ rows: 2, expandable: false }}>
            {submission.questionResponse}
          </Paragraph>
        );
      case RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE:
        return (
          <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }} ellipsis={{ rows: 2, expandable: false }}>
            {submission.questionResponse}
          </Paragraph>
        );
      case RESPONSE_STATUS.EDIT_ALLOWED_NEW_RESPONSE:
        return (
          <CPButton cpType="primary" onClick={toggleModal.bind({}, false, submission)}>
            Respond
          </CPButton>
        );
    }
  };

  // *********************** TABLE CONTENT *************************
  const aligner: 'left' | 'center' | 'right' = 'center';
  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      align: aligner,
    },
    {
      title: 'Student(s)',
      dataIndex: 'students',
      key: 'students',
      sorter: (a: any, b: any) => a.students.localeCompare(b.students),
    },
    {
      title: 'Status',
      dataIndex: 'statusTag',
      key: 'statusTag',
      align: aligner,
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
    },
    {
      title: 'Regrade Requested?',
      dataIndex: 'regrade',
      key: 'regrade',
      align: aligner,
    },
    {
      title: 'Responder',
      dataIndex: 'responder',
      key: 'responder',
      align: aligner,
      sorter: (a: any, b: any) => {
        if (!a.responder && b.responder) {
          return -1;
        } else if (a.responder && !b.responder) {
          return 1;
        } else if (!a.responder && !b.responder) {
          return 0;
        }
        return a.responder.localeCompare(b.responder);
      },
    },
    {
      title: 'Response',
      dataIndex: 'response',
      key: 'response',
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: aligner,
    },
  ];

  // Filtering for relevant submissions
  const regradeSubmissions = props.submissions.filter((submission) => {
    return (
      submission.questionIsOpen ||
      submission.questionText ||
      submission.questionResponder ||
      submission.questionResponse
    );
  });

  const rows = regradeSubmissions.map((submission) => {
    const hasPermissionToClaim =
      props.isAdmin || submission.questionResponder === props.user.email || submission.questionResponder === null;

    const responseStatus = getResponseStatus(submission);
    const menu = (
      <Menu>
        <Menu.Item key="1" onClick={toggleModal.bind({}, true, submission)}>
          <Icon type="eye" />
          View Regrade
        </Menu.Item>
        {responseStatus === RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE ? (
          <Menu.Item key="2" onClick={toggleModal.bind({}, false, submission)}>
            <Icon type="edit" />
            Edit Response
          </Menu.Item>
        ) : (
          <div />
        )}
        <Menu.Item
          key="3"
          onClick={
            submission.questionResponder !== props.user.email
              ? updateSubmissionField.bind({}, submission, 'questionResponder', props.user.email)
              : confirmRelease.bind({}, submission)
          }
        >
          <Icon type={submission.questionResponder !== props.user.email ? 'plus-circle' : 'minus-circle'} />
          {submission.questionResponder !== props.user.email ? 'Claim' : 'Release'}
        </Menu.Item>
        <Menu.Item
          key="4"
          onClick={updateSubmissionField.bind({}, submission, 'questionIsOpen', !submission.questionIsOpen)}
          disabled={!hasPermissionToClaim}
        >
          <Icon type={submission.questionIsOpen ? 'check-circle' : 'exclamation-circle'} />
          {submission.questionIsOpen ? 'Close' : 'Re-open'}
        </Menu.Item>
      </Menu>
    );

    const responseContent = getResponseContent(submission);
    return {
      key: submission.id,
      code: <Icon type="code" onClick={openSubmission.bind({}, submission.id)} />,
      students: submission.students && !props.isAnonymous ? submission.students.toString() : submission.id,
      statusTag:
        submission.questionText && !submission.questionIsOpen ? (
          <Tag color="green">Closed</Tag>
        ) : (
          <Tag color="orange">Open</Tag>
        ),
      status: submission.questionText && !submission.questionIsOpen ? 'Closed' : 'Open',
      responder: submission.questionResponder,
      regrade: submission.questionIsRegrade ? <Icon type="check-circle" /> : <div />,
      text: (
        <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }} ellipsis={{ rows: 2, expandable: false }}>
          {submission.questionText}
        </Paragraph>
      ),
      response: responseContent,
      actions: (
        <Dropdown overlay={menu} trigger={['click']}>
          <Icon type="menu" />
        </Dropdown>
      ),
    };
  });

  const closeButton = (
    <CPButton key="cancel" cpType="secondary" onClick={toggleModal.bind({}, true, null)}>
      Close
    </CPButton>
  );

  const submitButton = (
    <CPButton key="submit" cpType="primary" onClick={submitResponse}>
      Submit
    </CPButton>
  );

  const footer = modalReadOnly ? [closeButton] : [closeButton, submitButton];

  // *********************** RENDER *************************

  return (
    <div>
      <CPButton cpType="secondary" icon="reload" style={{ marginBottom: 10 }} onClick={props.refreshCourseData}>
        Refresh Data
      </CPButton>
      <Table columns={columns} dataSource={rows} loading={props.isLoading} />{' '}
      <Modal
        onCancel={toggleModal.bind({}, null)}
        visible={modalVisible}
        title="Respond to Regrade request"
        footer={footer}
      >
        <div className="display-flex flex-direction-column">
          <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
            {activeSubmission ? activeSubmission.students : ''}
            &nbsp; &nbsp;
            <span style={{ fontSize: 12, color: '#ccc' }}>
              {activeSubmission && activeSubmission.questionDate ? formatDate(activeSubmission.questionDate) : ''}
            </span>
          </div>
          <span style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>
            {activeSubmission ? activeSubmission.questionText : ''}
          </span>
        </div>
        <Divider />
        <div className="display-flex flex-direction-column">
          <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
            {activeSubmission && activeSubmission.questionResponder ? activeSubmission.questionResponder : ''}
            &nbsp; &nbsp;
            <span style={{ fontSize: 12, color: '#ccc' }}>
              {activeSubmission && activeSubmission.responseDate ? formatDate(activeSubmission.responseDate) : ''}
            </span>
          </div>
          {modalReadOnly ? (
            <div style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{responseText}</div>
          ) : (
            <div>
              <TextArea autosize value={responseText} onChange={changeRegradeText} />
              <div style={{ marginTop: 15 }}>
                <Text type="warning">
                  Note: The student will be able to view this response once submitted, as well as your email as the
                  responder. You will, however, still be able to edit the response.
                </Text>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RegradesTable;

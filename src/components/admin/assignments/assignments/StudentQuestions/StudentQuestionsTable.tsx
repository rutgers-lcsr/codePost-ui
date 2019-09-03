import React, { useState } from 'react';

import { Divider, Dropdown, Icon, Input, Menu, Modal, Table, Tag, Typography } from 'antd';
const { TextArea } = Input;
const { Text } = Typography;

/* codePost imports */
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { AnonymousSubmissionType, SubmissionType } from '../../../../../infrastructure/submission';

import { UserType } from '../../../../../infrastructure/user';

import CPButton from '../../../../../components/core/CPButton';

import { openSubmission } from '../../../other/AdminUtils';

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

const StudentQuestionsTable = (props: IStudentQuestionsProps) => {
  // *********************** STATE VARIABLES *************************
  const [modalVisible, setModalVisibility] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionType | undefined>(undefined);
  const [responseText, setResponseText] = useState('');

  // *********************** STATE CHANGE FUNCTIONS *************************
  const toggleModal = (submission?: SubmissionType) => {
    setActiveSubmission(submission);
    setModalVisibility(!modalVisible);
    setResponseText(submission && submission.questionResponse ? submission.questionResponse : '');
  };

  const changeRegradeText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseText(event.target.value);
  };

  const submitResponse = () => {
    if (activeSubmission) {
      updateSubmissionField(activeSubmission, 'questionResponse', responseText);
    }
    toggleModal(undefined);
  };

  const updateSubmissionField = (submission: SubmissionType, field: string, newValue: any) => {
    const newSubmission = JSON.parse(JSON.stringify(submission));
    newSubmission[field] = newValue;
    props.updateSubmission(newSubmission);
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
        return submission.questionResponse;
      case RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE:
        return (
          <div style={{ display: 'flex', justifyCotnent: 'space-between', alignItems: 'center' }}>
            {submission.questionResponse}
            <div style={{ float: 'right', marginLeft: 10 }}>
              <CPButton cpType="secondary" onClick={toggleModal.bind({}, submission)} icon="edit" />
            </div>
          </div>
        );
      case RESPONSE_STATUS.EDIT_ALLOWED_NEW_RESPONSE:
        return (
          <CPButton cpType="primary" onClick={toggleModal.bind({}, submission)}>
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

    const menu = (
      <Menu>
        <Menu.Item
          key="1"
          disabled={!submission.questionIsOpen || !hasPermissionToClaim}
          onClick={updateSubmissionField.bind(
            {},
            submission,
            'questionResponder',
            submission.questionResponder === props.user.email ? null : props.user.email,
          )}
        >
          <Icon type={submission.questionResponder === props.user.email ? 'minus-circle' : 'plus-circle'} />
          {submission.questionResponder === props.user.email ? 'Release' : 'Claim'}
        </Menu.Item>
        <Divider style={{ marginBottom: 10, marginTop: 10 }} />
        <Menu.Item
          key="2"
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
      text: <div style={{ whiteSpace: 'pre-wrap' }}>{submission.questionText}</div>,
      response: <div style={{ whiteSpace: 'pre-wrap' }}>{responseContent}</div>,
      actions: (
        <Dropdown overlay={menu} trigger={['click']}>
          <Icon type="menu" />
        </Dropdown>
      ),
    };
  });

  // *********************** RENDER *************************

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 10 }}>
        <CPButton cpType="secondary" icon="reload" onClick={props.refreshCourseData}>
          Refresh Data
        </CPButton>
      </div>
      <Table columns={columns} dataSource={rows} loading={props.isLoading} />{' '}
      <Modal
        onCancel={toggleModal.bind({}, null)}
        visible={modalVisible}
        title="Respond to Regrade request"
        footer={[
          <CPButton key="cancel" cpType="secondary" onClick={toggleModal.bind({}, null)}>
            Close
          </CPButton>,
          <CPButton key="submit" cpType="primary" onClick={submitResponse}>
            Submit
          </CPButton>,
        ]}
      >
        <div>
          <b>Request:</b>
          <span style={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
            {activeSubmission ? activeSubmission.questionText : ''}
          </span>
        </div>
        <Divider />
        <TextArea autosize value={responseText} onChange={changeRegradeText} />
        <div style={{ marginTop: 15 }}>
          <Text type="warning">
            Note: The student will be able to view this response once submitted, as well as your email as the responder.
            You will, however, still be able to edit the response.
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default StudentQuestionsTable;

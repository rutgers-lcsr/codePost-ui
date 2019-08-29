import React, { useState } from 'react';

import { Breadcrumb, Dropdown, Icon, Input, Menu, Modal, Table } from 'antd';
const { TextArea } = Input;

import CPAdminDetail from '../../other/CPAdminDetail';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../infrastructure/submission';

import { UserType } from '../../../../infrastructure/user';

import CPButton from '../../../../components/core/CPButton';

import { openSubmission } from '../../other/AdminUtils';

interface IStudentQuestionsProps {
  /* assignment data */
  assignment: AssignmentType;
  submissions: SubmissionType[];

  /* Refresh Course data */
  refreshCourseData: () => void | undefined;
  onCancel: () => void;
  user: UserType;
  updateSubmission: (submission: SubmissionType) => Promise<void>;
}

enum RESPONSE_STATUS {
  EDIT_NOT_ALLOWED,
  EDIT_ALLOWED_EXISTING_RESPONSE,
  EDIT_ALLOWED_NEW_RESPONSE,
}

const StudentQuestions = (props: IStudentQuestionsProps) => {
  const [modalVisible, setModalVisibility] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionType | undefined>(undefined);
  const [responseText, setResponseText] = useState('');

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Student(s)',
      dataIndex: 'students',
      key: 'students',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Grader',
      dataIndex: 'grader',
      key: 'grader',
    },
    {
      title: 'Request',
      dataIndex: 'request',
      key: 'request',
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
    },
  ];

  const toggleModal = (submission?: SubmissionType) => {
    setActiveSubmission(submission);
    setModalVisibility(!modalVisible);
    setResponseText(submission && submission.questionResponse ? submission.questionResponse : '');
  };

  const updateSubmissionField = (submission: SubmissionType, field: string, newValue: any) => {
    const newSubmission = JSON.parse(JSON.stringify(submission));
    newSubmission[field] = newValue;
    props.updateSubmission(newSubmission);
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

  const regradeSubmissions = props.submissions.filter((submission) => {
    return (
      submission.questionIsOpen ||
      submission.questionText ||
      submission.questionResponder ||
      submission.questionResponse
    );
  });

  const getResponseStatus = (submission: SubmissionType) => {
    if (submission.questionResponder !== props.user.email || !submission.questionIsOpen) {
      return RESPONSE_STATUS.EDIT_NOT_ALLOWED;
    } else if (submission.questionResponse) {
      return RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE;
    } else return RESPONSE_STATUS.EDIT_ALLOWED_NEW_RESPONSE;
  };

  const rows = regradeSubmissions.map((submission) => {
    const menu = (
      <Menu>
        <Menu.Item
          key="1"
          onClick={updateSubmissionField.bind(
            {},
            submission,
            'questionResponder',
            submission.questionResponder === props.user.email ? null : props.user.email,
          )}
        >
          <Icon type="user-delete" />
          {submission.questionResponder === props.user.email ? 'Release regrade' : 'Claim regrade'}
        </Menu.Item>
        <Menu.Item
          key="2"
          onClick={updateSubmissionField.bind({}, submission, 'questionIsOpen', !submission.questionIsOpen)}
        >
          <Icon type="user-delete" />
          {submission.questionIsOpen ? 'Close regrade' : 'Reopen regrade'}
        </Menu.Item>
      </Menu>
    );

    const responseStatus = getResponseStatus(submission);

    return {
      key: submission.id,
      code: <Icon type="code" onClick={openSubmission.bind({}, submission.id)} />,
      students: submission.students,
      status: submission.questionText && !submission.questionIsOpen ? 'Closed' : 'Open',
      grader: submission.questionResponder,
      request: submission.questionText,
      response:
        responseStatus === RESPONSE_STATUS.EDIT_NOT_ALLOWED ? (
          submission.questionResponse
        ) : responseStatus === RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE ? (
          <div>
            {submission.questionResponse}
            <CPButton cpType="secondary" onClick={toggleModal.bind({}, submission)}>
              Edit response
            </CPButton>
          </div>
        ) : (
          <CPButton cpType="primary" onClick={toggleModal.bind({}, submission)}>
            Respond
          </CPButton>
        ),
      actions: (
        <Dropdown overlay={menu} trigger={['click']}>
          <Icon type="menu" />
        </Dropdown>
      ),
    };
  });

  const content = (
    <div>
      <Table columns={columns} dataSource={rows} />{' '}
      <Modal
        onCancel={toggleModal.bind({}, null)}
        visible={modalVisible}
        title="Respond to Regrade request"
        onOk={submitResponse}
      >
        <TextArea autosize value={responseText} onChange={changeRegradeText} />
      </Modal>
    </div>
  );

  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item onClick={props.onCancel}>
            <a>Assignments</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{props.assignment.name}</Breadcrumb.Item>
          <Breadcrumb.Item>Regrade Requests</Breadcrumb.Item>
        </Breadcrumb>
      }
      goBack={null}
      title={`${props.assignment.name} | Student Questions${
        props.assignment.allowRegradeRequests ? ' and Regrade Requests' : ''
      }`}
      actions={[]}
      content={content}
    />
  );
};

export default StudentQuestions;

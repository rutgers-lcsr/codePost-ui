import React, { useState } from 'react';

import { Breadcrumb, Divider, Dropdown, Icon, Input, Menu, Modal, Table, Tag } from 'antd';
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
          disabled={!submission.questionIsOpen}
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
        >
          <Icon type={submission.questionIsOpen ? 'check-circle' : 'exclamation-circle'} />
          {submission.questionIsOpen ? 'Close' : 'Re-open'}
        </Menu.Item>
      </Menu>
    );

    const responseStatus = getResponseStatus(submission);

    return {
      key: submission.id,
      code: <Icon type="code" onClick={openSubmission.bind({}, submission.id)} />,
      students: submission.students.toString(),
      statusTag:
        submission.questionText && !submission.questionIsOpen ? (
          <Tag color="green">Closed</Tag>
        ) : (
          <Tag color="orange">Open</Tag>
        ),
      status: submission.questionText && !submission.questionIsOpen ? 'Closed' : 'Open',
      responder: submission.questionResponder,
      regrade: submission.questionIsRegrade ? <Icon type="check-circle" /> : <div />,
      text: submission.questionText,
      response:
        responseStatus === RESPONSE_STATUS.EDIT_NOT_ALLOWED ? (
          submission.questionResponse
        ) : responseStatus === RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE ? (
          <div style={{ display: 'flex', justifyCotnent: 'space-between', alignItems: 'center' }}>
            {submission.questionResponse}
            <div style={{ float: 'right', marginLeft: 10 }}>
              <CPButton cpType="secondary" onClick={toggleModal.bind({}, submission)} icon="edit" />
            </div>
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
          <Breadcrumb.Item>
            `Student Questions${props.assignment.allowRegradeRequests ? ' and Regrade Requests' : ''}`
          </Breadcrumb.Item>
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

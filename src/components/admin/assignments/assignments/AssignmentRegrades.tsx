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

interface IAssignmentRegradesProps {
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

const AssignmentRegrades = (props: IAssignmentRegradesProps) => {
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
    setResponseText(submission && submission.regradeResponse ? submission.regradeResponse : '');
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
      updateSubmissionField(activeSubmission, 'regradeResponse', responseText);
    }
    toggleModal(undefined);
  };

  const regradeSubmissions = props.submissions.filter((submission) => {
    return (
      submission.regradeIsOpen || submission.regradeRequest || submission.regradeGrader || submission.regradeResponse
    );
  });

  const getResponseStatus = (submission: SubmissionType) => {
    if (submission.regradeGrader !== props.user.email || !submission.regradeIsOpen) {
      return RESPONSE_STATUS.EDIT_NOT_ALLOWED;
    } else if (submission.regradeResponse) {
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
            'regradeGrader',
            submission.regradeGrader === props.user.email ? null : props.user.email,
          )}
        >
          <Icon type="user-delete" />
          {submission.regradeGrader === props.user.email ? 'Release regrade' : 'Claim regrade'}
        </Menu.Item>
        <Menu.Item
          key="2"
          onClick={updateSubmissionField.bind({}, submission, 'regradeIsOpen', !submission.regradeIsOpen)}
        >
          <Icon type="user-delete" />
          {submission.regradeIsOpen ? 'Close regrade' : 'Reopen regrade'}
        </Menu.Item>
      </Menu>
    );

    const responseStatus = getResponseStatus(submission);

    return {
      key: submission.id,
      code: <Icon type="code" onClick={openSubmission.bind({}, submission.id)} />,
      students: submission.students,
      status: submission.regradeRequest && !submission.regradeIsOpen ? 'Closed' : 'Open',
      grader: submission.regradeGrader,
      request: submission.regradeRequest,
      response:
        responseStatus === RESPONSE_STATUS.EDIT_NOT_ALLOWED ? (
          submission.regradeResponse
        ) : responseStatus === RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE ? (
          <div>
            {submission.regradeResponse}
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
      title={`${props.assignment.name} | Regrade Requests`}
      actions={[]}
      content={content}
    />
  );
};

export default AssignmentRegrades;

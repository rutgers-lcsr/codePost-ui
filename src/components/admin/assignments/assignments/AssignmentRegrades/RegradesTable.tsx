// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useState } from 'react';

import {
  CheckCircleOutlined,
  CodeOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

import { Button, Divider, Input, message, Modal, Space, Table, Tag, Typography } from 'antd';

/* codePost imports */
import { assignmentsApi } from '../../../../../api-client/clients';
import { Assignment, SubmissionInfoType } from '../../../../../types/common';
import RegradeInstructionsModal from './RegradeInstructionsModal';

import { User } from '../../../../../api-client';

type AnonymousSubmissionInfoType = SubmissionInfoType;

import CPButton from '../../../../../components/core/CPButton';

import { openSubmission } from '../../../other/AdminUtils';

import { CodePostDate } from '../../../../utils/CodepostDate';

const { TextArea } = Input;
const { Text } = Typography;
const { confirm } = Modal;

interface IRegradesTableProps {
  /* assignment data */
  assignment: Assignment;
  submissions: SubmissionInfoType[] | AnonymousSubmissionInfoType[];

  /* Refresh Course data */
  refreshCourseData: () => void | undefined;

  user: User;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;

  isAnonymous?: boolean;
  isLoading?: boolean;

  isAdmin: boolean;
}

enum RESPONSE_STATUS {
  EDIT_NOT_ALLOWED,
  EDIT_ALLOWED_EXISTING_RESPONSE,
  EDIT_ALLOWED_NEW_RESPONSE,
}

const RegradesTable = (props: IRegradesTableProps) => {
  // *********************** STATE VARIABLES *************************
  const [modalVisible, setModalVisibility] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<
    SubmissionInfoType | AnonymousSubmissionInfoType | undefined
  >(undefined);
  const [responseText, setResponseText] = useState('');
  const [modalReadOnly, setModalReadOnly] = useState(true);

  const [instructionsModalVisible, setInstructionsModalVisible] = useState(false);

  // *********************** STATE CHANGE FUNCTIONS *************************
  const toggleModal = (readOnly: boolean, submission?: SubmissionInfoType | AnonymousSubmissionInfoType) => {
    setModalReadOnly(readOnly);
    setActiveSubmission(submission);
    setModalVisibility(!modalVisible);
    setResponseText(submission && submission.questionResponse ? submission.questionResponse : '');
  };

  const changeRegradeText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseText(event.target.value);
  };

  const updateSubmissionField = (
    submission: SubmissionInfoType | AnonymousSubmissionInfoType,
    field: string,
    newValue: any,
  ) => {
    const newSubmission = JSON.parse(JSON.stringify(submission));
    newSubmission[field] = newValue;
    props.updateSubmission(newSubmission);
  };

  const clearRegrade = (submission: SubmissionInfoType | AnonymousSubmissionInfoType, newGrader: string | null) => {
    const newSubmission = JSON.parse(JSON.stringify(submission));
    newSubmission['questionResponder'] = newGrader;
    newSubmission['questionResponse'] = '';
    newSubmission['questionIsOpen'] = true;
    props.updateSubmission(newSubmission);
  };

  const confirmClear = (submission: SubmissionInfoType | AnonymousSubmissionInfoType, isRelease: boolean) => {
    confirm({
      title: `Are you sure you want to ${isRelease ? 'release' : 'claim'} this regrade?`,
      content: 'This will clear the existing draft response text.',
      onOk() {
        clearRegrade(submission, isRelease ? null : props.user.email || '');
      },
      onCancel() {
        return;
      },
    });
  };

  const submitResponse = (questionIsOpen: boolean) => {
    if (activeSubmission) {
      const newSubmission = JSON.parse(JSON.stringify(activeSubmission));
      newSubmission['questionIsOpen'] = questionIsOpen;
      newSubmission['questionResponse'] = responseText;
      props.updateSubmission(newSubmission);
    }
    toggleModal(true, undefined);
  };

  const openInstructionsModal = () => {
    setInstructionsModalVisible(true);
  };

  const closeInstructionsModal = () => {
    setInstructionsModalVisible(false);
  };

  const saveInstructions = async (instructions: string) => {
    try {
      await assignmentsApi.partialUpdate({
        id: props.assignment.id,
        patchedAssignment: { regradeInstructions: instructions },
      });
      message.success('Successfully updated instructions!');
      closeInstructionsModal();
    } catch {
      // unsuccessful
    }
  };
  // *********************** TABLE HELPER FUNCTIONS *************************
  const getResponseStatus = (submission: SubmissionInfoType | AnonymousSubmissionInfoType) => {
    if (submission.questionResponder !== props.user.email || !submission.questionIsOpen) {
      return RESPONSE_STATUS.EDIT_NOT_ALLOWED;
    } else if (submission.questionResponse) {
      return RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE;
    } else return RESPONSE_STATUS.EDIT_ALLOWED_NEW_RESPONSE;
  };

  // *********************** TABLE CONTENT *************************
  const btnStyle = { fontSize: 11, padding: '0 6px', height: 22 };

  const columns = [
    {
      title: 'Student(s)',
      dataIndex: 'students',
      key: 'students',
      width: 200,
      sorter: (a: any, b: any) => (a.studentSort ?? '').localeCompare(b.studentSort ?? ''),
    },
    {
      title: 'Request',
      dataIndex: 'request',
      key: 'request',
    },
    {
      title: 'Date',
      dataIndex: 'dateDisplay',
      key: 'date',
      width: 140,
      sorter: (a: any, b: any) => (a.dateSort ?? '').localeCompare(b.dateSort ?? ''),
    },
    {
      title: 'Status',
      dataIndex: 'statusTag',
      key: 'statusTag',
      width: 100,
      align: 'center' as const,
      sorter: (a: any, b: any) => (a.statusSort ?? '').localeCompare(b.statusSort ?? ''),
      defaultSortOrder: 'ascend' as const,
      filters: [
        { text: 'Open', value: 'Open' },
        { text: 'Closed', value: 'Closed' },
      ],
      onFilter: (value: any, record: any) => record.statusSort === value,
    },
    {
      title: 'Responder',
      dataIndex: 'responder',
      key: 'responder',
      width: 180,
      sorter: (a: any, b: any) => (a.responderSort ?? '').localeCompare(b.responderSort ?? ''),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      width: 280,
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
    const isAbleToChange =
      props.isAdmin || submission.questionResponder === props.user.email || submission.questionResponder === null;
    const isAbleToClose = submission.questionIsOpen && submission.questionResponse;
    const isClaimedByMe = submission.questionResponder === props.user.email;
    const isClosed = !submission.questionIsOpen;
    const responseStatus = getResponseStatus(submission);

    const studentLabel =
      submission.students && !props.isAnonymous ? submission.students.toString() : `#${submission.id}`;

    const handleClaim = () => {
      if (submission.questionResponder === null) {
        updateSubmissionField(submission, 'questionResponder', props.user.email);
      } else {
        confirmClear(submission, false);
      }
    };

    const handleRelease = () => {
      if (submission.questionResponse) {
        confirmClear(submission, true);
      } else {
        clearRegrade(submission, null);
      }
    };

    return {
      key: submission.id,
      students: (
        <a onClick={() => openSubmission(submission.id)} style={{ fontWeight: 500 }}>
          {studentLabel}
        </a>
      ),
      studentSort: studentLabel,
      dateDisplay: submission.questionDate ? (
        <Text style={{ fontSize: 12, color: '#666' }}>
          <CodePostDate datetime={submission.questionDate} />
        </Text>
      ) : (
        ''
      ),
      dateSort: submission.questionDate ?? '',
      request: (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {submission.questionIsRegrade && (
              <Tag color="geekblue" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                Regrade
              </Tag>
            )}
          </div>
          <Text style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{submission.questionText}</Text>
        </Space>
      ),
      statusTag: isClosed ? <Tag color="green">Closed</Tag> : <Tag color="orange">Open</Tag>,
      statusSort: isClosed ? 'Closed' : 'Open',
      responder: submission.questionResponder ?? '',
      responderSort: submission.questionResponder ?? '',
      actions: (
        <Space size={4} wrap>
          <Button size="small" style={btnStyle} icon={<CodeOutlined />} onClick={() => openSubmission(submission.id)}>
            View
          </Button>
          {!isClaimedByMe && isAbleToChange && !isClosed && (
            <Button size="small" style={btnStyle} icon={<PlusCircleOutlined />} onClick={handleClaim}>
              Claim
            </Button>
          )}
          {isClaimedByMe && !isClosed && (
            <Button size="small" style={btnStyle} icon={<MinusCircleOutlined />} onClick={handleRelease}>
              Release
            </Button>
          )}
          {responseStatus === RESPONSE_STATUS.EDIT_ALLOWED_NEW_RESPONSE && (
            <Button
              type="primary"
              size="small"
              style={btnStyle}
              icon={<EditOutlined />}
              onClick={() => toggleModal(false, submission)}
            >
              Respond
            </Button>
          )}
          {responseStatus === RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE && (
            <Button
              size="small"
              style={btnStyle}
              icon={<EditOutlined />}
              onClick={() => toggleModal(false, submission)}
            >
              Edit
            </Button>
          )}
          {isAbleToChange && isClosed && (
            <Button
              size="small"
              style={btnStyle}
              icon={<ExclamationCircleOutlined />}
              onClick={() => updateSubmissionField(submission, 'questionIsOpen', true)}
            >
              Re-open
            </Button>
          )}
          {isAbleToChange && !isClosed && isAbleToClose && (
            <Button
              size="small"
              style={btnStyle}
              icon={<CheckCircleOutlined />}
              onClick={() => updateSubmissionField(submission, 'questionIsOpen', false)}
            >
              Close
            </Button>
          )}
        </Space>
      ),
    };
  });

  const onCancel = () => {
    toggleModal(modalReadOnly, undefined);
  };

  const submitOpen = () => {
    submitResponse(true);
  };

  const submitClose = () => {
    submitResponse(false);
  };

  const closeButton = (
    <CPButton key="cancel" cpType="secondary" onClick={onCancel}>
      Close
    </CPButton>
  );

  const submitAndKeepOpenButton = (
    <CPButton key="submit-open" cpType="secondary" onClick={submitOpen}>
      Submit and Keep Open
    </CPButton>
  );

  const submitAndCloseButton = (
    <CPButton key="submit-close" cpType="primary" onClick={submitClose}>
      Submit and Close
    </CPButton>
  );

  const footer = modalReadOnly ? [closeButton] : [closeButton, submitAndKeepOpenButton, submitAndCloseButton];

  // *********************** RENDER *************************

  const openCount = regradeSubmissions.filter((s) => s.questionIsOpen).length;
  const closedCount = regradeSubmissions.length - openCount;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        {props.isAdmin && (
          <CPButton cpType="secondary" icon={<InfoCircleOutlined />} onClick={openInstructionsModal}>
            Edit Instructions
          </CPButton>
        )}
        <RegradeInstructionsModal
          open={instructionsModalVisible}
          instructions={props.assignment.regradeInstructions ?? ''}
          cancel={closeInstructionsModal}
          save={saveInstructions}
        />
        <CPButton cpType="secondary" icon={<ReloadOutlined />} onClick={props.refreshCourseData}>
          Refresh
        </CPButton>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#666' }}>
          {regradeSubmissions.length} request{regradeSubmissions.length !== 1 ? 's' : ''} &middot;{' '}
          <Text style={{ color: '#fa8c16' }}>{openCount} open</Text> &middot;{' '}
          <Text style={{ color: '#52c41a' }}>{closedCount} closed</Text>
        </span>
      </div>
      <Table
        columns={columns}
        dataSource={rows}
        loading={props.isLoading}
        size="small"
        pagination={regradeSubmissions.length > 20 ? { pageSize: 20 } : false}
      />
      <Modal onCancel={onCancel} open={modalVisible} title="Respond to Regrade Request" footer={footer}>
        <div className="display-flex flex-direction-column">
          <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
            {activeSubmission ? activeSubmission.students : ''}
            &nbsp; &nbsp;
            <span style={{ fontSize: 12, color: '#ccc' }}>
              {activeSubmission && activeSubmission.questionDate ? (
                <CodePostDate datetime={activeSubmission.questionDate} />
              ) : (
                ''
              )}
            </span>
            <span style={{ fontSize: 12, color: '#25be85', fontWeight: 400, float: 'right' }}>
              {activeSubmission && activeSubmission.questionIsRegrade ? ' Regrade Requested' : ''}
            </span>
          </div>
          <span style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>
            {activeSubmission ? activeSubmission.questionText : ''}
          </span>
        </div>
        <Divider />
        <div className="display-flex flex-direction-column">
          <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
            {activeSubmission && activeSubmission.questionResponder
              ? activeSubmission.questionResponder
              : activeSubmission && activeSubmission.grader
                ? `Graded by: ${activeSubmission.grader}`
                : ''}
            &nbsp; &nbsp;
            <span style={{ fontSize: 12, color: '#ccc' }}>
              {activeSubmission && activeSubmission.responseDate ? (
                <CodePostDate datetime={activeSubmission.responseDate} />
              ) : (
                ''
              )}
            </span>
          </div>
          {modalReadOnly ? (
            <div style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{responseText}</div>
          ) : (
            <div>
              <TextArea autoSize={{ minRows: 4, maxRows: 8 }} value={responseText} onChange={changeRegradeText} />
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

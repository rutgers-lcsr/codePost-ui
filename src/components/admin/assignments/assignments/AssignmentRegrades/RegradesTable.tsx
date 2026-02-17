import React, { useState } from 'react';

import {
  CheckCircleOutlined,
  CodeOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

import { Divider, Dropdown, Input, message, Modal, Table, Tag, Typography } from 'antd';

/* codePost imports */
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
const { Paragraph, Text } = Typography;
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
    } catch (err) {
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

  const getResponseContent = (submission: SubmissionInfoType | AnonymousSubmissionInfoType) => {
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
      case RESPONSE_STATUS.EDIT_ALLOWED_NEW_RESPONSE: {
        const toggle = () => {
          toggleModal(false, submission);
        };

        return (
          <CPButton cpType="primary" onClick={toggle}>
            Respond
          </CPButton>
        );
      }
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
      title: 'Request Type',
      dataIndex: 'type',
      key: 'type',
      align: aligner,
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
    const isAbleToChange =
      props.isAdmin || submission.questionResponder === props.user.email || submission.questionResponder === null;

    const isAbleToClose = submission.questionIsOpen && submission.questionResponse;

    const responseStatus = getResponseStatus(submission);

    const updateSubmissionFieldClick = () => {
      updateSubmissionField(submission, 'questionResponder', props.user.email);
    };

    const confirmClearReleaseClick = () => {
      confirmClear(submission, true);
    };

    const confirmClearNonReleaseClick = () => {
      confirmClear(submission, false);
    };

    const menuItems = [
      {
        key: '1',
        label: (
          <>
            <EyeOutlined /> View Regrade
          </>
        ),
        onClick: toggleModal.bind({}, true, submission),
      },
      ...(responseStatus === RESPONSE_STATUS.EDIT_ALLOWED_EXISTING_RESPONSE
        ? [
            {
              key: '2',
              label: (
                <>
                  <EditOutlined /> Edit Response
                </>
              ),
              onClick: toggleModal.bind({}, false, submission),
            },
          ]
        : []),
      {
        key: '3',
        label: (
          <>
            {submission.questionResponder !== props.user.email ? <PlusCircleOutlined /> : <MinusCircleOutlined />}
            {submission.questionResponder !== props.user.email ? ' Claim' : ' Release'}
          </>
        ),
        onClick:
          submission.questionResponder === null
            ? updateSubmissionFieldClick
            : submission.questionResponder === props.user.email
              ? confirmClearReleaseClick
              : confirmClearNonReleaseClick,
        disabled: !isAbleToChange,
      },
      {
        key: '4',
        label: (
          <>
            {submission.questionIsOpen ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            {submission.questionIsOpen ? ' Close' : ' Re-open'}
          </>
        ),
        onClick: updateSubmissionField.bind({}, submission, 'questionIsOpen', !submission.questionIsOpen),
        disabled: !(isAbleToChange && (!submission.questionIsOpen || isAbleToClose)),
      },
    ];

    const responseContent = getResponseContent(submission);
    return {
      key: submission.id,
      code: <CodeOutlined onClick={openSubmission.bind({}, submission.id)} />,
      students: submission.students && !props.isAnonymous ? submission.students.toString() : submission.id,
      type: submission.questionIsRegrade ? 'Regrade' : 'Question',
      statusTag:
        submission.questionText && !submission.questionIsOpen ? (
          <Tag color="green">Closed</Tag>
        ) : (
          <Tag color="orange">Open</Tag>
        ),
      status: submission.questionText && !submission.questionIsOpen ? 'Closed' : 'Open',
      responder: submission.questionResponder,
      text: (
        <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }} ellipsis={{ rows: 2, expandable: false }}>
          {submission.questionText}
        </Paragraph>
      ),
      response: responseContent,
      actions: (
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <MenuOutlined />
        </Dropdown>
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

  return (
    <div>
      <CPButton
        cpType="secondary"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 10, marginRight: 10 }}
        onClick={openInstructionsModal}
      >
        Edit Instructions
      </CPButton>
      <RegradeInstructionsModal
        visible={instructionsModalVisible}
        instructions={props.assignment.regradeInstructions ?? ''}
        cancel={closeInstructionsModal}
        save={saveInstructions}
      />
      <CPButton
        cpType="secondary"
        icon={<ReloadOutlined />}
        style={{ marginBottom: 10 }}
        onClick={props.refreshCourseData}
      >
        Refresh Data
      </CPButton>
      <Table columns={columns} dataSource={rows} loading={props.isLoading} />{' '}
      <Modal onCancel={onCancel} open={modalVisible} title="Respond to Regrade request" footer={footer}>
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

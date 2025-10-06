/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

import {
  AuditOutlined,
  CloseOutlined,
  HistoryOutlined,
  MailOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons';

/* antd imports */
import { Alert, Avatar, Divider, Input, message, Modal, Select, Switch, Tabs, Tag } from 'antd';

/* other library imports */
import moment from 'moment';
import ReactMarkdown from 'react-markdown';

/* codePost imports */
import { AssignmentType } from '../../../infrastructure/assignment';
import { AnonymousSubmissionType, StudentSubmissionType } from '../../../infrastructure/submission';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import CPButton from '../../core/CPButton';
import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

import { CodePostDate } from '../../utils/CodepostDate';

const { confirm } = Modal;

/**********************************************************************************************************************/

interface ISubmissionReadProps {
  title?: string;
  assignment: AssignmentType;
  submission?: AnonymousSubmissionType;
  readOnlySubmission?: StudentSubmissionType;
  submitStudentQuestion?: (
    submission: StudentSubmissionType,
    text: string,
    isRegrade: boolean,
  ) => Promise<StudentSubmissionType>;
  deleteStudentQuestion?: (submission: StudentSubmissionType) => Promise<StudentSubmissionType>;
  isStudentMode: boolean;
}

interface ISubmissionInfoWriteProps {
  graders: string[];
  isCourseAdmin: boolean;
  courseLateDayCreditsAllowable: number | null;
  updateGrader: (
    submission: AnonymousSubmissionType,
    graderUsername: string | undefined,
  ) => Promise<AnonymousSubmissionType>;
  addLateDayCreditComment: any;
}

const SubmissionInfo = (props: ISubmissionReadProps & ISubmissionInfoWriteProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const [lateDaySelectValue, setLateDaySelectValue] = React.useState(
    props.submission !== undefined ? props.submission.lateDayCreditsUsed : 0,
  );

  let submitted;
  if (props.submission !== undefined) {
    if (props.submission) {
      if (props.assignment.allowStudentUpload && props.assignment.uploadDueDate) {
        const two_hours = 3.6e6 * 2; // ms grace period
        const isLate =
          Date.parse(props.submission.dateUploaded) > Date.parse(props.assignment.uploadDueDate) + two_hours;

        const uploaded = moment(props.submission.dateUploaded);
        const due = moment(props.assignment.uploadDueDate);
        const daysLate = uploaded.diff(due, 'days') + 1;

        let useLateDayCredits;

        if (props.courseLateDayCreditsAllowable !== null && isLate) {
          const onChange = async (val: any) => {
            const success = await props.addLateDayCreditComment(val);
            if (success) {
              setLateDaySelectValue(val);
            }
          };

          // @ts-ignore
          const arr = [...Array(props.courseLateDayCreditsAllowable).keys(), props.courseLateDayCreditsAllowable];
          const content = (
            <div>
              <span>Use</span>
              <span style={{ margin: '0px 4px' }}>
                <Select
                  onChange={onChange}
                  value={lateDaySelectValue}
                  size="small"
                  style={{ width: 50 }}
                  disabled={props.submission.isFinalized}
                >
                  {arr.map((index: number) => {
                    return <Select.Option value={index.toString()}>{index}</Select.Option>;
                  })}
                </Select>
              </span>
              <span>Late Day Credits</span>
            </div>
          );

          useLateDayCredits = (
            <div className="submission-info__late-day-credits">
              <Alert message={content} type="warning" />
            </div>
          );
        }

        submitted = (
          <div>
            <div>
              Uploaded: <CodePostDate datetime={props.submission.dateUploaded} />{' '}
            </div>
            <div>
              Due: <CodePostDate datetime={props.assignment.uploadDueDate} />{' '}
              {isLate ? (
                <Tag color="volcano">
                  LATE {daysLate} {daysLate === 1 ? 'DAY' : 'DAYS'}
                </Tag>
              ) : (
                ''
              )}
            </div>
            {useLateDayCredits}
          </div>
        );
      }
    }
  }

  let studentList;
  if (props.submission !== undefined) {
    studentList = <Students submission={props.submission} isAnonymous={props.assignment.anonymousGrading} />;
  } else {
    studentList = <Students submission={props.readOnlySubmission!} isAnonymous={props.isStudentMode} />;
  }

  return (
    <div id="submission-info" style={{ paddingLeft: '15px', paddingBottom: '10px' }}>
      <span style={{ fontSize: '12px', color: '#ccc' }}>{submitted}</span>
      <div style={{ fontSize: 12, overflowX: 'auto' }}>
        <b style={{ color: consoleTheme.siderMenuItemColor }}>Students</b>: {studentList}
        {props.submission !== undefined ? (
          <div id="submission-grader">
            <br />
            <b style={{ color: consoleTheme.siderMenuItemColor }}>Grader</b>:{' '}
            <GraderInfo
              submission={props.submission}
              isCourseAdmin={props.isCourseAdmin}
              graders={props.graders}
              updateGrader={props.updateGrader}
            />
          </div>
        ) : null}
        {props.readOnlySubmission !== undefined &&
        props.submitStudentQuestion &&
        props.assignment.allowRegradeRequests ? (
          <StudentRegrade
            submission={props.readOnlySubmission}
            assignment={props.assignment}
            submitStudentQuestion={props.submitStudentQuestion}
            deleteStudentQuestion={props.deleteStudentQuestion}
          />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

const makeReadOnly = (Component: React.ComponentType<ISubmissionReadProps & ISubmissionInfoWriteProps>) => {
  return class WrappedComponent extends React.Component<ISubmissionReadProps> {
    public updateGrader = (submission: AnonymousSubmissionType) => {
      return Promise.resolve(submission);
    };

    public addLateDayCreditComment = () => {
      return;
    };

    public render() {
      return (
        <Component
          {...(this.props as ISubmissionReadProps)}
          updateGrader={this.updateGrader}
          courseLateDayCreditsAllowable={null}
          isCourseAdmin={false}
          graders={[]}
          addLateDayCreditComment={this.addLateDayCreditComment}
        />
      );
    }
  };
};

const ReadOnlySubmissionInfo = makeReadOnly(SubmissionInfo);

/**********************************************************************************************************************/

interface IGraderInfoProps {
  submission: AnonymousSubmissionType;
  graders: string[];
  isCourseAdmin: boolean;
  updateGrader: (
    submission: AnonymousSubmissionType,
    graderUsername: string | undefined,
  ) => Promise<AnonymousSubmissionType>;
}

export const GraderInfo = (props: IGraderInfoProps) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const handleChange = (grader: string) => {
    toggleModal();
    props.updateGrader(props.submission, grader).then(() => {
      message.success(`Successfully assigned to ${grader}`);
    });
  };

  const unassign = () => {
    props.updateGrader(props.submission, '').then(() => {
      message.success('Successfully unassigned submission');
    });
  };

  const toggleModal = () => {
    if (!props.submission.isFinalized) {
      setModalVisible(!modalVisible);
    }
  };

  const menuItems = props.graders.map((grader: string) => {
    return (
      <Select.Option key={grader} value={grader}>
        {grader}
      </Select.Option>
    );
  });

  const renderUnassign = (menu: React.ReactNode) => (
    <div>
      <div style={{ padding: '6px', cursor: 'pointer' }} onMouseDown={unassign}>
        <CloseOutlined /> Unassign
      </div>
      <Divider style={{ margin: '4px 0' }} />
      {menu}
    </div>
  );

  if (props.isCourseAdmin) {
    let graderDisplay;
    if (props.submission.grader === null) {
      graderDisplay = (
        <div onClick={toggleModal}>
          <Tag color={'geekblue'} style={{ cursor: 'pointer' }}>
            Assign
          </Tag>
        </div>
      );
    } else {
      graderDisplay = (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            size="small"
            icon={<AuditOutlined />}
            shape="square"
            style={{ backgroundColor: consoleTheme.avatarBackground }}
          />
          <span style={{ width: '8px' }} />
          <span
            onClick={toggleModal}
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '80%',
              textDecoration: 'underline',
              textDecorationColor: '#ccc',
              cursor: 'pointer',
              color: consoleTheme.siderMenuItemColor,
            }}
          >
            {props.submission.isFinalized ? (
              <CPTooltip title={tooltips.grade.subInfo.unfinalizeToAssign} placement="right">
                <div>{props.submission.grader}</div>
              </CPTooltip>
            ) : (
              <CPTooltip title={tooltips.grade.subInfo.assignGrader} placement="right" hideThisOnHideTips={true}>
                <div>{props.submission.grader}</div>
              </CPTooltip>
            )}
          </span>
        </div>
      );
    }

    const dropdown = (
      <Select
        value={props.submission.grader === null ? '' : props.submission.grader}
        style={{ width: '100%' }}
        disabled={props.submission.isFinalized}
        popupRender={renderUnassign}
        onChange={handleChange}
        showSearch
      >
        {menuItems}
      </Select>
    );

    return (
      <div>
        {graderDisplay}
        <Modal onCancel={toggleModal} open={modalVisible} footer={null} title="Select a grader">
          {dropdown}
        </Modal>
      </div>
    );
  } else {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          size="small"
          icon={<AuditOutlined />}
          shape="square"
          style={{ backgroundColor: consoleTheme.avatarBackground }}
        />
        <span style={{ width: '8px' }} />
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '80%',
            color: consoleTheme.siderMenuItemColor,
          }}
        >
          {props.submission.grader === undefined ? 'unassigned' : props.submission.grader}
        </span>
      </div>
    );
  }
};

/**********************************************************************************************************************/

export const Students = (props: {
  submission: AnonymousSubmissionType | StudentSubmissionType;
  isAnonymous: boolean;
}) => {
  const [showStudents, setShowStudents] = React.useState(!props.isAnonymous && props.submission.students !== undefined);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const reveal = () => {
    setShowStudents(true);
  };

  if (showStudents) {
    return (
      <div style={{ color: consoleTheme.subheaderStudents }}>
        {props.submission.students!.map((student) => {
          return (
            <div key={student} style={{ display: 'flex', alignItems: 'center', paddingBottom: '2px' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                shape="square"
                style={{ backgroundColor: consoleTheme.avatarBackground }}
              />
              <span style={{ width: '8px' }} />
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '80%',
                }}
              >
                {student}
              </span>
            </div>
          );
        })}
      </div>
    );
  } else {
    if (props.submission.students === undefined) {
      return <Tag color={'geekblue'}>Anonymized</Tag>;
    } else {
      return (
        <div>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <Tag color={'geekblue'}>Anonymized</Tag> <a onClick={reveal}>reveal</a>
        </div>
      );
    }
  }
};

/******************************* Student Question and Regrade option *******************************************/

interface IStudentRegradeProps {
  submission: StudentSubmissionType;
  assignment: AssignmentType;
  submitStudentQuestion?: (
    submission: StudentSubmissionType,
    text: string,
    isRegrade: boolean,
  ) => Promise<StudentSubmissionType>;
  deleteStudentQuestion?: (submission: StudentSubmissionType) => Promise<StudentSubmissionType>;
}

enum QUESTION_STATUS {
  NOT_SUBMITTED,
  UNCLAIMED,
  CLAIMED,
  RESPONDED,
}

const StudentRegrade = (props: IStudentRegradeProps) => {
  // *********************** STATE VARIABLES *************************
  const [isModalVisible, setModalVisible] = useState(false);
  const [questionText, setQuestionText] = useState(props.submission.questionText ? props.submission.questionText : '');
  const [questionIsRegrade, setQuestionIsRegrade] = useState(true);
  const [isLoading, setLoading] = useState(false);

  // *********************** STATE CHANGE FUNCTIONS *************************
  const changeQuestionText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestionText(event.target.value);
  };

  const submitQuestion = () => {
    if (props.submitStudentQuestion) {
      setLoading(true);
      props.submitStudentQuestion(props.submission, questionText, questionIsRegrade).then(() => {
        setModalVisible(false);
        setLoading(false);
        message.success(`${questionIsRegrade ? 'Regrade Request' : 'Question'}  Submitted!`);
      });
    }
  };

  const deleteQuestion = () => {
    if (props.deleteStudentQuestion) {
      setLoading(true);
      props.deleteStudentQuestion(props.submission).then(() => {
        setModalVisible(false);
        setLoading(false);
        message.success(`${questionIsRegrade ? 'Regrade Request' : 'Question'}  Deleted.`);
      });
    }
  };

  const confirmDelete = () => {
    confirm({
      title: 'Are you sure you want to delete this request?',
      onOk() {
        deleteQuestion();
      },
      onCancel() {
        return;
      },
    });
  };

  const toggleModalVisible = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleIsRegrade = () => {
    setQuestionIsRegrade(!questionIsRegrade);
  };

  // *********************** RENDER *************************
  const regradeStatus = !props.submission.questionText
    ? QUESTION_STATUS.NOT_SUBMITTED
    : props.submission.questionResponse
      ? QUESTION_STATUS.RESPONDED
      : props.submission.questionResponder
        ? QUESTION_STATUS.CLAIMED
        : QUESTION_STATUS.UNCLAIMED;

  const buttonStyle = { textAlign: 'center' as const, paddingTop: 15 };
  const regradeTextStyle = { padidngTop: 10, fontWeight: 500 };

  const deadline = props.assignment.regradeDeadline
    ? `Deadline: ${moment(props.assignment.regradeDeadline).format('llll')}`
    : '';

  const cancelButton = (
    <CPButton key="cancel" cpType="secondary" onClick={toggleModalVisible}>
      Cancel
    </CPButton>
  );
  const submitButton = (
    <CPButton key="submit" cpType="primary" loading={isLoading} onClick={submitQuestion}>
      Submit
    </CPButton>
  );
  const deleteButton = (
    <CPButton key="delete" cpType="danger" loading={isLoading} onClick={confirmDelete}>
      Delete
    </CPButton>
  );

  switch (regradeStatus) {
    case QUESTION_STATUS.NOT_SUBMITTED: {
      // Case 0: Student has not submitted a question or regrade request
      if (props.assignment.regradeDeadline && Date.parse(props.assignment.regradeDeadline) <= Date.now()) {
        // Case 1: No regraded summited and deadline has passed
        return (
          <div style={buttonStyle}>
            <CPTooltip title={`Deadline for submitting a regrade has passed. ${deadline}`}>
              <CPButton cpType="secondary" icon={<MessageOutlined />} disabled={true}>
                Submit a regrade request
              </CPButton>
            </CPTooltip>
          </div>
        );
      }

      const instructions = (
        <div>
          {props.assignment.regradeInstructions === '' ? null : (
            <div style={{ marginBottom: '12px' }}>
              <ReactMarkdown>{props.assignment.regradeInstructions}</ReactMarkdown>
            </div>
          )}
          <div style={{ fontWeight: 600 }}>{deadline}</div>
        </div>
      );
      return (
        <div>
          <div style={buttonStyle}>
            <CPButton cpType="secondary" icon={<MessageOutlined />} onClick={toggleModalVisible}>
              Submit a regrade request
            </CPButton>
          </div>
          <Modal
            onCancel={toggleModalVisible}
            open={isModalVisible}
            title="Submit a question or regrade request"
            footer={[cancelButton, submitButton]}
          >
            <Alert message={instructions} type="info" />
            <br />
            <Tabs defaultActiveKey="1">
              <Tabs.TabPane key="1" tab="Write">
                <Input.TextArea
                  defaultValue={questionText}
                  onChange={changeQuestionText}
                  autoSize={{ minRows: 10, maxRows: 16 }}
                />
              </Tabs.TabPane>
              <Tabs.TabPane key="2" tab="Preview">
                <ReactMarkdown>{questionText}</ReactMarkdown>
              </Tabs.TabPane>
            </Tabs>
            {props.assignment.allowRegradeRequests ? (
              <div style={{ paddingTop: 15, ...regradeTextStyle }}>
                Ask for a regrade: <Switch disabled={false} checked={questionIsRegrade} onChange={toggleIsRegrade} />
              </div>
            ) : (
              <div />
            )}
          </Modal>
        </div>
      );
    }
    case QUESTION_STATUS.CLAIMED:
    case QUESTION_STATUS.UNCLAIMED:
      // Case 2: Student has submitted. No response yet.
      return (
        <div>
          <div style={buttonStyle}>
            <CPButton cpType="secondary" icon={<HistoryOutlined />} onClick={toggleModalVisible}>
              View submitted request
            </CPButton>
          </div>
          <Modal
            onCancel={toggleModalVisible}
            open={isModalVisible}
            title="The review of your request is in progress..."
            footer={regradeStatus ? [deleteButton, cancelButton] : [cancelButton]}
          >
            <div className="display-flex flex-direction-column">
              <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
                {props.submission.students}
                &nbsp; &nbsp;
                <span style={{ fontSize: 12, color: '#ccc' }}>
                  {props.submission.questionDate ? <CodePostDate datetime={props.submission.questionDate} /> : ''}
                </span>
                <span style={{ fontSize: 12, color: '#25be85', fontWeight: 400, float: 'right' }}>
                  {props.submission.questionIsRegrade ? 'Regrade Requested' : ''}
                </span>
              </div>
              <span style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{props.submission.questionText}</span>
            </div>
          </Modal>
        </div>
      );
    case QUESTION_STATUS.RESPONDED:
      // Case 3: Student has submitted and there is a response.
      return (
        <div>
          <div style={buttonStyle}>
            <CPButton cpType="primary" icon={<MailOutlined />} onClick={toggleModalVisible}>
              View Response
            </CPButton>
          </div>
          <Modal
            onCancel={toggleModalVisible}
            visible={isModalVisible}
            title="View Question Response"
            footer={[cancelButton]}
          >
            <div className="display-flex flex-direction-column">
              <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
                {props.submission.students}
                &nbsp; &nbsp;
                <span style={{ fontSize: 12, color: '#ccc' }}>
                  {props.submission.questionDate ? <CodePostDate datetime={props.submission.questionDate} /> : ''}
                </span>
                <span style={{ color: '#25be85', fontWeight: 400, float: 'right' }}>
                  {props.submission.questionIsRegrade ? 'Regrade Requested' : ''}
                </span>
              </div>
              <span style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{props.submission.questionText}</span>
            </div>
            <Divider />
            <div className="display-flex flex-direction-column">
              <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
                {props.submission.questionResponder}
                &nbsp; &nbsp;
                <span style={{ fontSize: 12, color: '#ccc' }}>
                  {props.submission.responseDate ? <CodePostDate datetime={props.submission.responseDate} /> : ''}
                </span>
              </div>
              <span style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{props.submission.questionResponse}</span>
            </div>
          </Modal>
        </div>
      );
  }
};

export { ReadOnlySubmissionInfo, SubmissionInfo };

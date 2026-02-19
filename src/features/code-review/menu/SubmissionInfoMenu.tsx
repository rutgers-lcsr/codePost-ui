/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

import {
  AuditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  HistoryOutlined,
  MailOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons';

/* antd imports */
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  Badge as AntBadge,
} from 'antd';

/* other library imports */
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);
import ReactMarkdown from 'react-markdown';

/* codePost imports */
import type { AssignmentType, AnonymousSubmissionType, StudentSubmissionType } from '../../../types/models';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { osControlKey } from '../../../components/core/operatingSystem';
import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import { CodePostDate } from '../../../components/utils/CodepostDate';

const { confirm } = Modal;
const { Text } = Typography;

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
  courseStudentsCanSeeGraders?: boolean;
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

  let submittedInfo;
  let useLateDayCredits;

  if (props.submission !== undefined) {
    if (props.submission) {
      if (props.assignment.allowStudentUpload && props.assignment.uploadDueDate) {
        const two_hours = 3.6e6 * 2; // ms grace period
        const isLate =
          props.submission.dateUploaded !== null &&
          Date.parse(props.submission.dateUploaded!) > Date.parse(props.assignment.uploadDueDate) + two_hours;

        const due = dayjs(props.assignment.uploadDueDate);
        const daysLate = props.submission.dateUploaded ? dayjs(props.submission.dateUploaded).diff(due, 'days') + 1 : 0;

        if (props.courseLateDayCreditsAllowable !== null && isLate) {
          const onChange = async (val: any) => {
            const success = await props.addLateDayCreditComment(val);
            if (success) {
              setLateDaySelectValue(val);
            }
          };

          const arr = [...Array(props.courseLateDayCreditsAllowable).keys(), props.courseLateDayCreditsAllowable];
          const content = (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>Use</span>
              <span style={{ margin: '0px 8px' }}>
                <Select
                  onChange={onChange}
                  value={lateDaySelectValue}
                  size="small"
                  style={{ width: 60 }}
                  disabled={props.submission.isFinalized}
                >
                  {arr.map((index: number) => {
                    return <Select.Option value={index.toString()}>{index}</Select.Option>;
                  })}
                </Select>
              </span>
              <span>Late Days</span>
            </div>
          );

          useLateDayCredits = (
            <div className="submission-info__late-day-credits" style={{ marginTop: 12 }}>
              <Alert message={content} type="warning" showIcon />
            </div>
          );
        }

        submittedInfo = (
          <div
            style={{
              backgroundColor: consoleTheme.siderSubmenuTitleBg, // Uses new polished darkbg
              borderRadius: 8,
              padding: '16px 12px',
              border: `1px solid ${consoleTheme.siderSubmenuBorder ? consoleTheme.siderSubmenuBorder.split('solid ')[1] : '#30363d'}`, // Extract color or use fallback
            }}
          >
            <Row gutter={[16, 12]}>
              <Col span={24}>
                <Space align="start">
                  <CalendarOutlined style={{ color: consoleTheme.siderMenuItemColor, fontSize: 16, marginTop: 2 }} />
                  <div>
                    <Text
                      style={{
                        fontSize: 11,
                        display: 'block',
                        color: consoleTheme.siderMenuItemColor,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Uploaded
                    </Text>
                    <Text style={{ color: consoleTheme.text }}>
                      {props.submission.dateUploaded ? (
                        <CodePostDate datetime={props.submission.dateUploaded} />
                      ) : (
                        'Not uploaded'
                      )}
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col span={24}>
                <Space align="start">
                  <ClockCircleOutlined style={{ color: consoleTheme.siderMenuItemColor, fontSize: 16, marginTop: 2 }} />
                  <div>
                    <Text
                      style={{
                        fontSize: 11,
                        display: 'block',
                        color: consoleTheme.siderMenuItemColor,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Due Date
                    </Text>
                    <Space>
                      <Text style={{ color: consoleTheme.text }}>
                        <CodePostDate datetime={props.assignment.uploadDueDate} />
                      </Text>
                      {isLate && (
                        <Tag color="volcano" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                          LATE {daysLate}d
                        </Tag>
                      )}
                    </Space>
                  </div>
                </Space>
              </Col>
            </Row>
            {useLateDayCredits}
          </div>
        );
      }
    }
  }

  let studentList;
  if (props.submission !== undefined) {
    studentList = <Students submission={props.submission} isAnonymous={!!props.assignment.anonymousGrading} />;
  } else {
    studentList = <Students submission={props.readOnlySubmission!} isAnonymous={false} />;
  }

  const canSeeGrader =
    props.assignment.studentsCanSeeGraders === true ||
    (props.assignment.studentsCanSeeGraders === null && props.courseStudentsCanSeeGraders === true);

  const hasGraderField = (sub: any): sub is { grader?: string | null } => {
    return sub && typeof sub === 'object' && 'grader' in sub;
  };

  const readOnlyGrader =
    props.readOnlySubmission && hasGraderField(props.readOnlySubmission) ? props.readOnlySubmission.grader : undefined;
  const readOnlyHasGrader =
    props.readOnlySubmission && 'hasGrader' in props.readOnlySubmission ? props.readOnlySubmission.hasGrader : false;

  const graderEmail = props.submission?.grader ?? readOnlyGrader;
  const graderLabel =
    typeof graderEmail === 'string' && graderEmail.length > 0
      ? graderEmail
      : readOnlyHasGrader
        ? 'Assigned'
        : 'Unassigned';
  const showGraderToStudent = props.isStudentMode && (graderEmail || readOnlyHasGrader) && canSeeGrader;

  return (
    <div id="submission-info" style={{ padding: '10px 15px 15px' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {submittedInfo}

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: consoleTheme.siderMenuItemColor,
              marginBottom: 8,
            }}
          >
            Students
          </div>
          {studentList}
        </div>

        {props.submission !== undefined && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: consoleTheme.siderMenuItemColor,
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              Grader
            </div>
            <GraderInfo
              submission={props.submission}
              isCourseAdmin={props.isCourseAdmin}
              graders={props.graders}
              updateGrader={props.updateGrader}
            />
          </div>
        )}

        {showGraderToStudent && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: consoleTheme.siderMenuItemColor,
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              Grader
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                size="small"
                icon={<AuditOutlined />}
                shape="square"
                style={{ backgroundColor: consoleTheme.avatarBackground }}
              />
              <span style={{ width: '8px' }} />
              <Text
                style={{
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: consoleTheme.siderMenuItemColor,
                }}
              >
                {graderLabel}
              </Text>
            </div>
          </div>
        )}

        {props.readOnlySubmission !== undefined &&
        props.submitStudentQuestion &&
        props.assignment.allowRegradeRequests ? (
          <StudentRegrade
            submission={props.readOnlySubmission}
            assignment={props.assignment}
            submitStudentQuestion={props.submitStudentQuestion}
            deleteStudentQuestion={props.deleteStudentQuestion}
          />
        ) : null}
      </Space>
    </div>
  );
};

const makeReadOnly = (Component: React.ComponentType<ISubmissionReadProps & ISubmissionInfoWriteProps>) => {
  return (props: ISubmissionReadProps) => {
    const updateGrader = (submission: AnonymousSubmissionType) => {
      return Promise.resolve(submission);
    };

    const addLateDayCreditComment = () => {
      return;
    };

    return (
      <Component
        {...props}
        updateGrader={updateGrader}
        courseLateDayCreditsAllowable={null}
        isCourseAdmin={false}
        graders={[]}
        addLateDayCreditComment={addLateDayCreditComment}
        courseStudentsCanSeeGraders={props.courseStudentsCanSeeGraders}
      />
    );
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
          <Typography.Text
            onClick={toggleModal}
            style={{
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textDecoration: 'underline',
              textDecorationColor: '#ccc',
              cursor: 'pointer',
              color: consoleTheme.siderMenuItemColor,
            }}
          >
            {props.submission.isFinalized ? (
              <CPTooltip title={tooltips.grade.subInfo.unfinalizeToAssign} placement="right">
                <span>{props.submission.grader}</span>
              </CPTooltip>
            ) : (
              <CPTooltip title={tooltips.grade.subInfo.assignGrader} placement="right" hideThisOnHideTips={true}>
                <span>{props.submission.grader}</span>
              </CPTooltip>
            )}
          </Typography.Text>
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
        <Typography.Text
          style={{
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: consoleTheme.siderMenuItemColor,
          }}
        >
          {props.submission.grader === undefined ? 'unassigned' : props.submission.grader}
        </Typography.Text>
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
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {props.submission.students!.map((student) => {
          return (
            <div key={student} style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                shape="square"
                style={{ backgroundColor: consoleTheme.avatarBackground }}
              />
              <span style={{ width: '8px' }} />
              <Typography.Text
                style={{
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: consoleTheme.subheaderStudents,
                }}
              >
                {student}
              </Typography.Text>
            </div>
          );
        })}
      </Space>
    );
  } else {
    if (props.submission.students === undefined) {
      return <Tag color={'geekblue'}>Anonymized</Tag>;
    } else {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag color={'geekblue'} style={{ margin: 0 }}>
            Anonymized
          </Tag>
          <Button type="link" size="small" onClick={reveal} style={{ padding: 0, height: 'auto' }}>
            reveal
          </Button>
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
    ? `Deadline: ${dayjs(props.assignment.regradeDeadline).format('llll')}`
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
      // eslint-disable-next-line react-hooks/purity
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
        <Card
          styles={{ body: { padding: 12 } }}
          size="small"
          variant="borderless"
          style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} align="center">
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Need clarification or a regrade?
            </Typography.Text>
            <CPButton
              cpType="secondary"
              size="small"
              icon={<MessageOutlined />}
              onClick={toggleModalVisible}
              style={{ width: '100%' }}
            >
              Submit Request
            </CPButton>
          </Space>
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
        </Card>
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
            open={isModalVisible}
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

const SubmissionInfoTooltip: React.FC<{
  submission?: AnonymousSubmissionType | StudentSubmissionType;
  assignment?: AssignmentType;
}> = ({ submission, assignment }) => {
  let badge = null;

  if (submission && assignment && assignment.uploadDueDate) {
    const two_hours = 3.6e6 * 2; // ms grace period
    const isLate =
      submission.dateUploaded && Date.parse(submission.dateUploaded) > Date.parse(assignment.uploadDueDate) + two_hours;

    if (isLate) {
      badge = (
        <AntBadge
          count={'LATE'}
          style={{
            backgroundColor: '#ff4d4f',
            color: '#fff',
            boxShadow: '0 0 0 1px #d9d9d9 inset',
            fontSize: '10px',
            lineHeight: '16px',
            padding: '0 4px',
          }}
        />
      );
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>Submission Info</span>
      {badge}
      <span style={{ opacity: 0.7 }}>({osControlKey()} + Shift + E)</span>
    </div>
  );
};

export { ReadOnlySubmissionInfo, SubmissionInfo, SubmissionInfoTooltip };

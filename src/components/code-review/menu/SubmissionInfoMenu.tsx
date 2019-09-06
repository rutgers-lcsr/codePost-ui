/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* antd imports */
import { Avatar, Divider, Icon, Input, message, Modal, Select, Switch, Tag, Typography } from 'antd';
const { TextArea } = Input;
const { Text } = Typography;

/* other library imports */
import * as moment from 'moment';

/* codePost imports */
import { AssignmentType } from '../../../infrastructure/assignment';
import { AnonymousSubmissionType, StudentSubmissionType } from '../../../infrastructure/submission';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import CPButton from '../../core/CPButton';
import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

import { formatDate } from '../../utils/DateUtils';

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
}

interface ISubmissionInfoWriteProps {
  graders: string[];
  isCourseAdmin: boolean;
  updateGrader: (
    submission: AnonymousSubmissionType,
    graderUsername: string | undefined,
  ) => Promise<AnonymousSubmissionType>;
}

const SubmissionInfo = (props: ISubmissionReadProps & ISubmissionInfoWriteProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  let lastEdited;
  if (props.submission !== undefined) {
    if (props.submission.dateEdited) {
      lastEdited = formatDate(props.submission.dateEdited);
    }
  }

  let studentList;
  if (props.submission !== undefined) {
    studentList = <Students submission={props.submission} isAnonymous={props.assignment.anonymousGrading} />;
  } else {
    studentList = <Students submission={props.readOnlySubmission!} isAnonymous={false} />;
  }

  return (
    <div id="submission-info" style={{ paddingLeft: '15px', paddingBottom: '10px' }}>
      <span style={{ fontSize: '12px', color: '#ccc' }}>{lastEdited}</span>
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
          <StudentQuestion
            submission={props.readOnlySubmission}
            assignment={props.assignment}
            submitStudentQuestion={props.submitStudentQuestion}
          />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

const makeReadOnly = (Component: React.ComponentType<ISubmissionReadProps & ISubmissionInfoWriteProps>) => {
  return class WrappedComponent extends React.Component<ISubmissionReadProps, {}> {
    public updateGrader = (submission: AnonymousSubmissionType, graderUsername: string | undefined) => {
      return Promise.resolve(submission);
    };

    public render() {
      return (
        <Component
          {...this.props as ISubmissionReadProps}
          updateGrader={this.updateGrader}
          isCourseAdmin={false}
          graders={[]}
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

  const unassign = (e: any) => {
    props.updateGrader(props.submission, '').then(() => {
      message.success('Successfully unassigned submission');
    });
  };

  const toggleModal = () => {
    if (!props.submission.isFinalized) {
      setModalVisible(!modalVisible);
    }
  };

  const menuItems = props.graders.map((grader: string, index: number) => {
    return <Select.Option key={grader}>{grader}</Select.Option>;
  });

  const renderUnassign = (menu: any) => (
    <div>
      <div style={{ padding: '6px', cursor: 'pointer' }} onMouseDown={unassign}>
        <Icon type="close" /> Unassign
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
          <Avatar size="small" icon="audit" shape="square" style={{ backgroundColor: consoleTheme.avatarBackground }} />
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
                {props.submission.grader}
              </CPTooltip>
            ) : (
              <CPTooltip title={tooltips.grade.subInfo.assignGrader} placement="right" hideThisOnHideTips={true}>
                {props.submission.grader}
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
        dropdownRender={renderUnassign}
        onChange={handleChange}
        showSearch
      >
        {menuItems}
      </Select>
    );

    return (
      <div>
        {graderDisplay}
        <Modal onCancel={toggleModal} visible={modalVisible} footer={null} title="Select a grader">
          {dropdown}
        </Modal>
      </div>
    );
  } else {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar size="small" icon="audit" shape="square" style={{ backgroundColor: consoleTheme.avatarBackground }} />
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
                icon="user"
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
          <Tag color={'geekblue'}>Anonymized</Tag> <a onClick={reveal}>reveal</a>
        </div>
      );
    }
  }
};

/******************************* Student Question and Regrade option *******************************************/

interface IStudentQuestionProps {
  submission: StudentSubmissionType;
  assignment: AssignmentType;
  submitStudentQuestion?: (
    submission: StudentSubmissionType,
    text: string,
    isRegrade: boolean,
  ) => Promise<StudentSubmissionType>;
}

enum QUESTION_STATUS {
  NOT_SUBMITTED,
  IN_PROGRESS,
  RESPONDED,
}

const StudentQuestion = (props: IStudentQuestionProps) => {
  // *********************** STATE VARIABLES *************************
  const [isModalVisible, setModalVisible] = useState(false);
  const [questionText, setQuestionText] = useState(props.submission.questionText ? props.submission.questionText : '');
  const [questionIsRegrade, setQuestionIsRegrade] = useState(false);
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

  const toggleModalVisible = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleIsRegrade = () => {
    setQuestionIsRegrade(!questionIsRegrade);
  };

  // *********************** RENDER *************************
  const questionStatus = !props.submission.questionText
    ? QUESTION_STATUS.NOT_SUBMITTED
    : props.submission.questionResponse
    ? QUESTION_STATUS.RESPONDED
    : QUESTION_STATUS.IN_PROGRESS;

  const buttonStyle = { textAlign: 'center' as 'center', paddingTop: 15 };
  const regradeTextStyle = { padidngTop: 10, fontWeight: 500 };

  const deadline = props.assignment.regradeDeadline
    ? `Deadline: ${moment(props.assignment.regradeDeadline).format('llll')}`
    : '';

  switch (questionStatus) {
    case QUESTION_STATUS.NOT_SUBMITTED:
      // Case 0: Student has not submitted a question or regrade request
      if (props.assignment.regradeDeadline && Date.parse(props.assignment.regradeDeadline) <= Date.now()) {
        // Case 1: No regraded summited and deadline has passed
        return (
          <div style={buttonStyle}>
            <CPTooltip title={`Deadline for submitting a regrade has passed. ${deadline}`}>
              <CPButton cpType="secondary" icon="message" disabled={true}>
                Submit a regrade request
              </CPButton>
            </CPTooltip>
          </div>
        );
      }
      return (
        <div>
          <div style={buttonStyle}>
            <CPButton cpType="secondary" icon="message" onClick={toggleModalVisible}>
              Submit a regrade request
            </CPButton>
          </div>
          <Modal
            onCancel={toggleModalVisible}
            visible={isModalVisible}
            title="Submit a question or regrade request"
            footer={[
              <CPButton key="cancel" cpType="secondary" onClick={toggleModalVisible}>
                Cancel
              </CPButton>,
              <CPButton key="submit" cpType="primary" loading={isLoading} onClick={submitQuestion}>
                Submit
              </CPButton>,
            ]}
          >
            <Text type="warning" style={{ marginBottom: 15 }}>
              {deadline}
            </Text>
            ;
            <TextArea autosize value={questionText} onChange={changeQuestionText} />
            {props.assignment.allowRegradeRequests ? (
              <div style={{ paddingTop: 15, ...regradeTextStyle }}>
                Ask for a regrade: <Switch disabled={false} onChange={toggleIsRegrade} />
              </div>
            ) : (
              <div />
            )}
          </Modal>
        </div>
      );
    case QUESTION_STATUS.IN_PROGRESS:
      // Case 2: Student has submitted. No response yet.
      return (
        <div>
          <div style={buttonStyle}>
            <CPButton cpType="secondary" icon="history" onClick={toggleModalVisible}>
              View submitted request
            </CPButton>
          </div>
          <Modal
            onCancel={toggleModalVisible}
            visible={isModalVisible}
            title="The review of your request is in progress..."
            footer={[
              <CPButton key="cancel" cpType="secondary" onClick={toggleModalVisible}>
                Cancel
              </CPButton>,
            ]}
          >
            <div className="display-flex flex-direction-column">
              <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
                {props.submission.students}
                &nbsp; &nbsp;
                <span style={{ fontSize: 12, color: '#ccc' }}>
                  {props.submission.questionDate ? formatDate(props.submission.questionDate) : ''}
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
            <CPButton cpType="primary" icon="mail" onClick={toggleModalVisible}>
              View Response
            </CPButton>
          </div>
          <Modal
            onCancel={toggleModalVisible}
            visible={isModalVisible}
            title="View Question Response"
            footer={[
              <CPButton key="cancel" cpType="secondary" onClick={toggleModalVisible}>
                Cancel
              </CPButton>,
            ]}
          >
            <div className="display-flex flex-direction-column">
              <div style={{ fontSize: 13, color: 'grey', marginBottom: 5 }}>
                {props.submission.students}
                &nbsp; &nbsp;
                <span style={{ fontSize: 12, color: '#ccc' }}>
                  {props.submission.questionDate ? formatDate(props.submission.questionDate) : ''}
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
                  {props.submission.responseDate ? formatDate(props.submission.responseDate) : ''}
                </span>
              </div>
              <span style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{props.submission.questionResponse}</span>
            </div>
          </Modal>
        </div>
      );
  }
};

export { SubmissionInfo, ReadOnlySubmissionInfo };

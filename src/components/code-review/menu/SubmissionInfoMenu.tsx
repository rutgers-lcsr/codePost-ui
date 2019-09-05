/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* antd imports */
import { Avatar, Divider, Icon, Input, message, Modal, Select, Switch, Tag, Typography } from 'antd';
const { TextArea } = Input;
const { Text } = Typography;

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
  SUBMITTING,
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
  const closeModal = () => {
    setModalVisible(false);
  };

  const changeQuestionText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestionText(event.target.value);
  };

  const submitQuestion = () => {
    if (props.submitStudentQuestion) {
      setLoading(true);
      props.submitStudentQuestion(props.submission, questionText, questionIsRegrade).then(() => {
        closeModal();
        setLoading(false);
        message.success(`${questionIsRegrade ? 'Regrade Request' : 'Question'}  Submitted!`);
      });
    }
  };

  // *********************** RENDER *************************
  const questionStatus = isLoading
    ? QUESTION_STATUS.SUBMITTING
    : !props.submission.questionText
    ? QUESTION_STATUS.NOT_SUBMITTED
    : props.submission.questionResponse
    ? QUESTION_STATUS.RESPONDED
    : QUESTION_STATUS.IN_PROGRESS;

  const buttonStyle = { float: 'left' as 'left', paddingTop: 15 };
  const regradeTextStyle = { padidngTop: 10, fontWeight: 500 };

  switch (questionStatus) {
    case QUESTION_STATUS.NOT_SUBMITTED:
      // Case 0: Student has not submitted a question or regrade request
      return (
        <div>
          <div style={buttonStyle}>
            <CPTooltip title="Submit a question or a regrade request" placement="right">
              <CPButton cpType="secondary" icon="message" onClick={setModalVisible.bind(true)} />
            </CPTooltip>
          </div>
          <Modal
            onCancel={closeModal}
            visible={isModalVisible}
            title="Submit a question or regrade request"
            footer={[
              <CPButton key="cancel" cpType="secondary" onClick={closeModal}>
                Cancel
              </CPButton>,
              <CPButton key="submit" cpType="primary" loading={isLoading} onClick={submitQuestion}>
                Submit
              </CPButton>,
            ]}
          >
            <TextArea autosize value={questionText} onChange={changeQuestionText} />
            {props.assignment.allowRegradeRequests ? (
              <div style={{ paddingTop: 15, ...regradeTextStyle }}>
                Ask for a regrade: <Switch disabled={false} onChange={setQuestionIsRegrade.bind(true)} />
              </div>
            ) : (
              <div />
            )}
          </Modal>
        </div>
      );
    case QUESTION_STATUS.SUBMITTING:
      // Case 1: Student has submitted, but no API response yet
      return (
        <div style={buttonStyle}>
          <CPTooltip title="Submitting..." placement="right">
            <CPButton cpType="secondary" icon="loading" onClick={setModalVisible.bind(true)} />
          </CPTooltip>
        </div>
      );
    case QUESTION_STATUS.IN_PROGRESS:
      // Case 2: Student has submitted. No response yet.
      return (
        <div>
          <div style={buttonStyle}>
            <CPTooltip title="View submitted question or regrade request" placement="right">
              <CPButton cpType="secondary" icon="history" onClick={setModalVisible.bind(true)} />
            </CPTooltip>
          </div>
          <Modal
            onCancel={closeModal}
            visible={isModalVisible}
            title="The review of your question is in progress..."
            footer={[
              <CPButton key="cancel" cpType="secondary" onClick={closeModal}>
                Cancel
              </CPButton>,
            ]}
          >
            <Text style={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{props.submission.questionText}</Text>
            <div style={regradeTextStyle}>{props.submission.questionIsRegrade ? 'Regrade Requested' : ''}</div>
          </Modal>
        </div>
      );
    case QUESTION_STATUS.RESPONDED:
      // Case 3: Student has submitted and there is a response.
      return (
        <div>
          <div style={buttonStyle}>
            <CPTooltip title="View response" placement="right">
              <CPButton cpType="secondary" icon="mail" onClick={setModalVisible.bind(true)} />
            </CPTooltip>
          </div>
          <Modal
            onCancel={closeModal}
            visible={isModalVisible}
            title="View Question Response"
            footer={[
              <CPButton key="cancel" cpType="secondary" onClick={closeModal}>
                Cancel
              </CPButton>,
            ]}
          >
            <Text style={{ fontStyle: 'italic', whitespace: 'pre-wrap' }}>{props.submission.questionText}</Text>
            <div style={regradeTextStyle}>{props.submission.questionIsRegrade ? 'Regrade Requested' : ''}</div>
            <Divider />
            <div>
              <div>
                <b>Reviewer: </b> <Text>{props.submission.questionResponder}</Text>
              </div>
              <div style={{ paddingTop: 15 }}>
                <b>Response: </b> <Text style={{ whiteSpace: 'pre-wrap' }}>{props.submission.questionResponse}</Text>
              </div>
            </div>
          </Modal>
        </div>
      );
  }
};

export { SubmissionInfo, ReadOnlySubmissionInfo };

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
import moment from 'moment';

/* codePost imports */
import { AssignmentType } from '../../../infrastructure/assignment';
import { AnonymousSubmissionType, StudentSubmissionType, Submission } from '../../../infrastructure/submission';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import CPButton from '../../core/CPButton';
import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

/**********************************************************************************************************************/

interface ISubmissionReadProps {
  title?: string;
  assignment: AssignmentType;
  submission?: AnonymousSubmissionType;
  readOnlySubmission?: StudentSubmissionType;
  submitStudentQuestion?: (submission: StudentSubmissionType, text: string, isRegrade: boolean) => void;
}

interface ISubmissionInfoWriteProps {
  graders: string[];
  isCourseAdmin: boolean;
  updateGrader: (
    submission: AnonymousSubmissionType,
    graderUsername: string | undefined,
  ) => Promise<AnonymousSubmissionType>;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SubmissionInfo = (props: ISubmissionReadProps & ISubmissionInfoWriteProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  let lastEdited;
  if (props.submission !== undefined) {
    if (props.submission.dateEdited) {
      const dateObj = new Date(props.submission.dateEdited);
      const today = new Date();
      if (dateObj.getFullYear() === today.getFullYear()) {
        if (dateObj.getMonth() === today.getMonth() && dateObj.getDate() === today.getDate()) {
          if (today.getTime() - dateObj.getTime() < 30000) {
            lastEdited = 'Last edited moments ago';
          } else {
            lastEdited = `Last edit at ${moment(dateObj).format('h:mm a')}`;
          }
        } else {
          lastEdited = `Last edit on ${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
        }
      } else {
        lastEdited = `Last edit in ${dateObj.getFullYear()}`;
      }
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
        (props.assignment.allowRegradeRequests || props.assignment.allowQuestions) ? (
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

interface IRegradeRequestProps {
  submission: StudentSubmissionType;
  assignment: AssignmentType;
  submitStudentQuestion: (submission: StudentSubmissionType, text: string, isRegrade: boolean) => void;
}

enum QUESTION_STATUS {
  NOT_SUBMITTED,
  IN_PROGRESS,
  RESPONDED,
}

/******************************* Student Regrade Request option ******************************************************/

const StudentQuestion = (props: IRegradeRequestProps) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [questionText, setQuestionText] = useState(props.submission.questionText ? props.submission.questionText : '');
  const [questionIsRegrade, setQuestionIsRegrade] = useState(false);

  const closeModal = () => {
    setModalVisible(false);
  };

  const changeQuestionText = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestionText(event.target.value);
  };

  const submitRegradeRequest = () => {
    const payload = {
      id: props.submission.id,
      questionText,
      questionIsRegrade,
    };
    Submission.updateQuestion(payload);
    closeModal();
  };

  const questionStatus = !props.submission.questionText
    ? QUESTION_STATUS.NOT_SUBMITTED
    : props.submission.questionResponse
    ? QUESTION_STATUS.RESPONDED
    : QUESTION_STATUS.IN_PROGRESS;

  const setRegradeButton = (disabled: boolean) => {
    return props.assignment.allowRegradeRequests ? (
      <div style={{ float: 'right', paddingTop: 20, paddingBottom: 20 }}>
        Ask for a regrade: <Switch disabled={disabled} onChange={setQuestionIsRegrade.bind({}, true)} />
      </div>
    ) : (
      <div />
    );
  };

  switch (questionStatus) {
    case QUESTION_STATUS.NOT_SUBMITTED:
      return (
        <div>
          <CPButton cpType="secondary" onClick={setModalVisible.bind({}, true)}>
            Submit a question
          </CPButton>

          <Modal
            onCancel={closeModal}
            visible={isModalVisible}
            title={`Submit a question ${props.assignment.allowRegradeRequests ? 'or a regrade request' : ''}`}
            onOk={submitRegradeRequest}
          >
            <TextArea autosize value={questionText} onChange={changeQuestionText} />
            <Divider />
            {setRegradeButton(false)}
          </Modal>
        </div>
      );
    case QUESTION_STATUS.IN_PROGRESS:
      return (
        <div>
          <CPButton cpType="secondary" onClick={setModalVisible.bind({}, true)}>
            View Request
          </CPButton>
          <Modal onCancel={closeModal} visible={isModalVisible} title="Regrade Review in progress...">
            <Text>{props.submission.questionText}</Text>
            {setRegradeButton(true)}
          </Modal>
        </div>
      );
    case QUESTION_STATUS.RESPONDED:
      return (
        <div>
          <CPButton cpType="secondary" onClick={setModalVisible.bind({}, true)}>
            View Response
          </CPButton>
          <Modal onCancel={closeModal} visible={isModalVisible} title="View Regrade response">
            Request: <Text>{props.submission.questionText}</Text>
            {setRegradeButton(true)}
            <div>
              Reviewer: <Text>{props.submission.questionResponder}</Text>
              Response: <Text>{props.submission.questionResponse}</Text>
            </div>
          </Modal>
        </div>
      );
  }
};

export { SubmissionInfo, ReadOnlySubmissionInfo };

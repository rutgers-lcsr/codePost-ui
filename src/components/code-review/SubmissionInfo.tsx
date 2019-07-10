import * as React from 'react';

import moment from 'moment';

import { Avatar, Divider, Icon, message, Modal, Select, Tag, Tooltip } from 'antd';

import { AssignmentType } from '../../infrastructure/assignment';
import { AnonymousSubmissionType, StudentSubmissionType } from '../../infrastructure/submission';

import { Students } from './Subheader';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

interface ISubmissionReadProps {
  title?: string;
  assignment: AssignmentType;
  submission?: AnonymousSubmissionType;
  readOnlySubmission?: StudentSubmissionType;
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
      <div style={{ fontSize: 12 }}>
        <b style={{ color: consoleTheme.siderMenuItemColor }}>Students</b>: {studentList}
        {props.submission !== undefined ? (
          <div>
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

  function handleChange(grader: string) {
    props.updateGrader(props.submission, grader).then(() => {
      message.success(`Successfully assigned to ${grader}`);
    });
  }

  function unassign() {
    props.updateGrader(props.submission, '').then(() => {
      message.success('Successfully unassigned submission');
    });
  }

  function toggleModal() {
    if (!props.submission.isFinalized) {
      setModalVisible(!modalVisible);
    }
  }

  const menuItems = props.graders.map((grader: string, index: number) => {
    return <Select.Option key={grader}>{grader}</Select.Option>;
  });

  const renderUnassign = (menu: any) => (
    <div>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <div style={{ padding: '6px', cursor: 'pointer' }} onClick={unassign}>
        <Icon type="close" /> Unassign
      </div>
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
              <Tooltip title="Unfinalize this submission to edit its grader" placement="right">
                {props.submission.grader}
              </Tooltip>
            ) : (
              <Tooltip title="Click to reassign grader" placement="right">
                {props.submission.grader}
              </Tooltip>
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
      <div
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '80%',
        }}
      >
        {props.submission.grader === undefined ? 'unassigned' : props.submission.grader}
      </div>
    );
  }
};

export { SubmissionInfo, ReadOnlySubmissionInfo };

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Avatar, Divider, Icon, message, Modal, Select, Tag, Tooltip } from 'antd';

/* other library imports */
import * as moment from 'moment';

/* codePost imports */

// import useOnClickOutside from '../core/useOnClickOutside';

import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { AnonymousSubmissionType, StudentSubmissionType, SubmissionType } from '../../infrastructure/submission';

// import { wait } from '../../infrastructure/animation';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

/**********************************************************************************************************************/

interface ISubheaderTitleProps {
  assignment: AssignmentType;
}

export const SubheaderTitle = (props: ISubheaderTitleProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  return (
    <span className=" cp-label cp-label--very-bold cp-label--medium" style={{ color: consoleTheme.subheaderTitle }}>
      {props.assignment.name}
    </span>
  );
};

/**********************************************************************************************************************/

type StatisticType = 'Grade' | 'Mean' | 'Median';

interface ISubheaderStatisticProps {
  name: StatisticType;
  course?: CourseType;
  assignment?: AssignmentType;
  submission?: StudentSubmissionType;
}

export const SubheaderStatistic = (props: ISubheaderStatisticProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  if (props.course === undefined || props.assignment === undefined || props.submission === undefined) {
    return null;
  }

  if (props.assignment.hideGrades) {
    return null;
  }

  if (props.name === 'Mean' || props.name === 'Median') {
    if (!props.course.showStudentsStatistics) {
      return null;
    }
  }

  let statString;
  if (props.name === 'Grade') {
    statString = `${props.submission.grade} / ${props.assignment.points}`;
  }
  if (props.name === 'Mean') {
    statString = props.assignment.mean;
  }
  if (props.name === 'Median') {
    statString = props.assignment.median;
  }
  return (
    <span className="cp-label cp-label--very-bold cp-label--medium" style={{ color: consoleTheme.subheaderGrade }}>
      {`${props.name} ${statString}`}
    </span>
  );
};

/**********************************************************************************************************************/

interface ISubheaderGraderProps {
  submission: AnonymousSubmissionType;
  graders: string[];
  isCourseAdmin: boolean;
  updateGrader: (submission: AnonymousSubmissionType, graderUsername: string | undefined) => Promise<SubmissionType>;
}

export const SubheaderGrader = (props: ISubheaderGraderProps) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  // const { consoleTheme } = React.useContext(ConsoleThemeContext);

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
    setModalVisible(!modalVisible);
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
        <div style={{ display: 'flex' }}>
          <Avatar size="small" icon="audit" shape="square" />
          &nbsp;
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
            }}
          >
            {props.submission.grader}
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

/**********************************************************************************************************************/

interface IStatusTagsProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
}

type StatusTagType = 0 | 1 | 2 | 3;

export const StatusTags = (props: IStatusTagsProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const theme = consoleThemes.light === consoleTheme ? 'light' : 'dark';

  const subStatus = (finalized: boolean, published: boolean): StatusTagType => {
    if (!finalized && !published) {
      return 0;
    }

    if (finalized && !published) {
      return 1;
    }

    if (!finalized && published) {
      return 2;
    }

    if (finalized && published) {
      return 3;
    }

    // should never hit
    return 0;
  };

  const statusTagType: StatusTagType = subStatus(props.submission.isFinalized, props.assignment.isReleased);

  // @ts-ignore
  let tagColor;
  let tagText;
  let tooltipText;
  switch (statusTagType) {
    case 0:
      tagColor = theme === 'light' ? 'blue' : '#1890ff';
      tagText = 'not finalized and not published';
      tooltipText = 'student cannot view';
      break;
    case 1:
      tagColor = theme === 'light' ? 'orange' : '#fa8c16';
      tagText = 'finalized but not published';
      tooltipText = 'student cannot view';
      break;
    case 2:
      tagColor = theme === 'light' ? 'red' : '#f5222d';
      tagText = 'published but not finalized';
      tooltipText = 'student cannot view';
      break;
    case 3:
      tagColor = theme === 'light' ? 'gold' : '#faad14';
      tagText = 'finalized and published';
      tooltipText = 'student can view';
      break;
  }

  return (
    <Tooltip title={tooltipText} placement="bottom">
      <Tag
        color={tagColor}
        style={{
          marginRight: '0px',
          cursor: 'help',
        }}
      >
        {tagText}
      </Tag>
    </Tooltip>
  );
};

/**********************************************************************************************************************/

export const LastEdited = (props: { submission: AnonymousSubmissionType }) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  return (
    <span className="cp-label cp-label--bold" style={{ color: consoleTheme.subheaderDate }}>
      Last Edited: {props.submission.dateEdited ? moment(props.submission.dateEdited).format('lll') : '--'}
    </span>
  );
};

/**********************************************************************************************************************/

export const Students = (props: { submission: AnonymousSubmissionType; isAnonymous: boolean }) => {
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
            <div key={student} style={{ display: 'flex' }}>
              <Avatar size="small" icon="user" shape="square" /> &nbsp;{' '}
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

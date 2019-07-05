/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Avatar, Button, Descriptions, Divider, Icon, message, Modal, Popconfirm, Select, Tag, Tooltip } from 'antd';
const ButtonGroup = Button.Group;

/* other library imports */
import * as moment from 'moment';

/* codePost imports */
import Grade from '../grade/Grade';

// import useOnClickOutside from '../core/useOnClickOutside';

import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { AnonymousSubmissionType, StudentSubmissionType, SubmissionType } from '../../infrastructure/submission';

// import { wait } from '../../infrastructure/animation';

import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../../types/common';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

import CPButton from '../core/CPButton';

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

interface ISubheaderInfoProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType | StudentSubmissionType;
  rubricCategories: RubricCategoryType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
}

// FIXME: Although the calculate methods that compose this component are modularized,
//         it will be prudent to find a way to rigorously test this presentation.
//         Possibly with Snapshot tests
//         Wrong values here will damage the accountability chain.
export const SubheaderInfo = (props: ISubheaderInfoProps) => {
  const pointsPerCategory = Grade.pointsPerCategory(props.commentRubricComments);
  const pointsPerCategoryWithCaps = Grade.pointsPerCategoryWithCaps(pointsPerCategory, props.rubricCategories);
  const genericPoints = Grade.genericCommentPoints(props.comments);

  const categoryPoints = Object.values(pointsPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
    return accumulator + current;
  }, 0);

  const styledLabel = (n: number, excluded?: boolean) => {
    let points = n;
    let style = {};
    let className = 'cp-label';
    let modifier = null;

    if (n > 0) {
      modifier = '-';
      className = 'cp-label cp-label--bold cp-label--error';
    } else if (n < 0) {
      modifier = '+';
      points = n * -1;
      className = 'cp-label cp-label--bold cp-label--success';
    } else {
      className = 'cp-label cp-label--bold cp-label--neutral';
    }

    if (excluded) {
      style = { ...style, textDecoration: 'line-through' };
      className = 'cp-label cp-label--neutral';
    }

    return (
      <span style={style} className={className}>
        {modifier}
        {points}
      </span>
    );
  };

  let categories = props.rubricCategories.map((rubricCategory: RubricCategoryType) => {
    const uncappedPoints = pointsPerCategory.hasOwnProperty(rubricCategory.id)
      ? pointsPerCategory[rubricCategory.id]
      : null;

    const cappedPoints = pointsPerCategoryWithCaps.hasOwnProperty(rubricCategory.id)
      ? pointsPerCategoryWithCaps[rubricCategory.id]
      : null;

    let exceededBy = null;
    if (uncappedPoints !== null && cappedPoints !== null && uncappedPoints !== cappedPoints) {
      const diff = uncappedPoints - cappedPoints;
      exceededBy = <span className="cp-label cp-label--italic cp-label--bold">(exceeded limit by {diff})</span>;
    }

    let points;
    if (exceededBy !== null && uncappedPoints !== null && cappedPoints !== null) {
      points = (
        <span className="cp-label">
          {styledLabel(uncappedPoints, true)} <Icon type="caret-right" /> {styledLabel(cappedPoints)}
        </span>
      );
    } else if (cappedPoints !== null) {
      points = <span className="cp-label">{styledLabel(cappedPoints)}</span>;
    }

    return {
      description: (
        <span className="cp-label cp-label--italic">
          {rubricCategory.name} {exceededBy}
        </span>
      ),
      value: <span className="cp-label">{points}</span>,
    };
  });

  categories = [
    ...categories,
    {
      description: <span className="cp-label cp-label--italic">other</span>,
      value: styledLabel(genericPoints),
    },
  ];

  const categoriesTable = (
    <Descriptions title="Category Breakdown" column={1} bordered>
      {categories.map((item: any, index: number) => {
        return (
          <Descriptions.Item key={index} label={item.description}>
            {item.value}
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );

  const summary = [
    {
      description: <span className="cp-label">Assignment Total</span>,
      value: <span>{props.assignment.points}</span>,
    },
    {
      description: <span className="cp-label">Net Point Delta</span>,
      value: <span>{styledLabel(categoryPoints + genericPoints)}</span>,
    },
    {
      description: <span className="cp-label cp-label--very-bold">Final Grade</span>,
      value: (
        <span className="cp-label cp-label--very-bold">{props.assignment.points - categoryPoints - genericPoints}</span>
      ),
    },
  ];

  const summaryTable = (
    <Descriptions title="Summary" column={1} bordered>
      {summary.map((item: any, index: number) => {
        return (
          <Descriptions.Item key={index} label={item.description}>
            {item.value}
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );

  return (
    <div>
      {categoriesTable}
      <Divider />
      {summaryTable}
    </div>
  );
};

/**********************************************************************************************************************/

interface ISubheaderGradeProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
  calculateGrade: () => number | undefined;
  rubricCategories: RubricCategoryType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
}

export const SubheaderGrade = (props: ISubheaderGradeProps) => {
  const [breakdownVisible, setBreakdownVisible] = React.useState(false);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const gradeNum = props.submission.isFinalized ? (props.submission.grade as number) : props.calculateGrade();
  const theme = consoleThemes.light === consoleTheme ? 'light' : 'dark';

  function handleClick() {
    setBreakdownVisible(!breakdownVisible);
  }

  return (
    <div>
      <CPButton cpType={theme === 'light' ? 'secondary' : 'dark'} onClick={handleClick}>
        Grade: {gradeNum} / {props.assignment.points}
      </CPButton>
      <Modal title={'Grade breakdown'} visible={breakdownVisible} onCancel={handleClick} footer={null}>
        <SubheaderInfo
          submission={props.submission}
          assignment={props.assignment}
          rubricCategories={props.rubricCategories}
          comments={props.comments}
          commentRubricComments={props.commentRubricComments}
        />
      </Modal>
    </div>
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

interface IFinalizeButtonProps {
  submission: AnonymousSubmissionType;
  canToggle: () => boolean;
  toggleFinalized: () => void;
}

export const FinalizeButton = (props: IFinalizeButtonProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [popconfirmVisible, setPopconfirmVisible] = React.useState(false);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const [isLoading, setIsLoading] = React.useState(false);

  // const [notice, setNotice] = React.useState(false);
  // useOnClickOutside(ref, async (e: any) => {
  //   const fileMenu = document.getElementById('file-menu');
  //   if (ref && ref.current && fileMenu !== null && !fileMenu.contains(e.target)) {
  //     setNotice(true);
  //     await wait(250);
  //     setNotice(false);
  //   }
  // });

  const theme = consoleThemes.light === consoleTheme ? 'light' : 'dark';

  const onClick = async () => {
    setIsLoading(true);
    if (!props.submission.isFinalized && !props.canToggle()) {
      setPopconfirmVisible(true);
    } else {
      await props.toggleFinalized();
      setIsLoading(false);
    }
  };

  const confirm = async () => {
    await props.toggleFinalized();
    setIsLoading(false);
    setPopconfirmVisible(false);
  };

  const cancel = () => {
    setIsLoading(false);
    setPopconfirmVisible(false);
  };

  const isFinalized = props.submission.isFinalized;

  return (
    <div ref={ref}>
      <ButtonGroup>
        <CPButton
          cpType={theme === 'light' ? 'primary' : isFinalized ? 'primary' : 'dark'}
          fallback="unlock"
          onClick={onClick}
          loading={isLoading && isFinalized}
          small={true}
          disabled={!isFinalized}
        >
          Edit
        </CPButton>
        <CPButton
          cpType={theme === 'light' ? 'primary' : !isFinalized ? 'primary' : 'dark'}
          fallback="lock"
          onClick={onClick}
          loading={isLoading && !isFinalized}
          disabled={isFinalized}
          style={props.submission.grader === null ? { pointerEvents: 'none' } : undefined}
          small={true}
        >
          <Popconfirm
            title={
              <div>
                <p>You have draft comments that will not be saved.</p>{' '}
                <p>
                  <b>Are you sure you want to continue?</b>
                </p>
              </div>
            }
            visible={popconfirmVisible}
            onConfirm={confirm}
            onCancel={cancel}
            okText="Yes"
            cancelText="No"
            placement="bottomRight"
          >
            Done
          </Popconfirm>
        </CPButton>
      </ButtonGroup>
    </div>
  );
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

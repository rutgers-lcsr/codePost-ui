/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import {
  Button,
  Descriptions,
  Divider,
  Icon,
  message,
  Popconfirm,
  Popover,
  Select,
  Skeleton,
  Tag,
  Tooltip,
} from 'antd';
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
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  let content = <Skeleton active />;
  const title = 'How was this calculated?';

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

  content = (
    <div>
      {categoriesTable}
      <Divider />
      {summaryTable}
    </div>
  );

  return (
    <Popover content={content} title={title} placement="rightTop">
      <CPButton
        key="subheader-info"
        cpType="highlight"
        size="small"
        icon="question"
        style={{ cursor: 'help', backgroundColor: consoleTheme.subheaderBg }}
      />
    </Popover>
  );
};

/**********************************************************************************************************************/

interface ISubheaderGradeProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
  calculateGrade: () => number | undefined;
}

export const SubheaderGrade = (props: ISubheaderGradeProps) => {
  // const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const gradeNum = props.submission.isFinalized ? (props.submission.grade as number) : props.calculateGrade();

  return (
    <Button>
      Grade: {gradeNum} / {props.assignment.points}
    </Button>
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
  const menuItems = props.graders.map((grader: string, index: number) => {
    return (
      <Select.Option key={grader} style={{ fontSize: 12 }}>
        {grader}
      </Select.Option>
    );
  });
  // const { consoleTheme } = React.useContext(ConsoleThemeContext);
  // const theme = consoleThemes.light === consoleTheme ? 'light' : 'dark';

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

  const currentGrader = props.submission.grader ? props.submission.grader : 'unassigned';

  const renderUnassign = (menu: any) => (
    <div>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <div style={{ padding: '6px', cursor: 'pointer', fontSize: 12 }} onClick={unassign}>
        <Icon type="close" /> Unassign
      </div>
    </div>
  );

  const dropdown = (
    <Select
      value={currentGrader}
      style={{ width: 200, fontSize: 12 }}
      disabled={props.submission.isFinalized}
      dropdownRender={renderUnassign}
      onChange={handleChange}
    >
      {menuItems}
    </Select>
  );

  if (props.isCourseAdmin) {
    return <span>{dropdown}</span>;
  } else {
    return <span>{currentGrader}</span>;
  }
  return dropdown;
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
  // const [notice, setNotice] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // useOnClickOutside(ref, async (e: any) => {
  //   const fileMenu = document.getElementById('file-menu');
  //   if (ref && ref.current && fileMenu !== null && !fileMenu.contains(e.target)) {
  //     setNotice(true);
  //     await wait(250);
  //     setNotice(false);
  //   }
  // });

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

  return (
    <div ref={ref}>
      <ButtonGroup>
        <CPButton
          cpType="primary"
          fallback="unlock"
          onClick={onClick}
          loading={isLoading && props.submission.isFinalized}
          small={true}
          disabled={!props.submission.isFinalized}
        >
          Edit
        </CPButton>
        <CPButton
          cpType="primary"
          fallback="lock"
          onClick={onClick}
          loading={isLoading && !props.submission.isFinalized}
          disabled={props.submission.isFinalized}
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
  const [showStudents, setShowStudents] = React.useState(false);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const reveal = () => {
    setShowStudents(true);
  };

  let studentString;
  let revealButton;

  if (props.submission.students === undefined || (props.isAnonymous && !showStudents)) {
    studentString = '<Anonymized>';

    if (props.submission.students !== undefined && !showStudents) {
      revealButton = <a onClick={reveal}>reveal</a>;
    }
  } else {
    studentString = props.submission.students.join(', ');
  }
  return (
    <span>
      <span className="cp-label" style={{ color: consoleTheme.subheaderStudents }}>
        {studentString}{' '}
      </span>
      {revealButton}
    </span>
  );
};

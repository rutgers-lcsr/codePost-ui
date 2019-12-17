/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

import { Link } from 'react-router-dom';

import JSZip from 'jszip';

import { saveAs } from 'file-saver';

/* antd imports */
import { Button, Descriptions, Divider, Dropdown, Icon, message, Menu, Modal, Popover, Switch, Tag } from 'antd';

/* codePost imports */
import CPButton from '../core/CPButton';
import CPTooltip from '../core/CPTooltip';
import { ShowTooltipContext, tooltips } from '../core/tooltips';

import { osControlKey } from '../core/operatingSystem';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

import { wait } from '../../infrastructure/animation';
import { AssignmentType } from '../../infrastructure/assignment';
import { Submission } from '../../infrastructure/submission';
import { File } from '../../infrastructure/file';

import { CourseType } from '../../infrastructure/course';
import { FileType } from '../../infrastructure/file';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { AnonymousSubmissionType, StudentSubmissionType } from '../../infrastructure/submission';

import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../../types/common';

import CodeConsole from './CodeConsole';

import useHotkeys, { F_KEY, MINUS_KEY, PLUS_KEY, P_KEY, V_KEY } from './useHotkeys';

import useWindowSize from '../core/useWindowSize';

import { CODE_DEMO, CODE_TOUR_ID } from '../../routes';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import { encodeForLink } from '../core/URLutils';

const ButtonGroup = Button.Group;

/**********************************************************************************************************************/

interface IMagnifierProps {
  updateZoom: (newZoom: number) => void;
}

const Magnifier = (props: IMagnifierProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';
  const [zoom, setZoom] = React.useState(LOCAL_SETTINGS.codeZoom.getter());

  React.useEffect(() => {
    props.updateZoom(zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function zoomOut() {
    const newZoom = Math.max(0.5, zoom - 0.1);
    setZoom(newZoom);
    props.updateZoom(newZoom);
    LOCAL_SETTINGS.codeZoom.setter(newZoom);
  }

  function zoomIn() {
    const newZoom = Math.min(2, zoom + 0.1);
    setZoom(newZoom);
    props.updateZoom(newZoom);
    LOCAL_SETTINGS.codeZoom.setter(newZoom);
  }

  useHotkeys(MINUS_KEY, zoomOut);
  useHotkeys(PLUS_KEY, zoomIn);

  // Note: would be nice to let the user set her zoom explicitly
  // Would need to replace the middle button with an input
  // or maybe open a modal when the middle button is pressed

  return (
    <ButtonGroup style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', lineHeight: 1.499 }}>
      <CPTooltip title={tooltips.grade.header.zoomOut} hideThisOnHideTips={true}>
        <CPButton id="zoom-out" cpType={cpType} onClick={zoomOut} small={true}>
          <Icon type="zoom-out" />
        </CPButton>
      </CPTooltip>
      <CPButton cpType={cpType} small>
        {(zoom * 100).toFixed(0)}%
      </CPButton>
      <CPTooltip title={tooltips.grade.header.zoomIn} hideThisOnHideTips={true}>
        <CPButton id="zoom-in" cpType={cpType} onClick={zoomIn} small={true}>
          <Icon type="zoom-in" />
        </CPButton>
      </CPTooltip>
    </ButtonGroup>
  );
};

/**********************************************************************************************************************/

interface IResetProps {
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
}

const Reset = (props: IResetProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  function onClick() {
    props.updateVerticalOffset(() => 0);
  }

  return (
    <CPTooltip title={tooltips.grade.header.alignment} hideThisOnHideTips={true}>
      <ButtonGroup>
        <CPButton id="reset" cpType={cpType} small={true} onClick={onClick}>
          <Icon type="redo" />
        </CPButton>
      </ButtonGroup>
    </CPTooltip>
  );
};

/**********************************************************************************************************************/

interface IViewAsStudentProps {
  pathname: string;
}

export const ViewAsStudent = (props: IViewAsStudentProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  return (
    <Link to={{ pathname: `${props.pathname}?student=1` }} target="_blank">
      <CPTooltip title={tooltips.grade.header.viewAsStudent} hideThisOnHideTips={true}>
        <ButtonGroup>
          <CPButton id="view-as-student" cpType={cpType} small={true}>
            <Icon type="idcard" />
          </CPButton>
        </ButtonGroup>
      </CPTooltip>
    </Link>
  );
};

/**********************************************************************************************************************/

interface IDownloadCodeProps {
  submission: AnonymousSubmissionType;
}

export const DownloadCode = (props: IDownloadCodeProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  const onClick = async () => {
    // We fetch the latest files because some files over the size limit have had their code
    // replaced for rendering performance

    const latestSubmission = await Submission.read(props.submission.id);
    const files = await Promise.all(
      latestSubmission.files.map((f) => {
        return File.read(f);
      }),
    );

    if (files.length === 0) {
      return;
    }

    const zip = new JSZip();
    files.map((file: FileType) => {
      let dir = zip;
      if (file.path !== null && file.path.length > 0) {
        const folders = file.path.split('/');
        folders.forEach((f: string) => {
          dir = dir.folder(f);
        });
      }
      dir.file(file.name, file.code);
      return true;
    });

    zip.generateAsync({ type: 'blob' }).then(function(content: any) {
      saveAs(content, `submission-${files[0].submission}.zip`);
    });
  };

  return (
    <CPTooltip title={tooltips.grade.header.downloadCode} hideThisOnHideTips={true}>
      <ButtonGroup>
        <CPButton id="view-as-student" cpType={cpType} small={true} onClick={onClick}>
          <Icon type="download" />
        </CPButton>
      </ButtonGroup>
    </CPTooltip>
  );
};

/**********************************************************************************************************************/

interface IControlsProps {
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
  updateZoom: (newZoom: number) => void;
  fallbackWidth?: number;
}

export const Controls = (props: IControlsProps) => {
  const windowSize = useWindowSize();
  const controls = (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {/*      <Reset key="reset" updateVerticalOffset={props.updateVerticalOffset} />
      <div style={{ width: '20px' }} />*/}
      <Magnifier key="zoom" updateZoom={props.updateZoom} />
    </div>
  );
  const controlPanel =
    props.fallbackWidth && windowSize.width < props.fallbackWidth ? (
      <Popover content={controls} placement="bottom" trigger="click">
        <Icon
          type="control"
          style={{
            fontSize: '20px',
            lineHeight: '20px',
            verticalAlign: '-7px',
            cursor: 'pointer',
          }}
        />
      </Popover>
    ) : (
      controls
    );
  return controlPanel;
};

/**********************************************************************************************/
interface IFinalizeButtonProps {
  submission: AnonymousSubmissionType;
  toggleFinalized: () => void;
}

export const FinalizeButton = (props: IFinalizeButtonProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const showTooltips = React.useContext(ShowTooltipContext);

  const [nudge, setNudge] = React.useState(false);
  const triggerNudge = async () => {
    setNudge(true);
    message.warning('Unfinalize to modify this submission →');
    await wait(1200); // two wiggles
    setNudge(false);
  };

  const onClick = async () => {
    await props.toggleFinalized();
    setIsLoading(false);
  };

  useHotkeys(F_KEY, onClick, true);

  React.useEffect(() => {
    // Activate the nudge when these elements are clicked
    const codeContainer = document.getElementById('code-container');
    const comments = document.getElementById('comments');
    const grader = document.getElementById('submission-grader');

    if (props.submission.isFinalized) {
      if (codeContainer !== null) {
        codeContainer.addEventListener('click', triggerNudge);
      }

      if (comments !== null) {
        comments.addEventListener('click', triggerNudge);
      }

      if (grader !== null) {
        grader.addEventListener('click', triggerNudge);
      }
    }

    return () => {
      if (codeContainer !== null) {
        codeContainer.removeEventListener('click', triggerNudge);
      }

      if (comments !== null) {
        comments.removeEventListener('click', triggerNudge);
      }

      if (grader !== null) {
        grader.removeEventListener('click', triggerNudge);
      }
    };
  }, [props.submission]);

  const isFinalized = props.submission.isFinalized;

  const finalizeNotice =
    props.submission.grader === null ? 'Assign a grader to this submission before finalizing it.' : null;

  const toggleNotice =
    finalizeNotice !== null
      ? finalizeNotice
      : !showTooltips
      ? null
      : props.submission.isFinalized
      ? `This submission is finalized. Unfinalize to modify it. [${osControlKey()} shift f]`
      : `This submission is unfinalized. Finalize it to mark it as complete. [${osControlKey()} shift f]`;

  return (
    <div ref={ref} id="submission-status-toggle" className={nudge ? 'wiggle' : ''}>
      <CPTooltip title={toggleNotice} placement="left">
        <span style={{ color: consoleTheme.siderMenuItemColor }}>Finalized:</span>
        &nbsp;
        <Switch
          checked={isFinalized}
          onClick={onClick}
          disabled={!isFinalized && props.submission.grader === null}
          loading={isLoading}
        />
      </CPTooltip>
    </div>
  );
};

/**********************************************************************************************************************/

interface IGradeBreakdownProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType | StudentSubmissionType;
  rubricCategories: RubricCategoryType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  files: FileType[];
}

// FIXME: Although the calculate methods that compose this component are modularized,
//         it will be prudent to find a way to rigorously test this presentation.
//         Possibly with Snapshot tests
//         Wrong values here will damage the accountability chain.
export const GradeBreakdown = (props: IGradeBreakdownProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentFileSet, currentCommentSet] = CodeConsole.filterCurrentFileVersions(props.files, props.comments);
  const pointsPerCategory = CodeConsole.pointsPerCategory(props.commentRubricComments, currentCommentSet);
  const pointsPerCategoryWithCaps = CodeConsole.pointsPerCategoryWithCaps(pointsPerCategory, props.rubricCategories);
  const genericPoints = CodeConsole.genericCommentPoints(props.comments);

  const categoryPoints = Object.values(pointsPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
    return accumulator + current;
  }, 0);

  const liveFeedbackWarning = props.assignment.liveFeedbackMode ? (
    <div style={{ color: 'grey', fontStyle: 'italic', marginBottom: 10, textAlign: 'center' }}>
      Note: Grade calculations do not include old versions of files.
    </div>
  ) : (
    ''
  );

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

  // tslint:disable
  const summary = [
    props.assignment.additiveGrading
      ? null
      : {
          description: <span className="cp-label">Assignment Total</span>,
          value: <span>{props.assignment.points}</span>,
        },
    props.assignment.additiveGrading
      ? null
      : {
          description: <span className="cp-label">Net Point Delta</span>,
          value: <span>{styledLabel(categoryPoints + genericPoints)}</span>,
        },
    {
      description: <span className="cp-label cp-label--very-bold">Final Grade</span>,
      value: (
        <span className="cp-label cp-label--very-bold">
          {(props.assignment.additiveGrading ? 0 : props.assignment.points) - categoryPoints - genericPoints} /{' '}
          {props.assignment.points}
        </span>
      ),
    },
  ];
  // tslint:enable

  const summaryTable = (
    <Descriptions title="Summary" column={1} bordered>
      {summary
        .filter((el) => {
          return el !== null;
        })
        .map((item: any, index: number) => {
          return (
            <Descriptions.Item key={index} label={item.description}>
              {item.value}
            </Descriptions.Item>
          );
        })}
    </Descriptions>
  );

  return (
    <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      {liveFeedbackWarning}
      {categoriesTable}
      <Divider />
      {summaryTable}
    </div>
  );
};

/**********************************************************************************************************************/

interface IGradeButtonProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType | StudentSubmissionType;
  calculateGrade: () => number | undefined;
  rubricCategories: RubricCategoryType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  files: FileType[];
}

export const GradeButton = (props: IGradeButtonProps) => {
  const [breakdownVisible, setBreakdownVisible] = React.useState(false);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const gradeNum = props.submission.isFinalized ? (props.submission.grade as number) : props.calculateGrade();
  const theme = consoleThemes.light === consoleTheme ? 'light' : 'dark';

  function handleClick() {
    setBreakdownVisible(!breakdownVisible);
  }

  useHotkeys('b', handleClick, true);

  return (
    <div>
      <CPButton cpType={theme === 'light' ? 'secondary' : 'dark'} onClick={handleClick}>
        Grade: {gradeNum} / {props.assignment.points}
      </CPButton>
      <Modal title={'Grade breakdown'} visible={breakdownVisible} onCancel={handleClick} footer={null}>
        <GradeBreakdown
          submission={props.submission}
          assignment={props.assignment}
          rubricCategories={props.rubricCategories}
          comments={props.comments}
          commentRubricComments={props.commentRubricComments}
          files={props.files}
        />
      </Modal>
    </div>
  );
};

/**********************************************************************************************************************/

interface IStatusTagsProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
  fallbackWidth?: number;
}

type StatusTagType = 0 | 1 | 2 | 3;

export const StatusTags = (props: IStatusTagsProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const windowSize = useWindowSize();
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
      tagColor = theme === 'light' ? 'gold' : '#fa8c16';
      tagText = 'finalized but not published';
      tooltipText = 'student cannot view';
      break;
    case 2:
      tagColor = theme === 'light' ? 'orange' : '#fa8c16';
      tagText = 'published but not finalized';
      tooltipText = 'student cannot view';
      break;
    case 3:
      tagColor = theme === 'light' ? '#22be84' : '#22be84';
      tagText = 'finalized and published';
      tooltipText = 'student can view';
      break;
  }

  const tagStyle = { marginRight: '0px', cursor: 'help' };
  return (
    <CPTooltip
      title={
        props.fallbackWidth && windowSize.width < props.fallbackWidth ? [tagText, tooltipText].join('\n') : tooltipText
      }
      placement="bottom"
    >
      {props.fallbackWidth && windowSize.width < props.fallbackWidth ? (
        <Icon theme="twoTone" style={{ color: tagColor, ...tagStyle }} type="tag" />
      ) : (
        <Tag color={tagColor} style={tagStyle}>
          {tagText}
        </Tag>
      )}
    </CPTooltip>
  );
};

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

interface IHeaderMenuProps {
  claimSubmission: () => void;
  isStudent: boolean;
  hasExplanations: boolean;
  showExplanations: boolean;
  toggleShowExplanations: () => void;
  isAdmin: boolean;
  course?: CourseType;
  assignment: AssignmentType;
}

export const HeaderMenu = (props: IHeaderMenuProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  useHotkeys(P_KEY, props.claimSubmission, true);
  useHotkeys(V_KEY, props.toggleShowExplanations, true, !props.hasExplanations);

  const groupStyle = {
    padding: '5px 20px',
    lineHeight: '40px',
    fontSize: '14px',
    color: '#8d9298',
    background: '#f4f4f4',
    fontWeight: 600,
    cursor: 'default',
  };
  const itemStyle = {
    padding: '5px 20px',
    lineHeight: '35px',
    fontSize: '14px',
    cursor: 'pointer',
  };

  const openIntercom = () => {
    (window as any).Intercom('show');
  };

  const menu = (
    <Menu mode="vertical" style={{ width: 320, padding: 0 }}>
      <Menu.Item key="setting:1" style={groupStyle} className="header-menu">
        Code Review Console
      </Menu.Item>
      {props.isStudent ? null : (
        <Menu.Item key="claim" style={itemStyle} className="header-menu">
          <span onClick={props.claimSubmission}>
            <Icon type="plus-circle" /> Claim another submission{' '}
            <span style={{ color: '#ccc' }}>[{osControlKey()} shift p]</span>
          </span>
        </Menu.Item>
      )}
      {props.isAdmin && props.course ? (
        <Menu.Item key="rubric" style={itemStyle} className="header-menu">
          <Link
            to={`/admin/${encodeForLink(props.course.name)}/${encodeForLink(
              props.course.period,
            )}/assignments/${encodeForLink(props.assignment.name)}/rubric`}
          >
            <Icon type="edit" /> Open rubric in Admin Console
          </Link>
        </Menu.Item>
      ) : null}
      {props.isStudent || !props.hasExplanations ? null : (
        <Menu.Item key="explanations" style={itemStyle} className="header-menu" onClick={props.toggleShowExplanations}>
          Show rubric comment {props.showExplanations ? 'text' : ' explanations'}{' '}
          <span style={{ color: '#ccc' }}>[{osControlKey()} shift v]</span>
        </Menu.Item>
      )}
      <Menu.Item key="setting:3" style={itemStyle} className="header-menu" onClick={openIntercom}>
        Help! (talk to a human from codePost)
      </Menu.Item>
      <Menu.Item key="setting:4" style={groupStyle} className="header-menu">
        Other
      </Menu.Item>
      <Menu.Item key="setting:5" style={itemStyle} className="header-menu">
        <a href="/">Home</a>
      </Menu.Item>
      <Menu.Item key="setting:6" style={itemStyle} className="header-menu">
        <a href="/logout">Logout</a>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Icon type="menu" style={{ color: consoleTheme.text }} />
    </Dropdown>
  );
};

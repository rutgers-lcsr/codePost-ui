/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* antd imports */
import { Button, Descriptions, Divider, Icon, Modal, Popconfirm, Tooltip } from 'antd';
const ButtonGroup = Button.Group;

/* codePost imports */
import CPButton from '../../core/CPButton';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import themeVars from '../../../styles/abstracts/_theme.js';

import { AnonymousSubmissionType, StudentSubmissionType } from '../../../infrastructure/submission';

import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../../../types/common';

import { RubricCategoryType } from '../../../infrastructure/rubricCategory';

import CodeConsole from '../CodeConsole';

import { AssignmentType } from '../../../infrastructure/assignment';

import { EXPAND_CODE_SHORTCUT, SHRINK_CODE_SHORTCUT, ZOOM_IN_SHORTCUT, ZOOM_OUT_SHORTCUT } from '../Shortcuts';

/**********************************************************************************************************************/

interface IMagnifierProps {
  updateZoom: (newZoom: number) => void;
}

export const Magnifier = (props: IMagnifierProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';
  const [zoom, setZoom] = React.useState(1);

  function zoomOut() {
    const newZoom = Math.max(0.5, zoom - 0.1);
    setZoom(newZoom);
    props.updateZoom(newZoom);
  }

  function zoomIn() {
    const newZoom = Math.min(2, zoom + 0.1);
    setZoom(newZoom);
    props.updateZoom(newZoom);
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      if (e.which === ZOOM_IN_SHORTCUT && e.metaKey) {
        e.preventDefault();
        zoomIn();
      } else if (e.which === ZOOM_OUT_SHORTCUT && e.metaKey) {
        // [⌘ + -]
        e.preventDefault();
        zoomOut();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  // Note: would be nice to let the user set her zoom explicitly
  // Would need to replace the middle button with an input
  // or maybe open a modal when the middle button is pressed

  return (
    <ButtonGroup>
      <Tooltip
        placement="top"
        title={
          <div>
            Shrink code
            <br />
            [⌘ + -]
          </div>
        }
      >
        <CPButton id="zoom-out" cpType={cpType} onClick={zoomOut} small={true}>
          <Icon type="zoom-out" />
        </CPButton>
      </Tooltip>
      <CPButton cpType={cpType} small>
        {(zoom * 100).toFixed(0)}%
      </CPButton>
      <Tooltip
        placement="top"
        title={
          <div>
            Magnify code
            <br />
            [⌘ + +]
          </div>
        }
      >
        <CPButton id="zoom-in" cpType={cpType} onClick={zoomIn} small={true}>
          <Icon type="zoom-in" />
        </CPButton>
      </Tooltip>
    </ButtonGroup>
  );
};

/**********************************************************************************************************************/

interface ISizerProps {
  updateSplitBasis: (newSplitBasis: number) => void;
}

export const Sizer = (props: ISizerProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';
  const [splitBasis, setSplitBasis] = React.useState(themeVars.grade.splitBasis);

  // Track window width to prevent user from extending code too far to the right and
  // squishing comments
  const [width, setWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  function shrink() {
    const newSplitBasis = Math.max(200, splitBasis - 100);
    setSplitBasis(newSplitBasis);
    props.updateSplitBasis(newSplitBasis);
  }

  function grow() {
    const codeContainer = document.getElementById('code-container');
    if (codeContainer !== null) {
      const maxWidth = width - codeContainer.offsetLeft - themeVars.grade.commentMinWidth;
      const newSplitBasis = Math.min(maxWidth, splitBasis + 100);
      setSplitBasis(newSplitBasis);
      props.updateSplitBasis(newSplitBasis);
    }
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      if (e.which === SHRINK_CODE_SHORTCUT && e.metaKey) {
        shrink();
      } else if (e.which === EXPAND_CODE_SHORTCUT && e.metaKey) {
        grow();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  return (
    <ButtonGroup>
      <Tooltip
        placement="top"
        title={
          <div>
            Shrink code window
            <br />
            [⌘ + ←]
          </div>
        }
      >
        <CPButton id="shrink" cpType={cpType} onClick={shrink} small={true}>
          <Icon type="double-left" />
        </CPButton>
      </Tooltip>
      <Tooltip
        placement="top"
        title={
          <div>
            Expand code window
            <br />
            [⌘ + →]
          </div>
        }
      >
        <CPButton id="grow" cpType={cpType} onClick={grow} small={true}>
          <Icon type="double-right" />
        </CPButton>
      </Tooltip>
    </ButtonGroup>
  );
};

/**********************************************************************************************************************/

interface IResetProps {
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
}

export const Reset = (props: IResetProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  function onClick() {
    props.updateVerticalOffset(() => 0);
  }

  return (
    <Tooltip
      placement="top"
      title={
        <div>
          reset comment alignments
          <br />
          [⌘+click highlights]
        </div>
      }
    >
      <ButtonGroup>
        <CPButton id="reset" cpType={cpType} small={true} onClick={onClick}>
          <Icon type="redo" />
        </CPButton>
      </ButtonGroup>
    </Tooltip>
  );
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

  // FIXME: discuss this feature as a team
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

interface IGradeBreakdownProps {
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
export const GradeBreakdown = (props: IGradeBreakdownProps) => {
  const pointsPerCategory = CodeConsole.pointsPerCategory(props.commentRubricComments);
  const pointsPerCategoryWithCaps = CodeConsole.pointsPerCategoryWithCaps(pointsPerCategory, props.rubricCategories);
  const genericPoints = CodeConsole.genericCommentPoints(props.comments);

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
    <div style={{ maxHeight: '80vh', overflowY: 'scroll' }}>
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
}

export const GradeButton = (props: IGradeButtonProps) => {
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
        <GradeBreakdown
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

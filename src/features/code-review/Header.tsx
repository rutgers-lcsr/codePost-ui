// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

import { Link } from 'react-router-dom';

import JSZip from 'jszip';

import { saveAs } from 'file-saver';

import {
  ControlOutlined,
  DownloadOutlined,
  EditOutlined,
  IdcardOutlined,
  MailOutlined,
  MenuOutlined,
  PlusCircleOutlined,
  TagTwoTone,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';

/* antd imports */
import { Col, Dropdown, Modal, Popover, Row, Space, Statistic, Switch, Table, Tag, message } from 'antd';

import { trackFeature } from '../../components/utils/Fullstory';

/* codePost imports */
import CPButton from '../../components/core/CPButton';
import CPTooltip from '../../components/core/CPTooltip';
import { tooltips } from '../../components/core/tooltips';
import { colors } from '../../theme/colors';

import { osControlKey } from '../../components/core/operatingSystem';

import { ConsoleThemeContext, consoleThemes } from '../../styles/abstracts/_console-theme-context';

import { wait } from '../../utils/animation';
import type {
  AssignmentType,
  AnonymousSubmissionType,
  StudentSubmissionType,
  SubmissionTestType,
  TestCaseType,
} from '../../types/models';
import { getFileContent, type FileType, type FileWithId } from '../../utils/file';
import { Submission } from '../../services/submission';
import { submissionFilesApi } from '../../api-client/clients';

import { Course, RubricCategory } from '../../api-client';

import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../../types/common';

import {
  filterCurrentFileVersions,
  genericCommentPoints,
  pointsFromTests,
  pointsPerCategory,
  pointsPerCategoryWithCaps,
} from './codeConsoleUtils';

import { createFakeSubmission } from '../../components/utils/FakeSubmissionUtils';

import useHotkeys, { MINUS_KEY, PLUS_KEY, U_KEY } from './useHotkeys';
import useWindowSize from '../../components/core/useWindowSize';
import { LOCAL_SETTINGS } from '../../components/utils/LocalSettings';
import { useCodeConsoleStore } from '../../stores/useCodeConsoleStore';

import { encodeForLink } from '../../components/core/URLutils';

declare global {
  interface Window {
    Intercom?: (command: string) => void;
  }
}

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
    <Space.Compact style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', lineHeight: 1.499 }}>
      <CPTooltip title={tooltips.grade.header.zoomOut} hideThisOnHideTips={true}>
        <CPButton id="zoom-out" cpType={cpType} onClick={zoomOut} small={true}>
          <ZoomOutOutlined />
        </CPButton>
      </CPTooltip>
      <CPButton cpType={cpType} small>
        {(zoom * 100).toFixed(0)}%
      </CPButton>
      <CPTooltip title={tooltips.grade.header.zoomIn} hideThisOnHideTips={true}>
        <CPButton id="zoom-in" cpType={cpType} onClick={zoomIn} small={true}>
          <ZoomInOutlined />
        </CPButton>
      </CPTooltip>
    </Space.Compact>
  );
};

/**********************************************************************************************************************/

// interface IResetProps {
//   updateVerticalOffset: (updater: (oldValue: number) => number) => void;
// }

// const Reset = (props: IResetProps) => {
//   const { consoleTheme } = React.useContext(ConsoleThemeContext);
//   const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

//   function onClick() {
//     props.updateVerticalOffset(() => 0);
//   }

//   return (
//   return (
//     <Space align="center">
//       <Tooltip title="Toggle Help Modal">
//          <Tag style={{ cursor: 'pointer' }} onClick={() => useCodeConsoleStore.getState().setShowHelpModal(true)}>
//              Help: {osControlKey()} + ?
//          </Tag>
//       </Tooltip>
//       <CPTooltip title={tooltips.grade.header.alignment} hideThisOnHideTips={true}>
//         <ButtonGroup>
//           <CPButton id="reset" cpType={cpType} small={true} onClick={onClick}>
//             <Icon type="redo" />
//           </CPButton>
//         </ButtonGroup>
//       </CPTooltip>
//     </Space>
//   );
//   );
// };

/**********************************************************************************************************************/

interface IViewAsStudentProps {
  pathname: string;
}

export const ViewAsStudent = (props: IViewAsStudentProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const cpType = consoleTheme === consoleThemes.light ? 'secondary' : 'dark';

  return (
    <Link to={{ pathname: props.pathname, search: '?student=1' }} target="_blank">
      <CPTooltip title={tooltips.grade.header.viewAsStudent} hideThisOnHideTips={true}>
        <Space.Compact>
          <CPButton id="view-as-student" cpType={cpType} small={true}>
            <IdcardOutlined />
          </CPButton>
        </Space.Compact>
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
        if (typeof f === 'number') {
          return submissionFilesApi.retrieve({ id: f });
        } else {
          return submissionFilesApi.retrieve({ id: f.id });
        }
      }),
    );

    if (files.length === 0) {
      return;
    }

    const zip = new JSZip();
    files.map((file: FileType) => {
      let dir: JSZip = zip;
      if (file.path) {
        const folders = file.path.split('/');
        folders.forEach((f: string) => {
          const nextDir = dir.folder(f);
          dir = nextDir ? nextDir : dir;
        });
      }
      const content = getFileContent(file);
      // Binary files (PDFs, images, etc.) are stored as data URIs: "data:<mime>;base64,<data>"
      // Decode them to binary before adding to the zip so they download correctly.
      const dataUriMatch = content.match(/^data:[^;]+;base64,/);
      if (dataUriMatch) {
        const base64 = content.slice(dataUriMatch[0].length);
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        dir.file(file.name, bytes, { binary: true });
      } else {
        dir.file(file.name, content);
      }
      return true;
    });

    zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
      saveAs(content, `submission-${files[0].submission}.zip`);
    });
  };

  return (
    <CPTooltip title={tooltips.grade.header.downloadCode} hideThisOnHideTips={true}>
      <Space.Compact>
        <CPButton id="download-code" cpType={cpType} small={true} onClick={onClick}>
          <DownloadOutlined />
        </CPButton>
      </Space.Compact>
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
      <CPTooltip title="Toggle Help Modal">
        <Tag
          style={{ cursor: 'pointer', marginRight: '10px' }}
          onClick={() => useCodeConsoleStore.getState().setShowHelpModal(true)}
        >
          Help: {osControlKey()} + ?
        </Tag>
      </CPTooltip>
      <Magnifier key="zoom" updateZoom={props.updateZoom} />
    </div>
  );
  const controlPanel =
    props.fallbackWidth && windowSize.width < props.fallbackWidth ? (
      <Popover content={controls} placement="bottom" trigger="click">
        <ControlOutlined
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
  course: Course;
  submission: AnonymousSubmissionType;
  toggleFinalized: () => void;
  numComments: number;
  minComments: number;
  canUnfinalize: boolean;
  isOnlyGrader: boolean;
}

export const FinalizeButton = (props: IFinalizeButtonProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const [nudge, setNudge] = React.useState(false);
  const triggerNudge = async (event: MouseEvent) => {
    const safeAreaClasses = ['comment-share'];
    const safeAreas = safeAreaClasses
      .map((id) => Array.prototype.slice.call(document.getElementsByClassName(id))) // HTMLCollection => array
      .flat();
    if (!safeAreas.some((area) => area !== null && area.contains(event.target))) {
      setNudge(true);
      message.warning('Unfinalize to modify this submission →');
      await wait(1200); // two wiggles
      setNudge(false);
    }
  };

  const isFinalized = props.submission.isFinalized;

  const sendStudentNotification = async () => {
    fetch(`${process.env.REACT_APP_API_URL}/submissions/${props.submission.id}/notifyStudents/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        if (res.status === 200) {
          const json = await res.json();
          message.success(json);
          return;
        } else {
          const json = await res.json();
          message.error(json);
          return;
        }
      })
      .catch((_err) => {
        console.log(_err);
      });
    return;
  };

  const onClick = async () => {
    if (isFinalized) {
      if (props.canUnfinalize) {
        executeToggle();
      } else {
        message.warning("You aren't able to unfinalize this submission.");
      }
    } else {
      if (props.minComments > 0 && props.numComments < props.minComments) {
        Modal.confirm({
          title: `This submission has fewer than ${props.minComments} comments applied.`,
          content: `Are you sure you want to finalize it? Submissions with fewer than ${props.minComments} comments will be flagged for quality control.`,
          onOk() {
            return finalize();
          },
        });
        // FIXME: This doesn't cover the situation where both settings are enabled
        // course.enableStudentFeedbackNotifications and mincomments
      } else if (props.course.enableStudentFeedbackNotifications) {
        const studentText = `student${
          props.submission.students ? (props.submission.students.length > 1 ? 's' : '') : '(s)'
        }`;

        Modal.confirm({
          title: `Notify ${studentText} via email?`,
          content: `This submission will be viewable once finalized. Would you like codePost to notify the ${studentText} by sending them an email?`,
          icon: <MailOutlined />,
          okText: 'Finalize and send email',
          cancelText: 'Finalize',
          onOk: async () => {
            await finalize();
            sendStudentNotification();
            trackFeature('Student Feedback Notification Approved', {});
            return;
          },
          onCancel() {
            finalize();
            trackFeature('Student Feedback Notification Rejected', {});
            return;
          },
        });
      } else {
        finalize();
      }
    }
  };

  const executeToggle = async () => {
    await props.toggleFinalized();
    setIsLoading(false);
  };

  const finalize = async () => {
    // If the submission doesn't have a grader and there are multiple graders in the course, make the user finalize it
    if (!props.submission.grader && !props.isOnlyGrader) {
      message.warning('You must assign a grader before finalizing this submission.');
    } else {
      await executeToggle();
    }
  };

  // useHotkeys(F_KEY, onClick, true); // Disabled to allow Ctrl+Shift+F for sidebar
  // (window as any).addToFoobar({
  //   value: 'Finalize / unfinalize',
  //   label: 'Finalize / unfinalize',
  //   callback: onClick,
  //   kind: 'action',
  // });

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

  let toggleNotice;
  if (isFinalized) {
    if (props.canUnfinalize) {
      toggleNotice = `This submission is finalized. Unfinalize to modify it. [${osControlKey()} shift f]`;
    } else {
      toggleNotice = "You aren't able to unfinalize this submission. Please contact an admin if you made a mistake";
    }
  } else {
    if (!props.submission.grader && !props.isOnlyGrader) {
      toggleNotice = `You must assign a grader before finalizing this submission.`;
    } else {
      toggleNotice = `This submission is unfinalized. Finalize it to mark it as complete. [${osControlKey()} shift f]`;
    }
  }

  return (
    <div ref={ref} id="submission-status-toggle" className={nudge ? 'wiggle' : ''} style={{ minWidth: '108px' }}>
      <CPTooltip title={toggleNotice} placement="left">
        <div>
          <span style={{ color: consoleTheme.siderMenuItemColor }}>Finalized:</span>
          &nbsp;
          <span>
            <Switch
              aria-label={isFinalized ? 'Click to unfinalize' : 'Click to Finalize'}
              checked={isFinalized}
              onClick={onClick}
              disabled={
                (props.submission.grader === null && !props.isOnlyGrader) || (isFinalized && !props.canUnfinalize)
              }
              loading={isLoading}
            />
          </span>
        </div>
      </CPTooltip>
    </div>
  );
};

/**********************************************************************************************************************/

interface IGradeBreakdownProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType | StudentSubmissionType;
  rubricCategories: RubricCategory[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  files: FileType[];
  submissionTests: SubmissionTestType[];
  testCases: TestCaseType[];
}

// FIXME: Although the calculate methods that compose this component are modularized,
//         it will be prudent to find a way to rigorously test this presentation.
//         Possibly with Snapshot tests
//         Wrong values here will damage the accountability chain.
interface GradeBreakdownRow {
  key: string | number;
  category: string;
  points: number;
  uncapped: number;
  diff: number;
}

export const GradeBreakdown = (props: IGradeBreakdownProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const isDarkTheme = consoleThemes.dark === consoleTheme;
  const mutedText = isDarkTheme ? '#9da7b3' : 'rgba(0,0,0,0.65)';

  // Import these from codeConsoleUtils instead of using CodeConsole static
  const [currentFileSet, currentCommentSet] = filterCurrentFileVersions(props.files as FileWithId[], props.comments);
  const pointsPerCategoryVal = pointsPerCategory(props.commentRubricComments, currentCommentSet);
  const pointsPerCategoryWithCapsVal = pointsPerCategoryWithCaps(pointsPerCategoryVal, props.rubricCategories);
  const genericPoints = genericCommentPoints(props.comments, currentFileSet);
  const testsAffectGrade = props.assignment.testsAffectGrade ?? true;
  const testPoints = testsAffectGrade ? pointsFromTests(props.submissionTests, props.testCases) : 0;

  const categoryPoints = Object.values(pointsPerCategoryWithCapsVal).reduce((accumulator, current) => {
    return (typeof accumulator === 'number' ? accumulator : 0) + (typeof current === 'number' ? current : 0);
  }, 0);

  const liveFeedbackWarning = props.assignment.liveFeedbackMode ? (
    <div style={{ color: mutedText, fontStyle: 'italic', marginBottom: 10, textAlign: 'center' }}>
      Note: Grade calculations do not include old versions of files.
    </div>
  ) : (
    ''
  );

  const breakdownDataSource: GradeBreakdownRow[] = props.rubricCategories.map((rubricCategory: RubricCategory) => {
    const uncappedPoints = Object.prototype.hasOwnProperty.call(pointsPerCategoryVal, rubricCategory.id)
      ? pointsPerCategoryVal[rubricCategory.id]
      : 0;

    const cappedPoints = Object.prototype.hasOwnProperty.call(pointsPerCategoryWithCapsVal, rubricCategory.id)
      ? pointsPerCategoryWithCapsVal[rubricCategory.id]
      : 0;

    const diff = uncappedPoints !== cappedPoints ? uncappedPoints - cappedPoints : 0;

    return {
      key: rubricCategory.id,
      category: rubricCategory.name,
      points: cappedPoints,
      uncapped: uncappedPoints,
      diff: diff,
    };
  });

  // Add tests and other if relevant
  if (testsAffectGrade && testPoints !== 0) {
    breakdownDataSource.push({
      key: 'tests',
      category: 'Tests',
      points: testPoints,
      uncapped: testPoints,
      diff: 0,
    });
  }

  if (genericPoints !== 0) {
    breakdownDataSource.push({
      key: 'other',
      category: 'General Comments',
      points: genericPoints,
      uncapped: genericPoints,
      diff: 0,
    });
  }

  const finalGrade =
    (props.assignment.additiveGrading ? 0 : props.assignment.points) - categoryPoints - genericPoints - testPoints;
  const totalDeductions = categoryPoints + genericPoints + testPoints;

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string, record: GradeBreakdownRow) => (
        <span>
          {text}
          {record.diff !== 0 && (
            <span style={{ marginLeft: 8, fontSize: 12, color: mutedText, fontStyle: 'italic' }}>
              (Exceeded limit by {record.diff})
            </span>
          )}
        </span>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      align: 'right' as const,
      render: (points: number) => {
        if (points > 0) {
          return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>-{points}</span>;
        } else if (points < 0) {
          return <span style={{ color: '#52c41a', fontWeight: 600 }}>+{Math.abs(points)}</span>;
        }
        return <span style={{ color: isDarkTheme ? '#9da7b3' : '#d9d9d9', fontWeight: 600 }}>-</span>;
      },
    },
  ];

  return (
    <div style={{ maxHeight: '80vh', overflowY: 'auto', overflowX: 'hidden', padding: 4 }}>
      {liveFeedbackWarning}

      <Row gutter={16} style={{ marginBottom: 24, marginLeft: 0, marginRight: 0 }}>
        {!props.assignment.additiveGrading && (
          <Col span={8}>
            <Statistic title="Assignment Total" value={props.assignment.points} />
          </Col>
        )}
        <Col span={8}>
          <Statistic
            title={props.assignment.additiveGrading ? 'Total Points' : 'Net Change'}
            value={Math.abs(totalDeductions)}
            prefix={totalDeductions > 0 ? '-' : totalDeductions < 0 ? '+' : ''}
            valueStyle={{
              color: totalDeductions > 0 ? '#ff4d4f' : totalDeductions < 0 ? '#52c41a' : undefined,
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Final Grade"
            value={finalGrade}
            suffix={`/ ${props.assignment.points}`}
            valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
          />
        </Col>
      </Row>

      <Table dataSource={breakdownDataSource} columns={columns} pagination={false} size="small" rowKey="key" />

      {!testsAffectGrade && props.submissionTests.length > 0 && (
        <div style={{ color: mutedText, fontStyle: 'italic', marginTop: 10, textAlign: 'center' }}>
          Note: Test results are not included in the grade. Tests are for feedback only.
        </div>
      )}
    </div>
  );
};

/**********************************************************************************************************************/

interface IGradeButtonProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType | StudentSubmissionType;
  calculateGrade: () => number | undefined;
  rubricCategories: RubricCategory[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  files: FileType[];
  submissionTests?: SubmissionTestType[];
  testCases: TestCaseType[];
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

  if (gradeNum === null || gradeNum === undefined) {
    return null;
  }

  return (
    <div>
      <CPButton cpType={theme === 'light' ? 'secondary' : 'dark'} onClick={handleClick}>
        Grade: {gradeNum} / {props.assignment.points}
      </CPButton>
      <Modal title={'Grade breakdown'} open={breakdownVisible} onCancel={handleClick} footer={null}>
        <GradeBreakdown
          submission={props.submission}
          assignment={props.assignment}
          rubricCategories={props.rubricCategories}
          comments={props.comments}
          commentRubricComments={props.commentRubricComments}
          files={props.files}
          submissionTests={props.submissionTests || []}
          testCases={props.testCases}
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

  const statusTagType: StatusTagType = subStatus(!!props.submission.isFinalized, !!props.assignment.feedbackReleased);

  let tagColor;
  let tagText;
  let tooltipText;
  switch (statusTagType) {
    case 0:
      tagColor = theme === 'light' ? 'blue' : colors.actionBlue;
      tagText = 'not finalized and not published';
      tooltipText = 'student cannot view feedback';
      break;
    case 1:
      tagColor = theme === 'light' ? 'gold' : '#fa8c16';
      tagText = 'finalized but not published';
      tooltipText = 'student cannot view feedback';
      break;
    case 2:
      tagColor = theme === 'light' ? 'orange' : '#fa8c16';
      tagText = 'published but not finalized';
      tooltipText = 'student cannot view feedback';
      break;
    case 3:
      tagColor = theme === 'light' ? '#22be84' : '#22be84';
      tagText = 'finalized and published';
      tooltipText = 'student can view feedback';
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
        <TagTwoTone style={{ color: tagColor, ...tagStyle }} />
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
    <h1
      className=" cp-label cp-label--very-bold cp-label--medium"
      style={{ color: consoleTheme.subheaderTitle, margin: 0, display: 'inline-block', fontSize: 'inherit' }}
    >
      {props.assignment.name}
    </h1>
  );
};

interface IHeaderMenuProps {
  claimSubmission: () => void;
  isStudent: boolean;
  isDemo?: boolean;
  isAdmin: boolean;
  course?: Course;
  assignment: AssignmentType;
  submission?: StudentSubmissionType | AnonymousSubmissionType;
}

export const HeaderMenu = (props: IHeaderMenuProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  // Only register claim submission hotkey for non-students
  const canClaimSubmissions = !props.isStudent && !props.isDemo && props.course?.activateQueue;
  useHotkeys(U_KEY, canClaimSubmissions ? props.claimSubmission : () => {}, canClaimSubmissions);

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
    window.Intercom?.('show');
  };

  const menuItems = [
    ...(process.env.NODE_ENV === 'development'
      ? [
          {
            key: 'fake-data',
            label: (
              <span onClick={() => createFakeSubmission(props.assignment.id, props.submission?.id)}>
                <PlusCircleOutlined /> Populate Fake Data
              </span>
            ),
            style: itemStyle,
            className: 'header-menu',
          },
        ]
      : []),
    {
      key: 'setting:1',
      label: 'Code Review Console',
      style: groupStyle,
      className: 'header-menu',
    },
    ...(props.isStudent || props.isDemo || (props.course && !props.course.activateQueue)
      ? []
      : [
          {
            key: 'claim',
            label: (
              <span onClick={props.claimSubmission}>
                <PlusCircleOutlined /> Claim another submission{' '}
                <span style={{ color: '#ccc' }}>[{osControlKey()} shift u]</span>
              </span>
            ),
            style: itemStyle,
            className: 'header-menu',
          },
        ]),
    ...(props.isAdmin && props.course
      ? [
          {
            key: 'rubric',
            label: (
              <Link
                to={`/admin/${encodeForLink(props.course.name)}/${encodeForLink(
                  props.course.period,
                )}/assignments/rubrics/${encodeForLink(props.assignment.name)}`}
              >
                <EditOutlined /> Open rubric in Admin Console
              </Link>
            ),
            style: itemStyle,
            className: 'header-menu',
          },
        ]
      : []),

    {
      key: 'setting:3',
      label: 'Help! (talk to a human from codePost)',
      style: itemStyle,
      className: 'header-menu',
      onClick: openIntercom,
    },
    {
      key: 'setting:4',
      label: 'Other',
      style: groupStyle,
      className: 'header-menu',
    },
    {
      key: 'setting:5',
      label: <Link to="/">Home</Link>,
      style: itemStyle,
      className: 'header-menu',
    },
    {
      key: 'setting:6',
      label: <Link to="/logout">Logout</Link>,
      style: itemStyle,
      className: 'header-menu',
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <MenuOutlined style={{ color: consoleTheme.text }} />
    </Dropdown>
  );
};

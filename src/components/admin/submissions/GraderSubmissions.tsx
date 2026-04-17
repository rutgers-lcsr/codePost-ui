// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { PlusCircleOutlined, UserAddOutlined } from '@ant-design/icons';

/* ant imports */
import { Breadcrumb, Checkbox, Empty, Progress, Space, Typography, Tooltip } from 'antd';

/* other library imports */
import dayjs from 'dayjs';
import Highlighter from 'react-highlight-words';

import { Link, Route, Routes } from 'react-router-dom';

/* codePost imports  */
import type {
  Assignment,
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  SubmissionInfoType,
} from '../../../types/common';

import { encodeForLink } from '../../../components/core/URLutils';

import { sortAssignments } from '../../../utils/assignments';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import GraderDetail from './graders/GraderDetail';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import Loading from '../../../components/core/Loading';

/**********************************************************************************************************************/

export interface IByGraderProps {
  /* UI control */
  loadComplete: boolean;
  baseURL: string;
  courseURL: string;

  /* submissions data */
  assignments: Assignment[];
  submissionsByAssignment: IAssignmentToSubmissionsMap;
  submissionsByGrader: IGraderSubmissionsDataTable;
  graders: string[];
  inactiveGraders: string[];

  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
}

const GraderData: React.FC<IByGraderProps> = (props) => {
  const [showInactive, setShowInactive] = React.useState(false);
  const [showActive, setShowActive] = React.useState(true);

  const {
    loadComplete,
    baseURL,
    assignments,
    submissionsByAssignment,
    submissionsByGrader,
    graders,
    inactiveGraders,
    viewsBySubmission,
    deleteSubmission,
  } = props;

  const means = React.useMemo(() => {
    const newMeans: Record<string, string | null> = {};
    for (const key of Object.keys(submissionsByAssignment)) {
      const submissions: SubmissionInfoType[] = submissionsByAssignment[+key];
      const uniqueSubmissions = submissions ? Array.from(new Map(submissions.map((s) => [s.id, s])).values()) : [];
      let scoreSum = 0;
      let numFinalized = 0;
      for (const submission of uniqueSubmissions) {
        if (submission.isFinalized) {
          scoreSum = scoreSum + submission.grade!;
          numFinalized = numFinalized + 1;
        }
      }

      if (numFinalized > 0) {
        newMeans[key] = (scoreSum / numFinalized).toFixed(1);
      } else {
        newMeans[key] = null;
      }
    }
    return newMeans;
  }, [submissionsByAssignment]);

  const sortFunction = React.useCallback((a: unknown, b: unknown) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return b - a;
    } else if (typeof a === 'number') {
      return -1;
    } else if (typeof b === 'number') {
      return 1;
    }
    return 0;
  }, []);

  const toggleValue = React.useCallback((value: 'showActive' | 'showInactive') => {
    if (value === 'showActive') {
      setShowActive((prev) => !prev);
    } else {
      setShowInactive((prev) => !prev);
    }
  }, []);

  if (!loadComplete) {
    return <Loading />;
  }

  const currentBaseURL = `${baseURL}/by_grader`;

  return (
    <Routes>
      {graders.map((grader) => (
        <Route
          key={`route-grader-${grader}`}
          path={`${grader}/*`}
          element={
            <GraderDetail
              baseURL={currentBaseURL}
              assignments={assignments}
              graders={graders}
              viewsBySubmission={viewsBySubmission}
              deleteSubmission={deleteSubmission}
              means={means}
              grader={grader}
              submissionsByAssignment={submissionsByGrader[grader]}
            />
          }
        />
      ))}
      <Route
        index
        element={
          <GraderIndexRoute
            loadComplete={loadComplete}
            assignments={assignments}
            submissionsByGrader={submissionsByGrader}
            graders={graders}
            inactiveGraders={inactiveGraders}
            showActive={showActive}
            showInactive={showInactive}
            toggleValue={toggleValue}
            sortFunction={sortFunction}
            currentBaseURL={currentBaseURL}
            courseURL={props.courseURL}
          />
        }
      />
    </Routes>
  );
};

/** Extracted stable index route to avoid React.createElement remount */
const GraderIndexRoute: React.FC<{
  loadComplete: boolean;
  assignments: Assignment[];
  submissionsByGrader: IGraderSubmissionsDataTable;
  graders: string[];
  inactiveGraders: string[];
  showActive: boolean;
  showInactive: boolean;
  toggleValue: (value: 'showActive' | 'showInactive') => void;
  sortFunction: (a: unknown, b: unknown) => number;
  currentBaseURL: string;
  courseURL: string;
}> = ({
  loadComplete,
  assignments,
  submissionsByGrader,
  graders,
  inactiveGraders,
  showActive,
  showInactive,
  toggleValue,
  sortFunction,
  currentBaseURL,
  courseURL,
}) => {
  const { columns, data, toggleInactiveGraders } = React.useMemo(() => {
    let cols: ITableDetailColumn[] = [];
    let rows: Record<string, unknown>[] = [];
    let toggle: React.ReactNode = undefined;

    if (!loadComplete) return { columns: cols, data: rows, toggleInactiveGraders: toggle };

    const aligner: 'left' | 'center' | 'right' = 'center';
    cols = [
      {
        title: 'Grader',
        dataIndex: 'grader',
        key: 'primary',
        fixed: 'left' as const,
        width: 220,
        defaultSortOrder: 'ascend' as const,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a.key as string).localeCompare(b.key as string),
        renderForSearch: (searchText: string) => {
          return (_: string, record: Record<string, unknown>) => {
            const grader = record.grader as string;
            const content =
              graders.indexOf(grader) > -1 ? (
                <Typography.Text strong>
                  <Highlighter
                    highlightStyle={{ backgroundColor: '#5CBB8B', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={grader}
                  />
                </Typography.Text>
              ) : (
                <span style={{ color: '#999' }}>
                  <Highlighter
                    highlightStyle={{ backgroundColor: '#5CBB8B', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={grader}
                  />
                </span>
              );
            return (
              <Link to={`${currentBaseURL}/${grader}`} className="text-link">
                {content}
              </Link>
            );
          };
        },
      },
      {
        title: 'Claimed',
        dataIndex: '_totalClaimed',
        key: '_totalClaimed',
        align: aligner,
        width: 80,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a._totalClaimed as number) - (b._totalClaimed as number),
        render: (val: number) => <Typography.Text strong>{val}</Typography.Text>,
      },
      {
        title: 'Finalized',
        dataIndex: '_totalFinalized',
        key: '_totalFinalized',
        align: aligner,
        width: 80,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a._totalFinalized as number) - (b._totalFinalized as number),
        render: (val: number) => <Typography.Text strong>{val}</Typography.Text>,
      },
      {
        title: '% Done',
        dataIndex: '_pctDone',
        key: '_pctDone',
        align: aligner,
        width: 90,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a._pctDone as number) - (b._pctDone as number),
        render: (val: number) => {
          let color = '#f5222d'; // red
          if (val >= 80)
            color = '#198665'; // brand green
          else if (val >= 40) color = '#fa8c16'; // orange
          return (
            <Tooltip title={`${val}% of claimed submissions finalized`}>
              <Typography.Text strong style={{ color }}>
                {val}%
              </Typography.Text>
            </Tooltip>
          );
        },
      },
      {
        title: 'Oldest Unfinished',
        dataIndex: '_oldestUnfinished',
        key: '_oldestUnfinished',
        align: aligner,
        width: 130,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a._oldestUnfinishedTs as number) - (b._oldestUnfinishedTs as number),
        render: (_: unknown, record: Record<string, unknown>) => {
          const ts = record._oldestUnfinishedTs as number;
          if (ts === 0) return <span style={{ color: '#999' }}>—</span>;
          const d = dayjs(ts);
          const daysAgo = dayjs().diff(d, 'day');
          const color = daysAgo >= 7 ? '#f5222d' : daysAgo >= 3 ? '#fa8c16' : undefined;
          return (
            <Tooltip title={d.format('MMM D, YYYY h:mm A')}>
              <Typography.Text style={color ? { color } : undefined}>
                {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
              </Typography.Text>
            </Tooltip>
          );
        },
      },
      ...sortAssignments(assignments).map((assignment) => ({
        title: assignment.name,
        dataIndex: assignment.name,
        key: assignment.name,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          sortFunction(a[`${assignment.name}_sort`], b[`${assignment.name}_sort`]),
        align: aligner,
        className: 'student-table',
      })),
    ];

    if (inactiveGraders.length > 0) {
      toggle = (
        <div>
          <Space size="large">
            <Checkbox defaultChecked={showActive} onChange={toggleValue.bind(null, 'showActive')}>
              Active graders
            </Checkbox>
            <CPTooltip title={tooltips.admin.studentSubmissions.inactives} hideThisOnHideTips={true}>
              <Checkbox defaultChecked={showInactive} onChange={toggleValue.bind(null, 'showInactive')}>
                Inactive graders
              </Checkbox>
            </CPTooltip>
          </Space>
        </div>
      );
    }

    let rowValues: string[] = [];
    if (showActive && showInactive) {
      rowValues = Object.keys(submissionsByGrader);
    } else if (showInactive) {
      rowValues = inactiveGraders;
    } else if (showActive) {
      rowValues = graders;
    }

    rows = rowValues.map((graderEmail) => {
      const toRet: Record<string, unknown> = { key: graderEmail, grader: graderEmail };

      // Aggregate accumulators
      let totalClaimed = 0;
      let totalFinalized = 0;
      let oldestUnfinishedTs = 0; // 0 = none

      for (const assignment of assignments) {
        const graderSubs = submissionsByGrader[graderEmail];
        const graded = graderSubs ? graderSubs[assignment.id] : undefined;
        if (graded) {
          const uniqueGraded = Array.from(new Map(graded.map((s) => [s.id, s])).values());
          const finalized = uniqueGraded.filter((s) => s.isFinalized).length;

          totalClaimed += uniqueGraded.length;
          totalFinalized += finalized;

          // Track oldest unfinished submission
          for (const sub of uniqueGraded) {
            if (!sub.isFinalized && sub.dateEdited) {
              const ts = dayjs(sub.dateEdited).valueOf();
              if (oldestUnfinishedTs === 0 || ts < oldestUnfinishedTs) {
                oldestUnfinishedTs = ts;
              }
            }
          }

          const pct = uniqueGraded.length > 0 ? Math.round((finalized / uniqueGraded.length) * 100) : 0;
          toRet[assignment.name] = (
            <Link to={`${currentBaseURL}/${graderEmail}/${encodeForLink(assignment.name)}`}>
              <Tooltip title={`${finalized} finalized / ${uniqueGraded.length} claimed`}>
                <span style={{ cursor: 'pointer', display: 'block', width: '100%' }}>
                  <span style={{ fontSize: 12 }}>
                    {finalized}/{uniqueGraded.length}
                  </span>
                  <Progress
                    percent={pct}
                    showInfo={false}
                    size="small"
                    strokeColor={pct === 100 ? '#198665' : '#1890ff'}
                    style={{ marginTop: 2, marginBottom: 0 }}
                  />
                </span>
              </Tooltip>
            </Link>
          );
          toRet[`${assignment.name}_sort`] = uniqueGraded.length;
        } else {
          toRet[assignment.name] = <span style={{ color: '#999' }}>--</span>;
          toRet[`${assignment.name}_sort`] = -1;
        }
      }

      const pctDone = totalClaimed > 0 ? Math.round((totalFinalized / totalClaimed) * 100) : 0;
      toRet._totalClaimed = totalClaimed;
      toRet._totalFinalized = totalFinalized;
      toRet._pctDone = pctDone;
      toRet._oldestUnfinishedTs = oldestUnfinishedTs;

      return toRet;
    });

    return { columns: cols, data: rows, toggleInactiveGraders: toggle };
  }, [
    loadComplete,
    assignments,
    submissionsByGrader,
    graders,
    inactiveGraders,
    showActive,
    showInactive,
    sortFunction,
    currentBaseURL,
    toggleValue,
  ]);

  const numGraders = Object.keys(submissionsByGrader).length;

  return (
    <TableDetail
      loadComplete={loadComplete}
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          Submissions by Grader
        </Typography.Title>
      }
      isEmpty={numGraders === 0 || assignments.length === 0}
      emptyNode={
        <Empty
          styles={{ image: { height: 60 } }}
          description={
            assignments.length === 0 && numGraders === 0 ? (
              <span>No graders or assignments yet</span>
            ) : numGraders === 0 ? (
              <span>Nice job creating an assignment! Now add some graders.</span>
            ) : (
              <span>You added graders! Now create an assignment</span>
            )
          }
        >
          {numGraders === 0 ? (
            <Link to={`${courseURL}/roster/graders`}>
              <CPButton cpType="primary" key={1} icon={<UserAddOutlined />}>
                Add some graders
              </CPButton>
            </Link>
          ) : null}
          {assignments.length === 0 ? (
            <span>
              {numGraders === 0 ? <span>&nbsp; &nbsp;</span> : null}
              <Link to={`${courseURL}/assignments/overview`}>
                <CPButton cpType="primary" key={2} icon={<PlusCircleOutlined />}>
                  Add an assignment
                </CPButton>
              </Link>
            </span>
          ) : null}
        </Empty>
      }
      columns={columns}
      data={data}
      actions={[toggleInactiveGraders]}
      tableProps={{ scroll: { x: 'max-content' } }}
      breadcrumbs={
        <Breadcrumb
          items={[
            { title: <Link to={currentBaseURL}>Submissions</Link> },
            { title: <Link to={currentBaseURL}>By Grader</Link> },
          ]}
        />
      }
      titleInfo={tooltips.admin.graderSubmissions.title}
    />
  );
};

export default GraderData;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { PlusCircleOutlined, UserAddOutlined } from '@ant-design/icons';

/* ant imports */
import { Breadcrumb, Checkbox, Empty, Space, Typography, Tag } from 'antd';

/* other library imports */
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
      for (const assignment of assignments) {
        const graderSubs = submissionsByGrader[graderEmail];
        const graded = graderSubs ? graderSubs[assignment.id] : undefined;
        if (graded) {
          const uniqueGraded = Array.from(new Map(graded.map((s) => [s.id, s])).values());
          toRet[assignment.name] = (
            <Link to={`${currentBaseURL}/${graderEmail}/${encodeForLink(assignment.name)}`}>
              <span style={{ cursor: 'pointer', display: 'block', width: '100%' }} title="Click to view details">
                <Tag color="processing" style={{ margin: 0 }}>
                  {uniqueGraded.length} Claimed
                </Tag>
              </span>
            </Link>
          );
          toRet[`${assignment.name}_sort`] = uniqueGraded.length;
        } else {
          toRet[assignment.name] = <span style={{ color: '#999' }}>--</span>;
          toRet[`${assignment.name}_sort`] = -1;
        }
      }
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

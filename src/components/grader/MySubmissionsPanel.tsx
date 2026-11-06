// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { Link } from 'react-router';
import { Typography } from 'antd';
import { encodeForLink } from '../core/URLutils';

/* other library imports */

/* codePost imports */
import { Course } from '../../api-client';
import { AssignmentType } from '../../types/models';
import { sortAssignments } from '../../utils/assignments';

import MySubmissionsPanelDetail from './MySubmissionsPanelDetail';
import { CallerCounts, countCell, sortByWork } from './GraderUtils';

import GraderPanelBuilder from './GraderPanel';

const SubmissionsPanel = GraderPanelBuilder(MySubmissionsPanelDetail);
type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: Course;
  graderEmail: string;
}

/** The staff payload: the caller's queue counts, plus the course-wide mean for course admins. */
type AssignmentRow = AssignmentType & CallerCounts & { stats_mean?: number | null };

const MySubmissionsPanel: React.FC<IProps> = (props) => {
  const centerAlign: alignType = 'center';
  const rows = props.assignments as AssignmentRow[];
  // Graders never receive the course-wide mean; the column exists only when a row carries it.
  const hasMean = rows.some((a) => typeof a.stats_mean === 'number');

  const columns = [
    {
      title: 'Assignment',
      dataIndex: 'assignment',
    },
    {
      title: 'Unfinalized',
      dataIndex: 'unfinalized',
      align: centerAlign,
    },
    {
      title: 'Finalized',
      dataIndex: 'finalized',
      align: centerAlign,
    },
    {
      title: 'In queue',
      dataIndex: 'queue',
      align: centerAlign,
    },
    ...(hasMean ? [{ title: 'Avg. grade', dataIndex: 'grade', align: centerAlign }] : []),
  ];

  const data = sortByWork(sortAssignments(rows)).map((assignment) => ({
    key: assignment.id,
    assignment: (
      <Link to={`${encodeForLink(assignment.name)}`} className="text-link">
        <Typography.Text strong className="text-link">
          {assignment.name}
        </Typography.Text>
      </Link>
    ),
    unfinalized: <Typography.Text strong>{countCell(assignment.myUnfinalizedCount)}</Typography.Text>,
    finalized: countCell(assignment.myFinalizedCount),
    queue: countCell(assignment.queueLength),
    grade:
      typeof assignment.stats_mean === 'number' ? `${assignment.stats_mean.toFixed(1)}/${assignment.points}` : '--',
  }));

  return (
    <SubmissionsPanel
      {...props}
      assignment={props.assignments[0]}
      breadcrumbs={[]}
      assignments={props.assignments}
      course={props.course}
      actions={[]}
      title="Claimed by Me"
      graderEmail={props.graderEmail}
      data={data}
      columns={columns}
      isLoading={false}
    />
  );
};

export default MySubmissionsPanel;

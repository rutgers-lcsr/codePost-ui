// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */

/* codePost imports */
import { Course } from '../../api-client';
import { AssignmentType } from '../../types/models';
import { Typography } from 'antd';
import { Link } from 'react-router';
import { encodeForLink } from '../core/URLutils';
import { sortAssignments } from '../../utils/assignments';

import ViewAllDetailPanel from './ViewAllDetailPanel';
import GraderPanelBuilder from './GraderPanel';
import { CallerCounts, countCell, sortByWork } from './GraderUtils';

type alignType = 'left' | 'right' | 'center';
const ViewAllShell = GraderPanelBuilder(ViewAllDetailPanel);

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: Course;
}

/** The staff payload: the caller's queue counts; course admins also get the course-wide summary. */
type AssignmentRow = AssignmentType &
  CallerCounts & {
    submissions_inprogress_count?: number;
    submissions_finalized_count?: number;
    stats_mean?: number | null;
  };

class ViewAllPanel extends React.Component<IProps> {
  public render() {
    const centerAlign: alignType = 'center';
    const rows = this.props.assignments as AssignmentRow[];
    // Only course admins receive course-wide counts; graders see the queue alone rather
    // than zeros the API never sent.
    const hasSummary = rows.some((a) => typeof a.submissions_finalized_count === 'number');
    const hasMean = rows.some((a) => typeof a.stats_mean === 'number');

    const columns = [
      {
        title: 'Assignment',
        dataIndex: 'assignment',
      },
      {
        title: 'In queue',
        dataIndex: 'queue',
        align: centerAlign,
      },
      ...(hasSummary
        ? [
            { title: 'In progress', dataIndex: 'inProgress', align: centerAlign },
            { title: 'Finalized', dataIndex: 'finalized', align: centerAlign },
          ]
        : []),
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
      queue: <Typography.Text strong>{countCell(assignment.queueLength)}</Typography.Text>,
      inProgress: countCell(assignment.submissions_inprogress_count),
      finalized: countCell(assignment.submissions_finalized_count),
      grade:
        typeof assignment.stats_mean === 'number' ? `${assignment.stats_mean.toFixed(1)}/${assignment.points}` : '--',
    }));

    return (
      <ViewAllShell
        {...this.props}
        course={this.props.course}
        assignment={this.props.assignments[0]}
        assignments={this.props.assignments}
        breadcrumbs={[]}
        actions={[]}
        title="All Submissions"
        data={data}
        columns={columns}
        isLoading={false}
      />
    );
  }
}

export default ViewAllPanel;

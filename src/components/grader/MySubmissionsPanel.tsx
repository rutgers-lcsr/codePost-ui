// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from 'antd';
import { encodeForLink } from '../core/URLutils';

/* other library imports */

/* codePost imports */
import { Course } from '../../api-client';
import { AssignmentType } from '../../types/models';
import { sortAssignments } from '../../utils/assignments';

import MySubmissionsPanelDetail from './MySubmissionsPanelDetail';

import GraderPanelBuilder from './GraderPanel';

const SubmissionsPanel = GraderPanelBuilder(MySubmissionsPanelDetail);
type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: Course;
  graderEmail: string;
}

const MySubmissionsPanel: React.FC<IProps> = (props) => {
  const centerAlign: alignType = 'center';
  const columns = [
    {
      title: 'Assignment',
      dataIndex: 'assignment',
    },
    {
      title: 'Claimed',
      dataIndex: 'claimed',
      align: centerAlign,
    },
    {
      title: 'Finalized',
      dataIndex: 'finalized',
      align: centerAlign,
    },
    {
      title: 'Unfinalized',
      dataIndex: 'unfinalized',
      align: centerAlign,
    },
    {
      title: 'Avg. Grade',
      dataIndex: 'grade',
      align: centerAlign,
    },
  ];

  const data = sortAssignments(props.assignments).map((assignment) => {
    const assignmentStats = assignment as AssignmentType & {
      submissions_count?: number;
      submissions_finalized_count?: number;
      stats_mean?: number;
    };

    // Calculate unfinalized based on claimed and finalized counts
    // logic assumed: submissions_count = total claimed?
    // In admin panel: claimed = inprogress + finalized
    // In assignment.ts type definition: submissions_count is generic count, submissions_finalized_count.
    // Let's assume for My Submissions: submissions_count = Total Claimed.

    const claimed = assignmentStats.submissions_count || 0;
    const finalized = assignmentStats.submissions_finalized_count || 0;
    const unfinalized = claimed - finalized;

    return {
      key: assignment.id,
      assignment: (
        <Link to={`${encodeForLink(assignment.name)}`} className="text-link">
          <Typography.Text strong className="text-link">
            {assignment.name}
          </Typography.Text>
        </Link>
      ),
      claimed: <Typography.Text strong>{claimed}</Typography.Text>,
      finalized: <Typography.Text strong>{finalized}</Typography.Text>,
      unfinalized: <Typography.Text strong>{unfinalized}</Typography.Text>,
      grade:
        assignmentStats.stats_mean && assignmentStats.submissions_count && assignmentStats.submissions_count > 0
          ? `${assignmentStats.stats_mean.toFixed(1)}/${assignment.points}`
          : '--',
    };
  });

  return (
    <SubmissionsPanel
      {...props}
      assignment={props.assignments[0]}
      breadcrumbs={[]}
      assignments={props.assignments}
      course={props.course}
      actions={[]}
      title="Claimed by me"
      graderEmail={props.graderEmail}
      data={data}
      columns={columns}
      isLoading={false}
    />
  );
};

export default MySubmissionsPanel;

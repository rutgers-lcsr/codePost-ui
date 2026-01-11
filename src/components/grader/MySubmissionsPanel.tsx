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
import { AssignmentType, sortAssignments } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';

import MySubmissionsPanelDetail from './MySubmissionsPanelDetail';

import GraderPanelBuilder from './GraderPanel';

const SubmissionsPanel = GraderPanelBuilder(MySubmissionsPanelDetail);
type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: CourseType;
  graderEmail: string;
  isAdmin: boolean;
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
    // Calculate unfinalized based on claimed and finalized counts
    // logic assumed: submissions_count = total claimed?
    // In admin panel: claimed = inprogress + finalized
    // In assignment.ts type definition: submissions_count is generic count, submissions_finalized_count.
    // Let's assume for My Submissions: submissions_count = Total Claimed.

    const claimed = assignment.submissions_count || 0;
    const finalized = assignment.submissions_finalized_count || 0;
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
        assignment.stats_mean && assignment.submissions_count && assignment.submissions_count > 0
          ? `${assignment.stats_mean.toFixed(1)}/${assignment.points}`
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
      isAdmin={props.isAdmin}
      graderEmail={props.graderEmail}
      data={data}
      columns={columns}
      isLoading={false}
    />
  );
};

export default MySubmissionsPanel;

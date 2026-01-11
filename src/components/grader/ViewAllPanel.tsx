/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */

/* codePost imports */
import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { Typography } from 'antd';
import { Link } from 'react-router-dom';
import { encodeForLink } from '../core/URLutils';

import ViewAllDetailPanel from './ViewAllDetailPanel';
import GraderPanelBuilder from './GraderPanel';

type alignType = 'left' | 'right' | 'center';
const ViewAllShell = GraderPanelBuilder(ViewAllDetailPanel);

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: CourseType;
}

class ViewAllPanel extends React.Component<IProps> {
  public render() {
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
        title: 'Avg. Grade',
        dataIndex: 'grade',
        align: centerAlign,
      },
    ];

    const data = this.props.assignments.map((assignment) => {
      return {
        key: assignment.id,
        assignment: (
          <Link to={`${encodeForLink(assignment.name)}`} className="text-link">
            <Typography.Text strong className="text-link">
              {assignment.name}
            </Typography.Text>
          </Link>
        ),
        claimed: (
          <Typography.Text strong>
            {assignment.submissions_inprogress_count && assignment.submissions_finalized_count
              ? assignment.submissions_inprogress_count + assignment.submissions_finalized_count
              : 0}
          </Typography.Text>
        ),
        finalized: <Typography.Text strong>{assignment.submissions_finalized_count}</Typography.Text>,
        grade:
          assignment.stats_mean && assignment.submissions_finalized_count && assignment.submissions_finalized_count > 0
            ? `${assignment.stats_mean.toFixed(1)}/${assignment.points}`
            : '--',
      };
    });

    return (
      <ViewAllShell
        {...this.props}
        course={this.props.course}
        assignment={this.props.assignments[0]}
        assignments={this.props.assignments}
        breadcrumbs={[]}
        actions={[]}
        title="View All"
        data={data}
        columns={columns}
        isLoading={false}
      />
    );
  }
}

export default ViewAllPanel;

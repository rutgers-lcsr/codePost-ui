/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { RouteComponentProps } from '../../router/legacy';

/* codePost imports */
import { AssignmentType, sortAssignments } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';

import MySubmissionsPanelDetail from './MySubmissionsPanelDetail';

import GraderPanelBuilder from './GraderPanel';

const SubmissionsPanel = GraderPanelBuilder(MySubmissionsPanelDetail);
type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps extends RouteComponentProps {
  assignments: AssignmentType[];
  course: CourseType;
  graderEmail: string;
  isAdmin: boolean;
}

const MySubmissionsPanel: React.FC<IProps> = (props) => {
  const centerAlign: alignType = 'center';
  const columns = [
    {
      title: 'Zoom in',
      dataIndex: 'zoom',
      align: centerAlign,
    },
    {
      title: 'Assignment',
      dataIndex: 'assignment',
    },
    {
      title: 'Submissions',
      dataIndex: 'submissions',
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

  const data = sortAssignments(props.assignments).map((assignment) => {
    return {
      key: assignment.id,
      assignment: assignment.name,
      submissions: assignment.submissions_count,
      finalized: assignment.submissions_finalized_count,
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

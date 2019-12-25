/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { RouteComponentProps } from 'react-router';

/* codePost imports */
import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { SubmissionType, SubmissionInfoType } from '../../infrastructure/submission';

import ViewAllDetailPanel from './ViewAllDetailPanel';
import GraderPanelBuilder from './GraderPanel';

type alignType = 'left' | 'right' | 'center';
const ViewAllShell = GraderPanelBuilder(ViewAllDetailPanel);

/**********************************************************************************************************************/

interface IProps extends RouteComponentProps {
  assignments: AssignmentType[];
  course: CourseType;
}

interface IState {
  submissionsByAssignment: { [id: number]: SubmissionInfoType[] };
  isLoading: boolean;
}

class ViewAllPanel extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      submissionsByAssignment: [],
      isLoading: true,
    };
  }

  public componentDidMount() {
    this.loadSubmissions(this.props.assignments);
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.assignments !== this.props.assignments) {
      this.loadSubmissions(this.props.assignments);
    }
  }

  public loadSubmissions = (assignments: AssignmentType[]) => {
    this.setState({ isLoading: true }, () => {
      const toRet = [];
      for (const assn of assignments) {
        toRet.push(Assignment.readSubmissions(assn.id, { ['compact']: '0' }));
      }

      Promise.all(toRet).then((lists) => {
        const mapper: { [id: number]: SubmissionInfoType[] } = {};
        for (const list of lists) {
          if (list.length > 0) {
            mapper[list[0].assignment] = list;
          }
        }
        this.setState({ submissionsByAssignment: mapper, isLoading: false });
      });
    });
  };

  public render() {
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

    const submissions = this.state.submissionsByAssignment;
    const data = this.props.assignments.map((assignment) => {
      const list = assignment.id in submissions ? submissions[assignment.id] : [];
      const numFinalized = list.filter((sub) => sub.isFinalized).length;
      return {
        key: assignment.id,
        assignment: assignment.name,
        claimed: list.length,
        finalized: numFinalized,
        grade:
          numFinalized > 0
            ? `${(list.reduce((acc, sub) => (sub.isFinalized ? sub.grade! + acc : acc), 0) / numFinalized).toFixed(
                1,
              )}/${assignment.points}`
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
        isLoading={this.state.isLoading}
      />
    );
  }
}

export default ViewAllPanel;

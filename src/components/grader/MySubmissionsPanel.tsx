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
import { SubmissionType } from '../../infrastructure/submission';

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

interface IState {
  submissionsByAssignment: { [id: number]: SubmissionType[] };
  isLoading: boolean;
}

class MySubmissionsPanel extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      isLoading: true,
      submissionsByAssignment: [],
    };
  }

  public componentDidMount() {
    this.loadSubmissions(this.props.assignments, this.props.graderEmail);
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.assignments !== this.props.assignments) {
      this.loadSubmissions(this.props.assignments, this.props.graderEmail);
    }
  }

  public loadSubmissions = (assignments: AssignmentType[], grader: string) => {
    this.setState({ isLoading: true }, () => {
      const toRet = [];
      for (const assn of assignments) {
        toRet.push(Assignment.readSubmissions(assn.id, { grader }));
      }

      Promise.all(toRet).then((lists) => {
        const mapper: { [id: number]: SubmissionType[] } = {};
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

    const submissions = this.state.submissionsByAssignment;
    const data = this.props.assignments.map((assignment) => {
      const list = assignment.id in submissions ? submissions[assignment.id] : [];
      const numFinalized = list.filter((sub) => sub.isFinalized).length;
      return {
        key: assignment.id,
        assignment: assignment.name,
        submissions: list.length,
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
      <SubmissionsPanel
        {...this.props}
        assignment={this.props.assignments[0]}
        breadcrumbs={[]}
        assignments={this.props.assignments}
        course={this.props.course}
        actions={[]}
        title="Claimed by me"
        isAdmin={this.props.isAdmin}
        graderEmail={this.props.graderEmail}
        data={data}
        columns={columns}
        isLoading={this.state.isLoading}
      />
    );
  }
}

export default MySubmissionsPanel;

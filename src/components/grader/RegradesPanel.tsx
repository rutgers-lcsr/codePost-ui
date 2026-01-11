/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Switch } from 'antd';

/* other library imports */

/* codePost imports */
import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { AnonymousSubmissionInfoType } from '../../infrastructure/submission';
import { UserType } from '../../infrastructure/user';

import RegradesDetailPanel from './RegradesDetailPanel';

import GraderPanelBuilder from './GraderPanel';

const RegradePanelShell = GraderPanelBuilder(RegradesDetailPanel);

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: CourseType;
  user: UserType;
  isAnonymous: boolean;
  isAdmin: boolean;
  isSuperGrader: boolean;
}

interface IState {
  submissionsByAssignment: { [id: number]: AnonymousSubmissionInfoType[] };
  isLoading: boolean;
  viewAll: boolean;
}

class RegradesPanel extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      submissionsByAssignment: {},
      isLoading: true,
      viewAll: false,
    };
  }

  componentDidMount() {
    this.loadSubmissions(this.props.assignments, this.props.user.email);
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.assignments !== this.props.assignments) {
      this.loadSubmissions(this.props.assignments, this.props.user.email);
    }
  }

  public loadSubmissions = (assignments: AssignmentType[], grader?: string) => {
    this.setState({ isLoading: true }, () => {
      const toRet = [];
      for (const assn of assignments) {
        if (grader !== undefined) {
          toRet.push(Assignment.readSubmissionsAnonymous(assn.id, { grader, ['compact']: '1' }));
        } else {
          toRet.push(Assignment.readSubmissionsAnonymous(assn.id, { ['compact']: '1' }));
        }
      }

      Promise.all(toRet).then((lists) => {
        const mapper: { [id: number]: AnonymousSubmissionInfoType[] } = {};
        for (const list of lists) {
          if (list.length > 0) {
            mapper[list[0].assignment] = list;
          }
        }
        this.setState({ submissionsByAssignment: mapper, isLoading: false });
      });
    });
  };

  toggleViewAll = () => {
    this.setState(
      (oldState) => ({ viewAll: !oldState.viewAll }),
      () => {
        this.loadSubmissions(this.props.assignments, this.state.viewAll ? undefined : this.props.user.email);
      },
    );
  };

  public render() {
    const centerAlign: alignType = 'center';
    const columns = [
      {
        title: 'Zoom in',
        dataIndex: 'zoom',
        align: centerAlign,
        key: '0',
      },
      {
        title: 'Assignment',
        dataIndex: 'assignment',
        key: '1',
      },
      {
        title: 'Total',
        dataIndex: 'total',
        align: centerAlign,
        key: '2',
      },
      {
        title: 'With Regrades',
        dataIndex: 'regrades',
        align: centerAlign,
        key: '3',
      },
      {
        title: 'Open Regrades',
        dataIndex: 'open',
        align: centerAlign,
        key: '4',
      },
    ];

    const submissions = this.state.submissionsByAssignment;
    const data = this.props.assignments.map((assignment) => {
      const list = assignment.id in submissions ? submissions[assignment.id] : [];
      const regradeSubmissions = list.filter((submission: AnonymousSubmissionInfoType) => {
        return (
          submission.questionIsOpen ||
          submission.questionText ||
          submission.questionResponder ||
          submission.questionResponse
        );
      });

      return {
        assignment: assignment.name,
        total: list.length,
        regrades: regradeSubmissions.length,
        open: regradeSubmissions.filter((sub: AnonymousSubmissionInfoType) => sub.questionIsOpen).length,
        key: assignment.id,
      };
    });

    let viewToggle = <div />;
    if (this.props.isAdmin || this.props.isSuperGrader) {
      viewToggle = (
        <div>
          View all regrades: &nbsp;
          <Switch
            aria-label={!this.state.viewAll ? 'View all regrade requests' : 'View my regrade requests only'}
            onChange={this.toggleViewAll}
            defaultChecked={this.state.viewAll}
          />
        </div>
      );
    }

    return (
      <RegradePanelShell
        {...this.props}
        assignment={this.props.assignments[0]}
        breadcrumbs={[]}
        actions={[viewToggle]}
        columns={columns}
        data={data}
        isLoading={this.state.isLoading}
        title="Regrade Requests"
      />
    );
  }
}

export default RegradesPanel;

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Switch } from 'antd';

/* other library imports */

/* codePost imports */
import { getHeaders } from '../../utils/generics';
import { Course } from '../../api-client';
import { AnonymousSubmissionInfoType, AssignmentType, UserType } from '../../types/models';

import RegradesDetailPanel from './RegradesDetailPanel';

import GraderPanelBuilder from './GraderPanel';

const RegradePanelShell = GraderPanelBuilder(RegradesDetailPanel);

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: Course;
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
      const promises = assignments.map(async (assn) => {
        try {
          const params = new URLSearchParams({
            compact: '1',
          });
          if (grader) {
            params.append('grader', grader);
          }
          const response = await fetch(`/api/assignments/${assn.id}/submissions/?${params.toString()}`, {
            headers: getHeaders(),
          });
          if (!response.ok) throw new Error(`Failed to fetch submissions for assignment ${assn.id}`);
          const data = await response.json();
          return data;
        } catch (error) {
          console.error(error);
          return [];
        }
      });

      Promise.all(promises).then((lists) => {
        const mapper: { [id: number]: AnonymousSubmissionInfoType[] } = {};
        for (const list of lists) {
          if (list.length > 0) {
            // Check if list elements have assignment property
            const firstSub = list[0];
            if (firstSub && firstSub.assignment) {
              mapper[firstSub.assignment] = list;
            }
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

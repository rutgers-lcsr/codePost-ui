// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Alert, Button, Switch, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router';

/* codePost imports */
import { assignmentsApi } from '../../api-client/clients';
import { Course } from '../../api-client';
import { AnonymousSubmissionInfoType, AssignmentType, UserType } from '../../types/models';

import RegradesDetailPanel from './RegradesDetailPanel';

import GraderPanelBuilder from './GraderPanel';

import { encodeForLink } from '../core/URLutils';
import { useCourseCapabilities } from '../../stores/usePermissionsStore';

const RegradePanelShell = GraderPanelBuilder(RegradesDetailPanel);

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: Course;
  user: UserType;
  isAnonymous: boolean;
}

interface IState {
  submissionsByAssignment: { [id: number]: AnonymousSubmissionInfoType[] };
  isLoading: boolean;
  viewAll: boolean;
  /** Assignments whose regrade list failed to load this round. */
  failedCount: number;
}

const assignmentIds = (assignments: AssignmentType[]) => assignments.map((a) => a.id).join(',');

class RegradesPanel extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      submissionsByAssignment: {},
      isLoading: true,
      viewAll: false,
      failedCount: 0,
    };
  }

  componentDidMount() {
    this.loadSubmissions(this.props.assignments, this.props.user.email);
  }

  public componentDidUpdate(oldProps: IProps) {
    // The assignments array is a new reference on every refetch; only a different set
    // of assignments is a reason to fan out the per-assignment requests again.
    if (assignmentIds(oldProps.assignments) !== assignmentIds(this.props.assignments)) {
      this.loadSubmissions(this.props.assignments, this.state.viewAll ? undefined : this.props.user.email);
    }
  }

  public loadSubmissions = (assignments: AssignmentType[], grader?: string) => {
    this.setState({ isLoading: true, failedCount: 0 }, () => {
      const promises = assignments.map(async (assn) => {
        try {
          const response = await assignmentsApi.submissionsListRaw({
            id: assn.id,
            compact: '1',
            grader: grader,
          });
          const data = await response.raw.json();
          return Array.isArray(data) ? data : (data?.results ?? []);
        } catch (error) {
          console.error(error);
          return null;
        }
      });

      Promise.all(promises).then((lists) => {
        const mapper: { [id: number]: AnonymousSubmissionInfoType[] } = {};
        let failedCount = 0;
        for (const list of lists) {
          if (list === null) {
            failedCount += 1;
          } else if (list.length > 0) {
            // Check if list elements have assignment property
            const firstSub = list[0];
            if (firstSub && firstSub.assignment) {
              mapper[firstSub.assignment] = list;
            }
          }
        }
        this.setState({ submissionsByAssignment: mapper, isLoading: false, failedCount });
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
        title: 'Open',
        dataIndex: 'open',
        align: centerAlign,
        key: '3',
      },
      {
        title: 'Closed',
        dataIndex: 'closed',
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

      const openCount = regradeSubmissions.filter((sub: AnonymousSubmissionInfoType) => sub.questionIsOpen).length;

      return {
        assignment: (
          <Link to={`${encodeForLink(assignment.name)}`} className="text-link">
            <Typography.Text strong className="text-link">
              {assignment.name}
            </Typography.Text>
          </Link>
        ),
        regrades: regradeSubmissions.length,
        total: regradeSubmissions.length,
        open: openCount,
        closed: regradeSubmissions.length - openCount,
        key: assignment.id,
      };
    });

    const { failedCount } = this.state;
    const notice =
      failedCount > 0 ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Couldn't load regrade requests for ${failedCount} assignment${failedCount === 1 ? '' : 's'}.`}
          description="The counts below leave those assignments out."
          action={
            <Button
              size="small"
              onClick={() =>
                this.loadSubmissions(this.props.assignments, this.state.viewAll ? undefined : this.props.user.email)
              }
            >
              Retry
            </Button>
          }
        />
      ) : null;

    const viewToggle = (
      <RegradeViewAllToggle
        courseId={this.props.course.id}
        viewAll={this.state.viewAll}
        onToggle={this.toggleViewAll}
      />
    );

    return (
      <RegradePanelShell
        {...this.props}
        assignment={this.props.assignments[0]}
        breadcrumbs={[]}
        actions={[viewToggle]}
        columns={columns}
        data={data}
        isLoading={this.state.isLoading}
        notice={notice}
        title="Regrade Requests"
      />
    );
  }
}

/** Functional wrapper so we can use useCourseCapabilities inside a class component's render. */
const RegradeViewAllToggle: React.FC<{
  courseId: number;
  viewAll: boolean;
  onToggle: () => void;
}> = ({ courseId, viewAll, onToggle }) => {
  const courseCaps = useCourseCapabilities(courseId);
  const canManageRegrades = !!courseCaps.manage_regrades;

  if (!canManageRegrades) return <div />;

  return (
    <div>
      View all regrades: &nbsp;
      <Switch
        aria-label={!viewAll ? 'View all regrade requests' : 'View my regrade requests only'}
        onChange={onToggle}
        defaultChecked={viewAll}
      />
    </div>
  );
};

export default RegradesPanel;

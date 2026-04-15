// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Switch, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

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
          const response = await assignmentsApi.submissionsListRaw({
            id: assn.id,
            compact: '1',
            grader: grader,
          });
          const data = await response.raw.json();
          return Array.isArray(data) ? data : (data?.results ?? []);
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

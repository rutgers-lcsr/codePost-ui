/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Dropdown, Icon, Menu } from 'antd';

/* other library imports */
import { Route, Link, Switch } from 'react-router-dom';

/* codePost imports */
import { AssignmentType, sortAssignments } from '../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../infrastructure/submission';

import { TableDetail } from '../../other/TableDetail';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { IAssignmentToSubmissionsMap, IGraderSubmissionsDataTable } from '../../../../types/common';

import GraderAssignmentDetail from './GraderAssignmentDetail';

/**********************************************************************************************************************/

interface IProps {
  submissions: IGraderSubmissionsDataTable;
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  assignments: AssignmentType[];
  graders: string[];
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  means: { [assignmentID: number]: string | null };

  match: any;
  baseURL: string;
}

interface IState {
  grader: string;
  submissionsByAssignment: IAssignmentToSubmissionsMap;
}

class GraderDetail extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    console.log(props);
    this.state = {
      grader: this.props.match.params.graderEmail,
      submissionsByAssignment: this.props.submissions[this.props.match.params.graderEmail],
    };
  }

  public render() {
    const aligner: 'left' | 'center' | 'right' = 'center';

    return (
      <Switch>
        <Route
          path={this.props.match.url}
          exact={true}
          render={(props: any) => {
            const columns = [
              {
                title: 'Zoom in',
                dataIndex: 'expand',
                key: 'expand',
                align: aligner,
              },
              {
                title: 'Assignment',
                dataIndex: 'assignment',
                key: 'assignment',
              },
              {
                title: 'Claimed',
                dataIndex: 'claimed',
                key: 'claimed',
                align: aligner,
              },
              {
                title: 'Finalized',
                dataIndex: 'finalized',
                key: 'finalized',
                align: aligner,
              },
              {
                title: 'Unfinalized',
                dataIndex: 'unfinalized',
                key: 'unfinalized',
                align: aligner,
              },
              {
                title: 'Avg. Grade',
                dataIndex: 'graderAverage',
                key: 'graderAverage',
                align: aligner,
              },
              {
                title: 'Assignment Avg.',
                dataIndex: 'assignmentAverage',
                key: 'assignmentAverage',
                align: aligner,
              },
              {
                title: 'Actions',
                dataIndex: 'actions',
                key: 'actions',
                align: aligner,
              },
            ];

            const data = sortAssignments(this.props.assignments).map((assignment) => {
              let graded = this.state.submissionsByAssignment[assignment.id];

              const menu = (
                <Menu>
                  <Menu.Item>
                    <Link to={`${this.props.match.url}/${assignment.name}`}>
                      <Icon type="folder-open" />
                      Zoom in
                    </Link>
                  </Menu.Item>
                </Menu>
              );

              const numFinalized = graded
                ? graded.filter((sub) => {
                    return sub.isFinalized;
                  }).length
                : 0;

              const numClaimed = graded ? graded.length : 0;
              const numUnfinalized = numClaimed - numFinalized;

              let avgGrade = 0;
              if (graded) {
                avgGrade =
                  graded.reduce((acc, sub) => {
                    return acc + (sub.grade !== null ? sub.grade : 0);
                  }, 0) / graded.length;
              }

              return {
                key: assignment.name,
                expand: (
                  <Link to={`${this.props.match.url}/${assignment.name}`}>
                    <div style={{ cursor: 'pointer' }}>
                      <CPTooltip title={tooltips.admin.graderSubmissions.expandAssignment} hideThisOnHideTips={true}>
                        <Icon type="folder-open" />
                      </CPTooltip>
                    </div>
                  </Link>
                ),
                assignment: assignment.name,
                claimed: graded ? graded.length : 0,
                finalized: numFinalized,
                unfinalized: numUnfinalized,
                graderAverage: numFinalized > 0 ? `${avgGrade.toFixed(1)}/${assignment.points}` : '--',
                assignmentAverage: assignment.mean
                  ? `${assignment.mean.toFixed(1)}/${assignment.points}`
                  : this.props.means[assignment.id]
                  ? `${this.props.means[assignment.id]}/${assignment.points}`
                  : '--',
                actions: (
                  <Dropdown overlay={menu} trigger={['click']} placement={'bottomRight'}>
                    <Icon type="menu" />
                  </Dropdown>
                ),
              };
            });

            return (
              <div>
                <TableDetail
                  loadComplete={true}
                  title={`Submissions graded by: ${this.state.grader}`}
                  breadcrumbs={
                    <Breadcrumb>
                      <Breadcrumb.Item>
                        <Link to={this.props.baseURL}>Submissions</Link>
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <Link to={this.props.baseURL}>By Grader</Link>
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a>{this.state.grader}</a>
                      </Breadcrumb.Item>
                    </Breadcrumb>
                  }
                  isEmpty={false}
                  emptyNode={null}
                  columns={columns}
                  data={data}
                  actions={[]}
                />
              </div>
            );
          }}
        />
        <Route
          path={`${this.props.match.url}/:assignmentName`}
          exact={true}
          render={(props: any) => (
            <GraderAssignmentDetail
              {...props}
              baseURL={this.props.match.url}
              submissionsByAssignment={this.state.submissionsByAssignment}
              assignments={this.props.assignments}
              graders={this.props.graders}
              viewsBySubmission={this.props.viewsBySubmission}
              deleteSubmission={this.props.deleteSubmission}
              means={this.props.means}
              grader={this.state.grader}
            />
          )}
        />
      </Switch>
    );
  }
}

export default GraderDetail;

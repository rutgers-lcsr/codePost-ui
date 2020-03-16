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
import { encodeForLink, encodeForRoute } from '../../../../components/core/URLutils';

import { IAssignmentToSubmissionsMap } from '../../../../types/common';

import GraderAssignmentDetail from './GraderAssignmentDetail';

/**********************************************************************************************************************/

interface IProps {
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  assignments: AssignmentType[];
  graders: string[];
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  means: { [assignmentID: number]: string | null };

  match: any;
  baseURL: string;
  grader: string;
  submissionsByAssignment: IAssignmentToSubmissionsMap;
}

const GraderDetail = (props: IProps) => {
  const aligner: 'left' | 'center' | 'right' = 'center';

  return (
    <Switch>
      <Route
        path={props.match.url}
        exact={true}
        render={(subprops: any) => {
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

          const data = sortAssignments(props.assignments).map((assignment) => {
            const graded = props.submissionsByAssignment[assignment.id];

            const menu = (
              <Menu>
                <Menu.Item>
                  <Link to={`${props.match.url}/${encodeForLink(assignment.name)}`}>
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
                <Link to={`${props.match.url}/${encodeForLink(assignment.name)}`}>
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
                : props.means[assignment.id]
                ? `${props.means[assignment.id]}/${assignment.points}`
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
                title={`Submissions graded by: ${props.grader}`}
                breadcrumbs={
                  <Breadcrumb>
                    <Breadcrumb.Item>
                      <Link to={props.baseURL}>Submissions</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <Link to={props.baseURL}>By Grader</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <a>{props.grader}</a>
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
      {props.assignments.map((assn) => {
        return (
          <Route
            key={`route-assignment-${assn.id}`}
            path={`${props.match.url}/${encodeForRoute(assn.name)}`}
            exact={true}
            render={(subprops: any) => (
              <GraderAssignmentDetail
                {...subprops}
                baseURL={props.match.url}
                graders={props.graders}
                viewsBySubmission={props.viewsBySubmission}
                deleteSubmission={props.deleteSubmission}
                means={props.means}
                grader={props.grader}
                selectedAssignment={assn}
                submissions={props.submissionsByAssignment[assn.id]}
              />
            )}
          />
        );
      })}
    </Switch>
  );
};

export default GraderDetail;

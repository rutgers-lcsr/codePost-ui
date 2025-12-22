/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

import { MenuOutlined, ZoomInOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Dropdown, Typography, Tag, Button } from 'antd';

/* other library imports */
import { Link, Route, Routes } from 'react-router-dom';
import { LegacyRouteRenderer } from '../../../../router/legacy';

/* codePost imports */
import { AssignmentType, sortAssignments } from '../../../../infrastructure/assignment';
import { SubmissionInfoType } from '../../../../infrastructure/submission';

import { TableDetail } from '../../other/TableDetail';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';
import { encodeForLink, encodeForRoute } from '../../../../components/core/URLutils';

import { IAssignmentToSubmissionsMap } from '../../../../types/common';

import GraderAssignmentDetail from './GraderAssignmentDetail';

/**********************************************************************************************************************/

interface IProps {
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
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
    <Routes>
      <Route
        index
        element={
          <LegacyRouteRenderer
            path={props.match.url}
            render={(_subprops) => {
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

                const menuItems = [
                  {
                    key: 'zoom',
                    label: (
                      <Link to={`${props.match.url}/${encodeForLink(assignment.name)}`}>
                        <ZoomInOutlined /> Zoom in
                      </Link>
                    ),
                  },
                ];

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
                          <Button shape="circle" icon={<ZoomInOutlined />} />
                        </CPTooltip>
                      </div>
                    </Link>
                  ),
                  assignment: <Typography.Text strong>{assignment.name}</Typography.Text>,
                  claimed: <Tag color="processing">{graded ? graded.length : 0}</Tag>,
                  finalized: <Tag color="success">{numFinalized}</Tag>,
                  unfinalized: <Tag color="warning">{numUnfinalized}</Tag>,
                  graderAverage: numFinalized > 0 ? `${avgGrade.toFixed(1)}/${assignment.points}` : '--',
                  assignmentAverage: assignment.mean
                    ? `${assignment.mean.toFixed(1)}/${assignment.points}`
                    : props.means[assignment.id]
                      ? `${props.means[assignment.id]}/${assignment.points}`
                      : '--',
                  actions: (
                    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement={'bottomRight'}>
                      <Button shape="circle" icon={<MenuOutlined />} />
                    </Dropdown>
                  ),
                };
              });

              return (
                <div>
                  <TableDetail
                    loadComplete={true}
                    title={
                      <Typography.Title level={4} style={{ margin: 0 }}>
                        Submissions graded by: {props.grader}
                      </Typography.Title>
                    }
                    breadcrumbs={
                      <Breadcrumb
                        items={[
                          { title: <Link to={props.baseURL}>Submissions</Link> },
                          {
                            title: (
                              // eslint-disable-next-line jsx-a11y/anchor-is-valid
                              <Link to={props.baseURL}>By Grader</Link>
                            ),
                          },
                          {
                            title: (
                              // eslint-disable-next-line jsx-a11y/anchor-is-valid
                              <a>{props.grader}</a>
                            ),
                          },
                        ]}
                      />
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
        }
      />
      {props.assignments.map((assn) => {
        return (
          <Route
            key={`route-assignment-${assn.id}`}
            path={encodeForRoute(assn.name)}
            element={
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodeForRoute(assn.name)}`}
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
            }
          />
        );
      })}
    </Routes>
  );
};

export default GraderDetail;

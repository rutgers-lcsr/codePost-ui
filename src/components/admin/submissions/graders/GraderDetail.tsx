/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* style imports */
import { Breadcrumb, Typography } from 'antd';

/* other library imports */
import { Link, Route, Routes } from 'react-router-dom';

/* codePost imports */
import { AssignmentType, sortAssignments } from '../../../../infrastructure/assignment';
import { SubmissionInfoType } from '../../../../infrastructure/submission';

import { TableDetail } from '../../other/TableDetail';

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
        element={React.createElement(() => {
          const columns = [
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
          ];

          const uniqueAssignments = Array.from(new Map(props.assignments.map((a) => [a.id, a])).values());
          const data = sortAssignments(uniqueAssignments).map((assignment) => {
            const graded = props.submissionsByAssignment[assignment.id];

            // Deduplicate submissions for stats calculation
            const uniqueGraded = graded ? Array.from(new Map(graded.map((s) => [s.id, s])).values()) : undefined;

            const numFinalized = uniqueGraded
              ? uniqueGraded.filter((sub) => {
                  return sub.isFinalized;
                }).length
              : 0;

            const numClaimed = uniqueGraded ? uniqueGraded.length : 0;
            const numUnfinalized = numClaimed - numFinalized;

            let avgGrade = 0;
            if (uniqueGraded) {
              avgGrade =
                uniqueGraded.reduce((acc, sub) => {
                  return acc + (sub.grade !== null ? sub.grade : 0);
                }, 0) / uniqueGraded.length;
            }

            return {
              key: assignment.name,
              assignment: (
                <Link to={`${props.baseURL}/${props.grader}/${encodeForLink(assignment.name)}`} className="text-link">
                  <Typography.Text strong className="text-link">
                    {assignment.name}
                  </Typography.Text>
                </Link>
              ),
              claimed: <Typography.Text strong>{uniqueGraded ? uniqueGraded.length : 0}</Typography.Text>,
              finalized: <Typography.Text strong>{numFinalized}</Typography.Text>,
              unfinalized: <Typography.Text strong>{numUnfinalized}</Typography.Text>,
              graderAverage: numFinalized > 0 ? `${avgGrade.toFixed(1)}/${assignment.points}` : '--',
              assignmentAverage: assignment.mean
                ? `${assignment.mean.toFixed(1)}/${assignment.points}`
                : props.means[assignment.id]
                  ? `${props.means[assignment.id]}/${assignment.points}`
                  : '--',
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
                      { title: <Link to={props.baseURL.split('/').slice(0, -1).join('/')}>Submissions</Link> },
                      {
                        title: (
                          // eslint-disable-next-line jsx-a11y/anchor-is-valid
                          <Link to={props.baseURL.split('/').slice(0, -1).join('/')}>By Grader</Link>
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
        })}
      />
      {Array.from(new Map(props.assignments.map((a) => [a.id, a])).values()).map((assn) => {
        return (
          <Route
            key={`route-assignment-${assn.id}`}
            path={encodeForRoute(assn.name)}
            element={
              <GraderAssignmentDetail
                baseURL={`${props.baseURL}/${props.grader}`}
                graders={props.graders}
                viewsBySubmission={props.viewsBySubmission}
                deleteSubmission={props.deleteSubmission}
                means={props.means}
                grader={props.grader}
                selectedAssignment={assn}
                submissions={props.submissionsByAssignment[assn.id]}
              />
            }
          />
        );
      })}
    </Routes>
  );
};

export default GraderDetail;

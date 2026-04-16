// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useMemo } from 'react';

/* style imports */
import { Breadcrumb, Typography } from 'antd';

/* other library imports */
import { Link, Route, Routes } from 'react-router-dom';

/* codePost imports */
import type { Assignment, SubmissionInfoType } from '../../../../types/common';
import { IAssignmentToSubmissionsMap } from '../../../../types/common';
import { sortAssignments } from '../../../../utils/assignments';

import { TableDetail } from '../../other/TableDetail';

import { encodeForLink, encodeForRoute } from '../../../../components/core/URLutils';

import GraderAssignmentDetail from './GraderAssignmentDetail';

/**********************************************************************************************************************/

interface IProps {
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  assignments: Assignment[];
  graders: string[];
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  means: { [assignmentID: number]: string | null };

  baseURL: string;
  grader: string;
  submissionsByAssignment: IAssignmentToSubmissionsMap;
}

const GraderDetail = (props: IProps) => {
  const aligner: 'left' | 'center' | 'right' = 'center';

  interface GraderRow {
    key: string;
    _claimedRaw: number;
    _finalizedRaw: number;
    _unfinalizedRaw: number;
    _graderAverageRaw: number;
    _assignmentAverageRaw: number;
  }

  const { columns, data } = useMemo(() => {
    const cols = [
      {
        title: 'Assignment',
        dataIndex: 'assignment',
        key: 'assignment',
        defaultSortOrder: 'ascend' as const,
        sorter: (a: GraderRow, b: GraderRow) => a.key.localeCompare(b.key),
      },
      {
        title: 'Claimed',
        dataIndex: 'claimed',
        key: 'claimed',
        align: aligner,
        sorter: (a: GraderRow, b: GraderRow) => a._claimedRaw - b._claimedRaw,
      },
      {
        title: 'Finalized',
        dataIndex: 'finalized',
        key: 'finalized',
        align: aligner,
        sorter: (a: GraderRow, b: GraderRow) => a._finalizedRaw - b._finalizedRaw,
      },
      {
        title: 'Unfinalized',
        dataIndex: 'unfinalized',
        key: 'unfinalized',
        align: aligner,
        sorter: (a: GraderRow, b: GraderRow) => a._unfinalizedRaw - b._unfinalizedRaw,
      },
      {
        title: 'Avg. Grade',
        dataIndex: 'graderAverage',
        key: 'graderAverage',
        align: aligner,
        sorter: (a: GraderRow, b: GraderRow) => a._graderAverageRaw - b._graderAverageRaw,
      },
      {
        title: 'Assignment Avg.',
        dataIndex: 'assignmentAverage',
        key: 'assignmentAverage',
        align: aligner,
        sorter: (a: GraderRow, b: GraderRow) => a._assignmentAverageRaw - b._assignmentAverageRaw,
      },
    ];

    const uniqueAssignments = Array.from(new Map(props.assignments.map((a) => [a.id, a])).values());
    const rows = sortAssignments(uniqueAssignments).map((assignment) => {
      const graded = props.submissionsByAssignment[assignment.id];
      const uniqueGraded = graded ? Array.from(new Map(graded.map((s) => [s.id, s])).values()) : undefined;
      const numFinalized = uniqueGraded ? uniqueGraded.filter((sub) => sub.isFinalized).length : 0;
      const numClaimed = uniqueGraded ? uniqueGraded.length : 0;
      const numUnfinalized = numClaimed - numFinalized;

      let avgGrade = 0;
      if (uniqueGraded) {
        avgGrade =
          uniqueGraded.reduce((acc, sub) => acc + (sub.grade !== null ? sub.grade : 0), 0) / uniqueGraded.length;
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
        _claimedRaw: numClaimed,
        _finalizedRaw: numFinalized,
        _unfinalizedRaw: numUnfinalized,
        _graderAverageRaw: numFinalized > 0 ? avgGrade : -1,
        _assignmentAverageRaw: assignment.mean
          ? assignment.mean
          : props.means[assignment.id]
            ? parseFloat(props.means[assignment.id]!)
            : -1,
      };
    });

    return { columns: cols, data: rows };
  }, [props.assignments, props.submissionsByAssignment, props.baseURL, props.grader, props.means]);

  return (
    <Routes>
      <Route
        index
        element={
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
                      title: <Link to={props.baseURL.split('/').slice(0, -1).join('/')}>By Grader</Link>,
                    },
                    {
                      title: <a>{props.grader}</a>,
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
        }
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

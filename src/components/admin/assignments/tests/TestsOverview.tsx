/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React from 'react';
import { RouteComponentProps } from '../../../../router/legacy';
import { Link } from 'react-router-dom';

import { Breadcrumb, Button, Empty } from 'antd';

import { TableDetail } from '../../other/TableDetail';

import { AssignmentType } from '../../../../infrastructure/types';

import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
}

const TestsOverview = (props: IProps & RouteComponentProps) => {
  const columns = [
    { title: 'Assignment', key: 'assignment', dataIndex: 'assignment' },
    { title: 'Edit tests', key: 'edit', dataIndex: 'edit', align: 'center' as const },
    { title: 'View test results', key: 'tests', dataIndex: 'tests', align: 'center' as const },
  ];

  // Deduplicate assignments by ID
  const uniqueAssignments = React.useMemo(() => {
    const seen = new Set<number>();
    return props.assignments.filter((assignment) => {
      if (seen.has(assignment.id)) return false;
      seen.add(assignment.id);
      return true;
    });
  }, [props.assignments]);

  const data = uniqueAssignments.map((assignment) => {
    return {
      key: `assignment-${assignment.id}`,
      assignment: assignment.name,
      tests: (
        <Link to={`${props.match.url}/${encodeForLink(assignment.name)}/results`}>
          <Button disabled={!assignment.environment}>Results</Button>
        </Link>
      ),
      edit: (
        <Link to={`${props.match.url}/${encodeForLink(assignment.name)}/edit`}>
          <Button>{assignment.environment ? 'Edit' : 'Create'}</Button>
        </Link>
      ),
    };
  });

  return (
    <TableDetail
      loadComplete={true}
      pagination={uniqueAssignments.length < 10 ? false : undefined}
      title={<div className="display-flex align-items-center">Tests</div>}
      isEmpty={data.length === 0}
      emptyNode={
        <Empty
          styles={{
            image: {
              height: 60,
            },
          }}
          description={<span>No assignments yet</span>}
        ></Empty>
      }
      columns={columns}
      data={data}
      actions={[]}
      breadcrumbs={<Breadcrumb items={[{ title: 'Assignments' }, { title: 'Tests' }]} />}
    />
  );
};

export default TestsOverview;

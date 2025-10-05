/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import * as React from 'react';

import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { Button, Breadcrumb, Empty, Tag } from 'antd';

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

  const data = props.assignments.map((assignment) => {
    return {
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
      pagination={props.assignments.length < 10 ? false : undefined}
      title={<div className="display-flex align-items-center">Tests</div>}
      isEmpty={data.length === 0}
      emptyNode={
        <Empty
          styles={{ image: {
            height: 60,
          } }}
          description={<span>No assignments yet</span>}
        ></Empty>
      }
      columns={columns}
      data={data}
      actions={[]}
      breadcrumbs={
        <Breadcrumb items={[{ title: 'Assignments' }, { title: 'Tests' }]} />
      }
    />
  );
};

export default TestsOverview;

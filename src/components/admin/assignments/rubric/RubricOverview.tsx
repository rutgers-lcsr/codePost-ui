/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import * as React from 'react';

import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { Button, Breadcrumb, Empty, Tag } from 'antd';

import { TableDetail } from '../../other/TableDetail';

import { AssignmentType } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';

import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: CourseType | undefined;
}

const RubricOverview = (props: IProps & RouteComponentProps) => {
  const columns = [
    { title: 'Assignment', key: 'assignment', dataIndex: 'assignment' },
    { title: 'Edit', key: 'edit', dataIndex: 'edit', align: 'center' as const },
  ];

  const data = props.assignments.map((assignment) => {
    return {
      assignment: assignment.name,
      edit: (
        <Link to={`${props.match.url}/${encodeForLink(assignment.name)}`}>
          <Button type={assignment.rubricCategories.length > 0 ? 'default' : 'primary'}>
            {assignment.rubricCategories.length > 0 ? 'Edit' : 'Create'}
          </Button>
        </Link>
      ),
    };
  });

  return (
    <TableDetail
      loadComplete={true}
      pagination={props.assignments.length < 10 ? false : undefined}
      title={'Rubrics'}
      isEmpty={false}
      emptyNode={
        <Empty
          imageStyle={{
            height: 60,
          }}
          description={<span>No assignments yet</span>}
        ></Empty>
      }
      columns={columns}
      data={data}
      actions={[]}
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item>
            {props.course !== undefined && props.course.archived ? <Tag>Archived</Tag> : null}Assignments
          </Breadcrumb.Item>
          <Breadcrumb.Item>Rubrics</Breadcrumb.Item>
        </Breadcrumb>
      }
    />
  );
};

export default RubricOverview;

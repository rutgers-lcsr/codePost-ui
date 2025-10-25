/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useMemo } from 'react';
import { RouteComponentProps } from '../../../../router/legacy';
import { Link } from 'react-router-dom';

import { Breadcrumb, Button, Empty, Tag } from 'antd';

import { TableDetail } from '../../other/TableDetail';

import { AssignmentType } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';

import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: CourseType | undefined;
}

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const PAGINATION_THRESHOLD = 10;
const EMPTY_IMAGE_HEIGHT = 60;
const TITLE = 'Rubrics';

/**********************************************************************************************************************/
/* Helper Functions
/**********************************************************************************************************************/

const getButtonType = (rubricCategoriesCount: number): 'default' | 'primary' => {
  return rubricCategoriesCount > 0 ? 'default' : 'primary';
};

const getButtonText = (rubricCategoriesCount: number): string => {
  return rubricCategoriesCount > 0 ? 'Edit' : 'Create';
};

/**********************************************************************************************************************/
/* Component
/**********************************************************************************************************************/

const RubricOverview: React.FC<IProps & RouteComponentProps> = ({ assignments, course, match }) => {
  const columns = useMemo(
    () => [
      { title: 'Assignment', key: 'assignment', dataIndex: 'assignment' },
      { title: 'Edit', key: 'edit', dataIndex: 'edit', align: 'center' as const },
    ],
    [],
  );

  const data = useMemo(
    () =>
      assignments.map((assignment) => ({
        assignment: assignment.name,
        edit: (
          <Link to={`${match.url}/${encodeForLink(assignment.name)}`}>
            <Button type={getButtonType(assignment.rubricCategories.length)}>
              {getButtonText(assignment.rubricCategories.length)}
            </Button>
          </Link>
        ),
        rowKey: `row-assignment-${assignment.id}`,
      })),
    [assignments, match.url],
  );

  const isEmpty = useMemo(() => data.length === 0, [data.length]);

  const pagination = useMemo(
    () => (assignments.length < PAGINATION_THRESHOLD ? false : undefined),
    [assignments.length],
  );

  const emptyNode = useMemo(
    () => (
      <Empty
        styles={{
          image: {
            height: EMPTY_IMAGE_HEIGHT,
          },
        }}
        description={<span>No assignments yet</span>}
      />
    ),
    [],
  );

  const breadcrumbs = useMemo(
    () => (
      <Breadcrumb
        items={[
          {
            title: (
              <>
                {course !== undefined && course.archived ? <Tag>Archived</Tag> : null}
                Assignments
              </>
            ),
          },
          { title: TITLE },
        ]}
      />
    ),
    [course],
  );

  return (
    <TableDetail
      loadComplete={true}
      pagination={pagination}
      title={TITLE}
      isEmpty={isEmpty}
      emptyNode={emptyNode}
      columns={columns}
      data={data}
      actions={[]}
      breadcrumbs={breadcrumbs}
    />
  );
};

export default RubricOverview;

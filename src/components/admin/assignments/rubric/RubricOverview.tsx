// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Breadcrumb, Button, Empty, Tag } from 'antd';

import { TableDetail } from '../../other/TableDetail';

import { Course } from '../../../../api-client';
import { AssignmentType } from '../../../../types/models';

import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  course: Course | undefined;
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

const RubricOverview: React.FC<IProps> = ({ assignments, course }) => {
  const location = useLocation();
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
          <Link to={`${location.pathname}/${encodeForLink(assignment.name)}`}>
            <Button type={getButtonType(assignment.rubricCategories.length)}>
              {getButtonText(assignment.rubricCategories.length)}
            </Button>
          </Link>
        ),
        rowKey: `row-assignment-${assignment.id}`,
      })),
    [assignments, location.pathname],
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

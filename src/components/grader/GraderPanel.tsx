// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useEffect } from 'react';

/* antd imports */
import { Breadcrumb, Table } from 'antd';
import type { TableProps } from 'antd';

/* other library imports */

import { Link, Navigate, Route, Routes } from 'react-router';

/* codePost imports */
import CPAdminDetail from '../admin/other/CPAdminDetail';

import { Course } from '../../api-client';
import { AssignmentType } from '../../types/models';

import { encodeForLink, encodeForRoute } from '../core/URLutils';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import { usePermissionsStore } from '../../stores/usePermissionsStore';

/**********************************************************************************************************************/

interface IParentProps {
  assignments: AssignmentType[];
  course: Course;
  actions: React.ReactElement[];
  title: string;
  isLoading: boolean;
  data: Record<string, unknown>[];
  columns: TableProps<Record<string, unknown>>['columns'];
  /** Rendered above the index table: a failed load must not look like empty data. */
  notice?: React.ReactNode;
}

interface IDetailProps {
  assignment: AssignmentType;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

/** Stable route element that sets the active assignment without causing remounts */
const AssignmentRouteElement = <T extends IDetailProps>({
  assignment,
  detailProps,
  breadcrumbs,
  DetailComponent,
}: {
  assignment: AssignmentType;
  detailProps: IParentProps & T;
  breadcrumbs: Array<{ title: React.ReactNode }>;
  DetailComponent: React.ComponentType<T>;
}) => {
  useEffect(() => {
    LOCAL_SETTINGS.defaultAssignment.setter(assignment.id);
    usePermissionsStore.getState().fetchAssignmentCapabilities(assignment.id);
  }, [assignment.id]);
  return <DetailComponent {...detailProps} assignment={assignment} breadcrumbs={breadcrumbs} />;
};

/** Stable index route element — redirects to stored assignment or shows table */
const IndexRouteElement = ({
  assignments,
  breadcrumbs,
  title,
  actions,
  columns,
  data,
  isLoading,
  notice,
}: {
  assignments: AssignmentType[];
  breadcrumbs: Array<{ title: React.ReactNode }>;
  title: string;
  actions: React.ReactElement[];
  columns: TableProps<Record<string, unknown>>['columns'];
  data: Record<string, unknown>[];
  isLoading: boolean;
  notice?: React.ReactNode;
}) => {
  const storedID = LOCAL_SETTINGS.defaultAssignment.getter();
  const matchedAssignment = assignments.find((assn) => assn.id === storedID);
  if (matchedAssignment) {
    return <Navigate to={`${encodeForLink(matchedAssignment.name)}`} replace />;
  }
  return (
    <CPAdminDetail
      breadcrumbs={<Breadcrumb items={breadcrumbs} />}
      goBack={null}
      title={<div style={{ letterSpacing: '-0.3px' }}>{title}</div>}
      actions={actions}
      content={
        <>
          {notice}
          {/* A course has a dozen or two assignments: one page, so the totals are in view. */}
          <Table
            columns={columns}
            dataSource={data}
            loading={isLoading}
            size="middle"
            pagination={data.length > 25 ? { pageSize: 25 } : false}
          />
        </>
      }
      gutterSize={0}
    />
  );
};

function GraderPanelBuilder<T extends IDetailProps>(DetailComponent: React.ComponentType<T>) {
  const BuiltGraderPanel = (props: IParentProps & T) => {
    // A real link back to the index (focus ring, middle-click); it also forgets the stored
    // assignment so the index does not redirect straight back.
    const breadcrumbs = [
      {
        title: (
          <Link to=".." relative="path" onClick={() => LOCAL_SETTINGS.defaultAssignment.setter(0)}>
            {props.title}
          </Link>
        ),
      },
    ];

    const data = props.data;

    return (
      <Routes>
        {props.assignments.map((assignment) => (
          <Route
            key={assignment.id}
            path={`${encodeForRoute(assignment.name)}`}
            element={
              <AssignmentRouteElement
                assignment={assignment}
                detailProps={props}
                breadcrumbs={breadcrumbs}
                DetailComponent={DetailComponent}
              />
            }
          />
        ))}
        <Route
          index
          element={
            <IndexRouteElement
              assignments={props.assignments}
              breadcrumbs={breadcrumbs}
              title={props.title}
              actions={props.actions}
              columns={props.columns}
              data={data}
              isLoading={props.isLoading}
              notice={props.notice}
            />
          }
        />
      </Routes>
    );
  };
  return BuiltGraderPanel;
}

export default GraderPanelBuilder;

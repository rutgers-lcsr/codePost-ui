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

import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

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
}: {
  assignments: AssignmentType[];
  breadcrumbs: Array<{ title: React.ReactNode }>;
  title: string;
  actions: React.ReactElement[];
  columns: TableProps<Record<string, unknown>>['columns'];
  data: Record<string, unknown>[];
  isLoading: boolean;
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
      content={<Table columns={columns} dataSource={data} loading={isLoading} size="middle" />}
      gutterSize={0}
    />
  );
};

function GraderPanelBuilder<T extends IDetailProps>(DetailComponent: React.ComponentType<T>) {
  const BuiltGraderPanel = (props: IParentProps & T) => {
    const navigate = useNavigate();

    // In v6, simple back navigation to index or explicit path
    const back = () => {
      LOCAL_SETTINGS.defaultAssignment.setter(0);
      navigate('..', { relative: 'path' });
    };

    const breadcrumbs = [
      {
        title: (
          <span style={{ cursor: 'pointer' }} onClick={back}>
            {props.title}
          </span>
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
            />
          }
        />
      </Routes>
    );
  };
  return BuiltGraderPanel;
}

export default GraderPanelBuilder;

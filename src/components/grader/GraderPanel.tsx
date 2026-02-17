/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Breadcrumb, Table } from 'antd';

/* other library imports */

import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

/* codePost imports */
import CPAdminDetail from '../admin/other/CPAdminDetail';

import { Course } from '../../api-client';
import { AssignmentType } from '../../types/models';

import { encodeForLink, encodeForRoute } from '../core/URLutils';
import { LOCAL_SETTINGS } from '../utils/LocalSettings';

/**********************************************************************************************************************/

interface IParentProps {
  assignments: AssignmentType[];
  course: Course;
  actions: React.ReactElement[];
  title: string;
  isLoading: boolean;
  data: any[];
  columns: any;
}

interface IDetailProps {
  assignment: AssignmentType;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

function GraderPanelBuilder<T extends IDetailProps>(DetailComponent: React.ComponentType<T>) {
  return (props: IParentProps & T) => {
    const navigate = useNavigate();

    // In v6, simple back navigation to index or explicit path
    const back = () => {
      LOCAL_SETTINGS.defaultAssignment.setter(0);
      navigate('.', { replace: true });
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
            element={React.createElement(() => {
              LOCAL_SETTINGS.defaultAssignment.setter(assignment.id);
              return <DetailComponent {...props} assignment={assignment} breadcrumbs={breadcrumbs} />;
            })}
          />
        ))}
        <Route
          index
          element={React.createElement(() => {
            const storedID = LOCAL_SETTINGS.defaultAssignment.getter();
            const matchedAssignment = props.assignments.find((assn) => assn.id === storedID);
            if (matchedAssignment) {
              return <Navigate to={`${encodeForLink(matchedAssignment.name)}`} replace />;
            } else {
              return (
                <CPAdminDetail
                  breadcrumbs={<Breadcrumb items={breadcrumbs} />}
                  goBack={null}
                  title={<div>{props.title}</div>}
                  actions={props.actions}
                  content={<Table columns={props.columns} dataSource={data} loading={props.isLoading} />}
                  gutterSize={0}
                />
              );
            }
          })}
        />
      </Routes>
    );
  };
}

export default GraderPanelBuilder;

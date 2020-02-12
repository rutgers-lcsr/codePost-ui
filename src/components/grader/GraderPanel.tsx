/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Breadcrumb, Icon, Table } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Switch, Route, Link, Redirect } from 'react-router-dom';

/* codePost imports */
import CPAdminDetail from '../admin/other/CPAdminDetail';

import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';
import { encodeForLink, encodeForRoute } from '../core/URLutils';

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IParentProps extends RouteComponentProps {
  assignments: AssignmentType[];
  course: CourseType;
  actions: React.ReactElement[];
  title: string;
  isLoading: boolean;
  data: any[];
  columns: any;
}

interface IDetailProps {
  assignment: AssignmentType;
  breadcrumbs: React.ReactElement[];
}

function GraderPanelBuilder<T extends IDetailProps>(DetailComponent: React.ComponentType<T>) {
  return (props: IParentProps & T) => {
    const back = () => {
      LOCAL_SETTINGS.defaultAssignment.setter(0);
      props.history.push(props.match.url);
    };
    const breadcrumbs = [
      <Breadcrumb.Item key={props.title}>
        <span style={{ cursor: 'pointer' }} onClick={back}>
          {props.title}
        </span>
      </Breadcrumb.Item>,
    ];

    const data = props.data.map((row) => {
      return {
        ...row,
        zoom: (
          <Link to={`${props.match.url}/${encodeForLink(row.assignment)}`}>
            <Icon type="folder-open" />
          </Link>
        ),
      };
    });

    return (
      <Switch>
        {props.assignments.map((assignment) => (
          <Route
            key={assignment.id}
            path={`${props.match.url}/${encodeForRoute(assignment.name)}`}
            render={(subprops: any) => {
              LOCAL_SETTINGS.defaultAssignment.setter(assignment.id);
              return <DetailComponent {...props} assignment={assignment} breadcrumbs={breadcrumbs} />;
            }}
          />
        ))}
        <Route
          path={props.match.url}
          render={(subprops: any) => {
            const storedID = LOCAL_SETTINGS.defaultAssignment.getter();
            const matchedAssignment = props.assignments.find((assn) => assn.id === storedID);
            if (matchedAssignment) {
              return <Redirect to={`${props.match.url}/${encodeForLink(matchedAssignment.name)}`} />;
            } else {
              return (
                <CPAdminDetail
                  breadcrumbs={<Breadcrumb>{breadcrumbs}</Breadcrumb>}
                  goBack={null}
                  title={<div>{props.title}</div>}
                  actions={props.actions}
                  content={<Table columns={props.columns} dataSource={data} loading={props.isLoading} />}
                  gutterSize={0}
                />
              );
            }
          }}
        />
      </Switch>
    );
  };
}

export default GraderPanelBuilder;

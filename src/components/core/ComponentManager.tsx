/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Redirect, Route, Switch } from 'react-router-dom';

/* codePost imports */

/* API library */
import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { UserType } from '../../infrastructure/user';
import { SectionType } from '../../infrastructure/section';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import { CourseContext } from '../core/Contexts';

import { encodeForRoute, encodeForLink } from '../core/URLutils';

/**********************************************************************************************************************/

interface IComponentManagerProps extends RouteComponentProps<{}> {
  initialCourses: CourseType[];
  user: UserType;

  addAssignment: (assignment: AssignmentType) => void;
  deleteAssignment: (assignment: AssignmentType) => void;
  addCourse: (newCourse: CourseType) => void;

  superGraderCourses: CourseType[];
  sectionsLed: SectionType[];

  handleLogout: () => void;
}

export interface IComponentProps extends IComponentManagerProps {
  currentCourse?: CourseType;
}

const formURL = (baseURL: string, course: CourseType, page?: string) => {
  return `${baseURL}/${encodeForRoute(course.name)}/${encodeForRoute(course.period)}/${page !== undefined ? page : ''}`;
};

const formURLforLink = (baseURL: string, course: CourseType, page?: string) => {
  return `${baseURL}/${encodeForLink(course.name)}/${encodeForLink(course.period)}/${page !== undefined ? page : ''}`;
};

const ComponentManager = (
  MyComponent: React.ComponentType<IComponentProps>,
  defaultPage?: ((c: CourseType) => string) | string,
) => {
  return (props: IComponentManagerProps) => {
    return (
      <Switch>
        {props.initialCourses.map((course) => (
          <Route
            key={course.id.toString()}
            path={formURL(props.match.url, course)}
            render={(subprops: any) => {
              LOCAL_SETTINGS.defaultCourse.setter(course.id);
              return (
                <CourseContext.Provider value={course}>
                  <MyComponent {...props} {...subprops} currentCourse={course} />
                </CourseContext.Provider>
              );
            }}
          />
        ))}
        <Route
          key="0"
          path={props.match.url}
          render={(subprops: any) => {
            const storedID = LOCAL_SETTINGS.defaultCourse.getter();
            if (storedID !== 0) {
              const found = props.initialCourses.find((course: CourseType) => {
                return course.id === storedID;
              });
              if (found !== undefined) {
                let dPage =
                  typeof defaultPage === 'string' || typeof defaultPage === 'undefined'
                    ? defaultPage
                    : defaultPage(found);

                if (subprops.location.pathname === '/admin/billing') {
                  dPage = 'billing';
                }
                return <Redirect to={formURLforLink(props.match.url, found, dPage)} />;
              }
            }

            if (props.initialCourses.length > 0) {
              const lastResort = props.initialCourses.sort((a, b) => {
                return b.id - a.id;
              })[0];
              let dPage =
                typeof defaultPage === 'string' || typeof defaultPage === 'undefined'
                  ? defaultPage
                  : defaultPage(lastResort);

              if (subprops.location.pathname === '/admin/billing') {
                dPage = 'billing';
              }
              return <Redirect to={formURLforLink(props.match.url, lastResort, dPage)} />;
            }

            return <MyComponent {...props} {...subprops} currentCourse={undefined} />;
          }}
        />
      </Switch>
    );
  };
};

export default ComponentManager;

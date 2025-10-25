/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Navigate, Route, Routes } from 'react-router-dom';

import { LegacyRouteRenderer, RouteComponentProps } from '../../router/legacy';

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
  const base = `${baseURL}/${encodeForRoute(course.name)}/${encodeForRoute(course.period)}`;
  return page !== undefined ? `${base}/${page}` : base;
};

const formURLforLink = (baseURL: string, course: CourseType, page?: string) => {
  const base = `${baseURL}/${encodeForLink(course.name)}/${encodeForLink(course.period)}`;
  return page !== undefined ? `${base}/${page}` : base;
};

const ComponentManager = (
  MyComponent: React.ComponentType<IComponentProps>,
  defaultPage?: ((c: CourseType) => string) | string,
) => {
  const CatchAllElement = (props: IComponentManagerProps) => {
    return (
      <LegacyRouteRenderer
        path={`${props.match.url}/*`}
        render={(subprops: RouteComponentProps) => {
          const storedID = LOCAL_SETTINGS.defaultCourse.getter();
          if (storedID !== 0) {
            const found = props.initialCourses.find((course: CourseType) => course.id === storedID);
            if (found !== undefined) {
              let dPage =
                typeof defaultPage === 'string' || typeof defaultPage === 'undefined'
                  ? defaultPage
                  : defaultPage(found);

              if (subprops.location.pathname === '/admin/billing') {
                dPage = 'billing';
              }
              return <Navigate to={formURLforLink(props.match.url, found, dPage)} />;
            }
          }

          if (props.initialCourses.length > 0) {
            const lastResort = props.initialCourses.slice().sort((a, b) => {
              return b.id - a.id;
            })[0];
            let dPage =
              typeof defaultPage === 'string' || typeof defaultPage === 'undefined'
                ? defaultPage
                : defaultPage(lastResort);

            if (subprops.location.pathname === '/admin/billing') {
              dPage = 'billing';
            }
            return <Navigate to={formURLforLink(props.match.url, lastResort, dPage)} />;
          }

          return <MyComponent {...props} {...subprops} currentCourse={undefined} />;
        }}
      />
    );
  };

  return (props: IComponentManagerProps) => {
    return (
      <Routes>
        {props.initialCourses.map((course) => {
          const coursePath = formURL(props.match.url, course);
          // Remove the base URL to make it relative for nested Routes
          const relativeCoursePath = coursePath.replace(props.match.url, '').replace(/^\//, '');

          return (
            <Route
              key={course.id.toString()}
              path={`${relativeCoursePath}/*`}
              element={
                <LegacyRouteRenderer
                  path={`${coursePath}/*`}
                  render={(subprops: RouteComponentProps) => {
                    LOCAL_SETTINGS.defaultCourse.setter(course.id);
                    return (
                      <CourseContext.Provider value={course}>
                        <MyComponent {...props} {...subprops} currentCourse={course} />
                      </CourseContext.Provider>
                    );
                  }}
                />
              }
            />
          );
        })}
        <Route path="*" element={<CatchAllElement {...props} />} />
      </Routes>
    );
  };
};

export default ComponentManager;

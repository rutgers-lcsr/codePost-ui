/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

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

interface IComponentManagerProps {
  initialCourses: CourseType[];
  user: UserType;

  addAssignment: (assignment: AssignmentType) => void;
  deleteAssignment: (assignment: AssignmentType) => void;
  addCourse: (newCourse: CourseType) => void;

  superGraderCourses: CourseType[];
  sectionsLed: SectionType[];

  handleLogout: () => void;
  baseURL: string;
}

export interface IComponentProps extends IComponentManagerProps {
  currentCourse?: CourseType;
}

const formURLforLink = (baseURL: string, course: CourseType, page?: string) => {
  const base = `${baseURL}/${encodeForLink(course.name)}/${encodeForLink(course.period)}`;
  return page !== undefined ? `${base}/${page}` : base;
};

const ComponentManager = (
  MyComponent: React.ComponentType<IComponentProps>,
  defaultPage?: ((c: CourseType) => string) | string,
) => {
  const CatchAllElement = (props: IComponentManagerProps) => {
    // Hooks
    const location = useLocation();

    const storedID = LOCAL_SETTINGS.defaultCourse.getter();

    if (storedID !== 0) {
      const found = props.initialCourses.find((course: CourseType) => course.id === storedID);
      if (found !== undefined) {
        let dPage =
          typeof defaultPage === 'string' || typeof defaultPage === 'undefined' ? defaultPage : defaultPage(found);

        if (location.pathname === '/admin/billing') {
          dPage = 'billing';
        }

        return <Navigate to={formURLforLink(props.baseURL, found, dPage)} />;
      }
    }

    if (props.initialCourses.length > 0) {
      const lastResort = props.initialCourses.slice().sort((a, b) => {
        return b.id - a.id;
      })[0];
      let dPage =
        typeof defaultPage === 'string' || typeof defaultPage === 'undefined' ? defaultPage : defaultPage(lastResort);

      if (location.pathname === '/admin/billing') {
        dPage = 'billing';
      }
      return <Navigate to={formURLforLink(props.baseURL, lastResort, dPage)} />;
    }

    // Fallback: render component with no course
    return <MyComponent {...props} currentCourse={undefined} />;
  };

  return (props: IComponentManagerProps) => {
    return (
      <Routes>
        {props.initialCourses.map((course) => {
          const routePath = `${encodeForRoute(course.name)}/${encodeForRoute(course.period)}/*`;

          return (
            <Route
              key={course.id.toString()}
              path={routePath}
              element={React.createElement(() => {
                LOCAL_SETTINGS.defaultCourse.setter(course.id);
                return (
                  <CourseContext.Provider value={course}>
                    <MyComponent key={`course-${course.id}`} {...props} currentCourse={course} />
                  </CourseContext.Provider>
                );
              })}
            />
          );
        })}
        <Route path="*" element={<CatchAllElement {...props} />} />
      </Routes>
    );
  };
};

export default ComponentManager;

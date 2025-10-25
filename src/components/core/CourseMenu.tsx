/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* other library imports */
import { Link } from 'react-router-dom';
import { theme } from 'antd';

/* codePost imports */
import { CourseType } from '../../infrastructure/course';

import { encodeForLink } from '../core/URLutils';

import CPDropdown from './CPDropdown';

/**********************************************************************************************************************/

interface IProps {
  courses: CourseType[];
  currentCourse?: CourseType;
  base: string;
  panel?: string;
}

export const encodedCourseLink = (base: string, course: CourseType, panel?: string) => {
  return `/${base}/${encodeForLink(course.name)}/${encodeForLink(course.period)}/${panel !== undefined ? panel : ''}`;
};

const CourseMenu = (props: IProps) => {
  const { token } = theme.useToken();
  const sortArchived = (a: CourseType, b: CourseType) => {
    return a.archived === b.archived ? 0 : a.archived ? 1 : -1;
  };

  let selectorText = 'No courses yet...';
  if (props.courses.length > 0) {
    selectorText = 'Select a course';
  }

  if (props.currentCourse) {
    selectorText = `${props.currentCourse.name} | ${props.currentCourse.period}`;
  }
  // Dropdown menu maxHeight is to create scroll for long menus that scales with window height
  return (
    <CPDropdown
      value={selectorText}
      menu={{
        items: props.courses.sort(sortArchived).map((course) => ({
          key: course.id,
          label: (
            <Link to={encodedCourseLink(props.base, course, props.panel)}>
              <span style={course.archived ? { color: token.colorTextQuaternary } : undefined}>
                {`${course.name} | ${course.period}`}
              </span>
            </Link>
          ),
        })),
      }}
    />
  );
};

export default CourseMenu;

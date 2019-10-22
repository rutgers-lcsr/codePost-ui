/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Link } from 'react-router-dom';

/* ant imports */
import { Menu } from 'antd';

/* codePost imports */
import { CourseType } from '../../infrastructure/course';

import CPDropdown from './CPDropdown';

/**********************************************************************************************************************/

interface IProps {
  courses: CourseType[];
  currentCourse?: CourseType;
  base: string;
  panel?: string;
}

const CourseMenu = (props: IProps) => {
  const menu = (
    <Menu>
      {props.courses.map((course, i) => {
        return (
          <Menu.Item key={course.id}>
            <Link
              to={`/${props.base}/${encodeURIComponent(course.name)}/${encodeURIComponent(course.period)}/${
                props.panel !== undefined ? props.panel : ''
              }`}
            >
              <span>{`${course.name} | ${course.period}`}</span>
            </Link>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  let selectorText = 'No courses yet...';
  if (props.courses.length > 0) {
    selectorText = 'Select a course';
  }

  if (props.currentCourse) {
    selectorText = `${props.currentCourse.name} | ${props.currentCourse.period}`;
  }
  // Dropdown overlay maxHeight is to create scroll for long menus that scales with window height
  return (
    <CPDropdown
      value={selectorText}
      overlay={menu}
      overlayStyle={{ maxHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}
    />
  );
};

export default CourseMenu;

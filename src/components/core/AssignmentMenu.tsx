/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { RouteComponentProps, generatePath } from 'react-router';
import { Link } from 'react-router-dom';

/* ant imports */
import { Menu, Icon } from 'antd';

/* codePost imports */
import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';

import CPDropdown from './CPDropdown';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import { encodeForLink } from '../core/URLutils';

/**********************************************************************************************************************/

interface IProps extends RouteComponentProps<{ assignment: string; panel: string }> {
  currentCourse: CourseType;
  assignments: AssignmentType[];
  baseURL: string;
}

const AssignmentMenu = (props: IProps) => {
  const clear = () => {
    LOCAL_SETTINGS.defaultAssignment.setter(0);
    props.history.push(generatePath(props.match.path, { panel: props.match.params.panel, assignment: undefined }));
  };

  const menu = (
    <Menu>
      <Menu.Item key="clear">
        <span onClick={clear}>
          <Icon type="close" /> <em>Clear assignment</em>
        </span>
      </Menu.Item>
      {props.assignments.map((assignment) => {
        const path = generatePath(props.match.path, { panel: props.match.params.panel, assignment: assignment.name });
        return (
          <Menu.Item key={assignment.id}>
            <Link to={path}>
              <span>{assignment.name}</span>
            </Link>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  let selectorText = 'No assignments yet...';
  if (props.assignments.length > 0) {
    selectorText = 'Select an assignment';
  }

  const currentAssignment = props.assignments.find((el) => encodeForLink(el.name) === props.match.params.assignment);
  if (currentAssignment) {
    selectorText = currentAssignment.name;
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

export default AssignmentMenu;

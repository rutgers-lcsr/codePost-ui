// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* other library imports */

import { Link, useNavigate, useParams } from 'react-router-dom';

import { CloseOutlined } from '@ant-design/icons';

/* codePost imports */
import type { AssignmentType } from '../../types/models';
import { sortAssignments } from '../../utils/assignments';
import { Course } from '../../api-client';

import CPDropdown from './CPDropdown';

import { LOCAL_SETTINGS } from '../utils/LocalSettings';

import { encodeForLink } from '../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  currentCourse: Course;
  assignments: AssignmentType[];
  baseURL: string;
}

const AssignmentMenu = (props: IProps) => {
  const navigate = useNavigate();
  const params = useParams();
  const panel = params.panel || '';
  const assignmentParam = params.assignment || '';

  const clear = () => {
    LOCAL_SETTINGS.defaultAssignment.setter(0);
    navigate(`${props.baseURL}/${panel}/`);
  };

  const menuItems = [
    {
      key: 'clear',
      label: (
        <span onClick={clear}>
          <CloseOutlined /> <em>Clear assignment</em>
        </span>
      ),
    },
    ...sortAssignments(props.assignments).map((assignment) => {
      const path = `${props.baseURL}/${panel}/${encodeForLink(assignment.name)}`;
      return {
        key: assignment.id,
        label: (
          <Link to={path}>
            <span>{assignment.name}</span>
          </Link>
        ),
      };
    }),
  ];

  let selectorText = 'No assignments yet...';
  if (props.assignments.length > 0) {
    selectorText = 'Select an assignment';
  }

  const currentAssignment = props.assignments.find((el) => encodeForLink(el.name) === assignmentParam);
  if (currentAssignment) {
    selectorText = currentAssignment.name;
  }
  // Dropdown menu maxHeight is to create scroll for long menus that scales with window height
  return (
    <CPDropdown
      value={selectorText}
      menu={{ items: menuItems }}
      popupRender={(menu) => <div style={{ maxHeight: 'calc(100dvh - 60px)', overflowY: 'auto' }}>{menu}</div>}
    />
  );
};

export default AssignmentMenu;

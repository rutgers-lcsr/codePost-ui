/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { CloseOutlined } from '@ant-design/icons';

/* codePost imports */
import { AssignmentType, sortAssignments } from '../../infrastructure/assignment';
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
    props.history.push(`${props.baseURL}/${props.match.params.panel}/`);
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
      const path = `${props.baseURL}/${props.match.params.panel}/${encodeForLink(assignment.name)}`;
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

  const currentAssignment = props.assignments.find((el) => encodeForLink(el.name) === props.match.params.assignment);
  if (currentAssignment) {
    selectorText = currentAssignment.name;
  }
  // Dropdown menu maxHeight is to create scroll for long menus that scales with window height
  return (
    <CPDropdown
      value={selectorText}
      menu={{ items: menuItems }}
      dropdownRender={(menu) => <div style={{ maxHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}>{menu}</div>}
    />
  );
};

export default AssignmentMenu;

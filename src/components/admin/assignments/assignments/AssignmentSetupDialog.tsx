/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Modal, Timeline } from 'antd';

/* codePost imports */
import { CourseType, AssignmentType } from '../../../../infrastructure/types';

import {
  getRosterURL,
  getUploadSubmissionsURL,
  getTestsURL,
  getRubricURL,
  getSettingsURL,
} from '../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  assignment: AssignmentType;
  course: CourseType;
  hasStudents: boolean;
  onClose: () => void;
}

const AssignmentSetupDialog = (props: IProps) => {
  const studentsAreUploading = props.assignment.allowStudentUpload;

  const options = (
    <Timeline>
      <Timeline.Item color="green">Create assignment ({props.assignment.name})</Timeline.Item>
      {props.hasStudents ? (
        <Timeline.Item color="green">Add some students</Timeline.Item>
      ) : (
        <Timeline.Item color="gray">
          <a href={`/${getRosterURL(props.course)}/students`} target="_blank">
            <Button type="primary">Add some students</Button>
          </a>{' '}
          <p>
            <em>Students must be added to your roster before they can submit.</em>
          </p>
        </Timeline.Item>
      )}
      {!props.assignment.allowStudentUpload ? (
        <Timeline.Item color="gray">
          <a href={`/${getUploadSubmissionsURL(props.course, props.assignment)}`} target="_blank">
            <Button>Upload submissions</Button>
          </a>
          <p>
            <em>Upload submissions to review them in codePost.</em>
          </p>
        </Timeline.Item>
      ) : null}
      {props.assignment.allowStudentUpload ? (
        <Timeline.Item color="gray">
          <a href={`/${getSettingsURL(props.course, props.assignment)}`} target="_blank">
            <Button>[Optional] Configure student upload</Button>
          </a>
          <p>
            <em>Specify required files, allow late submissions, etc...</em>
          </p>
        </Timeline.Item>
      ) : null}
      <Timeline.Item color="gray">
        <a href={`/${getTestsURL(props.course, props.assignment)}`} target="_blank">
          <Button>[Optional] Create tests</Button>{' '}
        </a>
        <p>
          <em>
            Write tests and optionally expose tests to students so they can receive real-time feedback when they submit.
          </em>
        </p>
      </Timeline.Item>
      <Timeline.Item color="gray">
        <a href={`/${getRubricURL(props.course, props.assignment)}`} target="_blank">
          <Button>[Optional] Create rubric</Button>{' '}
        </a>
        <p>
          <em>Make it easier to review student code by creating standard comments.</em>
        </p>
      </Timeline.Item>
    </Timeline>
  );

  return (
    <Modal
      visible={true}
      title={`Setup: ${props.assignment.name}`}
      width={550}
      onCancel={props.onClose}
      onOk={props.onClose}
    >
      <b>
        Now that your assignment has been created, here are some next steps. You can access this list from this
        assignment's "Actions" menu by selecting "Get started".
      </b>
      <br />
      <br />
      {options}
    </Modal>
  );
};

export default AssignmentSetupDialog;

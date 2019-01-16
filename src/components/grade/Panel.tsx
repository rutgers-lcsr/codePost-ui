import * as React from 'react';
import Finalize from './Finalize';

import pluralize from 'pluralize';

import { AssignmentType } from '../../infrastructure/assignment';
import { SubmissionType } from '../../infrastructure/submission';

interface IPanelProps {
  submission: SubmissionType;
  assignment: AssignmentType;
  toggleFinalized: any;
}

const Panel = (props: IPanelProps) => {
  const { assignment, submission, toggleFinalized } = props;

  return (
    <div className="grade__top-container">
      <SubmissionInfo submission={submission} assignment={assignment} />
      <GradeBox submission={submission} assignment={assignment} />
      <GradeActions submission={submission} toggleFinalized={toggleFinalized} />
    </div>
  );
};

interface ISubmissionInfoProps {
  submission: SubmissionType;
  assignment: AssignmentType;
}

const SubmissionInfo = (props: ISubmissionInfoProps) => {
  const { assignment, submission } = props;

  const studentString = `${pluralize('Student', submission.students.length)}: ${submission.students.join(',')}`;

  const grader = submission.grader ? submission.grader : '';
  const graderString = `Grader: ${grader}`;

  const assignmentString = `Assignment: ${assignment.name}`;

  return (
    <div className="grade__top-container__sub-details">
      <div>{studentString}</div>
      <div>{graderString}</div>
      <div>{assignmentString}</div>
    </div>
  );
};

interface IGradeBoxProps {
  submission: SubmissionType;
  assignment: AssignmentType;
}

const GradeBox = (props: IGradeBoxProps) => {
  const { submission, assignment } = props;

  const gradeString = `Grade: ${submission.grade} / ${assignment.points}`;
  return <div className="grade__top-container__grade">{gradeString}</div>;
};

interface IGradeActionsProps {
  submission: SubmissionType;
  toggleFinalized: any;
}

const GradeActions = (props: IGradeActionsProps) => {
  const { submission, toggleFinalized } = props;

  return (
    <div className="grade__top-container__sub-finalize">
      <Finalize submission={submission} toggleFinalized={toggleFinalized} />
    </div>
  );
};

export default Panel;

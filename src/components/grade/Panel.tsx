import * as React from 'react';
import { IAssignment, ISubmission2 } from '../../types/common';
import Finalize from './Finalize';

import pluralize from 'pluralize';

interface IPanelProps {
  submission: ISubmission2;
  assignment: IAssignment;
  toggleFinalized: any;
}

const Panel = (props: IPanelProps) => {
  const { assignment, submission, toggleFinalized } = props;

  return (
    <div className="container-info">
      <SubmissionInfo submission={submission} assignment={assignment} />
      <GradeBox submission={submission} assignment={assignment} />
      <GradeActions submission={submission} toggleFinalized={toggleFinalized} />
    </div>
  );
};

interface ISubmissionInfoProps {
  submission: ISubmission2;
  assignment: IAssignment;
}

const SubmissionInfo = (props: ISubmissionInfoProps) => {
  const { assignment, submission } = props;

  const studentString = `${pluralize(
    'Student',
    submission.students.length,
  )}: ${submission.students.join(',')}`;

  const grader = submission.grader ? submission.grader : '';
  const graderString = `Grader: ${grader}`;

  const assignmentString = `Assignment: ${assignment.name}`;

  return (
    <div className="container-subinfo">
      <div>{studentString}</div>
      <div>{graderString}</div>
      <div>{assignmentString}</div>
    </div>
  );
};

interface IGradeBoxProps {
  submission: ISubmission2;
  assignment: IAssignment;
}

const GradeBox = (props: IGradeBoxProps) => {
  const { submission, assignment } = props;

  const gradeString = `Grade: ${submission.grade} / ${assignment.points}`;
  return <div className="container-grade">{gradeString}</div>;
};

interface IGradeActionsProps {
  submission: ISubmission2;
  toggleFinalized: any;
}

const GradeActions = (props: IGradeActionsProps) => {
  const { submission, toggleFinalized } = props;

  return (
    <div className="container-toggle">
      <Finalize submission={submission} toggleFinalized={toggleFinalized} />
    </div>
  );
};

export default Panel;

import * as React from 'react';
import { IStudent, ISubmission } from '../../types/common';
import Finalize from './Finalize';

import pluralize from 'pluralize';

interface IPanelProps {
  submission: ISubmission;
  toggleFinalized: any;
}

const Panel = (props: IPanelProps) => {
  const { submission, toggleFinalized } = props;

  return (
    <div className="container-info">
      <SubmissionInfo submission={submission} />
      <GradeBox submission={submission} />
      <GradeActions submission={submission} toggleFinalized={toggleFinalized} />
    </div>
  );
};

interface ISubmissionInfoProps {
  submission: ISubmission;
}

const SubmissionInfo = (props: ISubmissionInfoProps) => {
  const { submission } = props;

  const students = submission.students
    ? submission.students.map((student: IStudent) => student.profile.username)
    : [];
  const studentString = `${pluralize('Student', students.length)}: ${students.join(',')}`;

  const grader = submission.grader ? submission.grader.profile.username : '';
  const graderString = `Grader: ${grader}`;

  const assignmentString = `Assignment: ${submission.assignment.name}`;

  return (
    <div className="container-subinfo">
      <div>{studentString}</div>
      <div>{graderString}</div>
      <div>{assignmentString}</div>
    </div>
  );
};

interface IGradeBoxProps {
  submission: ISubmission;
}

const GradeBox = (props: IGradeBoxProps) => {
  const { submission } = props;

  const gradeString = `Grade: ${submission.grade} / ${submission.assignment.points}`;

  return <div className="container-grade">{gradeString}</div>;
};

interface IGradeActionsProps {
  submission: ISubmission;
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

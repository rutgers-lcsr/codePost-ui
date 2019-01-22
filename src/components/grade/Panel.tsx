import * as React from 'react';
import Finalize from './Finalize';

import pluralize from 'pluralize';

import { Button, FontIcon, SelectField } from 'react-md';

import { AssignmentType } from '../../infrastructure/assignment';
import { SubmissionType } from '../../infrastructure/submission';

interface IPanelProps {
  submission: SubmissionType;
  assignment: AssignmentType;
  toggleFinalized: any;
  graders: string[];
  updateGrader: any;
}

const Panel = (props: IPanelProps) => {
  const { assignment, submission, toggleFinalized, graders, updateGrader } = props;

  return (
    <div className="grade__top-container">
      <SubmissionInfo submission={submission} assignment={assignment} graders={graders} updateGrader={updateGrader} />
      <GradeBox submission={submission} assignment={assignment} />
      <GradeActions submission={submission} toggleFinalized={toggleFinalized} />
    </div>
  );
};

interface ISubmissionInfoProps {
  submission: SubmissionType;
  assignment: AssignmentType;
  graders: string[];
  updateGrader: any;
}

const SubmissionInfo = (props: ISubmissionInfoProps) => {
  const { assignment, submission, graders, updateGrader } = props;

  const studentTitle = pluralize('Student', submission.students.length);
  const studentString = `${submission.students.join(',')}`;
  const grader = submission.grader ? submission.grader : 'Unassigned';

  const menuItems = ['Unassigned', ...graders];

  const handleGraderChange = (value: any, index: any, event: any, details: any) => {
    updateGrader(submission, value);
  };

  return (
    <div className="grade__top-container__sub-details">
      <div>
        <b>{`${studentTitle}: `}</b>
        {studentString}
      </div>
      <div>
        <b>Grader: </b>
        {grader}
        <SelectField
          id="select-field-4"
          value={grader}
          onChange={handleGraderChange}
          menuItems={menuItems}
          position={SelectField.Positions.BELOW}
          dropdownIcon={<FontIcon>assignment_ind</FontIcon>}
        />
        <Button
          icon={true}
          forceIconFontSize={true}
          forceIconSize={20}
          tooltipLabel="Unassign grader"
          tooltipDelay={750}
          onClick={handleGraderChange.bind(props, '')}
        >
          remove_circle_outline
        </Button>
      </div>
      <div>
        <b>Assignment: </b> {assignment.name}
      </div>
    </div>
  );
};

interface IGradeBoxProps {
  submission: SubmissionType;
  assignment: AssignmentType;
}

const GradeBox = (props: IGradeBoxProps) => {
  const { submission, assignment } = props;

  const gradeString = `${submission.grade} / ${assignment.points}`;
  return (
    <div className="grade__top-container__grade">
      <b>Grade: </b>
      {gradeString}
    </div>
  );
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

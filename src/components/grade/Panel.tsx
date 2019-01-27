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
  isCourseAdmin: any;
  positiveNegativeAlert: boolean;
}

const Panel = (props: IPanelProps) => {
  const {
    assignment,
    submission,
    toggleFinalized,
    graders,
    updateGrader,
    isCourseAdmin,
    positiveNegativeAlert,
  } = props;

  return (
    <div className="grade__top-container">
      <SubmissionInfo
        submission={submission}
        assignment={assignment}
        graders={graders}
        updateGrader={updateGrader}
        isCourseAdmin={isCourseAdmin}
      />
      <GradeBox submission={submission} assignment={assignment} />
      <GradeActions
        submission={submission}
        toggleFinalized={toggleFinalized}
        positiveNegativeAlert={positiveNegativeAlert}
      />
    </div>
  );
};

interface ISubmissionInfoProps {
  submission: SubmissionType;
  assignment: AssignmentType;
  graders: string[];
  updateGrader: any;
  isCourseAdmin: any;
}

const SubmissionInfo = (props: ISubmissionInfoProps) => {
  const { assignment, submission, graders, updateGrader, isCourseAdmin } = props;

  const studentTitle = pluralize('Student', submission.students.length);
  const studentString = `${submission.students.join(',')}`;
  const grader = submission.grader ? submission.grader : 'Unassigned';

  const menuItems = ['Unassigned', ...graders];

  const handleGraderChange = (value: any, index: any, event: any, details: any) => {
    updateGrader(submission, value);
  };

  return (
    <div className="grade__top-container__sub-details">
      <div className="grade__top-container__sub-details__cell">
        <b>{`${studentTitle}: `}</b>
      </div>
      <div className="grade__top-container__sub-details__cell">{studentString}</div>
      <div className="grade__top-container__sub-details__cell">
        <b>Grader: </b>
      </div>
      <div className="grade__top-container__sub-details__cell">
        <SelectField
          id="grader-select-field"
          className="grade__top-container__sub-details__grader-select md-paper--1"
          value={grader}
          onChange={handleGraderChange}
          menuItems={menuItems}
          position={SelectField.Positions.BELOW}
          dropdownIcon={isCourseAdmin ? <FontIcon>assignment_ind</FontIcon> : <div />}
          label={isCourseAdmin ? '' : grader}
          disabled={!isCourseAdmin}
        />
        {isCourseAdmin ? (
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
        ) : (
          ''
        )}
      </div>
      <div className="grade__top-container__sub-details__cell">
        <b>Assignment: </b>
      </div>
      <div className="grade__top-container__sub-details__cell">{assignment.name}</div>
    </div>
  );
};

interface IGradeBoxProps {
  submission: SubmissionType;
  assignment: AssignmentType;
}

const GradeBox = (props: IGradeBoxProps) => {
  const { submission, assignment } = props;

  // convert from Python DateTime format
  const formattedDate = new Date(submission.dateEdited.substring(0, 16));
  formattedDate.setSeconds(0, 0);

  const gradeString = `${submission.grade} / ${assignment.points}`;
  return (
    <div>
      <div className="grade__top-container__grade">
        <b>Grade: </b>
        {gradeString}
      </div>
      <div className="grade__top-container__grade">
        <b>Last edited: </b>
        {formattedDate.toLocaleTimeString([], {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
};

interface IGradeActionsProps {
  submission: SubmissionType;
  toggleFinalized: any;
  positiveNegativeAlert: boolean;
}

const GradeActions = (props: IGradeActionsProps) => {
  const { submission, toggleFinalized, positiveNegativeAlert } = props;
  const warningClassName = positiveNegativeAlert ? 'positiveNegativeAlert' : 'positiveNegativeAlert--none';

  return (
    <div className="grade__top-container__sub-finalize">
      <Finalize submission={submission} toggleFinalized={toggleFinalized} />
      <div className={warningClassName}>
        Warning: This submission has both positive and negative point comments. Please check to make sure that this is
        intentional.
      </div>
    </div>
  );
};

export default Panel;

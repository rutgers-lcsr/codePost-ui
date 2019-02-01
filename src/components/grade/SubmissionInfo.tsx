import * as React from 'react';
import Select from 'react-select';

import pluralize from 'pluralize';

import { Divider } from 'react-md';

import { AssignmentType } from '../../infrastructure/assignment';
import { SubmissionType } from '../../infrastructure/submission';

interface ISubmissionInfoProps {
  submission: SubmissionType;
  assignment: AssignmentType;

  graders: string[];
  updateGrader: any;
  isCourseAdmin: any;
}

const SubmissionInfo = (props: ISubmissionInfoProps) => {
  const { assignment, submission, graders, updateGrader, isCourseAdmin } = props;

  const studentTitle = pluralize('Student', submission.students.length).toUpperCase();
  const studentString = `${submission.students.join(',')}`;

  const gradeString = `${submission.grade} / ${assignment.points}`;

  let menuItems: any = [];
  if (!submission.grader) {
    menuItems = menuItems.concat([{ value: 'Unassigned', label: 'Unassigned' }]);
  } else {
    menuItems = menuItems.concat([{ value: 'Unassign', label: 'Unassign' }]);
  }
  menuItems = menuItems.concat(
    graders.map((g) => {
      return { value: g, label: g };
    }),
  );

  const grader = submission.grader
    ? { value: submission.grader, label: submission.grader }
    : { value: 'Unassigned', label: 'Unassigned' };

  const handleGraderChange = (option: any, index: any, event: any, details: any) => {
    if (option.value === 'Unassign' || option.value === 'Unassigned') {
      updateGrader(submission, '');
    } else {
      updateGrader(submission, option.value);
    }
  };

  return (
    <div className="submission-info">
      <div className="submission-info--container">
        <div className="submission-info__title">Submission Info</div>
        <div className="submission-info__info">
          <div>ASSIGNMENT</div>
          <div>{assignment.name}</div>
          <div>{studentTitle}</div>
          <div>{studentString}</div>
          <div>GRADER</div>
          <div>
            {isCourseAdmin ? (
              <Select
                classNamePrefix="select--assign-grader"
                closeMenuOnSelect={true}
                isMulti={false}
                options={menuItems}
                onChange={handleGraderChange}
                value={grader}
                disabled={!isCourseAdmin}
              />
            ) : (
              grader.value
            )}
          </div>
        </div>
        <Divider />
        <div className="submission-info__info">
          <div>GRADE</div>
          <div>{gradeString}</div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionInfo;

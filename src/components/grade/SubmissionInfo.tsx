import * as React from 'react';
import Select from 'react-select';

import * as moment from 'moment';
import pluralize from 'pluralize';

import { Divider } from 'react-md';

import { AssignmentType } from '../../infrastructure/assignment';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { AnonymousSubmissionType } from '../../infrastructure/submission';

import { ICommentToRubricCommentMap } from '../../types/common';

interface ISubmissionInfoProps {
  submission: AnonymousSubmissionType;
  assignment: AssignmentType;

  graders: string[];
  updateGrader: any;
  isCourseAdmin: any;

  commentRubricComments: ICommentToRubricCommentMap;
  rubricCategories: RubricCategoryType[];

  calculateGradeFromComments: any;
}

const SubmissionInfo = (props: ISubmissionInfoProps) => {
  const {
    assignment,
    submission,
    graders,
    updateGrader,
    isCourseAdmin,
    commentRubricComments,
    rubricCategories,
  } = props;

  let studentTitle;
  let studentString;
  switch (typeof submission.students) {
    case 'undefined':
      studentTitle = 'Students';
      studentString = '<Anonymized>';
      break;
    default:
      studentTitle = pluralize('Student', submission.students.length).toUpperCase();
      studentString = `${submission.students.join(', ')}`;
      break;
  }

  const gradeString = submission.isFinalized
    ? `${submission.grade} / ${assignment.points}`
    : `${props.calculateGradeFromComments()} / ${assignment.points}`;

  let menuItems: any = [];
  if (!submission.grader) {
    menuItems = menuItems.concat([{ value: 'Unassigned', label: 'Unassigned' }]);
  } else {
    menuItems = menuItems.concat([{ value: 'Unassign', label: 'Unassign' }]);
  }
  menuItems = menuItems.concat(
    graders
      .map((g) => {
        return { value: g, label: g };
      })
      .sort((a: any, b: any) => {
        return a.value > b.value ? 1 : -1;
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

  const pointsPerCategory = {};
  for (const commentID in commentRubricComments) {
    // Don't count unsaved comments
    if (+commentID > 0 && commentRubricComments.hasOwnProperty(commentID)) {
      if (!pointsPerCategory[commentRubricComments[commentID].category]) {
        pointsPerCategory[commentRubricComments[commentID].category] = commentRubricComments[commentID].pointDelta;
      } else {
        pointsPerCategory[commentRubricComments[commentID].category] =
          pointsPerCategory[commentRubricComments[commentID].category] + commentRubricComments[commentID].pointDelta;
      }
    }
  }

  const messages: string[] = [];
  rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
    if (pointsPerCategory[rubricCategory.id]) {
      if (pointsPerCategory[rubricCategory.id] > rubricCategory.pointLimit!) {
        const diff = pointsPerCategory[rubricCategory.id] - rubricCategory.pointLimit!;
        messages.push(`${rubricCategory.name} exceeded by ${diff}`);
      }
    }
  });

  const caps = messages.map((message: string, index: number) => {
    return <div key={index}>{message}</div>;
  });

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
          <div>LAST EDITED</div>
          <div>{props.submission.dateEdited ? moment(props.submission.dateEdited).format('llll') : '--'}</div>
        </div>
        <Divider />
        <div className="submission-info__info">
          <div>GRADE</div>
          <div>{gradeString} </div>
          {messages.length > 0 ? <div>CATEGORIES</div> : <div />}
          <div>{caps}</div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionInfo;

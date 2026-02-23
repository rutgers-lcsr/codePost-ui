// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Link } from 'react-router-dom';

import { osControlKey } from './operatingSystem';

// ************************ Console Tooltips ************************
const CONSOLE_HEADER_DARKMODE = 'Switch to light mode';
const CONSOLE_HEADER_LIGHTMODE = 'Switch to dark mode';
const CONSOLE_FILEMENU_DEDUCTION = 'Points deducted in file';
const CONSOLE_FILEMENU_BONUS = 'Points added in file';
const CONSOLE_FILEMENU_COMMENTS = 'Comments in file';

// ************************ Student Tooltips ************************
const STUDENT_SUBHEADER_ASSIGNMENT = 'Assignment name';

// Grade Tooltips
const GRADE_HEADER_CURSORMODE = (
  <div>
    Toggle Cursor Mode
    <br />
    {`[${osControlKey()} shift y]`}
    <br />
    Shortcuts
    <br />
    {`[${osControlKey()} /]`}
  </div>
);
const GRADE_HEADER_DARKMODE = (
  <div>
    Toggle Dark Mode
    <br />
    {`[${osControlKey()} shift l]`}
  </div>
);
const GRADE_HEADER_ZOOMIN = (
  <div>
    Magnify code
    <br />
    {`[${osControlKey()} plus]`}
  </div>
);
const GRADE_HEADER_ZOOMOUT = (
  <div>
    Shrink code
    <br />
    {`[${osControlKey()} minus]`}
  </div>
);
const GRADE_HEADER_GROW = (
  <div>
    Expand code window
    <br />
    {`[${osControlKey()} →]`}
  </div>
);
const GRADE_HEADER_SHRINK = (
  <div>
    Shrink code window
    <br />
    {`[${osControlKey()} ←]`}
  </div>
);
const GRADE_HEADER_ALIGNMENT = (
  <div>
    reset comment alignments
    <br />
    {`[${osControlKey()} click highlights]`}
  </div>
);
const GRADE_RUBRIC_EDIT = <div>edit rubric [{osControlKey()} e]</div>;
const GRADE_RUBRIC_SAVE = <div>save rubric [{osControlKey()} s]</div>;
const GRADE_RUBRIC_CATEGORY_SEARCH = 'Search for specific rubric category names.';

const GRADE_HEADER_VIEW_AS_STUDENT = 'See what a student will see.';
const GRADE_HEADER_DOWNLOAD_CODE = 'Download the code for this submission.';
const GRADE_SUBINFO_ASSIGNGRADER = 'Click to assign a grader to this submission.';
const GRADE_SUBINFO_UNFINALIZETOASSIGN = 'Mark this submission as Done to edit its grader.';
const GRADE_COMMENT_POINTSDISABLED = `The points for a rubric comment are fixed by the rubric.\
        Create a normal comment to be able to change the points\
        (or, if you have admin privileges, edit the rubric).`;

// ************************ Settings tooltips ************************
const SETTINGS_TOKEN_COPY = 'Copy API token';
const SETTINGS_TOKEN_RESET = 'Reset token';

// ************************ Grader tooltips ************************
const GRADER_MYSUBMISSIONS_CLAIM = 'Get a submission from the queue';
const GRADER_MYSUBMISSIONS_FILTER = 'Select filters for future submissions claimed';
const GRADER_MYSUBMISSIONS_TITLE = 'All the submissions for this assignment for which you are the grader. ';
const GRADER_ALLSUBMISSIONS_FILTER = 'Filter submissions by grader';
const GRADER_ALLSUBMISSIONS_TITLE = (
  <div>
    All the submissions submitted for this assignment.
    <div style={{ height: 10 }} />
    Students who did not submit are not shown here. To see that data, please check the Admin panel.
  </div>
);

const GRADER_SECTION_TITLE =
  'All the students in your section(s) and their submissions. Students who did not submit will show up in the table.';

//  ************************ Admin tooltips ************************
const ADMIN_HEADER_SETTINGS = 'User Settings';

const ADMIN_STUDENTSUBMISSIONS_TITLE = 'Submissions submitted by each student in the course.';
const ADMIN_STUDENTSUBMISSIONS_INACTIVES = 'Students who have been un enrolled from the course.';
const ADMIN_STUDENTSUBMISSIONS_EXPAND = "View this student's submissions";
const ADMIN_STUDENTSUBMISSIONS_VIEWED = "Information about student's interaction with his/her published feedback.";
const ADMIN_STUDENTSUBMISSIONS_ASSIGNGRADER = 'Assign a grader to this submission';
const ADMIN_STUDENTSUBMISSIONS_LOCKASSIGNGRADER = 'Finish assigning';

const ADMIN_GRADERSUBMISSIONS_TITLE = 'Submissions graded by each grader in the course.';
const ADMIN_GRADERSUBMISSIONS_INACTIVES = 'Graders who have been un enrolled from the course.';
const ADMIN_GRADERSUBMISSIONS_EXPAND = 'View submissions graded by this grader';
const ADMIN_GRADERSUBMISSIONS_EXPANDASSIGNMENT = 'View graded submissions for this assignment';

const ADMIN_ASSIGNMENTS_PUBLISHED = (
  <div>
    If published (and visible), students with finalized submissions can view their submission and feedback.
    <div style={{ height: 10 }} />
    If not published, no student will be able to view their submissions.
  </div>
);
const ADMIN_ASSIGNMENTS_SUBMISSIONS = 'All submissions for this assignment.';
const ADMIN_ASSIGNMENTS_FINALIZED = 'Submissions marked as Finalized.';
const ADMIN_ASSIGNMENTS_CLAIMED = 'Submissions claimed by a grader.';
const ADMIN_ASSIGNMENTS_INPROGRESS = 'Submissions claimed by a grader but not yet finalized.';
const ADMIN_ASSIGNMENTS_MISSING = 'Students missing a submission.';
const ADMIN_ASSIGNMENTS_VIEWED = 'Students who have viewed their feedback.';
const ADMIN_ASSIGNMENTS_UNVIEWED = 'Students who have not viewed their feedback.';
const ADMIN_ASSIGNMENTS_UPLOADSUBMISSION =
  'Select multiple students, so long as none of them have a pre-existing submission for the assignment you selected.';
const ADMIN_ASSIGNMENTS_UPLOADSUBMISSIONFILETYPES = (
  <div>
    Not able to upload a file type that you think codePost should support?{' '}
    <a href="mailto:codepost@cs.rutgers.edu?subject=File Support Request">Let us know</a> and we'll add it.
  </div>
);

const ADMIN_RUBRIC_DELETECOMMENT = 'Delete this comment';
const ADMIN_RUBRIC_CATEGORYPOINTLIMIT = (
  <div>
    The maximum number of points that can be deducted or added from a category.
    <div style={{ height: 10 }} />
    For example, if the limit of a category is -4, no student can lose more than 4 points from the category, even if
    more deductions are applied.
    <div style={{ height: 10 }} />
    If left blank, no limit will be applied.
  </div>
);
const ADMIN_RUBRIC_CATEGORYHELPTEXT = (
  <div>
    Use this text to explain a rubric category to graders.
    <div style={{ height: 10 }} />
    It will appear alongside the rubric category in the Code Console.
  </div>
);
const ADMIN_RUBRIC_EXPLANATIONS = (
  <div>
    An optional textarea that allows you to explain a rubric comment to students. If defined, students will see a rubric
    comment's explanation instead of its text. Graders will always see the rubric comment's text.
  </div>
);
const ADMIN_RUBRIC_DEDUCTION = 'The deduction (or addition) associated with this comment';
const ADMIN_RUBRIC_INSTANCES = 'The comments that apply this rubric comment';
const ADMIN_RUBRIC_CATEGORYUP = 'Move this category up';
const ADMIN_RUBRIC_CATEGORYDOWN = 'Move this category down';
const ADMIN_RUBRIC_TITLE = (
  <div>
    Each assignment has a rubric associated with it.
    <div style={{ height: 10 }} />
    In the Code Console, you'll be able to reference and add rubric items to each submission.
  </div>
);
const ADMIN_STUDENTROSTER_TITLE = 'Students currently enrolled in this course';
const ADMIN_STUDENTROSTER_EDITSECTION = 'Edit section';
const ADMIN_STUDENTROSTER_LOCKSECTION = 'Finish editing';
const ADMIN_GRADERROSTER_TITLE = 'Graders currently enrolled in this course';
const ADMIN_GRADERROSTER_SUPERGRADER = (
  <div>
    Supergraders have elevated privileges. Read more about them in <a href="/docs/faq#supergrader">our docs</a>.
  </div>
);
const ADMIN_ADMINROSTER_TITLE = 'Admins who are enrolled in this course';
const ADMIN_ADMINROSTER_REMOVESELF = 'You cannot remove yourself as an admin';
const ADMIN_SECTIONROSTER_TITLE =
  'Sections (or Precepts) are groupings of students. Each student can only belong to one section.';
const ADMIN_DOWNLOADROSTER_CHOOSEGROUP = 'You must select at least one group to include.';
const ADMIN_UPLOADROSTER_ERROR = 'Fix all errors before proceeding';

const ADMIN_NEWCOURSE_CLONE = `Cloning a course will copy all assignments (including rubrics) and course settings
from the old course into your new course. All other information (including rosters) won't be copied.`;

// ************************ Pre auth tooltips ************************
const PREAUTH_CREATE_PROPRICING = (
  <span>
    To sign up for an Enterprise plan, please contact us at{' '}
    <a href="mailto:codepost@cs.rutgers.edu">codepost@cs.rutgers.edu</a>. To learn more, check out our{' '}
    <Link to="/pricing" target="_blank">
      Pricing.
    </Link>
  </span>
);
const PREAUTH_NOMATCH_LIKE = 'Like';
const PREAUTH_NOMATCH_DISLIKE = 'Dislike';

// ************************ Export ************************
export const tooltips = {
  console: {
    header: {
      darkmode: CONSOLE_HEADER_DARKMODE,
      lightmode: CONSOLE_HEADER_LIGHTMODE,
    },
    fileMenu: {
      deductions: CONSOLE_FILEMENU_DEDUCTION,
      bonuses: CONSOLE_FILEMENU_BONUS,
      comments: CONSOLE_FILEMENU_COMMENTS,
    },
  },
  student: {
    subheader: {
      assignment: STUDENT_SUBHEADER_ASSIGNMENT,
    },
  },
  grade: {
    header: {
      darkMode: GRADE_HEADER_DARKMODE,
      cursorMode: GRADE_HEADER_CURSORMODE,
      zoomIn: GRADE_HEADER_ZOOMIN,
      zoomOut: GRADE_HEADER_ZOOMOUT,
      grow: GRADE_HEADER_GROW,
      shrink: GRADE_HEADER_SHRINK,
      alignment: GRADE_HEADER_ALIGNMENT,
      viewAsStudent: GRADE_HEADER_VIEW_AS_STUDENT,
      downloadCode: GRADE_HEADER_DOWNLOAD_CODE,
    },
    subInfo: {
      assignGrader: GRADE_SUBINFO_ASSIGNGRADER,
      unfinalizeToAssign: GRADE_SUBINFO_UNFINALIZETOASSIGN,
    },
    comments: {
      pointsDisabled: GRADE_COMMENT_POINTSDISABLED,
    },
    rubric: {
      edit: GRADE_RUBRIC_EDIT,
      save: GRADE_RUBRIC_SAVE,
      categorySearch: GRADE_RUBRIC_CATEGORY_SEARCH,
    },
  },
  settings: {
    token: {
      copy: SETTINGS_TOKEN_COPY,
      reset: SETTINGS_TOKEN_RESET,
    },
  },
  grader: {
    mySubmissions: {
      title: GRADER_MYSUBMISSIONS_TITLE,
      claim: GRADER_MYSUBMISSIONS_CLAIM,
      filter: GRADER_MYSUBMISSIONS_FILTER,
    },
    allSubmissions: {
      title: GRADER_ALLSUBMISSIONS_TITLE,
      filter: GRADER_ALLSUBMISSIONS_FILTER,
    },
    section: {
      title: GRADER_SECTION_TITLE,
    },
  },
  management: {
    header: {
      settings: ADMIN_HEADER_SETTINGS,
    },
  },
  admin: {
    studentSubmissions: {
      title: ADMIN_STUDENTSUBMISSIONS_TITLE,
      inactives: ADMIN_STUDENTSUBMISSIONS_INACTIVES,
      expand: ADMIN_STUDENTSUBMISSIONS_EXPAND,
      viewed: ADMIN_STUDENTSUBMISSIONS_VIEWED,
      assignGrader: ADMIN_STUDENTSUBMISSIONS_ASSIGNGRADER,
      lockAssignGrader: ADMIN_STUDENTSUBMISSIONS_LOCKASSIGNGRADER,
    },
    graderSubmissions: {
      title: ADMIN_GRADERSUBMISSIONS_TITLE,
      inactives: ADMIN_GRADERSUBMISSIONS_INACTIVES,
      expand: ADMIN_GRADERSUBMISSIONS_EXPAND,
      expandAssignment: ADMIN_GRADERSUBMISSIONS_EXPANDASSIGNMENT,
    },
    assignments: {
      published: ADMIN_ASSIGNMENTS_PUBLISHED,
      submissions: ADMIN_ASSIGNMENTS_SUBMISSIONS,
      finalized: ADMIN_ASSIGNMENTS_FINALIZED,
      inProgress: ADMIN_ASSIGNMENTS_INPROGRESS,
      unclaimed: ADMIN_ASSIGNMENTS_CLAIMED,
      missing: ADMIN_ASSIGNMENTS_MISSING,
      viewed: ADMIN_ASSIGNMENTS_VIEWED,
      unviewed: ADMIN_ASSIGNMENTS_UNVIEWED,
      uploadSubmission: ADMIN_ASSIGNMENTS_UPLOADSUBMISSION,
      uploadSubmissionFileTypes: ADMIN_ASSIGNMENTS_UPLOADSUBMISSIONFILETYPES,
    },
    rubric: {
      deleteComment: ADMIN_RUBRIC_DELETECOMMENT,
      deduction: ADMIN_RUBRIC_DEDUCTION,
      instances: ADMIN_RUBRIC_INSTANCES,
      categoryUp: ADMIN_RUBRIC_CATEGORYUP,
      categoryDown: ADMIN_RUBRIC_CATEGORYDOWN,
      categoryPointLimit: ADMIN_RUBRIC_CATEGORYPOINTLIMIT,
      explanations: ADMIN_RUBRIC_EXPLANATIONS,
      title: ADMIN_RUBRIC_TITLE,
      categoryHelpText: ADMIN_RUBRIC_CATEGORYHELPTEXT,
    },
    studentRoster: {
      title: ADMIN_STUDENTROSTER_TITLE,
      editSection: ADMIN_STUDENTROSTER_EDITSECTION,
      lockSection: ADMIN_STUDENTROSTER_LOCKSECTION,
    },
    graderRoster: {
      title: ADMIN_GRADERROSTER_TITLE,
      supergrader: ADMIN_GRADERROSTER_SUPERGRADER,
    },
    adminRoster: {
      title: ADMIN_ADMINROSTER_TITLE,
      removeSelf: ADMIN_ADMINROSTER_REMOVESELF,
    },
    sectionRoster: {
      title: ADMIN_SECTIONROSTER_TITLE,
    },
    uploadRoster: {
      error: ADMIN_UPLOADROSTER_ERROR,
    },
    downloadRoster: {
      chooseGroup: ADMIN_DOWNLOADROSTER_CHOOSEGROUP,
    },
    newCourse: {
      clone: ADMIN_NEWCOURSE_CLONE,
    },
  },
  preauth: {
    create: {
      proPricing: PREAUTH_CREATE_PROPRICING,
    },
    noMatch: {
      like: PREAUTH_NOMATCH_LIKE,
      dislike: PREAUTH_NOMATCH_DISLIKE,
    },
  },
};

export const ShowTooltipContext = React.createContext(true);

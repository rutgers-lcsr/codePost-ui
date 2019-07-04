import * as React from 'react';
import { Link } from 'react-router-dom';

// ************************ Console Tooltips ************************
const CONSOLE_HEADER_DARKMODE = 'Switch to light mode';
const CONSOLE_HEADER_LIGHTMODE = 'Switch to dark mode';
const CONSOLE_FILEMENU_DEDUCTION = 'Points deducted in file';
const CONSOLE_FILEMENU_ADDITION = 'Points added in file';
const CONSOLE_FILEMENU_COMMENTS = 'Comments in file';

// ************************ Student Tooltips ************************
const STUDENT_SUBHEADER_ASSIGNMENT = 'Assignment name';

// Grade Tooltips
const GRADE_CODEBOX_ZOOMIN = 'Zoom in';
const GRADE_CODEBOX_ZOOMOUT = 'Zoom out';
const GRADE_CODEBOX_GROW = 'Increase width';
const GRADE_CODEBOX_SHRINK = 'Decrease width';
const GRADE_CODEBOX_ALIGNMENT = (
  <div>
    reset comment alignments
    <br />
    [⌘+click highlights]
  </div>
);
const GRADE_SUBHEADER_ASSIGNGRADER = 'Assign a grader to this submission.';

// ************************ Settings tooltips ************************
const SETTINGS_TOKEN_COPY = 'Copy API token';
const SETTINGS_TOKEN_RESET = 'Reset token';

// ************************ Grader tooltips ************************
const GRADER_MYSUBMISSIONS_CLAIM = 'Get a submission from the queue';
const GRADER_MYSUBMISSIONS_FILTER = 'Select filters for future submissions claimed';
const GRADER_MYSUBMISSIONS_TITLE = 'All the submissions for this assignment for which you are the grader. ';
const GRADER_ALLSUBMISSIONS_FILTER = 'Filter submissions by grader';
const GRADER_ALLSUBMISSIONS_TITLE =
  'All the submissions submitted for this assignment.\
   Students who did not submit are not shown here. To see that data, please check the Admin panel.';
const GRADER_SECTION_TITLE =
  'All the students in your section(s) and their submissions. Students who did not submit will show up in the table.';

//  ************************ Admin tooltips ************************
const ADMIN_HEADER_SETTINGS = 'User Settings';

const ADMIN_STUDENTSUBMISSIONS_TITLE = 'Submissions submitted by each student in the course.';
const ADMIN_STUDENTSUBMISSIONS_INACTIVES = 'Students who have been un enrolled from the course.';
const ADMIN_STUDENTSUBMISSIONS_VIEWED = "Information about student's interaction with his/her published feedback.";
const ADMIN_GRADERSUBMISSIONS_TITLE = 'Submissions graded by each grader in the course.';
const ADMIN_GRADERSUBMISSIONS_INACTIVES = 'Graders who have been un enrolled from the course.';

const ADMIN_ASSIGNMENTS_PUBLISHED =
  'Publishing an assignment allows students who have finalized submissions to view those submissions.\
   If an assignment is unpublished no student will be able to view their submissions.';
const ADMIN_ASSIGNMENTS_SUBMISSIONS = 'All submissions for this assignment';
const ADMIN_ASSIGNMENTS_FINALIZED = 'The submissions that have been marked as Finalized';
const ADMIN_ASSIGNMENTS_CLAIMED = 'The submissions that have been claimed by a grader.';
const ADMIN_ASSIGNMENTS_MISSING = 'The students that have not submitted a submission. ';
const ADMIN_ASSIGNMENTS_UNVIEWED = 'The students that have not viewed their feedback. ';
const ADMIN_ASSIGNMENTS_UPLOADSUBMISSION =
  'Select multiple students, so long as none of them have a pre-existing submission for the assignment you selected.';

const ADMIN_RUBRIC_DELETECOMMENT = 'Delete this comment';
const ADMIN_RUBRIC_CATEGORYPOINTLIMIT =
  'The maximum amount of points a student can lose in this category.\
   For example, if the limit is set at 4 points, no student will lose more than 4 points in this category,\
    even if more deductions are applied. If set to 0, no limit will be set.';
const ADMIN_RUBRIC_CATEGORYHELPTEXT =
  'Use this text to explain the rubric category to graders.\
   It will appear alongside the rubric category in the Code Review console.';
const ADMIN_RUBRIC_DEDUCTION =
  'The deduction associated with this comment.\
 Reminder: Deductions are negative by default! So a deduction of 1 => -1 points.';
const ADMIN_RUBRIC_INSTANCES = 'The places where this rubric comment is used.';
const ADMIN_RUBRIC_CATEGORYUP = 'Move this category up';
const ADMIN_RUBRIC_CATEGORYDOWN = 'Move this category down';
const ADMIN_RUBRIC_TITLE =
  "Each assignment has a rubric associated with it.\
   In the grade console, you'll be able to reference and add rubric items to each submission.";

const ADMIN_STUDENTROSTER_TITLE = 'Students currently enrolled in this course.';
const ADMIN_STUDENTROSTER_EDITSECTION = 'Edit section';
const ADMIN_STUDENTROSTER_LOCKSECTION = 'Finish editing';
const ADMIN_GRADERROSTER_TITLE = 'Users who have grader privileges in this course.';
const ADMIN_GRADERROSTER_SUPERGRADER = (
  <div>
    Supergraders have elevated privileges. Read more about them in{' '}
    <a href="https://help.codepost.io/docs/who-can-view-a-submission">our docs</a>.
  </div>
);
const ADMIN_ADMINROSTER_TITLE = 'Users who have admin privileges of this course. ';
const ADMIN_ADMINROSTER_REMOVESELF = 'You cannot remove yourself as an admin.';
const ADMIN_SECTIONROSTER_TITLE =
  'Sections (or Precepts) are groupings of students. Each student can only belong to one section.';
const ADMIN_DOWNLOADROSTER_CHOOSEGROUP = 'You must select at least one group to include.';
const ADMIN_UPLOADROSTER_ERROR = 'You must fix all errors before proceeding.';

const ADMIN_NEWCOURSE_CLONE =
  "Cloning a course will copy all assignments (including rubrics) and course settings\
   from the old course into your new course. All other information (including rosters) won't be copied.";

// ************************ Pre auth tooltips ************************
const PREAUTH_CREATE_PROPRICING = (
  <span>
    To sign up for Pro, please contact us at <a href="mailto:team@codepost.io">team@codepost.io</a>. To learn more about
    Pro, check out our{' '}
    <Link to="/pricing" target="_blank">
      Pricing
    </Link>{' '}
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
      additions: CONSOLE_FILEMENU_ADDITION,
      comments: CONSOLE_FILEMENU_COMMENTS,
    },
  },
  student: {
    subheader: {
      assignment: STUDENT_SUBHEADER_ASSIGNMENT,
    },
  },
  grade: {
    codePanel: {
      zoomIn: GRADE_CODEBOX_ZOOMIN,
      zoomOut: GRADE_CODEBOX_ZOOMOUT,
      grow: GRADE_CODEBOX_GROW,
      shrink: GRADE_CODEBOX_SHRINK,
      alignment: GRADE_CODEBOX_ALIGNMENT,
    },
    subheader: {
      assignGrader: GRADE_SUBHEADER_ASSIGNGRADER,
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
      viewed: ADMIN_STUDENTSUBMISSIONS_VIEWED,
    },
    graderSubmissions: {
      title: ADMIN_GRADERSUBMISSIONS_TITLE,
      inactives: ADMIN_GRADERSUBMISSIONS_INACTIVES,
    },
    assignments: {
      published: ADMIN_ASSIGNMENTS_PUBLISHED,
      submissions: ADMIN_ASSIGNMENTS_SUBMISSIONS,
      finalized: ADMIN_ASSIGNMENTS_FINALIZED,
      unclaimed: ADMIN_ASSIGNMENTS_CLAIMED,
      missing: ADMIN_ASSIGNMENTS_MISSING,
      unviewed: ADMIN_ASSIGNMENTS_UNVIEWED,
      uploadSubmission: ADMIN_ASSIGNMENTS_UPLOADSUBMISSION,
    },
    rubric: {
      deleteComment: ADMIN_RUBRIC_DELETECOMMENT,
      deduction: ADMIN_RUBRIC_DEDUCTION,
      instances: ADMIN_RUBRIC_INSTANCES,
      categoryUp: ADMIN_RUBRIC_CATEGORYUP,
      categoryDown: ADMIN_RUBRIC_CATEGORYDOWN,
      categoryPointLimit: ADMIN_RUBRIC_CATEGORYPOINTLIMIT,
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

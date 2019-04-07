/* Import codePost API wrappers */
import { Course, CourseType } from '../../infrastructure/course';
import { Section } from '../../infrastructure/section';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { RubricCategory } from '../../infrastructure/rubricCategory';
import { RubricComment } from '../../infrastructure/rubricComment';

import { CommentIO } from '../../infrastructure/comment';
import { File } from '../../infrastructure/file';
import { Submission } from '../../infrastructure/submission';

/* Import demo course data */
import { demoAssignments, demoCourse, demoRoster, demoSections, demoSubmissions } from './demo-data';

const createDemoCourse = (username: string, org: string) => {
  const payload = demoCourse(username);
  return Course.create(payload).then((course) => {
    // Create assignments
    const preAssignments = demoAssignments(course.id);
    const makeAssignmnets = preAssignments.map((assignment) => {
      return createAssignment(course, assignment);
    });

    return Promise.all(makeAssignmnets).then((assignments: AssignmentType[]) => {
      // Set roster
      const roster = demoRoster(org, course.id);
      return Course.updateRoster(roster, {}).then((rosterObj) => {
        // Make sections
        const sections = demoSections(org, roster.id);
        const makeSections = sections.map((section) => {
          return Section.create(section);
        });
        return Promise.all(makeSections).then(() => {
          // Make submissions
          const makeSubmissions = assignments.map((assignment) => {
            return createSubmissions(assignment, org);
          });

          return Promise.all(makeSubmissions).then(() => {
            return course;
          });
        });
      });
    });
  });
};

const createAssignment = (course: CourseType, assignment: any) => {
  const assnPayload = {
    id: -1, // codePost convention
    name: assignment.name,
    points: assignment.points,
    course: course.id,
    isReleased: false,
    rubricCategories: [], // ignored by API
    sortKey: assignment.sortKey,
    hideGrades: false,
  };

  return Assignment.create(assnPayload).then((assnObj: AssignmentType) => {
    // Update course object with assignment ids. This step is necessary to allow
    // the Admin component to load these assignments when the active course is switched
    // to the newly created demo course in changeLoadedCourse.
    course.assignments.push(assnObj.id);

    // Create rubric
    const makeCategories = assignment.rubric.map((category: any) => {
      const catPayload = {
        id: -1, // codePost convention
        name: category.category,
        rubricComments: [], // ignored by API
        assignment: assnObj.id,
        pointLimit: category.cap,
      };

      return RubricCategory.create(catPayload).then((catObj) => {
        const makeComments = category.comments.map((comment: any) => {
          const comPayload = {
            id: -1, // codePost convention
            text: comment.text,
            pointDelta: comment.points,
            category: catObj.id,
            comments: [], // ignored by API
          };

          return RubricComment.create(comPayload);
        });

        return Promise.all(makeComments);
      });
    });

    return Promise.all(makeCategories).then(() => {
      return assnObj;
    });
  });
};

// Need to figure out how to handle the following:

const createSubmissions = (assignment: AssignmentType, domain: string) => {
  const subTemplates = demoSubmissions(assignment.name, domain);
  return Assignment.readRubric(assignment.id, {}).then((rubric) => {
    const rubricComments = rubric.rubricComments;
    const makeSubs = subTemplates.map((subT) => {
      const payload = {
        id: -1, // codePost convention
        assignment: assignment.id,
        students: subT.students,
        isFinalized: subT.isFinalized,
        files: [], // ignored by API
        dateEdited: '', // ignored by API
        grade: 0, // ignored by API
        grader: subT.grader,
      };

      return Submission.create(payload).then((submission) => {
        // Make files
        const makeFiles = subT.files.map((fileT) => {
          const filePayload = {
            id: -1, // codePost convention
            code: fileT.code,
            comments: [], // ignored by API
            extension: fileT.ext,
            name: fileT.name,
            submission: submission.id,
          };

          return File.create(filePayload).then((fileObj) => {
            // Make comments
            const makeComments = fileT.comments.map((commentT) => {
              let rubricID = null;
              if (commentT.rubric !== null) {
                const rubricMatch = rubricComments.find((el) => {
                  return el.text === commentT.rubric;
                });
                if (typeof rubricMatch !== 'undefined') {
                  rubricID = rubricMatch.id;
                }
              }

              const commentPayload = {
                id: -1, // codePost convention
                startChar: commentT.startChar,
                endChar: commentT.endChar,
                startLine: commentT.startLine,
                endLine: commentT.endLine,
                pointDelta: commentT.pointDelta,
                text: commentT.text,
                file: fileObj.id,
                rubricComment: rubricID,
                author: commentT.author,
              };

              return CommentIO.create(commentPayload);
            });

            return Promise.all(makeComments);
          });
        });

        return Promise.all(makeFiles);
      });
    });
    return Promise.all(makeSubs);
  });
};

export { createDemoCourse };

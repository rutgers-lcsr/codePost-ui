/* Import codePost API wrappers */
import { Course, CourseType } from '../../infrastructure/course';
import { Section } from '../../infrastructure/section';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { RubricCategory } from '../../infrastructure/rubricCategory';
import { RubricComment } from '../../infrastructure/rubricComment';

import { CommentIO } from '../../infrastructure/comment';
import { File } from '../../infrastructure/file';
import { Submission } from '../../infrastructure/submission';

import { Environment } from '../../infrastructure/autograder/environment';
import { SubmissionTest } from '../../infrastructure/submissionTest';
import { TestCase } from '../../infrastructure/testCase';
import { TestCategory, TestCategoryType } from '../../infrastructure/testCategory';

import { fetchTestData } from '../core/testFetchUtils';

/* Import demo course data */
import { demoAssignments, demoCourse, demoRoster, demoSections, demoSubmissions } from './demo-data';
import { getDemoSubmissionTests } from './demo-submission-tests';

const createDemoCourse = async (email: string, username: string, org: string) => {
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
      // Add self to graders
      roster.graders = [...roster.graders, email];
      return Course.updateRoster(roster, {}).then((_rosterObj) => {
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

          return Promise.all(makeSubmissions).then((subs) => {
            // Generate SubmissionTests from cached JSON
            const subTestPromises = assignments.map(async (assignment) => {
              const [categories, casesByCategory] = await fetchTestData(assignment);
              const testCategories = categories as TestCategoryType[]; // not clear why this is necessary
              const testCases = Object.values(casesByCategory).flat();
              const thisSubmissions = await Assignment.readSubmissions(assignment.id);

              const demoSubmissionTests = getDemoSubmissionTests(org);
              return demoSubmissionTests.map((subEl) => {
                const subMatch = thisSubmissions.find((sub) => sub.students.indexOf(subEl.students[0]) > -1);
                return subEl.tests.map((subTestEl) => {
                  // Match submissionTest to newly created testCase object
                  const testCaseMatch = testCases.find((tc) => tc.description === subTestEl.testCase);
                  const testCategoryMatch = testCategories.find((cat) => cat.name === subTestEl.testCategory);

                  if (subMatch && testCaseMatch && testCategoryMatch) {
                    const payload = {
                      passed: subTestEl.passed,
                      logs: subTestEl.logs.length > 0 ? subTestEl.logs : '-',
                      submission: subMatch.id,
                      testCase: testCaseMatch.id,
                      id: -1,
                      testCategory: -1,
                      created: '',
                      modified: '',
                      isError: false,
                    };
                    return SubmissionTest.create(payload);
                  } else {
                    return null;
                  }
                });
              });
            });

            return Promise.all(subTestPromises).then(() => {
              const lastPromises = subs
                .flat()
                .flat()
                .flat()
                .map((lastSubEl) => Submission.update({ ...lastSubEl, isFinalized: true }));
              return Promise.all(lastPromises).then(() => {
                return course;
              });
            });
          });
        });
      });
    });
  });
};

const createAssignment = async (course: CourseType, assignment: any) => {
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

  return Assignment.create(assnPayload).then(async (assnObj: AssignmentType) => {
    // Update course object with assignment ids. This step is necessary to allow
    // the Admin component to load these assignments when the active course is switched
    // to the newly created demo course in changeLoadedCourse.
    course.assignments.push(assnObj.id);

    // Create environment for testing
    const payload = {
      id: -1,
      language: 'java',
      dockerRunInstructions: [],
      assignment: assnObj.id,
      dumpMode: false,
      testParsing: true,
      compileText: '',
      buildType: 'default',
      allowNetworkAccess: false,
      maxStudentTestRuns: null,
      exposeDumpLogs: false,
      maxExposedFailedTests: null,
    };
    const thisEnvironment = await Environment.create(payload);

    await Environment.build(thisEnvironment);

    // Create rubric
    const makeCategories = assignment.rubric.map((category: any) => {
      const catPayload = {
        id: -1, // codePost convention
        name: category.category,
        rubricComments: [], // ignored by API
        assignment: assnObj.id,
        pointLimit: category.cap,
        sortKey: 0,
        helpText: '',
        atMostOnce: false,
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

    // Create tests
    const makeTestCategories = assignment.tests.map((category: any) => {
      const catPayload = {
        id: -1,
        assignment: assnObj.id,
        name: category.category,
      };

      return TestCategory.create(catPayload).then((catObj) => {
        category.cases.map((testCase: any) => {
          const casePayload = { id: -1, testCategory: catObj.id, ...testCase };
          return TestCase.create(casePayload);
        });
      });
    });

    return Promise.all([...makeCategories, ...makeTestCategories]).then(() => {
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
        isFinalized: false,
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
            path: null,
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
                feedback: 0,
                color: null,
              };

              return CommentIO.create(commentPayload).then(() => {
                return submission;
              });
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

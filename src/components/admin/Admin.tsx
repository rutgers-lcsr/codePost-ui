/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState, useEffect, useRef } from 'react';

import { SettingOutlined } from '@ant-design/icons';

/* ant imports */
import { Button, Empty } from 'antd';

/* other library imports */
import _ from 'lodash';
import queryString from 'query-string';

import { Link, useNavigate, useLocation } from 'react-router-dom';

/* codePost imports */
import AdminNav from './other/AdminNav';
import CPLayoutAdmin from './other/CPLayoutAdmin';

import AdminRoutes from './AdminRoutes';

import CourseMenu from '../core/CourseMenu';
import Referral from '../core/Referral';
import RoleMenu from '../core/RoleMenu';
import NewCourseDialog from './other/NewCourseDialog';

/* types */
import {
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  IStudentSubmissionsDataTable,
  USER_APP,
  USER_TYPE,
} from '../../types/common';

/* API library */
import { Assignment, AssignmentPatchType, AssignmentType } from '../../infrastructure/assignment';
import { Course, CoursePatchType, CourseType, RosterType } from '../../infrastructure/course';
import { FileType, SubmissionFile } from '../../infrastructure/file';
import { Section, SectionType } from '../../infrastructure/section';
import { Submission, SubmissionInfoType } from '../../infrastructure/submission';
import { SubmissionHistoryType } from '../../infrastructure/submissionHistory';
import { addToPayload } from '../../infrastructure/utils';

import { AdminOnboardingSelector } from '../core/OnboardingSelector';

import { ADMIN_TOUR_ID } from '../../routes';

import { IComponentProps } from '../core/ComponentManager';

import CPFlex from '../core/CPFlex';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

import { AssignmentSetupBanner } from './assignments/assignments/AssignmentSetupDialog';

import { CIPAdminModal } from '../cip/components';



/**********************************************************************************************************************/

const formatCourseURL = (course: CourseType) => {
  return `/admin/${encodeURIComponent(course.name)}/${encodeURIComponent(course.period)}`;
};

const Admin: React.FC<IComponentProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  /**** UI control data ****/
  const [onboardingModalVisible, setOnboardingModalVisible] = useState(false);
  const [cipModalVisible, setCipModalVisible] = useState(false);

  /**** Top-level course data ****/
  const [courses, setCourses] = useState<CourseType[]>([]);

  /**** Roster data ****/
  const [rosterLoadComplete, setRosterLoadComplete] = useState(false);
  const [students, setStudents] = useState<string[]>([]);
  const [inactiveStudents, setInactiveStudents] = useState<string[]>([]);
  const [graders, setGraders] = useState<string[]>([]);
  const [inactiveGraders, setInactiveGraders] = useState<string[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [superGraders, setSuperGraders] = useState<string[]>([]);
  const [notActivated, setNotActivated] = useState<string[]>([]);

  /**** Sections data ****/
  const [sectionsLoadComplete, setSectionsLoadComplete] = useState(false);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [sectionsByStudent, setSectionsByStudent] = useState<{ [studentEmail: string]: SectionType }>({});

  /**** Assignments data ****/
  const [assignmentsLoadComplete, setAssignmentsLoadComplete] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);

  /*** Submissions data ****/
  const [partialSubmissionsLoadComplete, setPartialSubmissionsLoadComplete] = useState(false);
  const [fullSubmissionsLoadComplete, setFullSubmissionsLoadComplete] = useState(false);
  const [submissionsByUserLoadComplete, setSubmissionsByUserLoadComplete] = useState(false);
  const [submissions, setSubmissions] = useState<IAssignmentToSubmissionsMap>({});
  const [submissionsByStudent, setSubmissionsByStudent] = useState<IStudentSubmissionsDataTable>({});
  const [submissionsByGrader, setSubmissionsByGrader] = useState<IGraderSubmissionsDataTable>({});
  const [viewsBySubmission, setViewsBySubmission] = useState<{ [submissionID: number]: { [student: string]: string } }>({});

  // Refs for async data access
  const rosterRef = useRef<RosterType | undefined>(undefined);
  const assignmentsRef = useRef<AssignmentType[]>([]);

  // Initialize state based on props (mimicking constructor)
  useEffect(() => {
    // Load data into CommandBar context
    window.CommandBar.addContext({ currentCourse: props.currentCourse, courses: props.initialCourses });

    const showCIPModal = !props.user.hasCredentials;
    const showOnboarding =
      Object.prototype.hasOwnProperty.call(queryString.parse(location.search), 'onboarding') ||
      props.initialCourses.length === 0;

    setOnboardingModalVisible(showOnboarding && !showCIPModal);
    setCipModalVisible(showCIPModal);
    setCourses(_.cloneDeep(props.initialCourses));
  }, []); // Run once on mount

  // Document Title
  useEffect(() => {
    document.title = 'codePost - Admin Console';
    const routerFunc = (newUrl: string) => navigate(newUrl);
    window.CommandBar.addRouter(routerFunc);
  }, [navigate]);

  // Load Course Data when currentCourse changes
  useEffect(() => {
    if (props.currentCourse) {
      loadAllCourseData(props.currentCourse);
    }
  }, [props.currentCourse?.id]);

  // Update CommandBar when students change
  useEffect(() => {
    if (students) {
      window.CommandBar.addContext({
        course: props.currentCourse,
        students: students,
      });
    }
  }, [students, props.currentCourse]);

  /***********************************************************************************
  /* Helper Functions (Business Logic)
  /**********************************************************************************/

  /* GENERATORS (Pure functions mostly) */

  const generateSectionsByStudent = (sectionsToProcess: SectionType[]) => {
    const newSectionsByStudent: { [studentEmail: string]: SectionType } = {};
    sectionsToProcess.forEach((section) => {
      section.students.forEach((student) => {
        newSectionsByStudent[student] = section;
      });
    });
    return newSectionsByStudent;
  };

  const generateSubmissionsByUser = (
    rosterToUse: {
      students: string[];
      graders: string[];
      inactive_students: string[];
      inactive_graders: string[];
    },
    submissionsToUse: IAssignmentToSubmissionsMap,
    assignmentsToUse: AssignmentType[],
  ) => {
    const subsByStudent: IStudentSubmissionsDataTable = {};
    const subsByGrader: IGraderSubmissionsDataTable = {};

    const mixedStudentList = rosterToUse.students.concat(rosterToUse.inactive_students);
    mixedStudentList.forEach((student) => {
      subsByStudent[student] = {};
    });

    const mixedGraderList = rosterToUse.graders.concat(rosterToUse.inactive_graders);
    mixedGraderList.forEach((grader) => {
      subsByGrader[grader] = {};
      assignmentsToUse.forEach((assignment) => {
        subsByGrader[grader][assignment.id] = [];
      });
    });

    assignmentsToUse.forEach((assignment) => {
      const assignmentSubs = submissionsToUse[assignment.id];
      if (assignmentSubs) {
        assignmentSubs.forEach((submission: SubmissionInfoType) => {
          // NOTE: students in submission.students might be inactive
          submission.students.forEach((student: string) => {
            if (student in subsByStudent) {
              subsByStudent[student][assignment.id] = submission;
            }
          });

          // NOTE: graders in submission.students might be inactive
          if (submission.grader && submission.grader in subsByGrader) {
            subsByGrader[submission.grader][assignment.id].push(submission);
          }
        });
      }
    });

    return {
      subsByStudent,
      subsByGrader,
    };
  };

  /* DATA UPDATERS */

  // This function needs access to current state, so we wrap it or read state inside
  const updateSubmissionsByUser = (
    roster?: {
      students: string[];
      graders: string[];
      inactive_students: string[];
      inactive_graders: string[];
    },
    submissionsParam?: IAssignmentToSubmissionsMap,
    assignmentsParam?: AssignmentType[],
    callback?: () => void,
  ) => {
    // We use functional updates or read current state. To avoid stale closures, we might need to rely on the passed params
    // or assume we are calling this when state is stable.
    // However, since we are inside a functional component, capturing 'students' etc from closure might be stale if this is called async.
    // But usually in React we rely on the closure values at the time of render.
    // If this is called from an async .then(), 'students' will be the value from when the effect started.
    // To fix this proper, we should use refs or dependency chains, but for this refactor we will assume standard closure behavior
    // and try to pass explicit params where possible.

    // WARNING: In functional components, this state access pattern is tricky inside async callbacks.
    // We will trust the passed parameters primarily. If they are undefined, we fall back to state.
    // For state fallbacks to work in async, we'd theoretically need refs.
    // Given the complexity, let's try to pass arguments explicitly from the caller.

    const submissionsToUse = submissionsParam !== undefined ? submissionsParam : submissions;
    const assignmentsToUse = assignmentsParam !== undefined ? assignmentsParam : assignments;

    let rosterToUse;
    if (roster) {
      rosterToUse = roster;
    } else {
      rosterToUse = {
        students: students,
        graders: graders,
        inactive_graders: inactiveGraders,
        inactive_students: inactiveStudents,
      };
    }

    const subsByUser = generateSubmissionsByUser(rosterToUse, submissionsToUse, assignmentsToUse);

    setSubmissionsByStudent(subsByUser.subsByStudent);
    setSubmissionsByGrader(subsByUser.subsByGrader);
    setSubmissionsByUserLoadComplete(true);

    if (callback) callback();
  };

  /* LOADERS */

  const loadAssignmentsData = (course: CourseType) => {
    const getData = course.assignments.map((assignmentID) => {
      return Assignment.read(assignmentID);
    });
    return Promise.all(getData);
  };

  const loadSubmissionsData = (course: CourseType) => {
    setSubmissions({});
    setPartialSubmissionsLoadComplete(false);
    setFullSubmissionsLoadComplete(false);

    const promises = course.assignments.map((assignmentID) => {
      return Assignment.readPaginatedSubmissions(
        assignmentID,
        (submissionsPage) => onSubmissionsPagination(course, assignmentID, submissionsPage),
      );
    });
    Promise.all(promises).then(() => {
      setPartialSubmissionsLoadComplete(true);
      setFullSubmissionsLoadComplete(true);
    });
  };

  const loadRosterData = (course: CourseType) => {
    return Course.readRoster(course.id);
  };

  const loadSectionsData = (course: CourseType) => {
    Course.readPaginatedSections(course.id, (newSections) => onSectionPagination(course, newSections)).then(() => {
      setSectionsLoadComplete(true);
    });
  };

  const loadViewsBySubmissionData = (course: CourseType) => {
    course.assignments.forEach((assignmentID) => {
      Assignment.readPaginatedSubmissionHistories(assignmentID, (history) => onSubmissionHistoryPagination(course, history));
    });
  };

  const loadAllCourseData = (course: CourseType) => {
    // We start loading assignments
    loadAssignmentsData(course)
      .then((loadedAssignments) => {
        if (props.currentCourse?.id !== course.id) return;

        window.CommandBar.addContext({ assignments: loadedAssignments });
        setAssignments(loadedAssignments);
        assignmentsRef.current = loadedAssignments;
        setAssignmentsLoadComplete(true);

        // If we have other data ready, update mappings
        // Note: checking state here (partialSubmissionsLoadComplete) refers to closure state at start of loadAllCourseData.
        // This might be false initially.
        // We will trigger updates when those finish instead.

        // Trigger dependent loads
        loadSubmissionsData(course);
        loadViewsBySubmissionData(course);

        return loadedAssignments;
      })
      .then((loadedAssignments) => {
        // Then load roster
        loadRosterData(course).then((roster) => {
          if (props.currentCourse?.id !== course.id) return;

          window.CommandBar.addContext({ graders: roster.graders });

          setStudents(roster.students);
          setGraders(roster.graders);
          setAdmins(roster.courseAdmins);
          setSuperGraders(roster.superGraders);
          setInactiveStudents(roster.inactive_students);
          setInactiveGraders(roster.inactive_graders);
          setNotActivated(roster.not_activated);
          setRosterLoadComplete(true);
          rosterRef.current = roster;

          // We can try to update submissions by user if we have everything
          // Since loadedAssignments is passed through, we can use it.
          // Submissions might not be full yet (partial), but onSubmissionsPagination handles incremental updates.
          // However, we should do an initial generation if we have data.
          // But 'submissions' state is empty initially.
          // The pagination callbacks will handle the population.

          // If we already had data (refresh case), we might want to run update.
          updateSubmissionsByUser(roster, {}, loadedAssignments);
        })
          .catch((err) => {
            console.error('Failed to load roster:', err);
          });
      })
      .catch((err) => {
        console.error('Failed to load assignments or chain error:', err);
      });

    loadSectionsData(course);
  };


  /***********************************************************************************
  /* Pagination Callbacks
  /**********************************************************************************/

  const onSubmissionsPagination = (course: CourseType, assignment: number, submissionsPage: SubmissionInfoType[]) => {
    if (props.currentCourse?.id !== course.id) return;

    setSubmissions((prevSubmissions) => {
      const oldSubmissions = prevSubmissions[assignment] || [];
      const newAssignmentSubmissions = [...oldSubmissions, ...submissionsPage];
      const newSubmissionsMap = { ...prevSubmissions, [assignment]: newAssignmentSubmissions };

      // Update by-user mappings using functional update's latest state
      // We need access to latest roster and assignments here.
      // We can use a ref or rely on component re-render if this callback is recreated (it isn't currently).
      // Since `onSubmissionsPagination` is defined inside the component, it captures state.
      // BUT if it's passed to `Assignment.readPaginatedSubmissions` which is async, it captures the closure at call time.
      // This is the classic React stale closure problem.

      // FIX: Use functional updates for dependent states?
      // Or simply: `updateSubmissionsByUser` uses closure state.
      // If we use refs for roster/assignments, we can access them here.

      // Let's assume for this complex refactor that we might need to rely on the setters to trigger re-renders 
      // where we re-calculate derived data, but `updateSubmissionsByUser` is explicitly doing derived data calc.

      // For this step, I will construct usage of `updateSubmissionsByUser` carefully.
      // Since I can't easily get strict latest state inside this closure without refs,
      // I will assume `assignments` and `students` don't change rapidly during pagination loads.

      // Wait, `assignments` was loaded before submissions started loading. So `assignments` should be fresh enough.
      // `roster` might be loading in parallel.

      // We can check if `assignments` and `students` are populated.

      // To be safe, let's update `submissions` state, and then rely on an Effect to update `submissionsByStudent`?
      // No, `Admin.tsx` logic explicitly called `updateSubmissionsByUser`.

      // I'll leave the explicit call but aware it might use stale roster if roster load finishes after this starts.
      // But `loadAllCourseData` chains them: assignments -> then submissions starts. Roster is parallel.

      // Let's defer map updating to when we have data.
      setTimeout(() => {
        // Use refs to avoid stale closure issues
        const currentRoster = rosterRef.current;
        const currentAssignments = assignmentsRef.current;
        updateSubmissionsByUser(currentRoster, newSubmissionsMap, currentAssignments);
      }, 0);

      return newSubmissionsMap;
    });

    setPartialSubmissionsLoadComplete(true);
  };

  const onSubmissionHistoryPagination = (course: CourseType, viewHistoryList: SubmissionHistoryType[]) => {
    if (props.currentCourse?.id !== course.id) return;

    setViewsBySubmission((prev) => {
      const newViews = { ...prev };
      viewHistoryList.forEach((history) => {
        const { submission, student, hasViewed, dateViewed } = history;
        if (!(submission in newViews)) {
          newViews[submission] = {};
        }
        if (hasViewed && dateViewed) {
          newViews[submission][student] = dateViewed;
        }
      });
      return newViews;
    });
  };

  const onSectionPagination = (course: CourseType, newSections: SectionType[]) => {
    if (props.currentCourse?.id !== course.id) return;

    setSections((prev) => {
      const combined = [...prev, ...newSections];
      // Generate map
      const map = generateSectionsByStudent(combined);
      setSectionsByStudent(map);
      return combined;
    });
  };

  /***********************************************************************************
  /* URL + UI handling methods
  /**********************************************************************************/

  const handleDemoCourse = (course?: CourseType) => {
    const searchParam = `?product_tour_id=${ADMIN_TOUR_ID}`;

    if (course !== undefined) {
      setCourses((prev) => [...prev, course]);
      setOnboardingModalVisible(false);
      props.addCourse(course);
      navigate({ search: searchParam });
    } else {
      const demoCourse = courses.find((el) => el.period === 'demo');
      if (demoCourse !== undefined) {
        setOnboardingModalVisible(false);
        navigate({ search: searchParam });
      }
    }
  };

  const closeModal = () => {
    setOnboardingModalVisible(false);
    navigate(location.pathname);
  };

  /************************************************************************
  /* Course handling methods
  /***********************************************************************/

  const createCourse = (courseName: string, coursePeriod: string, copiedCourse: CourseType | undefined) => {
    const payload = {
      id: -1,
      name: courseName,
      period: coursePeriod,
      assignments: [],
      sections: [],
      sendReleasedSubmissionsToBack: false,
      showStudentsStatistics: false,
      timezone: 'US/Eastern',
      emailNewUsers: false,
      anonymousGradingDefault: false,
      allowGradersToEditRubric: false,
      minComments: 0,
      noUnfinalize: false,
      lateDayCreditsAllowable: null,
      archived: false,
      activateQueue: true,
      inviteCode: '',
      emailWhitelist: '',
      inviteCodeEnabled: false,
      enableStudentFeedbackNotifications: false,
      expiration_date: null,
      studentsCanSeeGraders: false,
      studentCount: 0,
    };

    return Course.create(payload).then((course: CourseType) => {
      if (!copiedCourse) {
        props.addCourse(course);
        navigate(`${formatCourseURL(course)}/assignments/overview`);
        return;
      }

      const assignmentClonePromises = copiedCourse.assignments.map((assignmentID: number) =>
        Assignment.clone(assignmentID, course.id),
      );

      const copyCourseFiles = fetch(`${process.env.REACT_APP_API_URL}/courseFiles/?course=${copiedCourse.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((courseFiles: any[]) => {
          if (!courseFiles || courseFiles.length === 0) return Promise.resolve([]);
          return Promise.all(
            courseFiles.map((file) =>
              fetch(`${process.env.REACT_APP_API_URL}/courseFiles/`, {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                method: 'POST',
                body: JSON.stringify({
                  course: course.id,
                  name: file.name,
                  extension: file.extension,
                  data: file.data,
                }),
              }),
            ),
          );
        })
        .catch((error) => {
          console.error('Error copying course files:', error);
          return Promise.resolve([]);
        });

      return Promise.all([...assignmentClonePromises, copyCourseFiles]).then(() => {
        props.addCourse(course);
        navigate(`${formatCourseURL(course)}/assignments/overview`);
      });
    });
  };

  const updateSettings = (course: CoursePatchType) => {
    return Course.update(course).then((newCourse: CourseType) => {
      setCourses(courses.map((c) => (c.id === newCourse.id ? newCourse : c)));
      navigate(`${formatCourseURL(newCourse)}/settings`);
      return newCourse;
    });
  };

  /**********************************************************************************
  /* Roster handling methods
  /**********************************************************************************/

  const updateRoster = async (adds: string[], deletes: string[], userType: USER_APP) => {
    const { currentCourse } = props;
    if (!currentCourse) return Promise.reject();
    if (adds.length === 0 && deletes.length === 0) return Promise.reject();

    const makePayload = (role: USER_APP, users: string[]) => {
      const payload = { id: currentCourse.id };
      switch (role) {
        case USER_APP.Student:
          addToPayload(payload, 'students', users);
          break;
        case USER_APP.Grader:
          addToPayload(payload, 'graders', users);
          break;
        case USER_APP.CourseAdmin:
          addToPayload(payload, 'courseAdmins', users);
          break;
        case USER_APP.SuperGrader:
          addToPayload(payload, 'superGraders', users);
          break;
      }
      return payload;
    };

    let roster: RosterType | undefined = undefined;

    if (adds.length > 0) {
      roster = await Course.addToRoster(makePayload(userType, adds));
    }

    if (deletes.length > 0) {
      roster = await Course.removeFromRoster(makePayload(userType, deletes));
    }

    if (roster) {
      switch (userType) {
        case USER_APP.Student:
          setStudents(roster.students);
          setInactiveStudents(roster.inactive_students);
          updateSubmissionsByUser(roster);
          break;
        case USER_APP.Grader:
          setGraders(roster.graders);
          setInactiveGraders(roster.inactive_graders);
          updateSubmissionsByUser(roster);
          break;
        case USER_APP.CourseAdmin:
          setAdmins(roster.courseAdmins);
          break;
        case USER_APP.SuperGrader:
          setSuperGraders(roster.superGraders);
          break;
      }
    }
  };

  /************************************************************************
  /* Section handling methods
  /***********************************************************************/

  const createSection = (newSection: string) => {
    if (!props.currentCourse) return Promise.reject();
    const payload = {
      name: newSection,
      course: props.currentCourse.id,
      leaders: [],
      students: [],
      id: -1,
    };

    return Section.create(payload).then((section: SectionType) => {
      setSections([...sections, section]);
      if (props.currentCourse) {
        props.currentCourse.sections.push(section.id);
      }
      return section;
    });
  };

  const deleteSection = (sectionID: number) => {
    const sectionIndex = sections.findIndex((s) => s.id === sectionID);
    if (sectionIndex === -1) return Promise.reject('No section with this ID exists.');

    const thisSection = sections[sectionIndex];
    const sectionStudents = thisSection.students;

    return Section.delete({ id: sectionID }).then(() => {
      const newSections = sections.filter((s) => s.id !== sectionID);
      const newSectionsByStudent = { ...sectionsByStudent };
      sectionStudents.forEach((student) => {
        delete newSectionsByStudent[student];
      });

      if (props.currentCourse) {
        props.currentCourse.sections = newSections.map((s) => s.id);
      }

      setSections(newSections);
      setSectionsByStudent(newSectionsByStudent);
    });
  };

  const updateSection = (toUpdate: SectionType): Promise<void> => {
    const oldSection = sections.find((s) => s.id === toUpdate.id);
    if (!oldSection) return Promise.reject('This section does not exist.');

    const oldStudents = [...oldSection.students];

    return Section.update(toUpdate).then((newSection) => {
      const newStudents = toUpdate.students;
      const removedStudents = oldStudents.filter((student) => !newStudents.includes(student));
      const addedStudents = newStudents.filter((student) => !oldStudents.includes(student));

      const sectionMap = { ...sectionsByStudent };
      for (const removed of removedStudents) delete sectionMap[removed];
      for (const added of addedStudents) sectionMap[added] = newSection;

      const otherSections = sections.filter((s) => s.id !== newSection.id)
        .map((el) => ({
          ...el,
          students: el.students.filter((stu) => addedStudents.indexOf(stu) === -1),
        }));

      setSections([...otherSections, newSection]);
      setSectionsByStudent(sectionMap);
    });
  };

  const updateStudentSection = (studentEmail: string, sectionID: number): Promise<void> => {
    const oldSection = sectionsByStudent[studentEmail];
    const newSection = sections.find((el) => el.id === sectionID);
    const promises = [];

    if (newSection) {
      const updatedSection = _.cloneDeep(newSection);
      updatedSection.students = [...updatedSection.students, studentEmail];
      promises.push(updateSection(updatedSection));
    } else if (oldSection) {
      const updatedSection = _.cloneDeep(oldSection);
      updatedSection.students = updatedSection.students.filter((el: string) => el !== studentEmail);
      promises.push(updateSection(updatedSection));
    }

    return Promise.all(promises).then(() => { });
  };

  /************************************************************************
  /* Assignment handling methods
  /***********************************************************************/

  const updateAssignment = (patchObj: AssignmentPatchType): Promise<void> => {
    return Assignment.update(patchObj).then((assignment) => {
      setAssignments(assignments.map((assn) => (assn.id === assignment.id ? assignment : assn)));
    }).catch((errors) => Promise.reject(errors));
  };

  const shallowUpdateAssignment = (assignmentID: number, field: string, value: number) => {
    setAssignments(assignments.map((assn) =>
      assn.id === assignmentID ? { ...assn, [field]: value } : assn
    ));
  };

  const createAssignment = (
    aName: string,
    aPoints: number,
    studentUpload: boolean,
    isVisible: boolean,
    dueDate?: string,
    sortKey?: number,
  ): Promise<AssignmentType> => {
    const { currentCourse } = props;
    if (!currentCourse) return Promise.reject();

    const payload = {
      id: -1,
      course: currentCourse.id,
      name: aName,
      points: aPoints,
      isReleased: false,
      hideGrades: false,
      rubricCategories: [],
      sortKey,
      allowStudentUpload: studentUpload,
      uploadDueDate: dueDate,
      isVisible,
    };

    return Assignment.create(payload).then((assignment: AssignmentType) => {
      const newSubsByGrader = { ...submissionsByGrader };
      graders.forEach((grader) => {
        newSubsByGrader[grader][assignment.id] = [];
      });

      const newAssignments = _.uniqBy([...assignments, assignment], (a: AssignmentType) => a.name);

      setSubmissions(prev => ({ ...prev, [assignment.id]: [] }));
      setAssignments(newAssignments);
      setSubmissionsByGrader(newSubsByGrader);

      props.addAssignment(assignment);
      return assignment;
    });
  };

  const deleteAssignment = (toDelete: AssignmentType) => {
    const { currentCourse } = props;
    if (!currentCourse) return Promise.reject();

    return Assignment.delete(toDelete).then(() => {
      const newAssignments = assignments.filter((el) => el.id !== toDelete.id);
      // We need to remove it from submissions map
      const newSubmissions = { ...submissions };
      delete newSubmissions[toDelete.id];

      const newAssignmentIDs = newAssignments.map((i) => i.id);
      currentCourse.assignments = newAssignmentIDs; // mutates prop object, which propagates in global state logic often
      props.deleteAssignment(toDelete);

      setAssignments(newAssignments);
      setSubmissions(newSubmissions);

      // Update by user mappings
      updateSubmissionsByUser(undefined, newSubmissions, newAssignments);
    });
  };

  /************************************************************************
  /* Submission handling methods
  /***********************************************************************/

  const bulkUpdateSubmissions = (
    assignmentID: number,
    getPayload: (sub: SubmissionInfoType) => Partial<SubmissionInfoType>,
  ) => {
    const submissionsToUpdate = submissions[assignmentID];
    const promises = submissionsToUpdate.map((s) => {
      const payload = { id: s.id, ...getPayload(s) };
      return Submission.update(payload);
    });

    return Promise.all(promises).then((updatedSubmissions: SubmissionInfoType[]) => {
      const newSubmissions = { ...submissions, [assignmentID]: updatedSubmissions };
      setSubmissions(newSubmissions);
      updateSubmissionsByUser(undefined, newSubmissions, undefined);
    });
  };

  const updateSubmission = (toUpdate: SubmissionInfoType) => {
    const assignmentID = toUpdate.assignment;
    const oldSubmission = submissions[assignmentID]?.find((el) => el.id === toUpdate.id);

    if (oldSubmission === undefined) return Promise.reject('Submission does not exist');

    return Submission.update(toUpdate).then((updated) => {
      const newAssignmentSubs = [
        ...submissions[assignmentID].filter((s) => s.id !== updated.id),
        updated,
      ];
      const newSubmissions = { ...submissions, [assignmentID]: newAssignmentSubs };

      // Update student mappings
      const newSubmissionsByStudent = { ...submissionsByStudent };
      const removedStudents = oldSubmission.students.filter((student) => updated.students.indexOf(student) < 0);

      removedStudents.forEach((student) => {
        delete newSubmissionsByStudent[student][assignmentID];
      });

      updated.students.forEach((student) => {
        newSubmissionsByStudent[student][assignmentID] = updated;
      });

      // Update grader mappings
      const newGraderMap = { ...submissionsByGrader };
      if (oldSubmission.grader && oldSubmission.grader !== updated.grader) {
        newGraderMap[oldSubmission.grader][assignmentID] = newGraderMap[oldSubmission.grader][assignmentID].filter((s) => s.id !== updated.id);
      }

      if (updated.grader) {
        const existingGraderSubs = newGraderMap[updated.grader][assignmentID] || [];
        newGraderMap[updated.grader][assignmentID] = [
          ...existingGraderSubs.filter((s) => s.id !== updated.id),
          updated
        ];
      }

      setSubmissions(newSubmissions);
      setSubmissionsByStudent(newSubmissionsByStudent);
      setSubmissionsByGrader(newGraderMap);
    });
  };

  const changeSubmissionGrader = (sub: SubmissionInfoType, grader: string | undefined) => {
    const newSub = { ...sub };
    newSub.grader = grader === undefined ? null : grader; // Assuming API accepts null
    return updateSubmission(newSub);
  };

  const deleteSubmission = (toDelete: SubmissionInfoType) => {
    const assignmentID = toDelete.assignment;
    const sub = submissions[assignmentID]?.find((el) => el.id === toDelete.id);

    if (sub === undefined) return Promise.reject('Submission does not exist');

    return Submission.delete(sub).then(() => {
      const newAssignmentSubs = submissions[assignmentID].filter((s) => s.id !== sub.id);
      const newSubmissions = { ...submissions, [assignmentID]: newAssignmentSubs };

      const newSubmissionsByStudent = { ...submissionsByStudent };
      sub.students.forEach((student) => {
        delete newSubmissionsByStudent[student][assignmentID];
      });

      const newSubmissionsByGrader = { ...submissionsByGrader };
      if (sub.grader) {
        newSubmissionsByGrader[sub.grader][assignmentID] = newSubmissionsByGrader[sub.grader][assignmentID].filter((s) => s.id !== sub.id);
      }

      setSubmissions(newSubmissions);
      setSubmissionsByStudent(newSubmissionsByStudent);
      setSubmissionsByGrader(newSubmissionsByGrader);
    });
  };

  const getFileExtension = (fileName: string): string => {
    const split = fileName.split('.');
    return split.length === 1 ? 'txt' : split[split.length - 1];
  };

  const addFilesToSubmission = (submission: SubmissionInfoType, files: FileType[]) => {
    const filePromises = files.map((file: FileType) => {
      const ext = getFileExtension(file.name);
      const filePayload = {
        id: -1,
        name: file.name,
        extension: ext,
        data: (file as unknown as { data: string }).data,
        submission: submission.id,
        comments: [],
        path: file.path ? file.path : null,
      };
      return SubmissionFile.create(filePayload);
    });

    return Promise.all(filePromises).then(() => submission);
  };

  const uploadSubmission = (assignment: AssignmentType, partners: string[], files: FileType[]) => {
    if (partners.length === 0) return Promise.reject();

    const submissionPayload = {
      id: -1,
      isFinalized: false,
      files: [],
      assignment: assignment.id,
      students: partners,
    };

    return Submission.create(submissionPayload).then((submission: SubmissionInfoType) => {
      const filesPromise = addFilesToSubmission(submission, files);

      const newSubmissionsByStudent = { ...submissionsByStudent };
      partners.forEach((student) => {
        if (!newSubmissionsByStudent[student]) newSubmissionsByStudent[student] = {};
        newSubmissionsByStudent[student][assignment.id] = submission;
      });

      const newSubmissions = { ...submissions };
      newSubmissions[submission.assignment] = [...newSubmissions[submission.assignment], submission];

      setSubmissionsByStudent(newSubmissionsByStudent);
      setSubmissions(newSubmissions);

      return filesPromise.then(() => submission);
    });
  };


  /************************************************************************************
  /* Render
  /************************************************************************************/

  const courseURL = props.currentCourse ? formatCourseURL(props.currentCourse) : props.baseURL;

  const dropdown = (
    <CourseMenu
      base="admin"
      panel="assignments"
      courses={courses}
      currentCourse={props.currentCourse}
    />
  );
  const createButton = <NewCourseDialog courses={courses} createCourse={createCourse} />;
  const headerLeft = [dropdown, createButton];

  const logout = (
    <Button key="header-logout" onClick={props.handleLogout}>
      Logout
    </Button>
  );

  const headerRight = [
    <span key="header-user" className="cp-label cp-label--bold">
      {props.user.email}
    </span>,
    <Referral key="referral" user={props.user} theme="light" />,
    <RoleMenu key="header-roles" user={props.user} thisApp={USER_TYPE.ADMIN} theme="light" />,
    <CPTooltip key="settings" title={tooltips.management.header.settings} hideThisOnHideTips={true}>
      <Link className="internal-link" to="/settings">
        <SettingOutlined />
      </Link>
    </CPTooltip>,
    logout,
    <AdminOnboardingSelector
      open={onboardingModalVisible}
      onCancel={closeModal}
      email={props.user.email}
      onDemoCreate={handleDemoCourse}
      demoCourseExists={courses.some((el) => el.period === 'demo')}
    />,
  ];

  const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;

  const navigation = (collapsed: boolean) => (
    <AdminNav baseURL={courseURL} collapsed={collapsed} />
  );

  const banner = props.currentCourse && assignments && assignments.length === 1 ? (
    <AssignmentSetupBanner
      course={props.currentCourse}
      hasStudents={students.length > 0}
      hasSubmissions={
        submissions &&
        submissions[assignments[0].id] &&
        submissions[assignments[0].id].length > 0
      }
      onClose={() => { }}
      assignment={assignments[0]}
    />
  ) : undefined;

  let detail;

  if (courses.length === 0) {
    detail = (
      <Empty
        style={{ marginTop: 60 }}
        styles={{ image: { height: 60 } }}
        description={<span>Get started by creating a course!</span>}
      >
        {createButton}
      </Empty>
    );
  } else if (props.currentCourse) {
    detail = (
      <AdminRoutes
        course={props.currentCourse}
        courseURL={courseURL}

        // Loaded Data
        assignments={assignments}
        students={students}
        graders={graders}
        admins={admins}
        superGraders={superGraders}
        inactiveStudents={inactiveStudents}
        inactiveGraders={inactiveGraders}
        notActivated={notActivated}
        sections={sections}
        sectionsByStudent={sectionsByStudent}
        submissions={submissions}
        submissionsByStudent={submissionsByStudent}
        submissionsByGrader={submissionsByGrader}
        viewsBySubmission={viewsBySubmission}

        // Load Status
        loadComplete={{
          assignments: assignmentsLoadComplete,
          submissionsPartial: partialSubmissionsLoadComplete,
          submissionsFull: fullSubmissionsLoadComplete,
          submissionsByUser: submissionsByUserLoadComplete,
          roster: rosterLoadComplete,
          sections: sectionsLoadComplete
        }}

        // User Context
        user={props.user}
        myEmail={props.user.email}

        // Change handlers
        createAssignment={createAssignment}
        updateAssignment={updateAssignment}
        deleteAssignment={deleteAssignment}
        shallowUpdateAssignment={shallowUpdateAssignment}
        updateSettings={updateSettings}
        updateRoster={updateRoster}
        createSection={createSection}
        updateSection={updateSection}
        deleteSection={deleteSection}
        updateStudentSection={updateStudentSection}
        uploadSubmission={uploadSubmission}
        addFilesToSubmission={addFilesToSubmission}
        deleteSubmission={deleteSubmission}
        updateSubmission={updateSubmission}
        changeSubmissionGrader={changeSubmissionGrader}
        bulkUpdateSubmissions={bulkUpdateSubmissions}

        courses={courses}

        // Actions
        refreshCourseData={() => loadAllCourseData(props.currentCourse!)}
      />
    );
  }

  return (
    <CPLayoutAdmin
      header={header}
      banner={banner}
      detail={
        <span>
          {detail}
          {
            <CIPAdminModal
              open={cipModalVisible}
              onClose={() => setCipModalVisible(false)}
              user={props.user}
              onCreateCourse={() => {
                setCipModalVisible(false);
                const newCourseButton = document.getElementById('new-course-button');
                if (newCourseButton) {
                  newCourseButton.click();
                }
              }}
              onCreateDemoCourse={handleDemoCourse}
            />
          }
        </span>
      }
      navigation={navigation}
      collapsible={true}
      role={USER_TYPE.ADMIN}
    />
  );
};

export default Admin;

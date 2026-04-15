// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState, useEffect, useRef } from 'react';

import { SettingOutlined } from '@ant-design/icons';

/* ant imports */
import { Button, Empty } from 'antd';

/* other library imports */
import cloneDeep from 'lodash/cloneDeep';
import uniqBy from 'lodash/uniqBy';
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
import { usePlatformCapabilities } from '../../stores/usePermissionsStore';

/* types */
import {
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  IStudentSubmissionsDataTable,
  USER_APP,
  USER_TYPE,
} from '../../types/common';

/* API library */
import { Course, CourseFile, CourseRoster, Section } from '../../api-client';
import type {
  CreateRequest as AssignmentCreateRequest,
  PartialUpdateRequest as AssignmentPartialUpdateRequest,
} from '../../api-client/apis/AssignmentsApi';
import type {
  CreateRequest as SubmissionCreateRequest,
  PartialUpdateRequest as SubmissionPartialUpdateRequest,
} from '../../api-client/apis/SubmissionsApi';
import type { CreateRequest as SubmissionFileCreateRequest } from '../../api-client/apis/SubmissionFilesApi';
import type { PartialUpdateRequest as SectionPartialUpdateRequest } from '../../api-client/apis/SectionsApi';
import {
  courseFilesApi,
  coursesApi,
  sectionsApi,
  assignmentsApi,
  submissionsApi,
  submissionFilesApi,
} from '../../api-client/clients';
import { Assignment, SubmissionInfoType, UploadFile } from '../../types/common';
import { SubmissionHistory } from '../../api-client';
import { withQueryParams } from '../../utils/apiClient';

import { AdminOnboardingSelector } from '../core/OnboardingSelector';

import { ADMIN_TOUR_ID } from '../../routes';

import { IComponentProps } from '../core/ComponentManager';
import { encodeForLink } from '../core/URLutils';

import CPFlex from '../core/CPFlex';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

import { AssignmentSetupBanner } from './assignments/assignments/AssignmentSetupDialog';

import { CIPAdminModal } from '../cip/components';

/**********************************************************************************************************************/

const formatCourseURL = (course: Course) => {
  return `/admin/${encodeForLink(course.name)}/${encodeForLink(course.period)}`;
};

const Admin: React.FC<IComponentProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  /**** UI control data ****/
  const [onboardingModalVisible, setOnboardingModalVisible] = useState(false);
  const [cipModalVisible, setCipModalVisible] = useState(false);

  /**** Top-level course data ****/
  const [courses, setCourses] = useState<Course[]>([]);

  /**** Roster data ****/
  const [rosterLoadComplete, setRosterLoadComplete] = useState(false);
  const [students, setStudents] = useState<string[]>([]);
  const [inactiveStudents, setInactiveStudents] = useState<string[]>([]);
  const [graders, setGraders] = useState<string[]>([]);
  const [inactiveGraders, setInactiveGraders] = useState<string[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [superGraders, setSuperGraders] = useState<string[]>([]);
  const [rubricEditors, setRubricEditors] = useState<string[]>([]);
  const [notActivated, setNotActivated] = useState<string[]>([]);

  /**** Sections data ****/
  const [sectionsLoadComplete, setSectionsLoadComplete] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsByStudent, setSectionsByStudent] = useState<{ [studentEmail: string]: Section }>({});

  /**** Assignments data ****/
  const [assignmentsLoadComplete, setAssignmentsLoadComplete] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  /*** Submissions data ****/
  const [partialSubmissionsLoadComplete, setPartialSubmissionsLoadComplete] = useState(false);
  const [fullSubmissionsLoadComplete, setFullSubmissionsLoadComplete] = useState(false);
  const [submissionsByUserLoadComplete, setSubmissionsByUserLoadComplete] = useState(false);
  const [submissions, setSubmissions] = useState<IAssignmentToSubmissionsMap>({});
  const [submissionsByStudent, setSubmissionsByStudent] = useState<IStudentSubmissionsDataTable>({});
  const [submissionsByGrader, setSubmissionsByGrader] = useState<IGraderSubmissionsDataTable>({});
  const [viewsBySubmission, setViewsBySubmission] = useState<{ [submissionID: number]: { [student: string]: string } }>(
    {},
  );

  type RosterData = {
    id?: number;
    name?: string;
    period?: string;
    students: string[];
    graders: string[];
    inactive_students: string[];
    inactive_graders: string[];
    inactive_courseAdmins?: string[];
    courseAdmins: string[];
    superGraders: string[];
    rubricEditors: string[];
    not_activated: string[];
    organization?: number;
  };

  // Refs for async data access
  const rosterRef = useRef<RosterData | undefined>(undefined);
  const assignmentsRef = useRef<Assignment[]>([]);
  const lastLoadedCourseIdRef = useRef<number | undefined>(undefined);

  // Initialize state based on props (mimicking constructor)
  useEffect(() => {
    const showCIPModal = !props.user.hasCredentials;
    const hasOnboardingParam = Object.prototype.hasOwnProperty.call(queryString.parse(location.search), 'onboarding');
    const hasDismissed = localStorage.getItem('cp_onboarding_dismissed') === '1';
    const showOnboarding = hasOnboardingParam || (props.initialCourses.length === 0 && !hasDismissed);

    queueMicrotask(() => {
      setOnboardingModalVisible(showOnboarding && !showCIPModal);
      setCipModalVisible(showCIPModal);
      setCourses(props.initialCourses);
    });
  }, [location.search, props.initialCourses, props.user.hasCredentials]);

  // Document Title
  useEffect(() => {
    document.title = 'codePost - Admin Console';
  }, [navigate]);

  /***********************************************************************************
  /* Helper Functions (Business Logic)
  /**********************************************************************************/

  /* GENERATORS (Pure functions mostly) */

  const generateSubmissionsByUser = (
    rosterToUse: {
      students: string[];
      graders: string[];
      inactive_students: string[];
      inactive_graders: string[];
    },
    submissionsToUse: IAssignmentToSubmissionsMap,
    assignmentsToUse: Assignment[],
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
          (submission.students as (string | null)[]).forEach((student: string | null) => {
            if (student && student in subsByStudent) {
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
    assignmentsParam?: Assignment[],
    callback?: () => void,
  ) => {
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

  const sortAssignments = (assignments: Assignment[]) => {
    return assignments.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));
  };

  type AssignmentCreatePayload = AssignmentCreateRequest['assignment'];
  type AssignmentPatchPayload = AssignmentPartialUpdateRequest['patchedAssignment'];
  type SubmissionPatchPayload = SubmissionPartialUpdateRequest['patchedSubmission'];
  type SubmissionCreatePayload = SubmissionCreateRequest['submission'];
  type SubmissionFileCreatePayload = SubmissionFileCreateRequest['submissionFile'];
  type SectionPatchPayload = SectionPartialUpdateRequest['patchedSection'];

  const normalizeRoster = (roster: CourseRoster | RosterData): RosterData => {
    if ('inactive_students' in roster) {
      return roster as RosterData;
    }

    const toStrings = (values?: Array<string | null>) => (values ?? []).filter((v): v is string => Boolean(v));
    const rosterApi = roster as CourseRoster;

    return {
      id: rosterApi.id,
      name: rosterApi.name,
      period: rosterApi.period,
      students: toStrings(rosterApi.students),
      inactive_students: toStrings(rosterApi.inactiveStudents),
      inactive_graders: toStrings(rosterApi.inactiveGraders),
      inactive_courseAdmins: toStrings(rosterApi.inactiveCourseAdmins),
      graders: toStrings(rosterApi.graders),
      superGraders: toStrings(rosterApi.superGraders),
      rubricEditors: toStrings(rosterApi.rubricEditors),
      courseAdmins: toStrings(rosterApi.courseAdmins),
      not_activated: rosterApi.notActivated ?? [],
      organization: rosterApi.organization,
    };
  };

  const sanitizeAssignment = (result: Assignment): Assignment => ({
    ...result,
    isReleased: result.isReleased ?? false,
    feedbackReleased: result.feedbackReleased ?? false,
    hideGrades: result.hideGrades ?? false,
    isVisible: result.isVisible ?? false,
    allowStudentUpload: result.allowStudentUpload ?? false,
    allowStudentUploadWithPartners: result.allowStudentUploadWithPartners ?? false,
    commentFeedback: result.commentFeedback ?? false,
    anonymousGrading: result.anonymousGrading ?? false,
    hideGradersFromStudents: result.hideGradersFromStudents ?? false,
    allowRegradeRequests: result.allowRegradeRequests ?? false,
    liveFeedbackMode: result.liveFeedbackMode ?? false,
    additiveGrading: result.additiveGrading ?? false,
    collaborativeRubricMode: result.collaborativeRubricMode ?? false,
    forcedRubricMode: result.forcedRubricMode ?? false,
    templateMode: result.templateMode ?? false,
    showFrequentlyUsedRubricComments: result.showFrequentlyUsedRubricComments ?? false,
    allowLateUploads: result.allowLateUploads ?? false,
    nudgeMode: result.nudgeMode ?? false,
    runFilesOnSubmit: result.runFilesOnSubmit ?? true,
    runTestsOnSubmit: result.runTestsOnSubmit ?? true,
    testsAffectGrade: result.testsAffectGrade ?? true,

    sortKey: result.sortKey ?? 0,
    points: result.points,
    maxLateDays: result.maxLateDays ?? 0,
    course: result.course,

    environment: result.environment ?? null,
    maxStudentTestRuns: result.maxStudentTestRuns ?? null,
    mean: result.mean ?? null,
    median: result.median ?? null,

    explanation: result.explanation ?? '',
    regradeInstructions: result.regradeInstructions ?? '',

    uploadDueDate: result.uploadDueDate ?? null,
    regradeDeadline: result.regradeDeadline ?? null,
    studentsCanSeeGraders: result.studentsCanSeeGraders ?? null,

    rubricCategories: result.rubricCategories ?? [],
    files: result.files ?? [],
    fileTemplates: result.fileTemplates ?? [],
    testCategories: result.testCategories ?? [],
    dataSets: result.dataSets ?? [],
    hideFrom: result.hideFrom ?? [],
    lateDeductions: result.lateDeductions ?? [],
  });

  const loadAssignmentsData = (course: Course): Promise<Assignment[]> => {
    if (!course.assignments) return Promise.resolve([]);

    const promises = course.assignments.map((id) => assignmentsApi.retrieve({ id }));
    return Promise.all(promises).then((results) => {
      // Sanitize fields
      const sanitized = results.map(sanitizeAssignment);

      const sorted = sortAssignments(sanitized);
      setAssignments(sorted);
      setAssignmentsLoadComplete(true);
      return sorted;
    });
  };

  const loadRosterData = (course: Course) => {
    if (!course) return Promise.resolve();

    return coursesApi.rosterRetrieve({ id: course.id }).then((roster) => {
      const r = normalizeRoster(roster);
      setStudents(r.students);
      setInactiveStudents(r.inactive_students);
      setGraders(r.graders);
      setInactiveGraders(r.inactive_graders);
      setAdmins(r.courseAdmins);
      setSuperGraders(r.superGraders);
      setRubricEditors(r.rubricEditors);
      setNotActivated(r.not_activated);
      setRosterLoadComplete(true);
      rosterRef.current = r;
      return r;
    });
  };

  const loadPaginatedSections = (course: Course) => {
    const fetchAllSections = async () => {
      const pageSize = 200;
      let page = 1;
      let allSections: Section[] = [];

      while (true) {
        const response = await coursesApi.sectionsList({ id: course.id, page, pageSize });
        const results = response.results ?? [];
        allSections = allSections.concat(results);

        if (!response.next) {
          break;
        }

        page += 1;
      }

      return allSections;
    };

    return fetchAllSections().then((sectionsList) => {
      const sectionMap: { [studentEmail: string]: Section } = {};

      sectionsList.forEach((sec) => {
        sec.students.forEach((stu) => {
          if (stu) {
            sectionMap[stu] = sec;
          }
        });
      });

      setSections(sectionsList);
      setSectionsByStudent(sectionMap);
      setSectionsLoadComplete(true);
      return sectionsList;
    });
  };

  /* New loaders using generated client */
  const fetchAssignmentSubmissionsCompact = async (assignmentId: number): Promise<SubmissionInfoType[]> => {
    const pageSize = 1000;
    let page = 1;
    let allResults: SubmissionInfoType[] = [];
    const assignmentsApiWithCompact = withQueryParams(assignmentsApi, { compact: 1 });

    while (true) {
      const response = await assignmentsApiWithCompact.submissionsListRaw({ id: assignmentId, page, pageSize });
      const data = (await response.raw.json()) as unknown;
      if (Array.isArray(data)) {
        allResults = data as SubmissionInfoType[];
        break;
      }

      const results = ((data as { results?: SubmissionInfoType[] } | undefined)?.results ?? []) as SubmissionInfoType[];
      allResults = allResults.concat(results);

      if (!(data as { next?: string | null } | undefined)?.next) {
        break;
      }

      page += 1;
    }

    return allResults;
  };

  const loadSubmissionsData = (_course: Course, loadedAssignments: Assignment[]) => {
    setPartialSubmissionsLoadComplete(false);
    setFullSubmissionsLoadComplete(false);

    if (!loadedAssignments || loadedAssignments.length === 0) {
      setPartialSubmissionsLoadComplete(true);
      setFullSubmissionsLoadComplete(true);
      return;
    }

    const promises = loadedAssignments.map((a) => fetchAssignmentSubmissionsCompact(a.id));

    Promise.all(promises).then((results) => {
      const newSubmissions: IAssignmentToSubmissionsMap = {};

      results.forEach((subsResponse: SubmissionInfoType[], index) => {
        const assignmentID = loadedAssignments[index].id;
        newSubmissions[assignmentID] = subsResponse ?? [];
      });

      setSubmissions(newSubmissions);

      if (rosterRef.current) {
        updateSubmissionsByUser(rosterRef.current, newSubmissions, loadedAssignments);
      }

      setPartialSubmissionsLoadComplete(true);
      setFullSubmissionsLoadComplete(true);
    });
  };

  const loadViewsBySubmissionData = (_course: Course, loadedAssignments: Assignment[]) => {
    const fetchAllSubmissionHistories = async (assignmentId: number) => {
      const pageSize = 200;
      let page = 1;
      let allResults: SubmissionHistory[] = [];

      while (true) {
        const response = await assignmentsApi.submissionHistoriesList({ id: assignmentId, page, pageSize });
        const results = response.results ?? [];
        allResults = allResults.concat(results as SubmissionHistory[]);

        if (!response.next) {
          break;
        }

        page += 1;
      }

      return allResults;
    };

    loadedAssignments.forEach((assignment) => {
      fetchAllSubmissionHistories(assignment.id).then((viewHistoryList) => {
        setViewsBySubmission((prev) => {
          const newViews = { ...prev };
          viewHistoryList.forEach((h) => {
            const { submission, student, hasViewed, dateViewed } = h;
            if (!(submission in newViews)) {
              newViews[submission] = {};
            }
            if (hasViewed && dateViewed) {
              newViews[submission][student] = dateViewed;
            }
          });
          return newViews;
        });
      });
    });
  };

  const loadAllCourseData = (course: Course) => {
    setRosterLoadComplete(false);
    setSectionsLoadComplete(false);
    setAssignmentsLoadComplete(false);

    // 1. Assignments
    loadAssignmentsData(course).then((loadedAssignments) => {
      if (props.currentCourse?.id !== course.id) return;

      assignmentsRef.current = loadedAssignments;

      // 2. Submissions & Views (depend on assignments)
      loadSubmissionsData(course, loadedAssignments);
      loadViewsBySubmissionData(course, loadedAssignments);
    });

    // 3. Roster (Independent)
    loadRosterData(course);

    // 4. Sections (Independent)
    loadPaginatedSections(course);
  };

  // Load Course Data when currentCourse changes
  useEffect(() => {
    const currentCourse = props.currentCourse;
    if (!currentCourse) return;
    if (lastLoadedCourseIdRef.current === currentCourse.id) return;

    lastLoadedCourseIdRef.current = currentCourse.id;

    queueMicrotask(() => {
      loadAllCourseData(currentCourse);
    });
  });

  /***********************************************************************************
  /* Pagination Callbacks
  /**********************************************************************************/

  /***********************************************************************************
  /* URL + UI handling methods
  /**********************************************************************************/

  const handleDemoCourse = (course?: Course) => {
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
    localStorage.setItem('cp_onboarding_dismissed', '1');
    setOnboardingModalVisible(false);
    navigate(location.pathname);
  };

  /************************************************************************
  /* Course handling methods
  /***********************************************************************/

  const createCourse = (courseName: string, coursePeriod: string, copiedCourse: Course | undefined) => {
    const courseRequest: Course = {
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
      expirationDate: null,
      studentsCanSeeGraders: false,
      studentCount: 0,
      isRubricEditor: false,
      cloneFrom: copiedCourse ? copiedCourse.id : undefined,
    } as unknown as Course;

    return coursesApi.create({ course: courseRequest }).then((course: Course) => {
      if (!copiedCourse) {
        props.addCourse(course);
        navigate(`${formatCourseURL(course)}/assignments/overview`);
        return;
      }

      const assignmentClonePromises = copiedCourse.assignments.map((assignmentID: number) =>
        assignmentsApi.cloneCreate({
          id: assignmentID,
          assignmentClone: {
            course: course.id,
          },
        }),
      );

      const copyCourseFiles = withQueryParams(courseFilesApi, { course: copiedCourse.id })
        .listRaw()
        .then((response: { raw: Response }) => response.raw.json())
        .then((courseFiles: CourseFile[]) => {
          if (!courseFiles || courseFiles.length === 0) return Promise.resolve([]);
          return Promise.all(
            courseFiles.map((file) =>
              courseFilesApi.create({
                courseFile: {
                  course: course.id,
                  name: file.name,
                  extension: file.extension,
                  data: file.data,
                },
              }),
            ),
          );
        })
        .catch((error: unknown) => {
          console.error('Error copying course files:', error);
          return Promise.resolve([]);
        });

      return Promise.all([...assignmentClonePromises, copyCourseFiles]).then(() => {
        props.addCourse(course);
        navigate(`${formatCourseURL(course)}/assignments/overview`);
      });
    });
  };

  const updateSettings = (course: Course) => {
    const patch: Course = { ...course };
    if (patch.id === undefined) return Promise.reject();

    return coursesApi.update({ id: patch.id, course: patch }).then((newCourse: Course) => {
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
      const payload: Record<string, unknown> = { id: currentCourse.id };
      switch (role) {
        case USER_APP.Student:
          payload.students = users;
          break;
        case USER_APP.Grader:
          payload.graders = users;
          break;
        case USER_APP.CourseAdmin:
          payload.courseAdmins = users;
          break;
        case USER_APP.SuperGrader:
          payload.superGraders = users;
          break;
        case USER_APP.RubricEditor:
          payload.rubricEditors = users;
          break;
      }
      return payload;
    };

    let roster: RosterData | undefined = undefined;

    if (adds.length > 0) {
      roster = normalizeRoster(
        await coursesApi.addToRosterPartialUpdate({
          id: currentCourse.id,
          patchedCourse: makePayload(userType, adds),
        }),
      );
    }

    if (deletes.length > 0) {
      roster = normalizeRoster(
        await coursesApi.removeFromRosterPartialUpdate({
          id: currentCourse.id,
          patchedCourse: makePayload(userType, deletes),
        }),
      );
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
        case USER_APP.RubricEditor:
          setRubricEditors(roster.rubricEditors);
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
    };

    return sectionsApi.create({ section: payload }).then((section: Section) => {
      setSections([...sections, section]);
      if (props.currentCourse) {
        // Previously mutated course sections list. Skipping for now as currentCourse is likely immutable prop
      }
      return section;
    });
  };

  const deleteSection = (sectionID: number) => {
    const sectionIndex = sections.findIndex((s) => s.id === sectionID);
    if (sectionIndex === -1) return Promise.reject('No section with this ID exists.');

    const thisSection = sections[sectionIndex];
    const sectionStudents = thisSection.students;

    return sectionsApi.destroy({ id: sectionID }).then(() => {
      const newSections = sections.filter((s) => s.id !== sectionID);
      const newSectionsByStudent = { ...sectionsByStudent };
      sectionStudents.forEach((student) => {
        if (student) {
          delete newSectionsByStudent[student];
        }
      });

      setSections(newSections);
      setSectionsByStudent(newSectionsByStudent);
    });
  };

  const updateSection = (toUpdate: Section): Promise<void> => {
    const oldSection = sections.find((s) => s.id === toUpdate.id);
    if (!oldSection) return Promise.reject('This section does not exist.');

    const oldStudents = [...oldSection.students];

    // Use partial update with full object to update fields
    // toUpdate is Section type (User, ID, course, etc)
    // Omit ID from body
    const { id, ...rest } = toUpdate;
    const payload: SectionPatchPayload = { ...rest };

    return sectionsApi.partialUpdate({ id, patchedSection: payload }).then((newSection) => {
      const newStudents = newSection.students;
      const removedStudents = oldStudents.filter((student) => !newStudents.includes(student));
      const addedStudents = newStudents.filter((student) => !oldStudents.includes(student));

      const sectionMap = { ...sectionsByStudent };
      for (const removed of removedStudents) {
        if (removed) delete sectionMap[removed];
      }
      for (const added of addedStudents) {
        if (added) sectionMap[added] = newSection;
      }

      const otherSections = sections
        .filter((s) => s.id !== newSection.id)
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
      const updatedSection = cloneDeep(newSection);
      updatedSection.students = [...updatedSection.students, studentEmail];
      promises.push(updateSection(updatedSection));
    } else if (oldSection) {
      const updatedSection = cloneDeep(oldSection);
      updatedSection.students = updatedSection.students.filter((el: string | null) => el !== studentEmail);
      promises.push(updateSection(updatedSection));
    }

    return Promise.all(promises).then(() => {});
  };

  /************************************************************************
  /* Assignment handling methods
  /***********************************************************************/

  const updateAssignment = (patchObj: Partial<Assignment> & { id: number }): Promise<void> => {
    const { id, ...rest } = patchObj;
    const payload: AssignmentPatchPayload = rest as AssignmentPatchPayload;
    return assignmentsApi.partialUpdate({ id, patchedAssignment: payload }).then((updatedGenerated) => {
      const assignment = sanitizeAssignment(updatedGenerated);
      setAssignments(assignments.map((assn) => (assn.id === assignment.id ? assignment : assn)));
    });
  };

  const shallowUpdateAssignment = (assignmentID: number, field: string, value: number) => {
    setAssignments(assignments.map((assn) => (assn.id === assignmentID ? { ...assn, [field]: value } : assn)));
  };

  const createAssignment = (
    aName: string,
    aPoints: number,
    studentUpload: boolean,
    isVisible: boolean,
    dueDate?: string,
    sortKey?: number,
  ): Promise<Assignment> => {
    const { currentCourse } = props;
    if (!currentCourse) return Promise.reject();

    const payload: AssignmentCreatePayload = {
      course: currentCourse.id,
      name: aName,
      points: aPoints,
      isReleased: false,
      hideGrades: false,
      sortKey,
      allowStudentUpload: studentUpload,
      uploadDueDate: dueDate,
      isVisible,
      feedbackReleased: false,
    };

    // assignmentsApi is imported from clients
    return assignmentsApi.create({ assignment: payload }).then((resp) => {
      const assignment = sanitizeAssignment(resp);
      const newSubsByGrader = { ...submissionsByGrader };
      graders.forEach((grader) => {
        newSubsByGrader[grader][assignment.id] = [];
      });

      const newAssignments = uniqBy([...assignments, assignment], (a) => a.name);

      setSubmissions((prev) => ({ ...prev, [assignment.id]: [] }));
      setAssignments(newAssignments);
      setSubmissionsByGrader(newSubsByGrader);

      props.addAssignment(assignment);
      return assignment;
    });
  };

  const deleteAssignment = (toDelete: Assignment) => {
    const { currentCourse } = props;
    if (!currentCourse) return Promise.reject();

    // assignmentsApi is imported from clients

    return assignmentsApi.destroy({ id: toDelete.id }).then(() => {
      const newAssignments = assignments.filter((el) => el.id !== toDelete.id);
      // We need to remove it from submissions map
      const newSubmissions = { ...submissions };
      delete newSubmissions[toDelete.id];

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
    // submissionsApi is imported from clients
    const promises = submissionsToUpdate.map((s) => {
      const payload = getPayload(s) as SubmissionPatchPayload;
      return submissionsApi
        .partialUpdate({ id: s.id, patchedSubmission: payload })
        .then((updated) => updated as SubmissionInfoType);
    });

    return Promise.all(promises).then((updatedSubmissions) => {
      const newSubmissions = { ...submissions, [assignmentID]: updatedSubmissions };
      setSubmissions(newSubmissions);
      updateSubmissionsByUser(undefined, newSubmissions, undefined);
    });
  };

  const updateSubmission = (toUpdate: SubmissionInfoType) => {
    const assignmentID = toUpdate.assignment;
    const oldSubmission = submissions[assignmentID]?.find((el) => el.id === toUpdate.id);

    if (oldSubmission === undefined) return Promise.reject('Submission does not exist');

    // submissionsApi is imported from clients
    const payload = toUpdate as SubmissionPatchPayload;
    return submissionsApi.partialUpdate({ id: toUpdate.id, patchedSubmission: payload }).then((updated) => {
      const updatedSubmission = updated as SubmissionInfoType;
      const newAssignmentSubs = [
        ...submissions[assignmentID].filter((s) => s.id !== updatedSubmission.id),
        updatedSubmission,
      ];
      const newSubmissions = { ...submissions, [assignmentID]: newAssignmentSubs };

      // Update student mappings
      const newSubmissionsByStudent = { ...submissionsByStudent };
      const removedStudents = (oldSubmission.students as (string | null)[]).filter(
        (student) => student && updatedSubmission.students.indexOf(student) < 0,
      ) as string[];

      removedStudents.forEach((student) => {
        if (newSubmissionsByStudent[student]) {
          delete newSubmissionsByStudent[student][assignmentID];
        }
      });

      (updatedSubmission.students as (string | null)[]).forEach((student) => {
        if (student) {
          const s = student as string;
          if (!newSubmissionsByStudent[s]) {
            newSubmissionsByStudent[s] = {};
          }
          newSubmissionsByStudent[s][assignmentID] = updatedSubmission;
        }
      });

      // Update grader mappings
      const newGraderMap = { ...submissionsByGrader };
      if (oldSubmission.grader && oldSubmission.grader !== updatedSubmission.grader) {
        newGraderMap[oldSubmission.grader][assignmentID] = newGraderMap[oldSubmission.grader][assignmentID].filter(
          (s) => s.id !== updatedSubmission.id,
        );
      }

      if (updatedSubmission.grader) {
        const existingGraderSubs = newGraderMap[updatedSubmission.grader!][assignmentID] || [];
        newGraderMap[updatedSubmission.grader!][assignmentID] = [
          ...existingGraderSubs.filter((s) => s.id !== updatedSubmission.id),
          updatedSubmission,
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

    // submissionsApi is imported from clients
    return submissionsApi.destroy({ id: sub.id }).then(() => {
      const newAssignmentSubs = submissions[assignmentID].filter((s) => s.id !== sub.id);
      const newSubmissions = { ...submissions, [assignmentID]: newAssignmentSubs };

      const newSubmissionsByStudent = { ...submissionsByStudent };
      (sub.students as (string | null)[]).forEach((student) => {
        if (student && newSubmissionsByStudent[student]) {
          delete newSubmissionsByStudent[student][assignmentID];
        }
      });

      const newSubmissionsByGrader = { ...submissionsByGrader };
      if (sub.grader) {
        newSubmissionsByGrader[sub.grader][assignmentID] = newSubmissionsByGrader[sub.grader][assignmentID].filter(
          (s) => s.id !== sub.id,
        );
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

  const addFilesToSubmission = (submission: SubmissionInfoType, files: UploadFile[]) => {
    // submissionFilesApi is imported from clients
    const filePromises = files.map((file: UploadFile) => {
      const ext = getFileExtension(file.name);
      const fileData = file.data ?? '';
      const payload: SubmissionFileCreatePayload = {
        name: file.name,
        extension: ext,
        data: fileData,
        submission: submission.id,
        path: file.path ? file.path : null,
      };
      return submissionFilesApi.create({
        submissionFile: payload,
      });
    });

    return Promise.all(filePromises).then(() => submission);
  };

  const uploadSubmission = (assignment: Assignment, partners: string[], files: UploadFile[]) => {
    if (partners.length === 0) return Promise.reject();

    const submissionPayload: SubmissionCreatePayload = {
      isFinalized: false,
      assignment: assignment.id,
      students: partners,
    };

    // submissionsApi is imported from clients
    return submissionsApi.create({ submission: submissionPayload }).then((submission) => {
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

  const platformCaps = usePlatformCapabilities();
  const canCreateCourse = platformCaps.create_course !== false;

  const dropdown = (
    <CourseMenu base="admin" panel="assignments" courses={courses} currentCourse={props.currentCourse} />
  );
  const createButton = canCreateCourse ? <NewCourseDialog courses={courses} createCourse={createCourse} /> : null;
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
      key="onboarding"
      open={onboardingModalVisible}
      onCancel={closeModal}
      email={props.user.email!}
      onDemoCreate={handleDemoCourse}
      demoCourseExists={courses.some((el) => el.period === 'demo')}
    />,
  ];

  const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;

  const navigation = (collapsed: boolean) => (
    <AdminNav baseURL={courseURL} collapsed={collapsed} courseId={props.currentCourse?.id} />
  );

  const banner =
    props.currentCourse && assignments && assignments.length === 1 ? (
      <AssignmentSetupBanner
        course={props.currentCourse}
        hasStudents={students.length > 0}
        hasSubmissions={submissions && submissions[assignments[0].id] && submissions[assignments[0].id].length > 0}
        onClose={() => {}}
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
          sections: sectionsLoadComplete,
        }}
        // User Context
        user={props.user}
        myEmail={props.user.email!}
        assignments={assignments}
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
        rubricEditors={rubricEditors}
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

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState, useEffect, useMemo } from 'react';

import { SettingOutlined } from '@ant-design/icons';

/* ant imports */
import { Button, Empty } from 'antd';

/* other library imports */
import { useQueryClient } from '@tanstack/react-query';
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
import { Course, CourseFile, Section } from '../../api-client';
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
import { withQueryParams } from '../../utils/apiClient';

import {
  useAssignmentsQuery,
  sanitizeAssignment,
  useRosterQuery,
  normalizeRoster,
  useSectionsQuery,
  useSubmissionsQuery,
  useViewHistoriesQuery,
} from './hooks';
import type { RosterData } from './hooks';
import { assignmentKeys, courseKeys } from '../../lib/queryKeys';

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
  const queryClient = useQueryClient();

  /**** UI control data ****/
  const [onboardingModalVisible, setOnboardingModalVisible] = useState(false);
  const [cipModalVisible, setCipModalVisible] = useState(false);

  /**** Top-level course data ****/
  const [courses, setCourses] = useState<Course[]>([]);

  /**** Query-based data fetching ****/
  const courseId = props.currentCourse?.id;

  const assignmentsQuery = useAssignmentsQuery(props.currentCourse);
  const assignments = assignmentsQuery.data ?? [];

  const rosterQuery = useRosterQuery(courseId);
  const roster = rosterQuery.data;
  const students = roster?.students ?? [];
  const inactiveStudents = roster?.inactive_students ?? [];
  const graders = roster?.graders ?? [];
  const inactiveGraders = roster?.inactive_graders ?? [];
  const admins = roster?.courseAdmins ?? [];
  const superGraders = roster?.superGraders ?? [];
  const rubricEditors = roster?.rubricEditors ?? [];
  const notActivated = roster?.not_activated ?? [];

  const sectionsQuery = useSectionsQuery(courseId);
  const sections = sectionsQuery.data ?? [];

  const sectionsByStudent = useMemo(() => {
    const map: { [email: string]: Section } = {};
    sections.forEach((sec) => {
      sec.students.forEach((stu) => {
        if (stu) map[stu] = sec;
      });
    });
    return map;
  }, [sections]);

  const submissionsQuery = useSubmissionsQuery(courseId, assignmentsQuery.data);
  const submissions = submissionsQuery.data ?? {};

  const viewHistoriesQuery = useViewHistoriesQuery(courseId, assignmentsQuery.data);
  const viewsBySubmission = viewHistoriesQuery.data ?? {};

  /**** Derived data ****/
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
          (submission.students as (string | null)[]).forEach((student: string | null) => {
            if (student && student in subsByStudent) {
              subsByStudent[student][assignment.id] = submission;
            }
          });

          if (submission.grader && submission.grader in subsByGrader) {
            subsByGrader[submission.grader][assignment.id].push(submission);
          }
        });
      }
    });

    return { subsByStudent, subsByGrader };
  };

  const { subsByStudent: submissionsByStudent, subsByGrader: submissionsByGrader } = useMemo(() => {
    if (!roster || assignments.length === 0) {
      return { subsByStudent: {} as IStudentSubmissionsDataTable, subsByGrader: {} as IGraderSubmissionsDataTable };
    }
    return generateSubmissionsByUser(
      { students, graders, inactive_students: inactiveStudents, inactive_graders: inactiveGraders },
      submissions,
      assignments,
    );
  }, [roster, students, graders, inactiveStudents, inactiveGraders, submissions, assignments]);

  /**** Loading states ****/
  const rosterLoadComplete = !rosterQuery.isPending;
  const sectionsLoadComplete = !sectionsQuery.isPending;
  const assignmentsLoadComplete = !assignmentsQuery.isPending;
  const partialSubmissionsLoadComplete = !submissionsQuery.isPending;
  const fullSubmissionsLoadComplete = !submissionsQuery.isPending;
  const submissionsByUserLoadComplete = rosterLoadComplete && !submissionsQuery.isPending;

  // Initialize state based on props (mimicking constructor)
  useEffect(() => {
    const showCIPModal = !props.user.hasCredentials;
    const hasOnboardingParam = Object.prototype.hasOwnProperty.call(queryString.parse(location.search), 'onboarding');
    const hasDismissed = localStorage.getItem('cp_onboarding_dismissed') === '1';
    const showOnboarding = hasOnboardingParam || (props.initialCourses.length === 0 && !hasDismissed);

    setOnboardingModalVisible(showOnboarding && !showCIPModal);
    setCipModalVisible(showCIPModal);
    setCourses(props.initialCourses);
  }, [location.search, props.initialCourses, props.user.hasCredentials]);

  // Document Title
  useEffect(() => {
    document.title = 'codePost - Admin Console';
  }, [navigate]);

  /***********************************************************************************
  /* Helper Functions (Business Logic)
  /**********************************************************************************/

  /* LOADERS */

  type AssignmentCreatePayload = AssignmentCreateRequest['assignment'];
  type AssignmentPatchPayload = AssignmentPartialUpdateRequest['patchedAssignment'];
  type SubmissionPatchPayload = SubmissionPartialUpdateRequest['patchedSubmission'];
  type SubmissionCreatePayload = SubmissionCreateRequest['submission'];
  type SubmissionFileCreatePayload = SubmissionFileCreateRequest['submissionFile'];
  type SectionPatchPayload = SectionPartialUpdateRequest['patchedSection'];

  /** Invalidate all course data queries for the current course */
  const refreshCourseData = () => {
    if (!courseId) return;
    queryClient.invalidateQueries({ queryKey: assignmentKeys.list(courseId) });
    queryClient.invalidateQueries({ queryKey: assignmentKeys.submissions(courseId) });
    queryClient.invalidateQueries({ queryKey: assignmentKeys.viewHistories(courseId) });
    queryClient.invalidateQueries({ queryKey: courseKeys.roster(courseId) });
    queryClient.invalidateQueries({ queryKey: courseKeys.sections(courseId) });
  };

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
      queryClient.setQueryData(courseKeys.roster(currentCourse.id), roster);
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
      queryClient.setQueryData(courseKeys.sections(props.currentCourse!.id), (old: Section[] | undefined) => [
        ...(old ?? []),
        section,
      ]);
      return section;
    });
  };

  const deleteSection = (sectionID: number) => {
    const sectionIndex = sections.findIndex((s) => s.id === sectionID);
    if (sectionIndex === -1) return Promise.reject('No section with this ID exists.');

    return sectionsApi.destroy({ id: sectionID }).then(() => {
      queryClient.setQueryData(courseKeys.sections(courseId!), (old: Section[] | undefined) =>
        (old ?? []).filter((s) => s.id !== sectionID),
      );
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
      const addedStudents = newStudents.filter((student) => !oldStudents.includes(student));

      queryClient.setQueryData(courseKeys.sections(courseId!), (old: Section[] | undefined) => {
        const otherSections = (old ?? [])
          .filter((s) => s.id !== newSection.id)
          .map((el) => ({
            ...el,
            students: el.students.filter((stu) => addedStudents.indexOf(stu) === -1),
          }));
        return [...otherSections, newSection];
      });
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
      queryClient.setQueryData(assignmentKeys.list(courseId!), (old: Assignment[] | undefined) =>
        (old ?? []).map((assn) => (assn.id === assignment.id ? assignment : assn)),
      );
    });
  };

  const shallowUpdateAssignment = (assignmentID: number, field: string, value: number) => {
    queryClient.setQueryData(assignmentKeys.list(courseId!), (old: Assignment[] | undefined) =>
      (old ?? []).map((assn) => (assn.id === assignmentID ? { ...assn, [field]: value } : assn)),
    );
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

      queryClient.setQueryData(assignmentKeys.list(courseId!), (old: Assignment[] | undefined) =>
        uniqBy([...(old ?? []), assignment], (a) => a.name),
      );
      queryClient.setQueryData(
        assignmentKeys.submissions(courseId!),
        (old: IAssignmentToSubmissionsMap | undefined) => ({
          ...(old ?? {}),
          [assignment.id]: [],
        }),
      );

      props.addAssignment(assignment);
      return assignment;
    });
  };

  const deleteAssignment = (toDelete: Assignment) => {
    const { currentCourse } = props;
    if (!currentCourse) return Promise.reject();

    return assignmentsApi.destroy({ id: toDelete.id }).then(() => {
      queryClient.setQueryData(assignmentKeys.list(courseId!), (old: Assignment[] | undefined) =>
        (old ?? []).filter((el) => el.id !== toDelete.id),
      );
      queryClient.setQueryData(
        assignmentKeys.submissions(courseId!),
        (old: IAssignmentToSubmissionsMap | undefined) => {
          const newSubmissions = { ...(old ?? {}) };
          delete newSubmissions[toDelete.id];
          return newSubmissions;
        },
      );

      props.deleteAssignment(toDelete);
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
      queryClient.setQueryData(
        assignmentKeys.submissions(courseId!),
        (old: IAssignmentToSubmissionsMap | undefined) => ({
          ...(old ?? {}),
          [assignmentID]: updatedSubmissions,
        }),
      );
    });
  };

  const updateSubmission = (toUpdate: SubmissionInfoType) => {
    const assignmentID = toUpdate.assignment;
    const oldSubmission = submissions[assignmentID]?.find((el) => el.id === toUpdate.id);

    if (oldSubmission === undefined) return Promise.reject('Submission does not exist');

    const payload = toUpdate as SubmissionPatchPayload;
    return submissionsApi.partialUpdate({ id: toUpdate.id, patchedSubmission: payload }).then((updated) => {
      const updatedSubmission = updated as SubmissionInfoType;

      queryClient.setQueryData(
        assignmentKeys.submissions(courseId!),
        (old: IAssignmentToSubmissionsMap | undefined) => {
          const prev = old ?? {};
          const newAssignmentSubs = [
            ...(prev[assignmentID] ?? []).filter((s) => s.id !== updatedSubmission.id),
            updatedSubmission,
          ];
          return { ...prev, [assignmentID]: newAssignmentSubs };
        },
      );
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
      queryClient.setQueryData(
        assignmentKeys.submissions(courseId!),
        (old: IAssignmentToSubmissionsMap | undefined) => {
          const prev = old ?? {};
          return { ...prev, [assignmentID]: (prev[assignmentID] ?? []).filter((s) => s.id !== sub.id) };
        },
      );
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

      queryClient.setQueryData(
        assignmentKeys.submissions(courseId!),
        (old: IAssignmentToSubmissionsMap | undefined) => {
          const prev = old ?? {};
          return {
            ...prev,
            [submission.assignment]: [...(prev[submission.assignment] ?? []), submission],
          };
        },
      );

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
        refreshCourseData={refreshCourseData}
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

import React, { lazy } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

// Lazy-loaded route components
const ManageAssignments = lazy(() => import('./assignments/ManageAssignments'));
const RosterManager = lazy(() => import('./roster/RosterManager'));
const CourseSettingsPanel = lazy(() => import('./settings/CourseSettingsPanel'));
const WebhooksPanel = lazy(() => import('./settings/WebhooksPanel'));
const SubmissionsManager = lazy(() => import('./submissions/SubmissionsManager'));
const VideoModal = lazy(() => import('../landing/VideoModal'));
import ErrorBoundary from '../core/ErrorBoundary';

/* types */
import {
  IAssignmentToSubmissionsMap,
  IGraderSubmissionsDataTable,
  IStudentSubmissionsDataTable,
  USER_APP,
} from '../../types/common';

import { Course, Section } from '../../api-client';

import { Submission } from '../../api-client';
import { User } from '../../api-client';
import { UploadFile } from '../../types/common';

import {
  Assignment, // Imported from shared types
} from '../../types/common';

interface AdminRoutesProps {
  course: Course;
  courseURL: string;

  // Loaded Data
  assignments: Assignment[];
  students: string[];
  graders: string[];
  admins: string[];
  superGraders: string[];
  rubricEditors: string[];
  inactiveStudents: string[];
  inactiveGraders: string[];
  notActivated: string[];
  sections: Section[];
  sectionsByStudent: { [studentEmail: string]: Section };
  submissions: IAssignmentToSubmissionsMap;
  submissionsByStudent: IStudentSubmissionsDataTable;
  submissionsByGrader: IGraderSubmissionsDataTable;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };

  // Load Status
  loadComplete: {
    assignments: boolean;
    submissionsPartial: boolean;
    submissionsFull: boolean;
    submissionsByUser: boolean;
    roster: boolean;
    sections: boolean;
  };

  // User Context
  user: User;
  myEmail: string;

  // Handlers
  createAssignment: (
    aName: string,
    aPoints: number,
    studentUpload: boolean,
    isVisible: boolean,
    dueDate?: string,
    sortKey?: number,
  ) => Promise<Assignment>;
  updateAssignment: (patchObj: Partial<Assignment> & { id: number }) => Promise<void>;
  deleteAssignment: (toDelete: Assignment) => Promise<void>;
  shallowUpdateAssignment: (assignmentID: number, field: string, value: number) => void;

  updateSettings: (course: Course) => Promise<Course>;

  updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;

  createSection: (newSection: string) => Promise<Section>;
  updateSection: (toUpdate: Section) => Promise<void>;
  deleteSection: (sectionID: number) => Promise<void>;
  updateStudentSection: (studentEmail: string, sectionID: number) => Promise<void>;

  uploadSubmission: (assignment: Assignment, partners: string[], files: UploadFile[]) => Promise<Submission>;
  addFilesToSubmission: (submission: Submission, files: UploadFile[]) => Promise<Submission>;
  deleteSubmission: (toDelete: Submission) => Promise<void>;
  updateSubmission: (toUpdate: Submission) => Promise<void>;
  changeSubmissionGrader: (submission: Submission, grader: string | undefined) => Promise<void>;
  bulkUpdateSubmissions: (assignmentID: number, getPayload: (sub: Submission) => Partial<Submission>) => Promise<void>;

  courses: Course[];

  // Actions
  refreshCourseData: () => void;
}

const AdminRoutes: React.FC<AdminRoutesProps> = (props) => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary type="app">
      <Routes>
        <Route
          path="submissions/*"
          element={
            <SubmissionsManager
              key="submissions"
              course={props.course}
              courseURL={props.courseURL}
              loadComplete={
                props.loadComplete.submissionsByUser &&
                props.loadComplete.assignments &&
                props.loadComplete.submissionsFull
              }
              assignments={props.assignments}
              submissionsByStudent={props.submissionsByStudent}
              deleteSubmission={props.deleteSubmission}
              graders={props.graders}
              changeSubmissionGrader={props.changeSubmissionGrader}
              uploadSubmission={props.uploadSubmission}
              addFilesToSubmission={props.addFilesToSubmission}
              viewsBySubmission={props.viewsBySubmission}
              students={props.students}
              inactiveStudents={props.inactiveStudents}
              submissionsByAssignment={props.submissions}
              submissionsByGrader={props.submissionsByGrader}
              inactiveGraders={props.inactiveGraders}
              baseURL={`${props.courseURL}/submissions`}
            />
          }
        />
        <Route
          path="assignments/*"
          element={
            <ManageAssignments
              key="assignments"
              loadComplete={props.loadComplete.assignments}
              partialSubmissionsLoadComplete={props.loadComplete.submissionsPartial}
              fullSubmissionsLoadComplete={props.loadComplete.submissionsFull}
              submissionsByUserLoadComplete={props.loadComplete.submissionsByUser}
              submissions={props.submissions}
              currentCourse={props.course}
              assignments={props.assignments}
              updateAssignment={props.updateAssignment}
              createAssignment={props.createAssignment}
              deleteAssignment={props.deleteAssignment}
              submissionsByStudent={props.submissionsByStudent}
              students={props.students}
              uploadSubmission={props.uploadSubmission}
              deleteSubmission={props.deleteSubmission}
              updateSubmission={props.updateSubmission}
              viewsBySubmission={props.viewsBySubmission}
              refreshCourseData={props.refreshCourseData}
              myEmail={props.myEmail}
              user={props.user}
              shallowUpdateAssignment={props.shallowUpdateAssignment}
              bulkUpdateSubmissions={props.bulkUpdateSubmissions}
              sections={props.sections}
              courses={props.courses}
              baseURL={`${props.courseURL}/assignments`}
            />
          }
        />
        <Route
          path="roster/*"
          element={
            <RosterManager
              key="roster"
              notActivated={props.notActivated}
              sections={props.sections}
              students={props.students}
              graders={props.graders}
              admins={props.admins}
              superGraders={props.superGraders}
              rubricEditors={props.rubricEditors}
              loadComplete={props.loadComplete.roster}
              sectionsLoadComplete={props.loadComplete.sections}
              currentCourse={props.course}
              updateRoster={props.updateRoster}
              sectionsByStudent={props.sectionsByStudent}
              updateSection={props.updateSection}
              createSection={props.createSection}
              updateStudentSection={props.updateStudentSection}
              myEmail={props.myEmail}
              deleteSection={props.deleteSection}
            />
          }
        />
        <Route path="settings/webhooks" element={<WebhooksPanel currentCourse={props.course} />} />
        <Route
          path="settings"
          element={<CourseSettingsPanel currentCourse={props.course} updateSettings={props.updateSettings} />}
        />
        <Route path="video" element={<VideoModal open={true} onCancel={() => navigate('/admin')} />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default AdminRoutes;

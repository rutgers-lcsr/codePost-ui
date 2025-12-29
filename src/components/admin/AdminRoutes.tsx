import React, { lazy } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

// Lazy-loaded route components
const ManageAssignments = lazy(() => import('./assignments/ManageAssignments'));
const RosterManager = lazy(() => import('./roster/RosterManager'));
const CourseSettingsPanel = lazy(() => import('./settings/CourseSettingsPanel'));
const WebhooksPanel = lazy(() => import('./settings/WebhooksPanel'));
const SubmissionsManager = lazy(() => import('./submissions/SubmissionsManager'));
const VideoModal = lazy(() => import('../landing/VideoModal'));

/* types */
import {
    IAssignmentToSubmissionsMap,
    IGraderSubmissionsDataTable,
    IStudentSubmissionsDataTable,
    USER_APP,
} from '../../types/common';

import { AssignmentPatchType, AssignmentType } from '../../infrastructure/assignment';
import { CoursePatchType, CourseType } from '../../infrastructure/course';
import { FileType } from '../../infrastructure/file';
import { SectionType } from '../../infrastructure/section';
import { SubmissionInfoType } from '../../infrastructure/submission';
import { UserType } from '../../infrastructure/user';


interface AdminRoutesProps {
    course: CourseType;
    courseURL: string;

    // Loaded Data
    assignments: AssignmentType[];
    students: string[];
    graders: string[];
    admins: string[];
    superGraders: string[];
    inactiveStudents: string[];
    inactiveGraders: string[];
    notActivated: string[];
    sections: SectionType[];
    sectionsByStudent: { [studentEmail: string]: SectionType };
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
    user: UserType;
    myEmail: string;

    // Handlers
    createAssignment: (aName: string, aPoints: number, studentUpload: boolean, isVisible: boolean, dueDate?: string, sortKey?: number) => Promise<AssignmentType>;
    updateAssignment: (patchObj: AssignmentPatchType) => Promise<void>;
    deleteAssignment: (toDelete: AssignmentType) => Promise<void>;
    shallowUpdateAssignment: (assignmentID: number, field: string, value: number) => void;

    updateSettings: (course: CoursePatchType) => Promise<CourseType>;

    updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;

    createSection: (newSection: string) => Promise<SectionType>;
    updateSection: (toUpdate: SectionType) => Promise<void>;
    deleteSection: (sectionID: number) => Promise<void>;
    updateStudentSection: (studentEmail: string, sectionID: number) => Promise<void>;

    uploadSubmission: (assignment: AssignmentType, partners: string[], files: FileType[]) => Promise<SubmissionInfoType>;
    addFilesToSubmission: (submission: SubmissionInfoType, files: FileType[]) => Promise<SubmissionInfoType>;
    deleteSubmission: (toDelete: SubmissionInfoType) => Promise<void>;
    updateSubmission: (toUpdate: SubmissionInfoType) => Promise<void>;
    changeSubmissionGrader: (submission: SubmissionInfoType, grader: string | undefined) => Promise<void>;
    bulkUpdateSubmissions: (
        assignmentID: number,
        getPayload: (sub: SubmissionInfoType) => Partial<SubmissionInfoType>,
    ) => Promise<void>;

    courses: CourseType[];

    // Actions
    refreshCourseData: () => void;
}

const AdminRoutes: React.FC<AdminRoutesProps> = (props) => {
    const navigate = useNavigate();

    return (
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
            <Route
                path="settings/webhooks"
                element={
                    <WebhooksPanel currentCourse={props.course} />
                }
            />
            <Route
                path="settings"
                element={
                    <CourseSettingsPanel
                        currentCourse={props.course}
                        updateSettings={props.updateSettings}
                    />
                }
            />
            <Route
                path="video"
                element={
                    <VideoModal open={true} onCancel={() => navigate('/admin')} />
                }
            />
        </Routes>
    );
};

export default AdminRoutes;

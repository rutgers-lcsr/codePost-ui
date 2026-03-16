// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import { lazy, Suspense } from 'react';

/* antd imports */
import { Tag } from 'antd';

/* other library imports */

import { Link, Navigate, Route, Routes } from 'react-router-dom';

/* codePost imports */
/* codePost imports */
import { Course, Section, User } from '../../../api-client';

import {
  Assignment,
  IAssignmentToSubmissionsMap,
  IStudentSubmissionsDataTable,
  SubmissionInfoType,
  UploadFile,
} from '../../../types/common';

// Keep synchronous - needed for main table
import AssignmentsTable from './AssignmentsTable';
import { DETAIL_TYPE } from './types';

import { encodeForRoute } from '../../core/URLutils';

import Loading from '../../core/Loading';

// Lazy load heavy sub-components for code splitting
const RubricManager = lazy(() => import('../../../components/core/rubric/RubricManager'));
const RubricUI = lazy(() => import('./rubric/RubricUI'));
const AssignmentStats = lazy(() => import('./assignments/AssignmentStats/AssignmentStats'));
const AssignmentRegrades = lazy(() => import('./assignments/AssignmentRegrades'));
const AssignmentTests = lazy(() => import('./tests/AssignmentTests').then((m) => ({ default: m.AssignmentTests })));
const Moss = lazy(() => import('./assignments/Moss'));
const RubricOverview = lazy(() => import('./rubric/RubricOverview'));
const TestsOverview = lazy(() => import('./tests/TestsOverview'));

// Type import for RubricManager params
import type { IRubricManagerParams } from '../../../components/core/rubric/RubricManager';

/**********************************************************************************************************************/

export interface IManageAssignmentsProps {
  /* assignment data */
  assignments: Assignment[];
  submissions: IAssignmentToSubmissionsMap;
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;
  currentCourse: Course | undefined;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  sections: Section[];
  courses: Course[];

  /* loading state */
  loadComplete: boolean;
  partialSubmissionsLoadComplete: boolean;
  fullSubmissionsLoadComplete: boolean;
  submissionsByUserLoadComplete: boolean;

  /* object-level REST operations */
  createAssignment: (
    assignmentName: string,
    assignmentPoints: number,
    upload: boolean,
    isVisible: boolean,
    dueDate?: string,
    sortKey?: number,
  ) => Promise<Assignment>;
  updateAssignment: (assignment: Partial<Assignment> & { id: number }) => Promise<void>;
  deleteAssignment: (assignment: Assignment) => Promise<void>;
  shallowUpdateAssignment: (assignmentID: number, field: string, value: number) => void;
  bulkUpdateSubmissions: (
    assignmentID: number,
    getPayload: (sub: SubmissionInfoType) => Partial<SubmissionInfoType>,
  ) => Promise<void>;

  uploadSubmission: (assignment: Assignment, partners: string[], files: UploadFile[]) => Promise<SubmissionInfoType>;
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;

  /* Refresh course */
  refreshCourseData: () => void;

  /* misc */
  myEmail: string;

  /* user data */
  /* user data */
  user: User;
  baseURL: string;
}

/**********************************************************************************************************************/

import { useNavigate, useLocation, useParams } from 'react-router-dom';

interface LegacyRouteProps {
  match: { params: Record<string, string | undefined>; url: string; path: string; isExact: boolean };
  location: ReturnType<typeof useLocation>;
  history: {
    push: (path: string) => void;
    replace: (path: string) => void;
    go: (n: number) => void;
    goBack: () => void;
    goForward: () => void;
    location: ReturnType<typeof useLocation>;
  };
}

const RoutePropsWrapper = ({ render }: { render: (props: LegacyRouteProps) => React.ReactElement }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Mock match and history
  const match = { params, url: location.pathname, path: location.pathname, isExact: true };
  const history = {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    go: (n: number) => navigate(n as number),
    goBack: () => navigate(-1),
    goForward: () => navigate(1),
    location,
  };

  return render({ match, location, history });
};

const ManageAssignments = (props: IManageAssignmentsProps) => {
  if (!props.loadComplete || props.currentCourse === undefined) {
    return <Loading />;
  }
  const cancel = () => {
    return;
  };

  const baseURL = props.baseURL;

  const breadcrumbs: Array<{ title: React.ReactNode }> = [
    {
      title: (
        <>{props.currentCourse !== undefined && props.currentCourse.archived ? <Tag>Archived</Tag> : null}Assignments</>
      ),
    },
  ];

  return (
    <Routes>
      {props.assignments.flatMap((assignment) => {
        const encodedName = encodeForRoute(assignment.name);
        return [
          <Route
            key={`${encodedName}-rubric`}
            path={`rubrics/${encodedName}`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) => (
                  <Suspense fallback={<Loading />}>
                    <RubricManager
                      {...subprops}
                      assignment={assignment}
                      submissions={props.submissions[assignment.id]}
                      onCancel={cancel}
                      shouldLoadFeedback={true}
                      shouldLoadInstanceLists={true}
                    >
                      {(params: IRubricManagerParams) => {
                        const propz = {
                          ...params.props,
                          breadcrumbs: [
                            ...breadcrumbs,
                            {
                              title: <Link to={`${props.baseURL}/rubrics`}>Rubrics</Link>,
                            },
                          ],
                          baseURL: `${props.baseURL}/${encodedName}/rubric`,
                          history: subprops.history,
                        };
                        return (
                          <RubricUI
                            key={`rubric-ui-${encodedName}`}
                            props={propz}
                            state={params.state}
                            helpers={params.helpers}
                          />
                        );
                      }}
                    </RubricManager>
                  </Suspense>
                )}
              />
            }
          />,
          <Route
            key={`${encodedName}-stats`}
            path={`${encodedName}/stats`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) =>
                  !props.fullSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
                    <Suspense fallback={<Loading />}>
                      <AssignmentStats
                        {...subprops}
                        course={props.currentCourse!}
                        assignment={assignment}
                        submissions={
                          Object.prototype.hasOwnProperty.call(props.submissions, assignment.id)
                            ? props.submissions[assignment.id]
                            : null
                        }
                        students={props.students}
                        submissionsByStudent={props.submissionsByStudent}
                        viewsBySubmission={props.viewsBySubmission}
                        refreshCourseData={props.refreshCourseData}
                        myEmail={props.myEmail}
                        breadcrumbs={breadcrumbs}
                      />
                    </Suspense>
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-regrades`}
            path={`${encodedName}/regrades`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) =>
                  !props.partialSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
                    <Suspense fallback={<Loading />}>
                      <AssignmentRegrades
                        {...subprops}
                        assignment={assignment}
                        submissions={props.submissions[assignment.id]}
                        refreshCourseData={props.refreshCourseData}
                        onCancel={cancel}
                        user={props.user}
                        updateSubmission={props.updateSubmission}
                        currentCourse={props.currentCourse!}
                        breadcrumbs={breadcrumbs}
                      />
                    </Suspense>
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-settings`}
            path={`${encodedName}/settings`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) => (
                  <AssignmentsTable
                    {...props}
                    {...subprops}
                    currentCourse={props.currentCourse!}
                    activeAssignment={assignment}
                    detailType={DETAIL_TYPE.Settings}
                    baseURL={baseURL}
                    breadcrumbs={breadcrumbs}
                    sections={props.sections}
                    courses={props.courses}
                  />
                )}
              />
            }
          />,
          <Route
            key={`${encodedName}-download-grades`}
            path={`${encodedName}/download/grades`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) =>
                  !props.fullSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
                    <AssignmentsTable
                      {...props}
                      {...subprops}
                      currentCourse={props.currentCourse!}
                      activeAssignment={assignment}
                      detailType={DETAIL_TYPE.DownloadGrades}
                      baseURL={baseURL}
                      breadcrumbs={breadcrumbs}
                      sections={props.sections}
                      courses={props.courses}
                    />
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-delete`}
            path={`${encodedName}/delete`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) => (
                  <AssignmentsTable
                    {...props}
                    {...subprops}
                    currentCourse={props.currentCourse!}
                    activeAssignment={assignment}
                    detailType={DETAIL_TYPE.Delete}
                    baseURL={baseURL}
                    breadcrumbs={breadcrumbs}
                    sections={props.sections}
                    courses={props.courses}
                  />
                )}
              />
            }
          />,
          <Route
            key={`${encodedName}-upload-single`}
            path={`${encodedName}/upload/single`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) =>
                  !props.partialSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
                    <AssignmentsTable
                      {...props}
                      {...subprops}
                      currentCourse={props.currentCourse!}
                      activeAssignment={assignment}
                      detailType={DETAIL_TYPE.Upload_Single}
                      baseURL={baseURL}
                      breadcrumbs={breadcrumbs}
                      sections={props.sections}
                      courses={props.courses}
                    />
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-upload-multiple`}
            path={`${encodedName}/upload/multiple`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) =>
                  !props.fullSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
                    <AssignmentsTable
                      {...props}
                      {...subprops}
                      currentCourse={props.currentCourse!}
                      activeAssignment={assignment}
                      detailType={DETAIL_TYPE.Upload_Multiple}
                      baseURL={baseURL}
                      breadcrumbs={breadcrumbs}
                      sections={props.sections}
                      courses={props.courses}
                    />
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-upload-import`}
            path={`${encodedName}/upload/import`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) =>
                  !props.partialSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
                    <AssignmentsTable
                      {...props}
                      {...subprops}
                      currentCourse={props.currentCourse!}
                      activeAssignment={assignment}
                      detailType={DETAIL_TYPE.Upload_Import}
                      baseURL={baseURL}
                      breadcrumbs={breadcrumbs}
                      sections={props.sections}
                      courses={props.courses}
                    />
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-bulk-edit`}
            path={`${encodedName}/bulk-edit`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) =>
                  !props.fullSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
                    <AssignmentsTable
                      {...props}
                      {...subprops}
                      currentCourse={props.currentCourse!}
                      activeAssignment={assignment}
                      detailType={DETAIL_TYPE.BulkSubmissionEdit}
                      baseURL={baseURL}
                      breadcrumbs={breadcrumbs}
                      sections={props.sections}
                      courses={props.courses}
                    />
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-onboarding`}
            path={`${encodedName}/onboarding`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) =>
                  !props.partialSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
                    <AssignmentsTable
                      {...props}
                      {...subprops}
                      currentCourse={props.currentCourse!}
                      activeAssignment={assignment}
                      detailType={DETAIL_TYPE.Onboarding}
                      baseURL={baseURL}
                      breadcrumbs={breadcrumbs}
                      sections={props.sections}
                      courses={props.courses}
                    />
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-environment`}
            path={`environment/${encodedName}/*`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) => (
                  <Suspense fallback={<Loading />}>
                    <AssignmentTests
                      {...subprops}
                      breadcrumbs={breadcrumbs}
                      activeAssignment={assignment}
                      submissions={props.submissions[assignment.id] || []}
                      user={props.user}
                      updateAssignment={props.shallowUpdateAssignment}
                      fullSubmissionsLoadComplete={props.fullSubmissionsLoadComplete}
                    />
                  </Suspense>
                )}
              />
            }
          />,
          <Route
            key={`${encodedName}-plagiarism`}
            path={`plagiarism/${encodedName}`}
            element={
              <RoutePropsWrapper
                render={(subprops: LegacyRouteProps) => (
                  <Suspense fallback={<Loading />}>
                    <Moss
                      {...subprops}
                      assignment={assignment}
                      assignments={props.assignments}
                      course={props.currentCourse!}
                      submissions={props.submissions[assignment.id] || []}
                      user={props.user}
                      breadcrumbs={breadcrumbs}
                    />
                  </Suspense>
                )}
              />
            }
          />,
        ];
      })}

      <Route
        path="environment"
        element={
          <RoutePropsWrapper
            render={(subprops: LegacyRouteProps) => (
              <Suspense fallback={<Loading />}>
                <TestsOverview {...subprops} assignments={props.assignments} />
              </Suspense>
            )}
          />
        }
      />
      <Route
        path="rubrics"
        element={
          <RoutePropsWrapper
            render={(subprops: LegacyRouteProps) => (
              <Suspense fallback={<Loading />}>
                <RubricOverview {...subprops} assignments={props.assignments} course={props.currentCourse} />
              </Suspense>
            )}
          />
        }
      />
      <Route
        path="download/grades"
        element={
          <RoutePropsWrapper
            render={(subprops: LegacyRouteProps) =>
              !props.submissionsByUserLoadComplete ? (
                <Loading />
              ) : (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  currentCourse={props.currentCourse!}
                  breadcrumbs={breadcrumbs}
                  detailType={DETAIL_TYPE.DownloadGrades}
                  baseURL={baseURL}
                  sections={props.sections}
                  courses={props.courses}
                />
              )
            }
          />
        }
      />
      <Route
        path="overview"
        element={
          <RoutePropsWrapper
            render={(subprops: LegacyRouteProps) => {
              return (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  currentCourse={props.currentCourse!}
                  breadcrumbs={breadcrumbs}
                  baseURL={baseURL}
                  courses={props.courses}
                />
              );
            }}
          />
        }
      />
      <Route index element={<Navigate to="overview" replace />} />
      <Route
        path="*"
        element={
          <div style={{ padding: 20 }}>
            <h3>404 - Page not found</h3>
            <p>Current URL: {window.location.href}</p>
          </div>
        }
      />
    </Routes>
  );
};

export default ManageAssignments;

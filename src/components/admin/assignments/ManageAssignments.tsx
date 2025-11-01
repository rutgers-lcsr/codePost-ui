/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */

/* antd imports */
import { Tag } from 'antd';

/* other library imports */
import { RouteComponentProps } from '../../../router/legacy';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { LegacyRouteRenderer } from '../../../router/legacy';

/* codePost imports */
import { AssignmentPatchType, AssignmentType } from '../../../infrastructure/assignment';
import { CourseType, SectionType, SubmissionInfoType } from '../../../infrastructure/types';
import { UserType } from '../../../infrastructure/user';

import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import RubricManager, { IRubricManagerParams } from '../../../components/core/rubric/RubricManager';
import AssignmentRegrades from './assignments/AssignmentRegrades';
import AssignmentStats from './assignments/AssignmentStats/AssignmentStats';
import AssignmentsTable, { DETAIL_TYPE } from './AssignmentsTable';
import RubricUI from './rubric/RubricUI';
import Moss from './assignments/Moss';

import { encodeForRoute } from '../../core/URLutils';

import Loading from '../../core/Loading';

import { AssignmentTests } from './tests/AssignmentTests';

import { FileType } from '../../../infrastructure/types';
import RubricOverview from './rubric/RubricOverview';
import TestsOverview from './tests/TestsOverview';

/**********************************************************************************************************************/

export interface IManageAssignmentsProps {
  /* assignment data */
  assignments: AssignmentType[];
  submissions: IAssignmentToSubmissionsMap;
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;
  currentCourse: CourseType | undefined;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  sections: SectionType[];
  courses: CourseType[];

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
  ) => Promise<AssignmentType>;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;
  shallowUpdateAssignment: (assignmentID: number, field: string, value: number) => void;
  bulkUpdateSubmissions: (
    assignmentID: number,
    getPayload: (sub: SubmissionInfoType) => Partial<SubmissionInfoType>,
  ) => Promise<void>;

  uploadSubmission: (assignment: AssignmentType, partners: string[], files: FileType[]) => Promise<SubmissionInfoType>;
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;

  /* Refresh course */
  refreshCourseData: () => void;

  /* misc */
  myEmail: string;

  /* user data */
  user: UserType;
}

/**********************************************************************************************************************/

const ManageAssignments = (props: IManageAssignmentsProps & RouteComponentProps) => {
  if (!props.loadComplete || props.currentCourse === undefined) {
    return <Loading />;
  }
  const cancel = () => {
    return;
  };

  // Extract the course base URL from the current path
  // props.match.url might be /admin/CourseName/Period/assignments/overview/something
  // We need to extract just /admin/CourseName/Period/assignments
  const getCourseBaseURL = () => {
    const parts = props.match.url.split('/').filter(Boolean);
    const adminIndex = parts.findIndex((part) => part === 'admin');
    if (adminIndex !== -1 && parts.length > adminIndex + 3) {
      // Take admin + courseName + period + assignments
      const baseParts = parts.slice(0, adminIndex + 4);
      return '/' + baseParts.join('/');
    }
    // Fallback: just use match.url
    return props.match.url;
  };
  const baseURL = getCourseBaseURL();

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
        // Note: we don't have to use encodeURIComponent, because react-router automatically
        // encodes assignment.name for us when parsing path strings.
        //
        // See here: https://github.com/ReactTraining/history/issues/505
        const encodedName = encodeForRoute(assignment.name);
        return [
          <Route
            key={`${encodedName}-rubric`}
            path={`rubrics/${encodedName}`}
            element={
              <LegacyRouteRenderer
                path={`${props.match.url}/rubrics/${encodedName}`}
                render={(subprops: RouteComponentProps) => (
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
                            title: <Link to={`${props.match.url}/rubrics`}>Rubrics</Link>,
                          },
                        ],
                        baseURL: `${props.match.url}/${encodedName}/rubric`,
                        history: props.history,
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
                )}
              />
            }
          />,
          <Route
            key={`${encodedName}-stats`}
            path={`${encodedName}/stats`}
            element={
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/stats`}
                render={(subprops: RouteComponentProps) =>
                  !props.fullSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
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
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-regrades`}
            path={`${encodedName}/regrades`}
            element={
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/regrades`}
                render={(subprops: RouteComponentProps) =>
                  !props.partialSubmissionsLoadComplete ? (
                    <Loading />
                  ) : (
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
                  )
                }
              />
            }
          />,
          <Route
            key={`${encodedName}-settings`}
            path={`${encodedName}/settings`}
            element={
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/settings`}
                render={(subprops: RouteComponentProps) => (
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
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/download/grades`}
                render={(subprops: RouteComponentProps) =>
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
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/delete`}
                render={(subprops: RouteComponentProps) => (
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
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/upload/single`}
                render={(subprops: RouteComponentProps) =>
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
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/upload/multiple`}
                render={(subprops: RouteComponentProps) =>
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
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/upload/import`}
                render={(subprops: RouteComponentProps) =>
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
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/bulk-edit`}
                render={(subprops: RouteComponentProps) =>
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
              <LegacyRouteRenderer
                path={`${props.match.url}/${encodedName}/onboarding`}
                render={(subprops: RouteComponentProps) =>
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
            key={`${encodedName}-tests`}
            path={`tests/${encodedName}/*`}
            element={
              <LegacyRouteRenderer
                path={`${props.match.url}/tests/${encodedName}/*`}
                render={(subprops: RouteComponentProps) => (
                  <AssignmentTests
                    {...subprops}
                    breadcrumbs={breadcrumbs}
                    activeAssignment={assignment}
                    submissions={props.submissions[assignment.id] || []}
                    user={props.user}
                    updateAssignment={props.shallowUpdateAssignment}
                    fullSubmissionsLoadComplete={props.fullSubmissionsLoadComplete}
                  />
                )}
              />
            }
          />,
          <Route
            key={`${encodedName}-plagiarism`}
            path={`plagiarism/${encodedName}`}
            element={
              <LegacyRouteRenderer
                path={`${props.match.url}/plagiarism/${encodedName}`}
                render={(subprops: RouteComponentProps) => (
                  <Moss
                    {...subprops}
                    assignment={assignment}
                    assignments={props.assignments}
                    course={props.currentCourse!}
                    submissions={props.submissions[assignment.id] || []}
                    user={props.user}
                    breadcrumbs={breadcrumbs}
                  />
                )}
              />
            }
          />,
        ];
      })}

      <Route
        path="tests"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/tests`}
            end
            render={(subprops: RouteComponentProps) => <TestsOverview {...subprops} assignments={props.assignments} />}
          />
        }
      />
      <Route
        path="rubrics"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/rubrics`}
            end
            render={(subprops: RouteComponentProps) => (
              <RubricOverview {...subprops} assignments={props.assignments} course={props.currentCourse} />
            )}
          />
        }
      />
      <Route
        path="download/grades"
        element={
          <LegacyRouteRenderer
            path={`${props.match.url}/download/grades`}
            end
            render={(subprops: RouteComponentProps) =>
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
          <LegacyRouteRenderer
            path={`${props.match.url}/overview`}
            end
            render={(subprops: RouteComponentProps) => {
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
    </Routes>
  );
};

export default ManageAssignments;

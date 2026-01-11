/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */

/* antd imports */
import { Tag } from 'antd';

/* other library imports */

import { Link, Navigate, Route, Routes } from 'react-router-dom';

/* codePost imports */
import { AssignmentPatchType, AssignmentType } from '../../../infrastructure/assignment';
import { CourseType, SectionType, SubmissionInfoType } from '../../../infrastructure/types';
import { UserType } from '../../../infrastructure/user';

import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import RubricManager, { IRubricManagerParams } from '../../../components/core/rubric/RubricManager';
import AssignmentRegrades from './assignments/AssignmentRegrades';
import AssignmentStats from './assignments/AssignmentStats/AssignmentStats';
import AssignmentsTable from './AssignmentsTable';
import { DETAIL_TYPE } from './types';
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
  /* user data */
  user: UserType;
  baseURL: string;
}

/**********************************************************************************************************************/

import { useNavigate, useLocation, useParams } from 'react-router-dom';

const RoutePropsWrapper = ({ render }: { render: (props: any) => React.ReactElement }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Mock match and history
  const match = { params, url: location.pathname, path: location.pathname, isExact: true };
  const history = {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    go: (n: number) => navigate(n),
    goBack: () => navigate(-1),
    goForward: () => navigate(1),
    location,
  } as any;

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
                render={(subprops: any) => (
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
                )}
              />
            }
          />,
          <Route
            key={`${encodedName}-stats`}
            path={`${encodedName}/stats`}
            element={
              <RoutePropsWrapper
                render={(subprops: any) =>
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
              <RoutePropsWrapper
                render={(subprops: any) =>
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
              <RoutePropsWrapper
                render={(subprops: any) => (
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
                render={(subprops: any) =>
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
                render={(subprops: any) => (
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
                render={(subprops: any) =>
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
                render={(subprops: any) =>
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
                render={(subprops: any) =>
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
                render={(subprops: any) =>
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
                render={(subprops: any) =>
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
                render={(subprops: any) => (
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
              <RoutePropsWrapper
                render={(subprops: any) => (
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
        path="environment"
        element={
          <RoutePropsWrapper
            render={(subprops: any) => <TestsOverview {...subprops} assignments={props.assignments} />}
          />
        }
      />
      <Route
        path="rubrics"
        element={
          <RoutePropsWrapper
            render={(subprops: any) => (
              <RubricOverview {...subprops} assignments={props.assignments} course={props.currentCourse} />
            )}
          />
        }
      />
      <Route
        path="download/grades"
        element={
          <RoutePropsWrapper
            render={(subprops: any) =>
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
            render={(subprops: any) => {
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

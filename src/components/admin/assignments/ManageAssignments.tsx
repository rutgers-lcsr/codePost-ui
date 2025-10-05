/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */

/* antd imports */
import { Tag } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Link, Redirect, Route } from 'react-router-dom';

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

import { encodeForRoute } from '../../core/URLutils';

import Loading from '../../core/Loading';

import { AssignmentTests } from './tests/AssignmentTests';

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
  bulkUpdateSubmissions: (assignmentID: number, getPayload: (sub: SubmissionInfoType) => any) => Promise<void>;

  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
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

  const breadcrumbs = [
    {
      title: (
        <>{props.currentCourse !== undefined && props.currentCourse.archived ? <Tag>Archived</Tag> : null}Assignments</>
      ),
    },
  ];

  return (
    <div>
      {props.assignments.map((assignment) => {
        // Note: we don't have to use encodeURIComponent, because react-router automatically
        // encodes assignment.name for us when parsing path strings.
        //
        // See here: https://github.com/ReactTraining/history/issues/505
        const encodedName = encodeForRoute(assignment.name);
        return (
          <div key={encodedName}>
            <Route
              path={`${props.match.url}/rubrics/${encodedName}`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) => (
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
            <Route
              path={`${props.match.url}/${encodedName}/stats`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) =>
                !props.fullSubmissionsLoadComplete ? (
                  <Loading />
                ) : (
                  <AssignmentStats
                    {...subprops}
                    course={props.currentCourse!}
                    assignment={assignment}
                    submissions={
                      props.submissions.hasOwnProperty(assignment.id) ? props.submissions[assignment.id] : null
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
            <Route
              path={`${props.match.url}/${encodedName}/regrades`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) =>
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
            <Route
              path={`${props.match.url}/${encodedName}/settings`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) => (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  currentCourse={props.currentCourse!}
                  activeAssignment={assignment}
                  detailType={DETAIL_TYPE.Settings}
                  baseURL={props.match.url}
                  breadcrumbs={breadcrumbs}
                  sections={props.sections}
                  courses={props.courses}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/download/grades`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) =>
                !props.fullSubmissionsLoadComplete ? (
                  <Loading />
                ) : (
                  <AssignmentsTable
                    {...props}
                    {...subprops}
                    currentCourse={props.currentCourse!}
                    activeAssignment={assignment}
                    detailType={DETAIL_TYPE.DownloadGrades}
                    baseURL={props.match.url}
                    breadcrumbs={breadcrumbs}
                    sections={props.sections}
                    courses={props.courses}
                  />
                )
              }
            />
            <Route
              path={`${props.match.url}/${encodedName}/delete`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) => (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  currentCourse={props.currentCourse!}
                  activeAssignment={assignment}
                  detailType={DETAIL_TYPE.Delete}
                  baseURL={props.match.url}
                  breadcrumbs={breadcrumbs}
                  sections={props.sections}
                  courses={props.courses}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/upload/single`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) =>
                !props.partialSubmissionsLoadComplete ? (
                  <Loading />
                ) : (
                  <AssignmentsTable
                    {...props}
                    {...subprops}
                    currentCourse={props.currentCourse!}
                    activeAssignment={assignment}
                    detailType={DETAIL_TYPE.Upload_Single}
                    baseURL={props.match.url}
                    breadcrumbs={breadcrumbs}
                    sections={props.sections}
                    courses={props.courses}
                  />
                )
              }
            />
            <Route
              path={`${props.match.url}/${encodedName}/upload/multiple`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) =>
                !props.fullSubmissionsLoadComplete ? (
                  <Loading />
                ) : (
                  <AssignmentsTable
                    {...props}
                    {...subprops}
                    currentCourse={props.currentCourse!}
                    activeAssignment={assignment}
                    detailType={DETAIL_TYPE.Upload_Multiple}
                    baseURL={props.match.url}
                    breadcrumbs={breadcrumbs}
                    sections={props.sections}
                    courses={props.courses}
                  />
                )
              }
            />
            <Route
              path={`${props.match.url}/${encodedName}/upload/import`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) =>
                !props.partialSubmissionsLoadComplete ? (
                  <Loading />
                ) : (
                  <AssignmentsTable
                    {...props}
                    {...subprops}
                    currentCourse={props.currentCourse!}
                    activeAssignment={assignment}
                    detailType={DETAIL_TYPE.Upload_Import}
                    baseURL={props.match.url}
                    breadcrumbs={breadcrumbs}
                    sections={props.sections}
                    courses={props.courses}
                  />
                )
              }
            />
            <Route
              path={`${props.match.url}/${encodedName}/bulk-edit`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) =>
                !props.fullSubmissionsLoadComplete ? (
                  <Loading />
                ) : (
                  <AssignmentsTable
                    {...props}
                    {...subprops}
                    currentCourse={props.currentCourse!}
                    activeAssignment={assignment}
                    detailType={DETAIL_TYPE.BulkSubmissionEdit}
                    baseURL={props.match.url}
                    breadcrumbs={breadcrumbs}
                    sections={props.sections}
                    courses={props.courses}
                  />
                )
              }
            />
            <Route
              path={`${props.match.url}/${encodedName}/onboarding`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) =>
                !props.partialSubmissionsLoadComplete ? (
                  <Loading />
                ) : (
                  <AssignmentsTable
                    {...props}
                    {...subprops}
                    currentCourse={props.currentCourse!}
                    activeAssignment={assignment}
                    detailType={DETAIL_TYPE.Onboarding}
                    baseURL={props.match.url}
                    breadcrumbs={breadcrumbs}
                    sections={props.sections}
                    courses={props.courses}
                  />
                )
              }
            />
            <Route
              path={`${props.match.url}/tests/${encodedName}`}
              render={(subprops: IManageAssignmentsProps & RouteComponentProps) => (
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
          </div>
        );
      })}

      <Route
        path={`${props.match.url}/tests`}
        exact={true}
        render={(subprops: any) => <TestsOverview {...subprops} assignments={props.assignments} />}
      />
      <Route
        path={`${props.match.url}/rubrics`}
        exact={true}
        render={(subprops: any) => (
          <RubricOverview {...subprops} assignments={props.assignments} course={props.currentCourse} />
        )}
      />
      <Route
        path={`${props.match.url}/download/grades`}
        exact={true}
        render={(subprops: any) =>
          !props.submissionsByUserLoadComplete ? (
            <Loading />
          ) : (
            <AssignmentsTable
              {...props}
              {...subprops}
              breadcrumbs={breadcrumbs}
              detailType={DETAIL_TYPE.DownloadGrades}
              baseURL={props.match.url}
              sections={props.sections}
              courses={props.courses}
            />
          )
        }
      />
      <Route
        path={`${props.match.url}/overview`}
        exact={true}
        render={(subprops: any) => {
          return (
            <AssignmentsTable
              {...props}
              {...subprops}
              breadcrumbs={breadcrumbs}
              baseURL={props.match.url}
              courses={props.courses}
            />
          );
        }}
      />
      <Route path={props.match.url} exact={true} render={() => <Redirect to={`${props.match.url}/overview`} />} />
    </div>
  );
};

export default ManageAssignments;

/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* antd imports */
import { Breadcrumb } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Route, Link } from 'react-router-dom';

/* codePost imports */
import { AssignmentPatchType, AssignmentType } from '../../../infrastructure/assignment';
import { CourseType } from '../../../infrastructure/course';
import { SubmissionType } from '../../../infrastructure/submission';
import { UserType } from '../../../infrastructure/user';

import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import RubricUI from './rubric/RubricUI';
import RubricManager, { IRubricManagerParams } from '../../../components/core/rubric/RubricManager';
import AssignmentStats from './assignments/AssignmentStats/AssignmentStats';
import AssignmentRegrades from './assignments/AssignmentRegrades';
import Moss from './assignments/Moss';
import AssignmentsTable, { DETAIL_TYPE } from './AssignmentsTable';

import { encodeForRoute } from '../../core/URLutils';

import Loading from '../../core/Loading';

/**********************************************************************************************************************/

export interface IManageAssignmentsProps {
  /* assignment data */
  assignments: AssignmentType[];
  submissions: IAssignmentToSubmissionsMap;
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;
  currentCourse: CourseType | undefined;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };

  /* loading state */
  loadComplete: boolean;

  /* object-level REST operations */
  createAssignment: (assignmentName: string, assignmentPoints: number) => Promise<AssignmentType>;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;

  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  updateSubmission: (submission: SubmissionType) => Promise<void>;

  /* Refresh course */
  refreshCourseData: () => void;

  /* misc */
  myEmail: string;

  /* user data */
  user: UserType;
}

/**********************************************************************************************************************/

const ManageAssignments = (props: IManageAssignmentsProps & RouteComponentProps) => {
  if (!props.loadComplete) {
    return <Loading />;
  }

  const cancel = () => {
    return;
  };

  const breadcrumbs = [
    <Breadcrumb.Item>
      <Link to={props.match.url}>Assignments</Link>
    </Breadcrumb.Item>,
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
              path={`${props.match.url}/${encodedName}/rubric`}
              render={(subprops: any) => (
                <RubricManager
                  {...subprops}
                  assignment={assignment}
                  submissions={props.submissions[assignment.id]}
                  onCancel={cancel}
                  shouldLoadFeedback={true}
                >
                  {(params: IRubricManagerParams) => {
                    const propz = {
                      ...params.props,
                      breadcrumbs: breadcrumbs,
                      baseURL: `${props.match.url}/${encodedName}/rubric`,
                      history: props.history,
                    };
                    return <RubricUI props={propz} state={params.state} helpers={params.helpers} />;
                  }}
                </RubricManager>
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/stats`}
              render={(subprops: any) => (
                <AssignmentStats
                  {...subprops}
                  course={props.currentCourse!}
                  assignment={assignment}
                  submissions={props.submissions[assignment.id]}
                  students={props.students}
                  submissionsByStudent={props.submissionsByStudent}
                  viewsBySubmission={props.viewsBySubmission}
                  refreshCourseData={props.refreshCourseData}
                  onCancel={cancel}
                  myEmail={props.myEmail}
                  breadcrumbs={breadcrumbs}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/moss`}
              render={(subprops: any) => (
                <Moss
                  {...subprops}
                  course={props.currentCourse!}
                  assignment={assignment}
                  submissions={props.submissions[assignment.id]}
                  user={props.user}
                  onCancel={cancel}
                  location={props.location}
                  breadcrumbs={breadcrumbs}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/regrades`}
              render={(subprops: any) => (
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
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/settings`}
              render={(subprops: any) => (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  activeAssignment={assignment}
                  detailType={DETAIL_TYPE.Settings}
                  baseURL={props.match.url}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/download/grades`}
              render={(subprops: any) => (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  activeAssignment={assignment}
                  detailType={DETAIL_TYPE.DownloadGrades}
                  baseURL={props.match.url}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/delete`}
              render={(subprops: any) => (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  activeAssignment={assignment}
                  detailType={DETAIL_TYPE.Delete}
                  baseURL={props.match.url}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/upload/single`}
              render={(subprops: any) => (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  activeAssignment={assignment}
                  detailType={DETAIL_TYPE.Upload_Single}
                  baseURL={props.match.url}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/upload/multiple`}
              render={(subprops: any) => (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  activeAssignment={assignment}
                  detailType={DETAIL_TYPE.Upload_Multiple}
                  baseURL={props.match.url}
                />
              )}
            />
            <Route
              path={`${props.match.url}/${encodedName}/upload/import`}
              render={(subprops: any) => (
                <AssignmentsTable
                  {...props}
                  {...subprops}
                  activeAssignment={assignment}
                  detailType={DETAIL_TYPE.Upload_Import}
                  baseURL={props.match.url}
                />
              )}
            />
          </div>
        );
      })}
      <Route
        path={`${props.match.url}/download/grades`}
        exact={true}
        render={(subprops: any) => (
          <AssignmentsTable
            {...props}
            {...subprops}
            detailType={DETAIL_TYPE.DownloadGrades}
            baseURL={props.match.url}
          />
        )}
      />
      <Route
        path={props.match.url}
        exact={true}
        render={(subprops: any) => <AssignmentsTable {...props} {...subprops} baseURL={props.match.url} />}
      />
    </div>
  );
};

export default ManageAssignments;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FC, lazy } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { Course, Section } from '../../api-client';
import type { CourseType, UserType } from '../../types/models';
import { Assignment } from '../../types/common';

// Lazy-loaded route components
const MySubmissionsPanel = lazy(() => import('./MySubmissionsPanel'));
const SectionPanel = lazy(() => import('./SectionPanel'));
const RegradesPanel = lazy(() => import('./RegradesPanel'));
const ViewAllPanel = lazy(() => import('./ViewAllPanel'));

import RubricManager, { IRubricManagerParams } from '../core/rubric/RubricManager';
import RubricUI from '../admin/assignments/rubric/RubricUI';
import RubricOverview from '../admin/assignments/rubric/RubricOverview';
import { encodeForRoute } from '../core/URLutils';
import { useLocation, useParams } from 'react-router-dom';

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

interface GraderRoutesProps {
  currentCourse: Course;
  assignments: Assignment[];
  user: UserType;
  localSectionsLed: Section[];
  isSuperGrader: boolean;
  someRegrades: boolean;
  isRubricEditor: boolean;
}

const GraderRoutes: FC<GraderRoutesProps> = ({
  currentCourse,
  assignments,
  user,
  localSectionsLed,
  isSuperGrader,
  someRegrades,
  isRubricEditor,
}) => {
  const isAdmin = user.courseadminCourses.some((el: CourseType) => el.id === currentCourse.id);

  return (
    <Routes>
      <Route index element={<div>Select a panel from the navigation</div>} />
      {currentCourse.activateQueue && (
        <Route
          key="my_submissions"
          path="my_submissions/*"
          element={
            <MySubmissionsPanel
              assignments={assignments as any}
              course={currentCourse}
              graderEmail={user.email!}
              isAdmin={isAdmin}
            />
          }
        />
      )}
      {localSectionsLed.length > 0 && (
        <Route
          key="my_sections"
          path="my_sections/*"
          element={
            <SectionPanel
              assignments={assignments as any}
              course={currentCourse}
              graderEmail={user.email!}
              sections={localSectionsLed as any}
              isAdmin={isAdmin}
            />
          }
        />
      )}
      {isSuperGrader && (
        <Route
          key="all_submissions"
          path="all_submissions/*"
          element={<ViewAllPanel course={currentCourse} assignments={assignments as any} />}
        />
      )}
      {someRegrades && (
        <Route
          path="regrades/*"
          key="regrades"
          element={
            <RegradesPanel
              course={currentCourse}
              assignments={assignments as any}
              user={user}
              isAnonymous={false}
              isAdmin={isAdmin}
              isSuperGrader={isSuperGrader}
            />
          }
        />
      )}
      <Route path="video" key="video" element={<Navigate to="/docs" replace />} />
      {isRubricEditor && (
        <Route
          path="rubrics/*"
          element={
            <Routes>
              <Route index element={<RubricOverview assignments={assignments as any} course={currentCourse} />} />
              {assignments.map((assignment) => {
                const encodedName = encodeForRoute(assignment.name);
                return (
                  <Route
                    key={assignment.id}
                    path={`${encodedName}/*`}
                    element={
                      <RoutePropsWrapper
                        render={(subprops: any) => (
                          <RubricManager
                            {...subprops}
                            assignment={assignment as any}
                            submissions={[]}
                            onCancel={() => {}}
                            shouldLoadFeedback={false}
                            shouldLoadInstanceLists={false}
                          >
                            {(params: IRubricManagerParams) => (
                              <RubricUI
                                props={{
                                  ...params.props,
                                  breadcrumbs: [],
                                  baseURL: `rubrics/${encodedName}`,
                                  history: subprops.history,
                                }}
                                state={params.state}
                                helpers={params.helpers}
                              />
                            )}
                          </RubricManager>
                        )}
                      />
                    }
                  />
                );
              })}
            </Routes>
          }
        />
      )}
    </Routes>
  );
};

export default GraderRoutes;

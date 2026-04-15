// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FC, lazy } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { Course, Section } from '../../api-client';
import type { UserType } from '../../types/models';
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
import { useCourseCapabilities } from '../../stores/usePermissionsStore';

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

interface GraderRoutesProps {
  currentCourse: Course;
  assignments: Assignment[];
  user: UserType;
  localSectionsLed: Section[];
  someRegrades: boolean;
}

const GraderRoutes: FC<GraderRoutesProps> = ({
  currentCourse,
  assignments,
  user,
  localSectionsLed,
  someRegrades,
}) => {
  const courseCaps = useCourseCapabilities(currentCourse?.id);
  const showAllSubmissions = !!courseCaps.manage_regrades;
  const showRubrics = !!courseCaps.edit_rubric;

  return (
    <Routes>
      <Route index element={<div>Select a panel from the navigation</div>} />
      {currentCourse.activateQueue && (
        <Route
          key="my_submissions"
          path="my_submissions/*"
          element={
            <MySubmissionsPanel
              assignments={assignments as unknown as Assignment[]}
              course={currentCourse}
              graderEmail={user.email!}
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
              assignments={assignments as unknown as Assignment[]}
              course={currentCourse}
              graderEmail={user.email!}
              sections={localSectionsLed as unknown as Section[]}
            />
          }
        />
      )}
      {showAllSubmissions && (
        <Route
          key="all_submissions"
          path="all_submissions/*"
          element={<ViewAllPanel course={currentCourse} assignments={assignments as unknown as Assignment[]} />}
        />
      )}
      {someRegrades && (
        <Route
          path="regrades/*"
          key="regrades"
          element={
            <RegradesPanel
              course={currentCourse}
              assignments={assignments as unknown as Assignment[]}
              user={user}
              isAnonymous={false}
            />
          }
        />
      )}
      <Route path="video" key="video" element={<Navigate to="/docs" replace />} />
      {showRubrics && (
        <Route
          path="rubrics/*"
          element={
            <Routes>
              <Route
                index
                element={<RubricOverview assignments={assignments as unknown as Assignment[]} course={currentCourse} />}
              />
              {assignments.map((assignment) => {
                const encodedName = encodeForRoute(assignment.name);
                return (
                  <Route
                    key={assignment.id}
                    path={`${encodedName}/*`}
                    element={
                      <RoutePropsWrapper
                        render={(subprops: LegacyRouteProps) => (
                          <RubricManager
                            {...subprops}
                            assignment={assignment as unknown as Assignment}
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

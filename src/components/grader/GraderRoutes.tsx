// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FC, lazy } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router';

import { Course, Section } from '../../api-client';
import type { UserType } from '../../types/models';
import { Assignment } from '../../types/common';

// Lazy-loaded route components
const MySubmissionsPanel = lazy(() => import('./MySubmissionsPanel'));
const SectionPanel = lazy(() => import('./SectionPanel'));
const RegradesPanel = lazy(() => import('./RegradesPanel'));
const ViewAllPanel = lazy(() => import('./ViewAllPanel'));
const QuizGradingPanel = lazy(() => import('./QuizGradingPanel'));

import RubricManager, { IRubricManagerParams } from '../core/rubric/RubricManager';
import RubricUI from '../admin/assignments/rubric/RubricUI';
import RubricOverview from '../admin/assignments/rubric/RubricOverview';
import { encodeForRoute } from '../core/URLutils';
import { useLocation, useParams } from 'react-router';
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

/** A panel this role lacks (stale bookmark, shared link): say so, and link to the first one
 *  it has. The link is absolute: inside a splat route a relative "my_submissions" would
 *  resolve under the unknown segment (…/rubrics/my_submissions). */
const NoPanel: FC<{ firstPanel: string | null }> = ({ firstPanel }) => {
  const location = useLocation();
  const splat = useParams()['*'] ?? '';
  const base = location.pathname.slice(0, location.pathname.length - splat.length);
  return (
    <div style={{ padding: 24 }}>
      <p>You don&apos;t have access to this page in this course.</p>
      {firstPanel ? (
        <Link to={`${base}${firstPanel}`}>
          Go to {firstPanel === 'my_submissions' ? 'Claimed by Me' : 'your first panel'}
        </Link>
      ) : (
        <p>Nothing to grade in this course yet.</p>
      )}
    </div>
  );
};

interface GraderRoutesProps {
  currentCourse: Course;
  assignments: Assignment[];
  user: UserType;
  localSectionsLed: Section[];
  someRegrades: boolean;
}

const GraderRoutes: FC<GraderRoutesProps> = ({ currentCourse, assignments, user, localSectionsLed, someRegrades }) => {
  const courseCaps = useCourseCapabilities(currentCourse?.id);
  const showAllSubmissions = !!courseCaps.manage_regrades;
  const showRubrics = !!courseCaps.edit_rubric || !!courseCaps.edit_unapplied_rubric_comments;
  const showQuizGrading = !!courseCaps.grade_quiz;

  // The first panel this grader has, in sidebar order: the course root lands there, and a
  // panel the role lacks (stale bookmark, shared link) says so instead of rendering nothing.
  const firstPanel =
    (currentCourse.activateQueue && 'my_submissions') ||
    (localSectionsLed.length > 0 && 'my_sections') ||
    (showAllSubmissions && 'all_submissions') ||
    (someRegrades && 'regrades') ||
    (showRubrics && 'rubrics') ||
    (showQuizGrading && 'quizzes') ||
    null;
  const noPanel = <NoPanel firstPanel={firstPanel} />;

  return (
    <Routes>
      <Route index element={firstPanel ? <Navigate to={firstPanel} replace /> : noPanel} />
      <Route path="*" element={noPanel} />
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
      {showQuizGrading && (
        <Route path="quizzes/*" key="quizzes" element={<QuizGradingPanel course={currentCourse} />} />
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

import { FC, lazy } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import { AssignmentType } from '../../infrastructure/assignment';
import { SectionType } from '../../infrastructure/section';
import { CourseType } from '../../infrastructure/types';
import { UserType } from '../../infrastructure/user';

// Lazy-loaded route components
const MySubmissionsPanel = lazy(() => import('./MySubmissionsPanel'));
const SectionPanel = lazy(() => import('./SectionPanel'));
const ViewAllPanel = lazy(() => import('./ViewAllPanel'));
const RegradesPanel = lazy(() => import('./RegradesPanel'));
const VideoModal = lazy(() => import('../landing/VideoModal'));

import RubricManager, { IRubricManagerParams } from '../core/rubric/RubricManager';
import RubricUI from '../admin/assignments/rubric/RubricUI';
import RubricOverview from '../admin/assignments/rubric/RubricOverview';
import { encodeForRoute } from '../core/URLutils';
import { Link, useLocation, useParams } from 'react-router-dom';

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
  currentCourse: CourseType;
  assignments: AssignmentType[];
  user: UserType;
  localSectionsLed: SectionType[];
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
  const navigate = useNavigate();

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
              assignments={assignments}
              course={currentCourse}
              graderEmail={user.email}
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
              assignments={assignments}
              course={currentCourse}
              graderEmail={user.email}
              sections={localSectionsLed}
              isAdmin={isAdmin}
            />
          }
        />
      )}
      {isSuperGrader && (
        <Route
          key="all_submissions"
          path="all_submissions/*"
          element={<ViewAllPanel course={currentCourse} assignments={assignments} />}
        />
      )}
      {someRegrades && (
        <Route
          path="regrades/*"
          key="regrades"
          element={
            <RegradesPanel
              course={currentCourse}
              assignments={assignments}
              user={user}
              isAnonymous={false}
              isAdmin={isAdmin}
              isSuperGrader={isSuperGrader}
            />
          }
        />
      )}
      <Route path="video" key="video" element={<VideoModal open={true} onCancel={() => navigate('/grader')} />} />
      {isRubricEditor && (
        <Route
          path="rubrics/*"
          element={
            <Routes>
              <Route index element={<RubricOverview assignments={assignments} course={currentCourse} />} />
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
                            assignment={assignment}
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

import { FC } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import { AssignmentType } from '../../infrastructure/assignment';
import { SectionType } from '../../infrastructure/section';
import { CourseType } from '../../infrastructure/types';
import { UserType } from '../../infrastructure/user';

import MySubmissionsPanel from './MySubmissionsPanel';
import SectionPanel from './SectionPanel';
import ViewAllPanel from './ViewAllPanel';
import RegradesPanel from './RegradesPanel';
import VideoModal from '../landing/VideoModal';

interface GraderRoutesProps {
    currentCourse: CourseType;
    assignments: AssignmentType[];
    user: UserType;
    localSectionsLed: SectionType[];
    isSuperGrader: boolean;
    someRegrades: boolean;
}

const GraderRoutes: FC<GraderRoutesProps> = ({
    currentCourse,
    assignments,
    user,
    localSectionsLed,
    isSuperGrader,
    someRegrades,
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
            <Route
                path="video"
                key="video"
                element={<VideoModal open={true} onCancel={() => navigate('/grader')} />}
            />
        </Routes>
    );
};

export default GraderRoutes;

import { Spin } from 'antd';
import { useEffect, useState } from 'react';

import useFixedWindow from '../core/useFixedWindow';

import AdminTable from './AdminTable';
import OrganizationTable from './OrganizationTable';
import SummaryCard from './SummaryCard';

import { Course, CourseType, RosterType } from '../../infrastructure/course';
import { Organization, OrganizationType } from '../../infrastructure/organization';

type TabType = 'Organizations' | 'Courses' | 'Admins';

export interface AdminData {
  id: number;
  key: number;
  organization: OrganizationType | undefined;
  course_name: string;
  course_period: string;
  email: string;
}

const Dashboard = () => {
  useFixedWindow();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [current, setCurrent] = useState<TabType>('Organizations');
  const [isLoading, setIsLoading] = useState(true);

  const buildAdminList = (_rosters: RosterType[], _organizations: OrganizationType[]): AdminData[] => {
    let idCounter = 0;
    return _rosters.flatMap((roster, index) =>
      roster.courseAdmins.map((email) => {
        return {
          id: idCounter++,
          key: index,
          organization: _organizations.find((_org) => _org.id === roster.organization),
          course_name: roster.name,
          course_period: roster.period,
          email,
        };
      }),
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [organizationData, courseData] = await Promise.all([Organization.list(), Course.list()]);

        setOrganizations(organizationData);
        setCourses(courseData);

        const rosterData = await Promise.all(
          courseData.map(async (course) => {
            const roster = await Course.readRoster(course.id);
            return roster;
          }),
        );

        setRosters(rosterData);
        setAdmins(buildAdminList(rosterData, organizationData));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const renderContent = () => {
    switch (current) {
      case 'Admins':
        return <AdminTable admins={admins} />;
      case 'Organizations':
        return <OrganizationTable organizations={organizations} rosters={rosters} />;
      case 'Courses':
      default:
        return <div>Not implemented</div>;
    }
  };

  return (
    <div style={{ margin: '0px 0px 90px' }}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <SummaryCard objects={organizations} title="Organizations" onClick={setCurrent} />
        <SummaryCard objects={courses} title="Courses" onClick={setCurrent} />
        <SummaryCard objects={admins} title="Admins" onClick={setCurrent} />
      </div>
      {renderContent()}
    </div>
  );
};

export default Dashboard;

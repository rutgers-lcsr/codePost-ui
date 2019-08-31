import * as React from 'react';

import { Spin } from 'antd';

import useFixedWindow from '../core/useFixedWindow';

import AdminTable from './AdminTable';
import OrganizationTable from './OrganizationTable';
import SummaryCard from './SummaryCard';

import { Course, CourseType, RosterType } from '../../infrastructure/course';
import {
  Organization,
  OrganizationType,
} from '../../infrastructure/organization';

const Dashboard = (props: any) => {
  useFixedWindow();
  const [admins, setAdmins] = React.useState<any[]>([]);
  const [courses, setCourses] = React.useState<CourseType[]>([]);
  const [rosters, setRosters] = React.useState<RosterType[]>([]);
  const [organizations, setOrganizations] = React.useState<OrganizationType[]>(
    [],
  );

  const [current, setCurrent] = React.useState('Organizations');

  const buildAdminList = (
    _rosters: RosterType[],
    _organizations: OrganizationType[],
  ) => {
    return _rosters
      .map((roster: any, index: number) => {
        return roster.courseAdmins.map((email: string) => {
          const org = _organizations.find((_org: OrganizationType) => {
            return _org['id'] === roster['organization'];
          });
          return {
            key: index,
            organization: org,
            course_name: roster['name'],
            course_period: roster['period'],
            email,
          };
        });
      })
      .flat(1);
  };

  React.useEffect(() => {
    const fetchData = async () => {
      const organizationData = await Organization.list();
      setOrganizations(organizationData);

      const courseData = await Course.list();
      setCourses(courseData);

      const rosterData = await Promise.all(
        courseData.map(async (course: CourseType) => {
          return await Course.readRoster(course['id']);
        }),
      );

      setRosters(rosterData);

      setAdmins(buildAdminList(rosterData, organizationData));
    };

    fetchData();
  }, []);

  // console.log('courses', courses);
  // console.log('organizations', organizations);
  // console.log('rosters', rosters);
  // console.log('admins', admins);

  const isLoading =
    courses.length === 0 ||
    organizations.length === 0 ||
    rosters.length === 0 ||
    admins.length === 0;

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0px', textAlign: 'center' }}>
        <Spin size='large' />
      </div>
    );
  }

  let content;
  switch (current) {
    case 'Admins':
      content = <AdminTable admins={admins} />;
      break;
    case 'Courses':
      content = <div>not implemented</div>;
      break;
    case 'Organizations':
      content = (
        <OrganizationTable organizations={organizations} rosters={rosters} />
      );
      break;
    default:
      content = <div>not implemented</div>;
  }

  return (
    <div style={{ margin: '0px 0px 90px' }}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}>
        <SummaryCard
          objects={organizations}
          title='Organizations'
          onClick={setCurrent}
        />
        <div style={{ width: '20px' }} />
        <SummaryCard objects={courses} title='Courses' onClick={setCurrent} />
        <div style={{ width: '20px' }} />
        <SummaryCard objects={admins} title='Admins' onClick={setCurrent} />
      </div>
      {content}
    </div>
  );
};

export default Dashboard;

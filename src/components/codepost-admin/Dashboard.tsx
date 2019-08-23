import * as React from 'react';

import { Icon, Layout, Menu, Spin } from 'antd';

const { Content, Sider } = Layout;

import { Link } from 'react-router-dom';

import CPLogo from '../core/CPLogo';
import useFixedWindow from '../core/useFixedWindow';

import AdminTable from './AdminTable';
import SummaryCard from './SummaryCard';

import { Course, CourseType, RosterType } from '../../infrastructure/course';
import { Organization, OrganizationType } from '../../infrastructure/organization';

const Dashboard = (props: any) => {
  useFixedWindow();
  const [admins, setAdmins] = React.useState<any[]>([]);
  const [courses, setCourses] = React.useState<CourseType[]>([]);
  const [rosters, setRosters] = React.useState<RosterType[]>([]);
  const [organizations, setOrganizations] = React.useState<OrganizationType[]>([]);

  const [current, setCurrent] = React.useState('Admins');

  const buildAdminList = (_rosters: RosterType[], _organizations: OrganizationType[]) => {
    return _rosters
      .map((roster: RosterType) => {
        return roster.courseAdmins.map((email: string) => {
          const org = _organizations.find((_org: OrganizationType) => {
            return _org['id'] === roster['organization'];
          });
          return {
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

  console.log('courses', courses);
  console.log('organizations', organizations);
  console.log('rosters', rosters);
  console.log('admins', admins);

  const isLoading = courses.length === 0 || organizations.length === 0 || rosters.length === 0 || admins.length === 0;

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  let content;
  switch (current) {
    case 'Admins':
      content = <AdminTable />;
      break;
    case 'Courses':
      content = <div>not implemented</div>;
      break;
    case 'Organizations':
      content = <div>not implemented</div>;
      break;
    default:
      content = <div>not implemented</div>;
  }

  return (
    <Layout>
      <Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
        }}
      >
        <div style={{ padding: '10px 0px' }}>
          <Link to="/">
            <CPLogo cpType="main" />
          </Link>
          <div
            style={{
              textAlign: 'center',
              color: '#24be85',
              lineHeight: 1,
              paddingTop: 10,
            }}
          >
            SuperAdmin Console
          </div>
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">
            <Icon type="dashboard" />
            <span className="nav-text">dashboard</span>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial', minHeight: '100vh' }}>
          <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', marginBottom: '20px' }}>
            <SummaryCard objects={organizations} title="Organizations" onClick={setCurrent} />
            <div style={{ width: '20px' }} />
            <SummaryCard objects={courses} title="Courses" onClick={setCurrent} />
            <div style={{ width: '20px' }} />
            <SummaryCard objects={admins} title="Admins" onClick={setCurrent} />
          </div>
          {content}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;

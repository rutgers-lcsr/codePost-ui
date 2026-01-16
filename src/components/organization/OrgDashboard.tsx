import * as React from 'react';
import { Layout, Menu, theme, Typography } from 'antd';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DashboardOutlined, SettingOutlined, TeamOutlined, BookOutlined } from '@ant-design/icons';
import CPLogo from '../core/CPLogo';
import useFixedWindow from '../core/useFixedWindow';
import { UserType } from '../../infrastructure/user';
import { Organization, OrganizationType } from '../../infrastructure/organization';
import { Course, CourseType } from '../../infrastructure/course';
import OrgSettings from './OrgSettings';
import OrgOverview from './OrgOverview';
import OrgCourses from './OrgCourses';
import OrgUsers from './OrgUsers';

const { Content, Sider } = Layout;

interface IProps {
  user: UserType;
  handleLogout: () => void;
  baseURL: string;
}

const OrgDashboard: React.FC<IProps> = (props) => {
  useFixedWindow();
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();

  const [organization, setOrganization] = React.useState<OrganizationType | null>(null);
  const [courses, setCourses] = React.useState<CourseType[]>([]);
  const [orgUsers, setOrgUsers] = React.useState<UserType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usersLoading, setUsersLoading] = React.useState(false);

  // Determine selected key based on path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/courses')) return 'courses';
    if (path.includes('/users')) return 'users';
    return 'overview';
  };

  const fetchOrgData = React.useCallback(async () => {
    if (!props.user.organization) return;

    try {
      setLoading(true);
      const org = await Organization.read(props.user.organization);
      setOrganization(org);

      // Fetch courses (filtered by backend for Org Staff)
      const coursesList = await Course.list();
      setCourses(coursesList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [props.user.organization]);

  const fetchUsers = React.useCallback(async () => {
    if (!props.user.organization) return;
    try {
      setUsersLoading(true);
      const users = await Organization.getUsers(props.user.organization);
      setOrgUsers(users);
    } catch (error) {
      console.error(error);
    } finally {
      setUsersLoading(false);
    }
  }, [props.user.organization]);

  React.useEffect(() => {
    fetchOrgData();
  }, [fetchOrgData]);

  React.useEffect(() => {
    if (getSelectedKey() === 'users') {
      fetchUsers();
    }
  }, [getSelectedKey(), fetchUsers]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={200}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Link to="/">
            <CPLogo cpType="main" />
          </Link>
          <Typography.Title
            level={1}
            style={{
              color: token.colorPrimary,
              marginTop: '8px',
              fontWeight: 500,
              fontSize: '18px',
            }}
          >
            Organization Console
          </Typography.Title>
        </div>

        <nav aria-label="Organization navigation">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            onClick={({ key }) => navigate(`${props.baseURL}/${key === 'overview' ? '' : key}`)}
            items={[
              {
                key: 'overview',
                icon: <DashboardOutlined />,
                label: 'Overview',
              },
              {
                key: 'courses',
                icon: <BookOutlined />,
                label: 'Courses',
              },
              {
                key: 'users',
                icon: <TeamOutlined />,
                label: 'Users',
              },
              {
                key: 'settings',
                icon: <SettingOutlined />,
                label: 'Settings',
              },
            ]}
          />
        </nav>
      </Sider>

      <Layout style={{ marginLeft: 200, minHeight: '100vh' }}>
        <Content role="main" style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <Routes>
            <Route
              path="/"
              element={
                organization ? (
                  <OrgOverview
                    organization={organization}
                    courseCount={courses.length}
                    userCount={orgUsers.length || undefined} // Only show if fetched, or maybe trigger fetch?
                  />
                ) : (
                  <div>Loading...</div>
                )
              }
            />
            <Route
              path="/courses"
              element={<OrgCourses courses={courses} loading={loading} onRefresh={fetchOrgData} />}
            />
            <Route
              path="/users"
              element={
                <OrgUsers
                  orgId={props.user.organization!}
                  users={orgUsers}
                  loading={usersLoading}
                  onRefresh={fetchUsers}
                  ssoEnabled={organization?.sso_enabled || false}
                />
              }
            />
            <Route path="/settings" element={<OrgSettings user={props.user} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default OrgDashboard;

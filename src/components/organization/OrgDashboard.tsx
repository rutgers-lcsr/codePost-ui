import * as React from 'react';
import { Layout, Menu, theme, Typography } from 'antd';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DashboardOutlined, SettingOutlined, TeamOutlined, BookOutlined } from '@ant-design/icons';
import CPLogo from '../core/CPLogo';
import useFixedWindow from '../core/useFixedWindow';
import type { UserType } from '../../types/models';
import { Organization, Course, User } from '../../api-client';
import { organizationsApi, coursesApi } from '../../api-client/clients';
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

  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [orgUsers, setOrgUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usersLoading, setUsersLoading] = React.useState(false);

  const api = organizationsApi;

  const coursesApiInstance = coursesApi;

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
      const org = await api.retrieve({ id: props.user.organization });
      setOrganization(org);

      // Fetch courses (filtered by backend for Org Staff)
      const coursesList = await coursesApiInstance.list();
      setCourses(coursesList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [props.user.organization, api, coursesApiInstance]);

  const fetchUsers = React.useCallback(async () => {
    if (!props.user.organization) return;
    try {
      setUsersLoading(true);
      // NOTE: The generated client has wrong return type for usersRetrieve (returns Organization instead of User[]).
      // We cast it to any then to User[] to bypass strict check, assuming backend returns array.
      const users = (await api.usersRetrieve({ id: props.user.organization })) as unknown as User[];
      setOrgUsers(users);
    } catch (error) {
      console.error(error);
    } finally {
      setUsersLoading(false);
    }
  }, [props.user.organization, api]);

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
                    userCount={orgUsers.length || undefined}
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
                  ssoEnabled={organization?.ssoEnabled || false}
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

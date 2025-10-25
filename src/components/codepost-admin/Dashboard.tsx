import {
  BookOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  GlobalOutlined,
  RiseOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Card, Col, Progress, Row, Spin, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

import { colors } from '../../theme/colors';
import useFixedWindow from '../core/useFixedWindow';

import AdminTable from './AdminTable';
import CoursesTable from './CoursesTable';
import OrganizationTable from './OrganizationTable';
import UsersTable from './UsersTable';

import { Course, CourseType, RosterType } from '../../infrastructure/course';
import { Organization, OrganizationType } from '../../infrastructure/organization';
import { UserIO, UserType } from '../../infrastructure/user';

const { Title, Text } = Typography;

type TabType = 'Overview' | 'Organizations' | 'Courses' | 'Admins' | 'Users';

export interface AdminData {
  id: number;
  key: number;
  organization: OrganizationType | undefined;
  course_name: string;
  course_period: string;
  email: string;
}

interface DashboardStats {
  totalOrganizations: number;
  totalCourses: number;
  activeCourses: number;
  archivedCourses: number;
  totalCourseAdmins: number; // Users with course admin role (may have other roles too)
  totalCodePostAdmins: number; // Platform-wide codePost administrators
  totalGraders: number; // Users with grader role (may have other roles too)
  totalStudents: number; // Users with student role (may have other roles too)
  totalUniqueUsers: number; // Total unique people (regardless of roles)
  totalSections: number;
  totalAssignments: number;
  avgCoursesPerOrg: number;
  avgStudentsPerCourse: number;
  totalInactiveUsers: number;
}

const Dashboard = () => {
  useFixedWindow();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [rosters, setRosters] = useState<RosterType[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentTab, setCurrentTab] = useState<TabType>('Overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalCourses: 0,
    activeCourses: 0,
    archivedCourses: 0,
    totalCourseAdmins: 0,
    totalCodePostAdmins: 0,
    totalGraders: 0,
    totalStudents: 0,
    totalUniqueUsers: 0,
    totalSections: 0,
    totalAssignments: 0,
    avgCoursesPerOrg: 0,
    avgStudentsPerCourse: 0,
    totalInactiveUsers: 0,
  });

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

  const calculateStats = (
    orgs: OrganizationType[],
    courses: CourseType[],
    rosters: RosterType[],
    users: UserType[],
  ): DashboardStats => {
    const avgCoursesPerOrg = orgs.length > 0 ? courses.length / orgs.length : 0;

    // Calculate active vs archived courses
    const activeCourses = courses.filter((c) => !c.archived).length;
    const archivedCourses = courses.filter((c) => c.archived).length;

    // Calculate total sections and assignments
    const totalSections = courses.reduce((sum, course) => sum + course.sections.length, 0);
    const totalAssignments = courses.reduce((sum, course) => sum + course.assignments.length, 0);

    // Calculate total unique users from rosters (including both active and inactive)
    // Note: These count users WITH each role (users can have multiple roles)
    const usersWithStudentRole = new Set<string>();
    const usersWithGraderRole = new Set<string>();
    const usersWithAdminRole = new Set<string>();
    const allInactive = new Set<string>();

    rosters.forEach((roster) => {
      // Active users
      roster.students.forEach((email) => usersWithStudentRole.add(email));
      roster.graders.forEach((email) => usersWithGraderRole.add(email));
      roster.superGraders.forEach((email) => usersWithGraderRole.add(email));
      roster.courseAdmins.forEach((email) => usersWithAdminRole.add(email));

      // Inactive users - add to both their role set AND the inactive set
      roster.inactive_students.forEach((email) => {
        usersWithStudentRole.add(email);
        allInactive.add(email);
      });
      roster.inactive_graders.forEach((email) => {
        usersWithGraderRole.add(email);
        allInactive.add(email);
      });
      roster.inactive_courseAdmins.forEach((email) => {
        usersWithAdminRole.add(email);
        allInactive.add(email);
      });
    });

    const totalStudents = usersWithStudentRole.size;
    const totalGraders = usersWithGraderRole.size;
    const totalCourseAdmins = usersWithAdminRole.size;

    // Calculate codePost platform admins from users list
    const totalCodePostAdmins = users.filter((user) => user.codePostAdmin).length;

    // Calculate total unique users (union of all role sets)
    const allUniqueUsers = new Set<string>([...usersWithStudentRole, ...usersWithGraderRole, ...usersWithAdminRole]);

    const avgStudentsPerCourse = activeCourses > 0 ? totalStudents / activeCourses : 0;

    return {
      totalOrganizations: orgs.length,
      totalCourses: courses.length,
      activeCourses,
      archivedCourses,
      totalCourseAdmins,
      totalCodePostAdmins,
      totalGraders,
      totalStudents,
      totalUniqueUsers: allUniqueUsers.size,
      totalSections,
      totalAssignments,
      avgCoursesPerOrg: parseFloat(avgCoursesPerOrg.toFixed(1)),
      avgStudentsPerCourse: parseFloat(avgStudentsPerCourse.toFixed(1)),
      totalInactiveUsers: allInactive.size,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [organizationData, courseData, userData] = await Promise.all([
          Organization.list(),
          Course.list(),
          UserIO.list(),
        ]);

        setOrganizations(organizationData);
        setCourses(courseData);
        setUsers(userData);

        const rosterData = await Promise.all(
          courseData.map(async (course) => {
            const roster = await Course.readRoster(course.id);
            return roster;
          }),
        );

        setRosters(rosterData);
        const adminList = buildAdminList(rosterData, organizationData);
        setAdmins(adminList);
        setStats(calculateStats(organizationData, courseData, rosterData, userData));
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
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  const renderOverview = () => {
    const topOrganizations = organizations
      .map((org) => ({
        ...org,
        courseCount: courses.filter((c) => rosters.find((r) => r.id === c.id && r.organization === org.id)).length,
      }))
      .sort((a, b) => b.courseCount - a.courseCount)
      .slice(0, 5);

    return (
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Admin Dashboard
          </Title>
          <Text type="secondary">Welcome back! Here's what's happening with your platform.</Text>
        </div>

        {/* Stats Cards Row 1 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Organizations"
                value={stats.totalOrganizations}
                prefix={<GlobalOutlined style={{ color: colors.actionBlue }} />}
                valueStyle={{ color: colors.actionBlue }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">{stats.avgCoursesPerOrg} avg courses/org</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Courses"
                value={stats.activeCourses}
                suffix={<Text type="secondary">/ {stats.totalCourses}</Text>}
                prefix={<BookOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color="default">{stats.archivedCourses} archived</Tag>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Users with Student Role"
                value={stats.totalStudents}
                prefix={<UserOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">{stats.avgStudentsPerCourse} avg/course</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Assignments"
                value={stats.totalAssignments}
                prefix={<BookOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Across all courses</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Stats Cards Row 2 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Unique Users"
                value={stats.totalUniqueUsers}
                prefix={<UserOutlined style={{ color: colors.actionBlue }} />}
                valueStyle={{ color: colors.actionBlue }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Unique people (any role)</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Course Admins"
                value={stats.totalCourseAdmins}
                prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
                valueStyle={{ color: '#13c2c2' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Course-level administrators</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Platform Admins"
                value={stats.totalCodePostAdmins}
                prefix={<CrownOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">codePost administrators</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Users with Grader Role"
                value={stats.totalGraders}
                prefix={<TeamOutlined style={{ color: '#eb2f96' }} />}
                valueStyle={{ color: '#eb2f96' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Grading staff</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Sections"
                value={stats.totalSections}
                prefix={<TeamOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Course sections</Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Inactive Users"
                value={stats.totalInactiveUsers}
                prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
                valueStyle={{ color: '#8c8c8c' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Inactive accounts</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Charts and Tables Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Top Organizations by Courses" bordered={false}>
              <Table
                dataSource={topOrganizations}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Organization',
                    dataIndex: 'name',
                    key: 'name',
                    render: (name: string) => <Text strong>{name}</Text>,
                  },
                  {
                    title: 'Courses',
                    dataIndex: 'courseCount',
                    key: 'courseCount',
                    width: 100,
                    align: 'center',
                    render: (count: number) => <Tag color="blue">{count}</Tag>,
                  },
                  {
                    title: 'Usage',
                    dataIndex: 'courseCount',
                    key: 'usage',
                    width: 150,
                    render: (count: number) => {
                      const maxCourses = Math.max(...topOrganizations.map((o) => o.courseCount));
                      const percent = maxCourses > 0 ? (count / maxCourses) * 100 : 0;
                      return <Progress percent={Math.round(percent)} size="small" />;
                    },
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col span={24}>
            <Alert
              message="Platform Status"
              description={`System is running smoothly. ${stats.totalCourses} active courses across ${stats.totalOrganizations} organizations.`}
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          </Col>
        </Row>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'Overview':
        return renderOverview();
      case 'Admins':
        return (
          <div style={{ padding: '24px' }}>
            <AdminTable admins={admins} />
          </div>
        );
      case 'Organizations':
        return (
          <div style={{ padding: '24px' }}>
            <OrganizationTable organizations={organizations} rosters={rosters} />
          </div>
        );
      case 'Courses':
        return (
          <div style={{ padding: '24px' }}>
            <CoursesTable courses={courses} rosters={rosters} organizations={organizations} />
          </div>
        );
      case 'Users':
        return <UsersTable rosters={rosters} organizations={organizations} users={users} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Tabs
        activeKey={currentTab}
        onChange={(key) => setCurrentTab(key as TabType)}
        size="large"
        style={{ background: 'white', padding: '0 24px', margin: 0 }}
        items={[
          {
            key: 'Overview',
            label: (
              <span>
                <RiseOutlined />
                Overview
              </span>
            ),
          },
          {
            key: 'Organizations',
            label: (
              <span>
                <GlobalOutlined />
                Organizations ({organizations.length})
              </span>
            ),
          },
          {
            key: 'Courses',
            label: (
              <span>
                <BookOutlined />
                Courses ({courses.length})
              </span>
            ),
          },
          {
            key: 'Admins',
            label: (
              <span>
                <TeamOutlined />
                Admins ({admins.length})
              </span>
            ),
          },
          {
            key: 'Users',
            label: (
              <span>
                <UserOutlined />
                Users ({users.length})
              </span>
            ),
          },
        ]}
      />
      {renderContent()}
    </div>
  );
};

export default Dashboard;

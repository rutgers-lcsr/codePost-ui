import {
  BookOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  MailOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Col, Descriptions, Drawer, Input, Row, Space, Statistic, Table, Tag } from 'antd';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { RosterType as InfraRosterType } from '../../infrastructure/course';
import { OrganizationType } from '../../infrastructure/organization';

const { Search } = Input;

interface RosterType extends InfraRosterType {
  // Using the infrastructure RosterType which has organization as number
}

interface OrganizationRow extends OrganizationType {
  rosters: RosterType[];
  key: string;
}

interface CourseRow {
  name: string;
  admins: number;
  graders: number;
  students: number;
  roster: RosterType;
}

interface Props {
  organizations: OrganizationType[];
  rosters: RosterType[];
}

const OrganizationTable: React.FC<Props> = ({ organizations, rosters }) => {
  const getOrganizationRows = React.useCallback((): OrganizationRow[] => {
    return organizations.map((organization) => {
      const orgRosters = rosters.filter((roster) => roster.organization === organization.id);
      return { ...organization, rosters: orgRosters, key: organization.shortname };
    });
  }, [organizations, rosters]);

  const [organizationRows, setOrganizationRows] = React.useState<OrganizationRow[]>(getOrganizationRows);
  const [visible, setVisible] = React.useState(false);
  const [currentRoster, setCurrentRoster] = React.useState<RosterType | undefined>(undefined);

  const showDrawer = (roster: RosterType) => {
    setVisible(true);
    setCurrentRoster(roster);
  };

  const onClose = () => {
    setVisible(false);
    setCurrentRoster(undefined);
  };

  const onSearch = (value: string) => {
    const searchTerm = value.toLowerCase();
    setOrganizationRows(
      getOrganizationRows().filter(
        (org) => org.name.toLowerCase().includes(searchTerm) || org.shortname.toLowerCase().includes(searchTerm),
      ),
    );
  };

  const getTotalUsers = (rosters: RosterType[]) => {
    const students = new Set<string>();
    const graders = new Set<string>();
    const admins = new Set<string>();

    rosters.forEach((roster) => {
      // Active users
      roster.students.forEach((email) => students.add(email));
      roster.graders.forEach((email) => graders.add(email));
      roster.superGraders.forEach((email) => graders.add(email));
      roster.courseAdmins.forEach((email) => admins.add(email));

      // Inactive users - they should still count in totals
      roster.inactive_students.forEach((email) => students.add(email));
      roster.inactive_graders.forEach((email) => graders.add(email));
      roster.inactive_courseAdmins.forEach((email) => admins.add(email));
    });

    // Calculate total unique staff (union of graders and admins to avoid double-counting)
    const staff = new Set<string>([...graders, ...admins]);

    return { students: students.size, graders: graders.size, admins: admins.size, staff: staff.size };
  };

  const mainColumns = [
    {
      title: 'Organization',
      dataIndex: 'organization',
      key: 'organization',
      render: (_: string, record: OrganizationRow) => (
        <Space>
          <GlobalOutlined style={{ color: colors.actionBlue }} />
          <span>
            <strong>{record.name}</strong>
            <br />
            <Tag color="blue">{record.shortname}</Tag>
          </span>
        </Space>
      ),
    },
    {
      title: 'Email Domain',
      dataIndex: 'emailDomain',
      key: 'emailDomain',
      render: (domain: string) => (
        <Space>
          <MailOutlined />
          {domain}
        </Space>
      ),
    },
    {
      title: 'Courses',
      dataIndex: 'courses',
      key: 'courses',
      sorter: (a: OrganizationRow, b: OrganizationRow) => a.rosters.length - b.rosters.length,
      render: (_: unknown, record: OrganizationRow) => (
        <Badge count={record.rosters.length} showZero style={{ backgroundColor: '#52c41a' }}>
          <BookOutlined style={{ fontSize: '20px' }} />
        </Badge>
      ),
    },
    {
      title: 'Total Students',
      key: 'students',
      sorter: (a: OrganizationRow, b: OrganizationRow) =>
        getTotalUsers(a.rosters).students - getTotalUsers(b.rosters).students,
      render: (_: unknown, record: OrganizationRow) => (
        <Space>
          <UserOutlined style={{ color: '#722ed1' }} />
          {getTotalUsers(record.rosters).students}
        </Space>
      ),
    },
    {
      title: 'Total Staff',
      key: 'staff',
      sorter: (a: OrganizationRow, b: OrganizationRow) => {
        const aUsers = getTotalUsers(a.rosters);
        const bUsers = getTotalUsers(b.rosters);
        return aUsers.staff - bUsers.staff;
      },
      render: (_: unknown, record: OrganizationRow) => {
        const users = getTotalUsers(record.rosters);
        return (
          <Space>
            <TeamOutlined style={{ color: '#13c2c2' }} />
            {users.staff}
          </Space>
        );
      },
    },
  ];

  const expandedColumns = [
    {
      title: 'Course',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CourseRow) => (
        <Button type="link" onClick={() => showDrawer(record.roster)}>
          <BookOutlined /> {name}
        </Button>
      ),
    },
    {
      title: 'Admins',
      dataIndex: 'admins',
      key: 'admins',
      sorter: (a: CourseRow, b: CourseRow) => a.admins - b.admins,
      render: (count: number) => (
        <Tag color="purple" icon={<TeamOutlined />}>
          {count}
        </Tag>
      ),
    },
    {
      title: 'Graders',
      dataIndex: 'graders',
      key: 'graders',
      sorter: (a: CourseRow, b: CourseRow) => a.graders - b.graders,
      render: (count: number) => (
        <Tag color="cyan" icon={<TeamOutlined />}>
          {count}
        </Tag>
      ),
    },
    {
      title: 'Students',
      dataIndex: 'students',
      key: 'students',
      sorter: (a: CourseRow, b: CourseRow) => a.students - b.students,
      render: (count: number) => (
        <Tag color="green" icon={<UserOutlined />}>
          {count}
        </Tag>
      ),
    },
    {
      title: 'Total Unique Users',
      key: 'total',
      render: (_: unknown, record: CourseRow) => {
        // Calculate unique users across all roles (union to avoid double-counting)
        const allUsers = new Set<string>();

        // Add all users from the roster
        record.roster.students.forEach((email) => allUsers.add(email));
        record.roster.graders.forEach((email) => allUsers.add(email));
        record.roster.superGraders.forEach((email) => allUsers.add(email));
        record.roster.courseAdmins.forEach((email) => allUsers.add(email));
        record.roster.inactive_students.forEach((email) => allUsers.add(email));
        record.roster.inactive_graders.forEach((email) => allUsers.add(email));
        record.roster.inactive_courseAdmins.forEach((email) => allUsers.add(email));

        return <strong>{allUsers.size}</strong>;
      },
    },
  ];

  const expandedRowRender = (record: OrganizationRow) => {
    const courses: CourseRow[] = record.rosters.map((roster) => {
      // Count unique users including inactive ones
      const uniqueStudents = new Set<string>();
      const uniqueGraders = new Set<string>();
      const uniqueAdmins = new Set<string>();

      // Active users
      roster.students.forEach((email) => uniqueStudents.add(email));
      roster.graders.forEach((email) => uniqueGraders.add(email));
      roster.superGraders.forEach((email) => uniqueGraders.add(email));
      roster.courseAdmins.forEach((email) => uniqueAdmins.add(email));

      // Inactive users
      roster.inactive_students.forEach((email) => uniqueStudents.add(email));
      roster.inactive_graders.forEach((email) => uniqueGraders.add(email));
      roster.inactive_courseAdmins.forEach((email) => uniqueAdmins.add(email));

      return {
        name: `${roster.name} | ${roster.period}`,
        admins: uniqueAdmins.size,
        graders: uniqueGraders.size,
        students: uniqueStudents.size,
        roster,
      };
    });

    return (
      <div style={{ padding: '10px 0px' }}>
        <Table columns={expandedColumns} dataSource={courses} pagination={false} size="small" />
      </div>
    );
  };

  const renderEmailList = (emails: string[], title: string, icon: React.ReactNode, color: string) => (
    <>
      <Descriptions title={title} column={1} bordered size="small" style={{ marginBottom: '16px' }}>
        <Descriptions.Item label={icon}>
          <strong>{emails.length}</strong> {title.toLowerCase()}
        </Descriptions.Item>
      </Descriptions>
      <Space direction="vertical" style={{ width: '100%' }}>
        {emails.map((email) => (
          <Tag key={email} color={color} style={{ marginBottom: '4px' }}>
            <Link to={`/loginAs?email=${email}`} target="_blank" style={{ color: 'inherit' }}>
              {email}
            </Link>
          </Tag>
        ))}
      </Space>
      <br />
    </>
  );

  const getTotalOrgStats = () => {
    const totalCourses = organizationRows.reduce((sum, org) => sum + org.rosters.length, 0);

    // Use Sets to avoid double-counting users across organizations
    const allStudents = new Set<string>();
    const allGraders = new Set<string>();
    const allAdmins = new Set<string>();

    organizationRows.forEach((org) => {
      org.rosters.forEach((roster) => {
        // Active users
        roster.students.forEach((email) => allStudents.add(email));
        roster.graders.forEach((email) => allGraders.add(email));
        roster.superGraders.forEach((email) => allGraders.add(email));
        roster.courseAdmins.forEach((email) => allAdmins.add(email));

        // Inactive users
        roster.inactive_students.forEach((email) => allStudents.add(email));
        roster.inactive_graders.forEach((email) => allGraders.add(email));
        roster.inactive_courseAdmins.forEach((email) => allAdmins.add(email));
      });
    });

    // Calculate total unique staff (union of graders and admins)
    const allStaff = new Set<string>([...allGraders, ...allAdmins]);

    return {
      totalCourses,
      totalStudents: allStudents.size,
      totalGraders: allGraders.size,
      totalAdmins: allAdmins.size,
      totalStaff: allStaff.size,
    };
  };

  const orgStats = getTotalOrgStats();

  return (
    <Card title="Organizations" variant="outlined" style={{ width: '100%' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Organizations"
              value={organizationRows.length}
              prefix={<GlobalOutlined style={{ color: colors.actionBlue }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Courses"
              value={orgStats.totalCourses}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Students"
              value={orgStats.totalStudents}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Staff"
              value={orgStats.totalStaff}
              prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ padding: '14px 0px', width: '400px' }}>
        <Search placeholder="Search organizations..." onSearch={onSearch} enterButton />
      </div>

      <Table
        columns={mainColumns}
        dataSource={organizationRows}
        size="middle"
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} organizations` }}
      />

      <Drawer
        title={
          <Space>
            <BookOutlined />
            {currentRoster?.name || ''} | {currentRoster?.period || ''}
          </Space>
        }
        placement="right"
        closable={true}
        onClose={onClose}
        open={visible}
        width={500}
      >
        {currentRoster && (
          <div style={{ overflowY: 'auto' }}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Statistic
                  title="Admins"
                  value={currentRoster.courseAdmins.length}
                  prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Graders"
                  value={currentRoster.graders.length + currentRoster.superGraders.length}
                  prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Students"
                  value={currentRoster.students.length}
                  prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
            </Row>

            {currentRoster.courseAdmins.length > 0 &&
              renderEmailList(
                currentRoster.courseAdmins,
                'Course Admins',
                <TeamOutlined style={{ color: '#722ed1' }} />,
                'purple',
              )}
            {currentRoster.graders.length + currentRoster.superGraders.length > 0 &&
              renderEmailList(
                [...currentRoster.graders, ...currentRoster.superGraders],
                'Graders',
                <TeamOutlined style={{ color: '#13c2c2' }} />,
                'cyan',
              )}
            {currentRoster.students.length > 0 &&
              renderEmailList(currentRoster.students, 'Students', <UserOutlined />, 'green')}

            {currentRoster.not_activated.length > 0 && (
              <>
                <Descriptions title="Not Activated" column={1} bordered size="small" style={{ marginTop: '16px' }}>
                  <Descriptions.Item label={<ClockCircleOutlined />}>
                    {currentRoster.not_activated.length} users
                  </Descriptions.Item>
                </Descriptions>
                <Space direction="vertical" style={{ width: '100%', marginTop: '8px' }}>
                  {currentRoster.not_activated.map((email) => (
                    <Tag key={email} color="orange">
                      {email}
                    </Tag>
                  ))}
                </Space>
              </>
            )}
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default OrganizationTable;

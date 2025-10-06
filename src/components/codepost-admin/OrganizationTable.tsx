import { Button, Card, Drawer, Input, Table } from 'antd';
import * as React from 'react';
import { Link } from 'react-router-dom';
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

  const mainColumns = [
    {
      title: 'Organization',
      dataIndex: 'organization',
      key: 'organization',
      render: (_: string, record: OrganizationRow) => `${record.name} (${record.shortname})`,
    },
    {
      title: 'Courses',
      dataIndex: 'courses',
      key: 'courses',
      sorter: (a: OrganizationRow, b: OrganizationRow) => a.rosters.length - b.rosters.length,
      render: (_: unknown, record: OrganizationRow) => record.rosters.length,
    },
  ];

  const expandedColumns = [
    {
      title: 'Course',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CourseRow) => (
        <Button type="link" onClick={() => showDrawer(record.roster)}>
          {name}
        </Button>
      ),
    },
    {
      title: '# Admins',
      dataIndex: 'admins',
      key: 'admins',
      sorter: (a: CourseRow, b: CourseRow) => a.admins - b.admins,
    },
    {
      title: '# Graders',
      dataIndex: 'graders',
      key: 'graders',
      sorter: (a: CourseRow, b: CourseRow) => a.graders - b.graders,
    },
    {
      title: '# Students',
      dataIndex: 'students',
      key: 'students',
      sorter: (a: CourseRow, b: CourseRow) => a.students - b.students,
    },
  ];

  const expandedRowRender = (record: OrganizationRow) => {
    const courses: CourseRow[] = record.rosters.map((roster) => ({
      name: `${roster.name} | ${roster.period}`,
      admins: roster.courseAdmins.length,
      graders: roster.graders.length,
      students: roster.students.length,
      roster,
    }));

    return (
      <div style={{ padding: '10px 0px' }}>
        <Table columns={expandedColumns} dataSource={courses} pagination={false} size="small" />
      </div>
    );
  };

  const renderEmailList = (emails: string[], title: string) => (
    <>
      <p>
        <b>{title}</b>
      </p>
      {emails.map((email) => (
        <div key={email}>
          <Link to={`/loginas/${email}`} target="_blank">
            {email}
          </Link>
        </div>
      ))}
      <br />
    </>
  );

  return (
    <Card title="Organizations" variant="outlined" style={{ width: '100%' }}>
      <div style={{ padding: '14px 0px', width: '400px' }}>
        <Search placeholder="search..." onSearch={onSearch} enterButton />
      </div>
      <div style={{ padding: '14px 0px' }}>Organization Count: {organizationRows.length}</div>
      <Table columns={mainColumns} dataSource={organizationRows} size="small" expandedRowRender={expandedRowRender} />
      <Drawer title={currentRoster?.name || ''} placement="right" closable={true} onClose={onClose} visible={visible}>
        {currentRoster && (
          <div style={{ overflowY: 'auto' }}>
            {renderEmailList(currentRoster.courseAdmins, 'Admins')}
            {renderEmailList(currentRoster.graders, 'Graders')}
            {renderEmailList(currentRoster.students, 'Students')}
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default OrganizationTable;

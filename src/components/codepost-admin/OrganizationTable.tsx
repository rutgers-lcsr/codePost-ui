import * as React from 'react';

import { Button, Card, Drawer, Input, Table } from 'antd';

const { Search } = Input;

import { Link } from 'react-router-dom';

import { OrganizationType } from '../../infrastructure/organization';

const cols = [
  {
    title: 'Organization',
    dataIndex: 'organization',
    key: 'organization',
    render: (name: string, record: any) => {
      return `${record.name} (${record.shortname})`;
    },
  },
  {
    title: 'Courses',
    dataIndex: 'courses',
    key: 'courses',
    sorter: (a: any, b: any) => {
      return a['rosters'].length - b['rosters'].length;
    },
    render: (courses: any, record: any) => {
      return record['rosters'].length;
    },
  },
];

const OrganizationTable = (props: any) => {
  const initialOrganizationRows = () => {
    return props.organizations.map((organization: OrganizationType) => {
      const rosters = props.rosters.filter((roster: any) => {
        return roster['organization'] === organization.id;
      });
      return { ...organization, rosters, key: organization.shortname };
    });
  };

  const [organizationRows, setOrganizationRows] = React.useState(initialOrganizationRows());
  const [visible, setVisible] = React.useState(false);

  const [currentRoster, setCurrentRoster] = React.useState<any>(undefined);

  const showDrawer = (roster: any) => {
    setVisible(true);
    setCurrentRoster(roster);
  };

  const onClose = () => {
    setVisible(false);
    setCurrentRoster(undefined);
  };

  const onSearch = (value: string) => {
    const v = value.toLowerCase();
    setOrganizationRows(
      initialOrganizationRows().filter((organization: any) => {
        return organization['name'].toLowerCase().includes(v) || organization['shortname'].toLowerCase().includes(v);
      }),
    );
  };

  const expandedRowRender = (record: any, index: any) => {
    const columns = [
      {
        title: 'Course',
        dataIndex: 'name',
        key: 'name',
        render: (name: any, record1: any) => {
          const onClick = () => {
            showDrawer(record1['roster']);
          };
          return (
            <Button type="link" onClick={onClick}>
              {name}
            </Button>
          );
        },
      },
      {
        title: '# Admins',
        dataIndex: 'admins',
        key: 'admins',
        sorter: (a: any, b: any) => {
          return a['admins'] - b['admins'];
        },
      },
      {
        title: '# Graders',
        dataIndex: 'graders',
        key: 'graders',
        sorter: (a: any, b: any) => {
          return a['graders'] - b['graders'];
        },
      },
      {
        title: '# Students',
        dataIndex: 'students',
        key: 'students',
        sorter: (a: any, b: any) => {
          return a['students'] - b['students'];
        },
      },
    ];

    const courses = record['rosters'].map((roster: any) => {
      return {
        name: `${roster['name']} | ${roster['period']}`,
        admins: roster['courseAdmins'].length,
        graders: roster['graders'].length,
        students: roster['students'].length,
        roster,
      };
    });
    return (
      <div style={{ padding: '10px 0px' }}>
        <Table columns={columns} dataSource={courses} pagination={false} size="small" />
      </div>
    );
  };

  let drawerContent;
  if (currentRoster !== undefined) {
    const loginas = (email: string) => {
      return (
        <div>
          <Link to={`/loginas/${email}`} target="_blank">
            {email}
          </Link>
        </div>
      );
    };

    drawerContent = (
      <div style={{ overflowY: 'auto' }}>
        <p>
          <b>Admins</b>
        </p>
        {currentRoster.courseAdmins.map((email: string) => {
          return loginas(email);
        })}
        <br />
        <p>
          <b>Graders</b>
        </p>
        {currentRoster.graders.map((email: string) => {
          return loginas(email);
        })}
        <br />
        <p>
          <b>Students</b>
        </p>
        {currentRoster.students.map((email: string) => {
          return loginas(email);
        })}
      </div>
    );
  }

  return (
    <Card title="Organizations" bordered={false} style={{ width: '100%' }}>
      <div style={{ padding: '14px 0px', width: '400px' }}>
        <Search placeholder="search..." onSearch={onSearch} enterButton />
      </div>
      <div style={{ padding: '14px 0px' }}>Organization Count: {organizationRows.length}</div>
      <Table columns={cols} dataSource={organizationRows} size="small" expandedRowRender={expandedRowRender} />
      <Drawer
        title={currentRoster !== undefined ? currentRoster.name : ''}
        placement="right"
        closable={true}
        onClose={onClose}
        visible={visible}
      >
        {drawerContent}
      </Drawer>
    </Card>
  );
};

export default OrganizationTable;

import { Card, Input, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { CourseType } from '../../infrastructure/course';
import { OrganizationType } from '../../infrastructure/organization';
import { AdminData } from './Dashboard';

const { Search } = Input;

export interface AdminRecord {
  email: string;
  organization: OrganizationType;
  course: CourseType;
  course_name: string;
  course_period: string;
}

interface AdminTableProps {
  admins: AdminData[];
}

const fullstoryQuery = (email: string) =>
  `https://app.fullstory.com/ui/MFFNS/segments/everyone/people:search:((NOW%2FDAY-29DAY:NOW%2FDAY%2B1DAY):((UserEmail:==:%22${email}%22)):():():():)/0`;

const columns: ColumnsType<AdminData> = [
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Organization',
    dataIndex: 'organization',
    key: 'organization',
    render: (org: OrganizationType) => `${org.name} (${org.shortname})`,
  },
  {
    title: 'Course',
    dataIndex: 'course',
    key: 'course',
    render: (course: CourseType) => `${course.name} | ${course.period}`,
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_: unknown, record: AdminData) => (
      <span>
        <Link to={`/loginas/${record.email}`} target="_blank" rel="noopener noreferrer">
          loginas
        </Link>{' '}
        <a href={fullstoryQuery(record.email)} target="_blank" rel="noopener noreferrer">
          fullstory
        </a>
      </span>
    ),
  },
];

const AdminTable: React.FC<AdminTableProps> = ({ admins }) => {
  const [searchValue, setSearchValue] = useState('');

  const filteredAdmins = useMemo(() => {
    const search = searchValue.toLowerCase();
    if (!search) return admins;

    return admins.filter(
      (admin) =>
        admin.email.toLowerCase().includes(search) ||
        admin.course_name.toLowerCase().includes(search) ||
        admin.course_period.toLowerCase().includes(search) ||
        admin.organization?.name.toLowerCase().includes(search),
    );
  }, [admins, searchValue]);

  return (
    <Card title="Admins" style={{ width: '100%' }}>
      <Search
        placeholder="Search..."
        onSearch={setSearchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        enterButton
        style={{ width: 400, marginBottom: 14 }}
      />
      <div style={{ marginBottom: 14 }}>Admin Count: {filteredAdmins.length}</div>
      <Table columns={columns} dataSource={filteredAdmins} size="small" rowKey="email" />
    </Card>
  );
};

export default AdminTable;

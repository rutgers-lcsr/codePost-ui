// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Drawer, Input, Table, Tabs, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import type { Course, CourseRoster } from '../../api-client';
import { coursesApi } from '../../api-client/clients';
import { apiErrorMessageAsync } from '../../lib/apiError';

const { Text } = Typography;

interface IProps {
  /** The course whose roster to show; null keeps the drawer closed. */
  course: Course | null;
  onClose: () => void;
}

interface Row {
  email: string;
  tags: string[];
}

function toRows(emails: Array<string | null>, tagsFor: (email: string) => string[]): Row[] {
  return emails
    .filter((email): email is string => !!email)
    .sort((a, b) => a.localeCompare(b))
    .map((email) => ({ email, tags: tagsFor(email) }));
}

/** View-only roster of one course for org staff (Organization › Courses). */
const OrgCourseRoster: React.FC<IProps> = ({ course, onClose }) => {
  // Tagged with the course it was loaded for, so switching courses never shows the old roster.
  const [loaded, setLoaded] = React.useState<{ courseId: number; roster?: CourseRoster; error?: string } | null>(null);
  const [search, setSearch] = React.useState('');
  const courseId = course?.id;

  React.useEffect(() => {
    if (courseId === undefined) return;
    let cancelled = false;
    coursesApi
      .rosterRetrieve({ id: courseId })
      .then((roster) => {
        if (!cancelled) setLoaded({ courseId, roster });
      })
      .catch(async (e: unknown) => {
        const message = await apiErrorMessageAsync(e);
        if (!cancelled) setLoaded({ courseId, error: message ?? 'The roster could not be loaded.' });
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const current = loaded?.courseId === courseId ? loaded : null;
  const roster = current?.roster ?? null;
  const error = current?.error ?? null;
  const close = () => {
    setSearch('');
    onClose();
  };

  const notActivated = new Set(roster?.notActivated ?? []);
  const graderTags = (email: string) =>
    [
      roster?.superGraders.includes(email) ? 'Super grader' : null,
      roster?.rubricEditors.includes(email) ? 'Rubric editor' : null,
      roster?.quizGraders.includes(email) ? 'Quiz grader' : null,
      notActivated.has(email) ? 'Not activated' : null,
    ].filter((tag): tag is string => tag !== null);
  const activationTag = (email: string) => (notActivated.has(email) ? ['Not activated'] : []);

  const groups = [
    { key: 'students', label: 'Students', rows: toRows(roster?.students ?? [], activationTag) },
    { key: 'graders', label: 'Graders', rows: toRows(roster?.graders ?? [], graderTags) },
    { key: 'courseAdmins', label: 'Course Admins', rows: toRows(roster?.courseAdmins ?? [], activationTag) },
  ];
  const query = search.trim().toLowerCase();

  return (
    <Drawer
      open={course !== null}
      onClose={close}
      width={560}
      title={course ? `Roster — ${course.name} | ${course.period}` : 'Roster'}
    >
      <Text type="secondary">View only. Course admins change the roster from the course&apos;s Roster page.</Text>
      {error ? (
        <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />
      ) : (
        <>
          <Input
            allowClear
            placeholder="Search by email"
            aria-label="Search the roster"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ margin: '16px 0 8px' }}
          />
          <Tabs
            items={groups.map((group) => ({
              key: group.key,
              label: `${group.label} (${group.rows.length})`,
              children: (
                <Table<Row>
                  size="small"
                  rowKey="email"
                  loading={roster === null}
                  dataSource={group.rows.filter((row) => row.email.toLowerCase().includes(query))}
                  pagination={{ pageSize: 50, hideOnSinglePage: true }}
                  locale={{ emptyText: query ? 'No matches' : `No ${group.label.toLowerCase()}` }}
                  columns={[
                    { title: 'Email', dataIndex: 'email', key: 'email' },
                    {
                      title: '',
                      key: 'tags',
                      align: 'right',
                      render: (_, row) =>
                        row.tags.map((tag) => (
                          <Tag key={tag} color={tag === 'Not activated' ? 'default' : 'blue'}>
                            {tag}
                          </Tag>
                        )),
                    },
                  ]}
                />
              ),
            }))}
          />
        </>
      )}
    </Drawer>
  );
};

export default OrgCourseRoster;

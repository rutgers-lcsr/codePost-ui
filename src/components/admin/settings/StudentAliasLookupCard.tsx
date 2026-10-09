// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Empty, Input, message, Space, Table, Tag, Typography } from 'antd';
import { UserSwitchOutlined } from '@ant-design/icons';
import { Course } from '../../../services/course';
import type { AgentAliasMatch } from '../../../services/course';
import { apiErrorMessage } from '../../../lib/apiError';

const { Text, Paragraph } = Typography;

interface IStudentAliasLookupCardProps {
  courseId: number;
}

/**
 * AI agents connected over MCP never see student email addresses: each
 * student appears as a stable, course-specific alias (student-3f9a1c2d40).
 * This card is the instructor's way back — paste an alias from a chat to see
 * who it is, or an email/NetID to see their alias. The endpoint refuses the
 * agent's own credential, so only a signed-in admin can resolve aliases.
 */
const StudentAliasLookupCard: React.FC<IStudentAliasLookupCardProps> = ({ courseId }) => {
  const [matches, setMatches] = React.useState<AgentAliasMatch[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSearch = async (value: string) => {
    const q = value.trim();
    if (!q) {
      setMatches(null);
      return;
    }
    setLoading(true);
    try {
      const result = await Course.lookupAgentAlias(courseId, q);
      setMatches(result.matches);
    } catch (err: unknown) {
      message.error(apiErrorMessage(err) ?? 'Failed to look up that alias.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Alias',
      key: 'alias',
      render: (m: AgentAliasMatch) => <Text code>{m.alias}</Text>,
    },
    {
      title: 'Student',
      key: 'student',
      render: (m: AgentAliasMatch) => (
        <Space>
          <Text>{m.email}</Text>
          {!m.active && <Tag>inactive</Tag>}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <UserSwitchOutlined />
          <span>Student aliases</span>
        </Space>
      }
    >
      <Paragraph type="secondary">
        AI agents connected to this course see students as stable aliases like <Text code>student-3f9a1c2d40</Text>{' '}
        instead of email addresses, so no student identity leaves codePost. Paste an alias from a chat to see who it is,
        or enter an email or NetID to see their alias. Aliases are specific to this course.
      </Paragraph>
      <Input.Search
        placeholder="student-3f9a1c2d40, an email, or a NetID"
        allowClear
        enterButton="Look up"
        loading={loading}
        onSearch={handleSearch}
        style={{ maxWidth: 480, marginBottom: 12 }}
        data-testid="student-alias-search"
      />
      {matches !== null &&
        (matches.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No student in this course matches" />
        ) : (
          <Table dataSource={matches} columns={columns} rowKey="email" pagination={false} size="small" />
        ))}
    </Card>
  );
};

export default StudentAliasLookupCard;

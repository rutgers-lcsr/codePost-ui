// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Card, Empty, Flex, Input, Progress, Select, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import CPButton from '../../core/CPButton';
import { Course, GradebookAssignmentCell, GradebookQuizCell, GradebookResponse, ResponseError } from '../../../api-client';
import ExportModal from './ExportModal';
import {
  IGradebookRow,
  assignmentAverage,
  buildRows,
  classAveragePercent,
  percentColor,
  quizAveragePercent,
  sectionOptions,
} from './gradebookMath';
import { useGradebook } from './queries';

const { Text, Title } = Typography;

const PAGE_SIZE = 50;

const Muted: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text type="secondary">{children}</Text>
);

const renderAssignmentCell = (cell?: GradebookAssignmentCell) => {
  if (cell?.grade != null) return Number(cell.grade);
  if (cell?.hasSubmission && !cell.isFinalized) return <Tag color="orange">Pending</Tag>;
  return <Muted>—</Muted>;
};

const renderQuizCell = (cell?: GradebookQuizCell) => {
  if (cell?.score != null) return `${Number(cell.score)} / ${Number(cell.maxScore)}`;
  if (cell?.needsGrading) return <Tag color="orange">Pending</Tag>;
  return <Muted>—</Muted>;
};

const renderPercent = (percent: number | null) => {
  if (percent === null) return <Muted>—</Muted>;
  const p = Number(percent);
  return (
    <Flex align="center" gap={8}>
      {/* The bar is decorative — the text next to it is the accessible value. */}
      <span aria-hidden style={{ width: 56, display: 'inline-flex' }}>
        <Progress percent={p} size="small" showInfo={false} strokeColor={percentColor(p)} style={{ margin: 0 }} />
      </span>
      <Text>{p.toFixed(1)}%</Text>
    </Flex>
  );
};

// Sort helpers: ungraded rows always sort below graded ones.
const gradeOf = (row: IGradebookRow, assignmentId: number) => {
  const g = row.byAssignment[assignmentId]?.grade;
  return g == null ? -1 : Number(g);
};
const quizRatioOf = (row: IGradebookRow, quizId: number) => {
  const c = row.byQuiz[quizId];
  if (c?.score == null || !c.maxScore || Number(c.maxScore) <= 0) return -1;
  return Number(c.score) / Number(c.maxScore);
};

interface ITableProps {
  data: GradebookResponse;
}

/** The gradebook grid itself (presentational — takes the fetched response). Exported for
 *  tests; the default export wraps it with fetching, error handling, and the export button. */
export const GradebookTable: React.FC<ITableProps> = ({ data }) => {
  const [search, setSearch] = React.useState('');
  const [section, setSection] = React.useState<string | undefined>(undefined);

  const rows = React.useMemo(() => buildRows(data), [data]);
  const sections = React.useMemo(() => sectionOptions(rows), [rows]);
  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(
      (r) => (!needle || r.student.toLowerCase().includes(needle)) && (!section || r.section === section),
    );
  }, [rows, search, section]);

  const columns: ColumnsType<IGradebookRow> = React.useMemo(
    () => [
      {
        title: 'Student',
        dataIndex: 'student',
        key: 'student',
        fixed: 'left',
        width: 230,
        sorter: (a, b) => a.student.localeCompare(b.student),
      },
      {
        title: 'Section',
        key: 'section',
        width: 90,
        render: (_, row) => row.section ?? <Muted>—</Muted>,
        sorter: (a, b) => (a.section ?? '').localeCompare(b.section ?? ''),
      },
      ...(data.assignments.length > 0
        ? [
            {
              title: 'Assignments',
              children: data.assignments.map((a) => ({
                title: (
                  <>
                    {a.name} <Muted>/{Number(a.points)}</Muted>
                  </>
                ),
                key: `a-${a.id}`,
                width: 130,
                align: 'right' as const,
                sorter: (x: IGradebookRow, y: IGradebookRow) => gradeOf(x, a.id) - gradeOf(y, a.id),
                render: (_: unknown, row: IGradebookRow) => renderAssignmentCell(row.byAssignment[a.id]),
              })),
            },
          ]
        : []),
      ...(data.quizzes.length > 0
        ? [
            {
              title: 'Quizzes',
              children: data.quizzes.map((q) => ({
                title: q.title,
                key: `q-${q.id}`,
                width: 140,
                align: 'right' as const,
                sorter: (x: IGradebookRow, y: IGradebookRow) => quizRatioOf(x, q.id) - quizRatioOf(y, q.id),
                render: (_: unknown, row: IGradebookRow) => renderQuizCell(row.byQuiz[q.id]),
              })),
            },
          ]
        : []),
      {
        title: 'Overall',
        children: [
          {
            title: 'Total',
            key: 'total',
            width: 110,
            align: 'right' as const,
            sorter: (a: IGradebookRow, b: IGradebookRow) => a.totalEarned - b.totalEarned,
            render: (_: unknown, row: IGradebookRow) => `${Number(row.totalEarned)} / ${Number(row.totalPossible)}`,
          },
          {
            title: 'Percent',
            key: 'percent',
            width: 150,
            sorter: (a: IGradebookRow, b: IGradebookRow) => (a.percent ?? -1) - (b.percent ?? -1),
            render: (_: unknown, row: IGradebookRow) => renderPercent(row.percent),
          },
        ],
      },
    ],
    [data],
  );

  // Class averages over the FILTERED rows, so filtering to a section shows that
  // section's averages. Computed from all filtered rows, not just the visible page.
  const summary = () => {
    const classAvg = classAveragePercent(filtered);
    let index = 2;
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}>
            <Text strong>Average{section ? ` (${section})` : ''}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={1} />
          {data.assignments.map((a) => {
            const avg = assignmentAverage(filtered, a.id);
            return (
              <Table.Summary.Cell key={`a-${a.id}`} index={index++} align="right">
                {avg === null ? <Muted>—</Muted> : <Text strong>{avg.toFixed(1)}</Text>}
              </Table.Summary.Cell>
            );
          })}
          {data.quizzes.map((q) => {
            const avg = quizAveragePercent(filtered, q.id);
            return (
              <Table.Summary.Cell key={`q-${q.id}`} index={index++} align="right">
                {avg === null ? <Muted>—</Muted> : <Text strong>{avg.toFixed(0)}%</Text>}
              </Table.Summary.Cell>
            );
          })}
          <Table.Summary.Cell index={index++} />
          <Table.Summary.Cell index={index++}>
            {classAvg === null ? <Muted>—</Muted> : <Text strong>{classAvg.toFixed(1)}%</Text>}
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  if (rows.length === 0) {
    return <Empty description="No students enrolled yet." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 32 }} />;
  }

  return (
    <>
      <Flex gap={12} wrap style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          placeholder="Search students…"
          aria-label="Search students"
          style={{ width: 260 }}
          onChange={(e) => setSearch(e.target.value)}
        />
        {sections.length > 0 && (
          <Select
            allowClear
            placeholder="All sections"
            aria-label="Filter by section"
            style={{ width: 160 }}
            value={section}
            onChange={setSection}
            options={sections.map((s) => ({ value: s, label: s }))}
          />
        )}
      </Flex>
      <Table<IGradebookRow>
        dataSource={filtered}
        columns={columns}
        rowKey="student"
        size="small"
        pagination={{
          pageSize: PAGE_SIZE,
          showSizeChanger: true,
          showTotal: (total) => `${total} student${total === 1 ? '' : 's'}`,
        }}
        scroll={{ x: 'max-content' }}
        summary={summary}
        locale={{ emptyText: <Empty description="No students match your filters." image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />
    </>
  );
};

interface IProps {
  course: Course;
}

/** Course gradebook: every active student × every assignment and quiz, with totals over
 *  graded work. Course admins only (the server 403s everyone else). */
const Gradebook: React.FC<IProps> = ({ course }) => {
  const { data, isLoading, isError, error, refetch, isRefetching } = useGradebook(course.id);
  const [exportOpen, setExportOpen] = React.useState(false);

  const forbidden = error instanceof ResponseError && error.response?.status === 403;

  const stats =
    data &&
    [
      `${data.rows.length} student${data.rows.length === 1 ? '' : 's'}`,
      `${data.assignments.length} assignment${data.assignments.length === 1 ? '' : 's'}`,
      `${data.quizzes.length} quiz${data.quizzes.length === 1 ? '' : 'zes'}`,
    ].join(' · ');

  return (
    <Card
      title={
        <Flex vertical gap={2}>
          <Title level={2} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Gradebook
          </Title>
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
            {stats ?? 'Finalized assignment grades and official quiz scores.'}
          </Text>
        </Flex>
      }
      extra={
        <Flex gap={8}>
          <Tooltip title="Reload the latest grades">
            <CPButton icon={<ReloadOutlined />} loading={isRefetching} onClick={() => refetch()} aria-label="Reload gradebook" />
          </Tooltip>
          <Tooltip title="Choose columns and download a spreadsheet-ready CSV">
            <CPButton icon={<DownloadOutlined />} onClick={() => setExportOpen(true)} disabled={!data}>
              Export CSV
            </CPButton>
          </Tooltip>
        </Flex>
      }
    >
      {isLoading ? (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin size="large" />
        </Flex>
      ) : isError ? (
        forbidden ? (
          <Alert
            type="warning"
            showIcon
            message="Only course admins can view the gradebook."
            description="Ask a course admin for access, or use your per-assignment and per-quiz grading views."
          />
        ) : (
          <Alert
            type="error"
            showIcon
            message="The gradebook could not be loaded."
            action={
              <CPButton size="small" onClick={() => refetch()}>
                Try again
              </CPButton>
            }
          />
        )
      ) : data ? (
        <GradebookTable data={data} />
      ) : null}
      {data && <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} course={course} data={data} />}
    </Card>
  );
};

export default Gradebook;

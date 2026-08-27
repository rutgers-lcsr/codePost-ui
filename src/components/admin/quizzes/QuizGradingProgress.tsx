// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Course-level quiz grading progress — the quiz analogue of Submissions → By Grader.
 * Rows are graders, one progress column per published quiz with manual (essay/code)
 * responses; powered by GET /courses/{id}/quizGradingProgress/ (admin-only).
 */
import * as React from 'react';
import { Alert, Breadcrumb, Button, Empty, Progress, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { Link, useLocation } from 'react-router';

import { Course } from '../../../api-client';
import { ITableDetailColumn, TableDetail } from '../other/TableDetail';
import { useQuizGradingProgress } from './queries';
import { buildQuizProgressRows, pctColor } from './quizProgressRows';

interface IProps {
  course: Course;
  /** Eligible graders (rows even when idle): all graders while the course's
   *  gradersCanGradeQuizzes default is on, else the explicit quizGraders role list. */
  graders: string[];
  quizGraders: string[];
}

const QuizGradingProgress: React.FC<IProps> = ({ course, graders, quizGraders }) => {
  const location = useLocation();
  const { data, isLoading } = useQuizGradingProgress(course.id);

  const graderUniverse = (course.gradersCanGradeQuizzes ?? true) ? graders : quizGraders;
  const rows = React.useMemo(
    () => (data ? buildQuizProgressRows(data, graderUniverse) : []),
    [data, graderUniverse],
  );
  // Only quizzes with manual responses get a column — all-auto quizzes have nothing to track.
  const quizzes = React.useMemo(() => (data?.quizzes ?? []).filter((q) => q.totalManual > 0), [data]);
  const totalManual = quizzes.reduce((sum, q) => sum + q.totalManual, 0);
  const totalPending = data?.pendingUngraded ?? 0;

  const columns: ITableDetailColumn[] = React.useMemo(() => {
    const quizColumns: ITableDetailColumn[] = quizzes.map((quiz) => ({
      title: quiz.title,
      key: `quiz-${quiz.id}`,
      dataIndex: `_quiz_${quiz.id}`,
      width: 140,
      align: 'center' as const,
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((a[`_quiz_${quiz.id}_sort`] as number) ?? 0) - ((b[`_quiz_${quiz.id}_sort`] as number) ?? 0),
    }));
    return [
      {
        title: 'Grader',
        dataIndex: 'grader',
        key: 'primary',
        fixed: 'left' as const,
        width: 220,
        defaultSortOrder: 'ascend' as const,
        sorter: (a: { grader: string }, b: { grader: string }) => a.grader.localeCompare(b.grader),
      },
      {
        title: 'Responses Graded',
        dataIndex: '_totalGraded',
        key: 'totalGraded',
        width: 110,
        align: 'center' as const,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a._totalGraded as number) - (b._totalGraded as number),
      },
      {
        title: '% of All Grading',
        dataIndex: '_pctDone',
        key: 'pctDone',
        width: 100,
        align: 'center' as const,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a._pctDone as number) - (b._pctDone as number),
        render: (val: number) => (
          <Tooltip title={`This grader graded ${val}% of all manual responses in the course`}>
            <Typography.Text strong style={{ color: pctColor(val) }}>
              {val}%
            </Typography.Text>
          </Tooltip>
        ),
      },
      {
        title: 'Last Graded',
        dataIndex: '_lastGraded',
        key: 'lastGraded',
        width: 120,
        align: 'center' as const,
        sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (a._lastGradedTs as number) - (b._lastGradedTs as number),
        render: (_: unknown, record: Record<string, unknown>) => {
          const ts = record._lastGradedTs as number;
          if (ts === 0) return <span style={{ color: '#999' }}>—</span>;
          const d = dayjs(ts);
          const daysAgo = dayjs().diff(d, 'day');
          return (
            <Tooltip title={d.format('MMM D, YYYY h:mm A')}>
              <Typography.Text>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</Typography.Text>
            </Tooltip>
          );
        },
      },
      ...quizColumns,
    ];
  }, [quizzes]);

  const tableData = React.useMemo(
    () =>
      rows.map((row) => {
        const record: Record<string, unknown> = {
          key: row.grader,
          grader: row.grader,
          _totalGraded: row.totalGraded,
          _pctDone: totalManual > 0 ? Math.round((row.totalGraded / totalManual) * 100) : 0,
          _lastGradedTs: row.lastGradedTs,
        };
        for (const quiz of quizzes) {
          const graded = row.perQuiz[quiz.id] ?? 0;
          const pct = quiz.totalManual > 0 ? Math.round((graded / quiz.totalManual) * 100) : 0;
          record[`_quiz_${quiz.id}`] = (
            <Tooltip title={`${graded} of ${quiz.totalManual} manual responses graded by this grader`}>
              <span style={{ display: 'block', width: '100%' }}>
                <span style={{ fontSize: 12 }}>
                  {graded}/{quiz.totalManual}
                </span>
                <Progress
                  percent={pct}
                  showInfo={false}
                  size="small"
                  strokeColor={pct === 100 ? '#198665' : '#1890ff'}
                  style={{ marginTop: 2, marginBottom: 0 }}
                />
              </span>
            </Tooltip>
          );
          record[`_quiz_${quiz.id}_sort`] = graded;
        }
        return record;
      }),
    [rows, quizzes, totalManual],
  );

  const quizzesURL = location.pathname.replace(/\/quizzes\/grading-progress.*/, '/quizzes');
  const rosterURL = location.pathname.replace(/\/quizzes\/grading-progress.*/, '/roster/graders');

  return (
    <TableDetail
      title="Quiz Grading Progress"
      loadComplete={!isLoading}
      isEmpty={quizzes.length === 0 || rows.length === 0}
      emptyNode={
        <Empty
          description={
            quizzes.length === 0
              ? 'No quizzes with manually-graded (essay/code) responses yet.'
              : 'No eligible graders yet.'
          }
        >
          <Link to={quizzes.length === 0 ? quizzesURL : rosterURL}>
            <Button type="primary">{quizzes.length === 0 ? 'Go to Quizzes' : 'Manage Graders'}</Button>
          </Link>
        </Empty>
      }
      columns={columns}
      data={tableData}
      actions={[]}
      beforeTable={
        <Alert
          type={totalPending > 0 ? 'warning' : 'success'}
          showIcon
          style={{ marginBottom: 12 }}
          message={
            totalPending > 0
              ? `${totalPending} response${totalPending === 1 ? '' : 's'} awaiting grading across ${quizzes.length} quiz${quizzes.length === 1 ? '' : 'zes'}`
              : 'All manual responses are graded.'
          }
        />
      }
      tableProps={{ scroll: { x: 'max-content' } }}
      breadcrumbs={<Breadcrumb items={[{ title: 'Quizzes' }, { title: 'Grading Progress' }]} />}
    />
  );
};

export default QuizGradingProgress;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useState, useEffect } from 'react';
import { Collapse, Segmented, Typography, Badge, Progress, Card, Button } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, CaretRightOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

// ── Status colors matching real TestsList ───────────────────────────
const statusColors = {
  passed: { main: '#237804', bg: '#f6ffed', border: '#b7eb8f' },
  failed: { main: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
  default: { main: '#595959', bg: '#fafafa', border: '#d9d9d9' },
};

// ── Test data structures ───────────────────────────────────────────
interface TestDef {
  name: string;
  description: string;
  score: number;
  maxScore: number;
  passed: boolean;
}

interface TestCategory {
  name: string;
  targetFileName: string;
  tests: TestDef[];
}

// ── Test data per slider mode ──────────────────────────────────────

// Mode 0: Simple — one category, basic unit tests
const SIMPLE_CATEGORIES: TestCategory[] = [
  {
    name: 'Sorting Tests',
    targetFileName: 'solution.py',
    tests: [
      { name: 'test_basic_sort', description: 'Basic ascending sort', score: 5, maxScore: 5, passed: true },
      { name: 'test_empty_input', description: 'Empty array edge case', score: 5, maxScore: 5, passed: true },
      { name: 'test_duplicates', description: 'Handle duplicate values', score: 5, maxScore: 5, passed: true },
      { name: 'test_reverse', description: 'Reverse-sorted input', score: 0, maxScore: 5, passed: false },
      { name: 'test_single', description: 'Single element array', score: 5, maxScore: 5, passed: true },
    ],
  },
];

// Mode 1: Medium — two categories
const MEDIUM_CATEGORIES: TestCategory[] = [
  {
    name: 'Correctness',
    targetFileName: 'merge_sort.py',
    tests: [
      { name: 'test_sorted', description: 'Already sorted input', score: 5, maxScore: 5, passed: true },
      { name: 'test_random', description: 'Random order input', score: 5, maxScore: 5, passed: true },
      { name: 'test_negative', description: 'Negative values', score: 0, maxScore: 5, passed: false },
    ],
  },
  {
    name: 'Performance',
    targetFileName: 'merge_sort.py',
    tests: [
      { name: 'test_time', description: 'O(n log n) time complexity', score: 5, maxScore: 5, passed: true },
      { name: 'test_space', description: 'Memory usage within bounds', score: 5, maxScore: 5, passed: true },
    ],
  },
];

// Mode 2: Flexible — three categories
const FLEXIBLE_CATEGORIES: TestCategory[] = [
  {
    name: 'Sorting Correctness',
    targetFileName: 'sort_module.py',
    tests: [
      { name: 'test_asc', description: 'Ascending sort', score: 5, maxScore: 5, passed: true },
      { name: 'test_desc', description: 'Descending input', score: 5, maxScore: 5, passed: true },
      { name: 'test_equal', description: 'All equal elements', score: 0, maxScore: 5, passed: false },
    ],
  },
  {
    name: 'Edge Cases',
    targetFileName: 'sort_module.py',
    tests: [
      { name: 'test_empty', description: 'Empty array', score: 5, maxScore: 5, passed: true },
      { name: 'test_single', description: 'Single element', score: 5, maxScore: 5, passed: true },
    ],
  },
  {
    name: 'Stability',
    targetFileName: 'sort_module.py',
    tests: [{ name: 'test_no_mutation', description: 'Input array unchanged', score: 5, maxScore: 5, passed: true }],
  },
];

type TestMode = 0 | 1 | 2;
const modeCategories = [SIMPLE_CATEGORIES, MEDIUM_CATEGORIES, FLEXIBLE_CATEGORIES] as const;

// ── Single test card ───────────────────────────────────────────────
const TestCard: React.FC<{ test: TestDef; visible: boolean }> = ({ test, visible }) => {
  const sc = test.passed ? statusColors.passed : statusColors.failed;

  return (
    <Card
      size="small"
      hoverable
      style={{
        marginBottom: 10,
        borderRadius: 6,
        border: `1px solid ${sc.border}`,
        borderLeft: `4px solid ${sc.main}`,
        backgroundColor: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
      styles={{ body: { padding: '10px 14px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ paddingTop: 1 }}>
          {test.passed ? (
            <CheckCircleFilled style={{ fontSize: 20, color: statusColors.passed.main }} />
          ) : (
            <CloseCircleFilled style={{ fontSize: 20, color: statusColors.failed.main }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, marginRight: 8 }}>
              <Text strong style={{ fontSize: 12, display: 'block', lineHeight: 1.4 }}>
                {test.description}
              </Text>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: sc.main,
                  border: `1px solid ${sc.border}`,
                  background: sc.bg,
                  borderRadius: 4,
                  padding: '1px 6px',
                  display: 'inline-block',
                }}
              >
                {test.score}/{test.maxScore} pts
              </div>
              <div style={{ fontSize: 10, color: '#595959', marginTop: 2 }}>{test.passed ? 'Passed' : 'Failed'}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ── Category header (matches real renderCategoryHeader) ────────────
const CategoryHeader: React.FC<{ category: TestCategory }> = ({ category }) => {
  const catScore = category.tests.reduce((s, t) => s + t.score, 0);
  const catMax = category.tests.reduce((s, t) => s + t.maxScore, 0);
  const catPct = catMax > 0 ? Math.round((catScore / catMax) * 100) : 0;
  const isComplete = catMax > 0 && catScore === catMax;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingRight: 8,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: 16 }}>
        <Text
          strong
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {category.name}
        </Text>
        <Text code style={{ fontSize: 10, marginTop: 2, color: '#595959' }}>
          {category.targetFileName}
        </Text>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <Text strong style={{ fontSize: 11, color: isComplete ? '#52c41a' : undefined }}>
          {catScore} / {catMax} pts
        </Text>
        <div style={{ width: 70, marginTop: 2 }}>
          <Progress
            percent={catPct}
            size="small"
            showInfo={false}
            strokeColor={isComplete ? '#52c41a' : undefined}
            aria-label={`${category.name} progress: ${catScore} of ${catMax} points`}
          />
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────
const AutograderModule: React.FC = () => {
  const [mode, setMode] = useState<TestMode>(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const categories = modeCategories[mode];
  const allTests = categories.flatMap((c) => c.tests);

  // Animate cards in one by one
  useEffect(() => {
    // animation timer pattern, not cascading render
    setVisibleCount(0);
    let i = 0;
    const tick = () => {
      i += 1;
      setVisibleCount(i);
      if (i < allTests.length) setTimeout(tick, 150);
    };
    const t = setTimeout(tick, 250);
    return () => clearTimeout(t);
  }, [mode, allTests.length]);

  const passed = allTests.filter((t) => t.passed).length;
  const failed = allTests.filter((t) => !t.passed).length;
  const totalScore = allTests.reduce((s, t) => s + t.score, 0);
  const totalMax = allTests.reduce((s, t) => s + t.maxScore, 0);
  const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  // Cumulative test counts per category for staggered animation
  const categoryOffsets = categories.reduce<number[]>(
    (acc, cat) => [...acc, (acc[acc.length - 1] ?? 0) + cat.tests.length],
    [0],
  );

  return (
    <div style={{ width: 460 }}>
      {/* Mode selector */}
      <div style={{ marginBottom: 16 }}>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as TestMode)}
          options={[
            { label: 'Simple', value: 0 },
            { label: 'Standard', value: 1 },
            { label: 'Flexible', value: 2 },
          ]}
          block
        />
      </div>

      {/* Test results panel */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #e8e8e8',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          {/* Styled as a heading but not a semantic <h5>: this demo widget is embedded in
              marketing/docs pages where an h5 here skips heading levels (heading-order). */}
          <Text strong style={{ fontSize: 14 }}>
            Test Results
          </Text>
          <Button type="primary" icon={<PlayCircleOutlined />} size="small">
            Run All
          </Button>
        </div>

        <div style={{ padding: '12px 16px' }}>
          {/* Summary badges */}
          <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge count={`${passed} Passed`} style={{ backgroundColor: statusColors.passed.main, color: '#fff' }} />
            {failed > 0 && (
              <Badge count={`${failed} Failed`} style={{ backgroundColor: statusColors.failed.main, color: '#fff' }} />
            )}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 12 }}>
            <Progress
              percent={pct}
              status={failed > 0 ? 'exception' : passed === allTests.length ? 'success' : 'active'}
              // antd's exception-state text red (#f64852) is only 3.5:1; use a darker red (5.6:1) when failing.
              format={() => (
                <span style={{ color: failed > 0 ? '#cf1322' : undefined }}>
                  {totalScore}/{totalMax}
                </span>
              )}
              strokeColor={passed === allTests.length ? statusColors.passed.main : undefined}
              aria-label={`Overall test score: ${totalScore} of ${totalMax} points`}
            />
          </div>

          {/* Categories as collapsible panels */}
          <Collapse
            defaultActiveKey={categories.map((_, i) => i.toString())}
            ghost
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: 11 }} />}
          >
            {categories.map((category, catIdx) => {
              const startIdx = categoryOffsets[catIdx];

              return (
                <Collapse.Panel
                  key={catIdx.toString()}
                  header={<CategoryHeader category={category} />}
                  style={{ marginBottom: 8 }}
                >
                  {category.tests.map((test, testIdx) => (
                    <TestCard key={`${mode}-${test.name}`} test={test} visible={startIdx + testIdx < visibleCount} />
                  ))}
                </Collapse.Panel>
              );
            })}
          </Collapse>
        </div>
      </div>
    </div>
  );
};

export default AutograderModule;

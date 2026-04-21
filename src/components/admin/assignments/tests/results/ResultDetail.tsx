// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Avatar,
  Button,
  Collapse,
  Empty,
  message,
  Modal,
  Segmented,
  Select,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CodeOutlined,
  ExclamationCircleFilled,
  FileTextOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { SubmissionInfoType, SubmissionTestType, TestCaseType, TestCategoryType } from '../../../../../types/models';
import { colors } from '../../../../../theme/colors';
import { SubmissionFile } from '../../../../../api-client';
import { autograderApi, submissionFilesApi } from '../../../../../api-client/clients';
import { File as FileUtil, FileType } from '../../../../../utils/file';

import {
  fetchTestsBySubmission,
  RESULT_STATUS,
  TestCasesByCategory,
  TestsBySubmission,
} from '../../../../core/testFetchUtils';
import { getLatestSubmissionTests } from '../../../../../utils/submissionTests';
import { awaitTestResult } from '../autograderPollingUtils';

import { List, type RowComponentProps } from 'react-window';
import useWindowSize from '../../../../core/useWindowSize';

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

interface IProps {
  open: boolean;
  onCancel: () => void;
  testsBySubmission: TestsBySubmission;
  casesByCategory: TestCasesByCategory;
  categories: TestCategoryType[];
  submissions: SubmissionInfoType[];

  filterCategory: TestCategoryType | undefined;
  filterCase: TestCaseType | undefined;
  filterStatus: RESULT_STATUS | undefined;
  filterSubmission: SubmissionInfoType | undefined;
}

// ───────────────────────────────────────────────────────────────
// Style constants
// ───────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  [RESULT_STATUS.Passed]: {
    color: colors.brandPrimary,
    bg: '#f6ffed',
    border: '#b7eb8f',
    label: 'Passed',
    icon: <CheckCircleFilled />,
    tagColor: 'success',
  },
  [RESULT_STATUS.Failed]: {
    color: colors.actionRed,
    bg: '#fff1f0',
    border: '#ffa39e',
    label: 'Failed',
    icon: <CloseCircleFilled />,
    tagColor: 'error',
  },
  [RESULT_STATUS.Error]: {
    color: '#faad14',
    bg: '#fffbe6',
    border: '#ffe58f',
    label: 'Error',
    icon: <ExclamationCircleFilled />,
    tagColor: 'warning',
  },
} as const;

const SIDEBAR_WIDTH = 260;
const ROW_HEIGHT = 56;

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

const getTestStatus = (t: SubmissionTestType): RESULT_STATUS =>
  t.passed === true ? RESULT_STATUS.Passed : t.isError ? RESULT_STATUS.Error : RESULT_STATUS.Failed;

const sameStatus = (t: SubmissionTestType, status: RESULT_STATUS): boolean => {
  switch (status) {
    case RESULT_STATUS.Passed:
      return t.passed === true;
    case RESULT_STATUS.Failed:
      return !t.passed && !t.isError;
    case RESULT_STATUS.Error:
      return !!t.isError;
  }
};

const formatPoints = (points: number | undefined): string => {
  const p = points || 0;
  if (p > 0) return `+${p}`;
  return `${p}`;
};

// ───────────────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────────────

/** Single test result card shown in the main content area */
const TestResultCard: React.FC<{
  test: SubmissionTestType;
  testCase: TestCaseType | undefined;
  categoryName: string | undefined;
}> = ({ test, testCase, categoryName }) => {
  const status = getTestStatus(test);
  const config = STATUS_CONFIG[status];
  const points = test.passed ? testCase?.pointsPass : testCase?.pointsFail;

  const tabs = useMemo(() => {
    const items = [
      {
        key: 'output',
        label: 'Output',
        children: (
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#333',
              lineHeight: 1.5,
              maxHeight: 250,
              overflow: 'auto',
              padding: '12px 16px',
            }}
          >
            {test.logs || '(No output)'}
          </pre>
        ),
      },
    ];

    if (testCase) {
      if (testCase.explanation || testCase.functionName || testCase.timeout) {
        items.push({
          key: 'details',
          label: 'Details',
          children: (
            <div style={{ padding: '12px 16px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {testCase.explanation && (
                <div>
                  <Typography.Text strong>Explanation</Typography.Text>
                  <div style={{ marginTop: 4, color: '#555' }}>{testCase.explanation}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 24 }}>
                {testCase.functionName && (
                  <div>
                    <Typography.Text type="secondary">Function:</Typography.Text>{' '}
                    <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: 4 }}>
                      {testCase.functionName}
                    </code>
                  </div>
                )}
                {testCase.timeout && (
                  <div>
                    <Typography.Text type="secondary">Timeout:</Typography.Text> {testCase.timeout}s
                  </div>
                )}
              </div>
            </div>
          ),
        });
      }

      if (testCase.testCode) {
        items.push({
          key: 'code',
          label: 'Test Code',
          children: (
            <div style={{ padding: '0' }}>
              <SyntaxHighlighter
                language="python"
                style={githubGist}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  fontSize: 12,
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                {testCase.testCode}
              </SyntaxHighlighter>
            </div>
          ),
        });
      }
    }

    if (test.results) {
      items.push({
        key: 'results',
        label: 'Raw Results',
        children: (
          <div style={{ padding: '12px 16px' }}>
            <pre
              style={{
                margin: 0,
                fontSize: 11,
                fontFamily: 'monospace',
                background: '#f9f9f9',
                padding: 12,
                borderRadius: 4,
                maxHeight: 200,
                overflow: 'auto',
                border: '1px solid #eee',
              }}
            >
              {JSON.stringify(test.results, null, 2)}
            </pre>
          </div>
        ),
      });
    }

    return items;
  }, [test, testCase]);

  return (
    <div
      style={{
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ width: 6, background: config.color, flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 18, color: config.color }}>{config.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Typography.Text strong style={{ fontSize: 15 }}>
                  {testCase?.description || `Test #${test.testCase}`}
                </Typography.Text>
                {testCase?.explanation && (
                  <Tooltip title={testCase.explanation}>
                    <InfoCircleOutlined style={{ color: '#aaa' }} />
                  </Tooltip>
                )}
              </div>
              {categoryName && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {categoryName}
                </Typography.Text>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Score Badge */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: config.color }}>{formatPoints(points)} pts</div>
              {test.score !== undefined && test.maxScore !== undefined && test.maxScore > 0 && (
                <div style={{ fontSize: 11, color: '#999' }}>
                  {test.score} / {test.maxScore}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ background: '#fff' }}>
        <Tabs
          items={tabs}
          size="small"
          tabBarStyle={{ marginBottom: 0, paddingLeft: 16, background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}
        />
      </div>
    </div>
  );
};

/** Collapsible code preview panel for a submission file */
const CodePreview: React.FC<{
  file: SubmissionFile;
  loading: boolean;
}> = ({ file, loading }) => {
  const lang = FileUtil.language(file as FileType);

  return (
    <Collapse
      size="small"
      defaultActiveKey={['code']}
      style={{ marginBottom: 20, border: '1px solid #d9d9d9', borderRadius: 8 }}
      items={[
        {
          key: 'code',
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ color: colors.actionBlue }} />
              <Typography.Text strong style={{ fontSize: 13 }}>
                {file.name}
              </Typography.Text>
              <Tag style={{ margin: 0, fontSize: 11 }}>{lang}</Tag>
            </div>
          ),
          extra: (
            <Tag icon={<CodeOutlined />} color="blue" style={{ margin: 0 }}>
              Preview
            </Tag>
          ),
          children: loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin tip="Loading file content..." />
            </div>
          ) : file.data ? (
            <SyntaxHighlighter
              language={lang}
              style={githubGist}
              showLineNumbers
              wrapLines
              customStyle={{
                margin: 0,
                borderRadius: 4,
                fontSize: 12,
                lineHeight: '1.6',
                maxHeight: 400,
                overflow: 'auto',
                border: '1px solid #f0f0f0',
              }}
              lineNumberStyle={{
                minWidth: '2.5em',
                paddingRight: 12,
                color: '#bbb',
                userSelect: 'none',
                borderRight: '1px solid #f0f0f0',
                marginRight: 8,
              }}
            >
              {file.data}
            </SyntaxHighlighter>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <Empty description="File content not available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ),
        },
      ]}
    />
  );
};

/** Empty state when no tests match filters */
const EmptyResults: React.FC<{ hasSubmission: boolean }> = ({ hasSubmission }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 300,
      background: '#fafafa',
      borderRadius: 8,
      border: '1px dashed #d9d9d9',
    }}
  >
    <Empty
      description={
        hasSubmission ? 'No test results match the current filters.' : 'Select a student to view test results.'
      }
    />
  </div>
);

// ───────────────────────────────────────────────────────────────
// Main component
// ───────────────────────────────────────────────────────────────

export const ResultDetail = (props: IProps) => {
  const [filterCategory, setFilterCategory] = useState<TestCategoryType | undefined>(props.filterCategory);
  const [filterCase, setFilterCase] = useState<TestCaseType | undefined>(props.filterCase);
  const [filterStatus, setFilterStatus] = useState<RESULT_STATUS | undefined>(props.filterStatus);
  const [filterSubmission, setFilterSubmission] = useState<SubmissionInfoType | undefined>(props.filterSubmission);

  // ─── Local overrides for rerun tests ───────────────────────
  const [localTests, setLocalTests] = useState<TestsBySubmission>({});
  const [running, setRunning] = useState(false);

  const windowSize = useWindowSize();

  // ─── State for code preview ────────────────────────────────
  const [targetFile, setTargetFile] = useState<SubmissionFile | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // ─── Sync filters from props when modal opens ─────────────
  useEffect(() => {
    if (props.open) setFilterCategory(props.filterCategory);
  }, [props.filterCategory, props.open]);
  useEffect(() => {
    if (props.open) setFilterCase(props.filterCase);
  }, [props.filterCase, props.open]);
  useEffect(() => {
    if (props.open) setFilterStatus(props.filterStatus);
  }, [props.filterStatus, props.open]);
  useEffect(() => {
    const newSub = props.filterSubmission
      ? props.filterSubmission
      : props.submissions !== undefined && props.submissions.length > 0
        ? props.submissions[0]
        : undefined;
    if (props.open) setFilterSubmission(newSub);
  }, [props.filterSubmission, props.open, props.submissions]);

  // ─── Fetch target file when submission or category changes ─
  const fetchTargetFile = useCallback(
    async (submission: SubmissionInfoType | undefined, category: TestCategoryType | undefined) => {
      if (!submission || !submission.files || submission.files.length === 0) {
        setTargetFile(null);
        return;
      }

      // Determine which file to show: match by category's targetFileName, or fall back to first file
      const targetName = category?.targetFileName;
      const matchingFile = targetName ? submission.files.find((f) => f.name === targetName) : submission.files[0];

      if (!matchingFile) {
        // If the targetFileName doesn't match any file, show first file
        const fallbackFile = submission.files[0];
        if (!fallbackFile || !fallbackFile.id) {
          setTargetFile(null);
          return;
        }
        setFileLoading(true);
        try {
          const full = await submissionFilesApi.retrieve({ id: fallbackFile.id });
          setTargetFile(full);
        } catch {
          setTargetFile(fallbackFile);
        } finally {
          setFileLoading(false);
        }
        return;
      }

      // If data is already populated, use it
      if (matchingFile.data) {
        setTargetFile(matchingFile);
        return;
      }

      // Fetch the full file content
      if (!matchingFile.id) {
        setTargetFile(matchingFile);
        return;
      }
      setFileLoading(true);
      try {
        const full = await submissionFilesApi.retrieve({ id: matchingFile.id });
        setTargetFile(full);
      } catch {
        setTargetFile(matchingFile);
      } finally {
        setFileLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (props.open && filterSubmission) {
      fetchTargetFile(filterSubmission, filterCategory);
    } else {
      setTargetFile(null);
    }
  }, [props.open, filterSubmission, filterCategory, fetchTargetFile]);

  // ─── Event handlers ───────────────────────────────────────
  const handleCategoryChange = (value: string) => {
    const categoryID = parseInt(value, 10);
    const category = props.categories.find((c) => c.id === categoryID);
    setFilterCategory(category);
    // Reset case filter when category changes
    setFilterCase(undefined);
  };

  const handleCaseChange = (value: string) => {
    const caseID = parseInt(value, 10);
    const availableCases =
      filterCategory && filterCategory.id in props.casesByCategory ? props.casesByCategory[filterCategory.id] : [];
    setFilterCase(availableCases.find((c) => c.id === caseID));
  };

  const handleStatusChange = (value: string | number) => {
    if (value === 'All') {
      setFilterStatus(undefined);
    } else {
      const newStatus = RESULT_STATUS[value as keyof typeof RESULT_STATUS];
      if (newStatus !== undefined) {
        setFilterStatus(newStatus);
      }
    }
  };

  const handleRunTests = () => {
    if (!filterSubmission) return;
    const subId = filterSubmission.id;

    Modal.confirm({
      title: 'Run all tests',
      content: 'Test run on edited files will be rerun and results will be overwritten',
      okText: 'Run',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        setRunning(true);
        const hide = message.loading('Starting test run...', 0);
        try {
          const payload = { submissionId: subId, testId: null };
          const response = await autograderApi.v2RunCreate({
            testExecutionRequest: payload as unknown as Parameters<
              typeof autograderApi.v2RunCreate
            >[0]['testExecutionRequest'],
          });
          const taskId =
            (response as unknown as { taskId?: string; task_id?: string }).taskId ||
            (response as unknown as { task_id?: string }).task_id;
          if (!taskId) throw new Error('No task ID returned');

          // Poll for completion
          await new Promise<void>((resolve, reject) => {
            awaitTestResult(
              taskId,
              async () => {
                try {
                  // Fetch updated results for this submission
                  const newTestsMap = await fetchTestsBySubmission([filterSubmission]);
                  setLocalTests((prev) => ({ ...prev, [subId]: newTestsMap[subId] }));
                  message.success('Tests completed successfully');
                  resolve();
                } catch (err) {
                  reject(err);
                }
              },
              (_progress: unknown) => {
                // optional progress updates
              },
            );
          });
        } catch (e) {
          console.error(e);
          message.error('Failed to run tests');
        } finally {
          hide();
          setRunning(false);
        }
      },
    });
  };

  // ─── Derived data ─────────────────────────────────────────

  /** Utilities to get tests for a submission, preferring local updates */
  const getTestsForSubmission = useCallback(
    (subId: number) => {
      return localTests[subId] || props.testsBySubmission[subId] || [];
    },
    [localTests, props.testsBySubmission],
  );

  /** Check if a submission has any tests matching the active status filter */
  const isInactive = (submission: SubmissionInfoType): boolean => {
    if (filterStatus === undefined) return false;

    const subTests = getTestsForSubmission(submission.id);
    const latest = getLatestSubmissionTests(subTests);

    if (filterCase) {
      return !latest.some((t) => sameStatus(t, filterStatus) && t.testCase === filterCase.id);
    }
    if (filterCategory) {
      const caseIds = (props.casesByCategory[filterCategory.id] || []).map((tc) => tc.id);
      return !latest.some((t) => sameStatus(t, filterStatus) && caseIds.includes(t.testCase));
    }
    return !latest.some((t) => sameStatus(t, filterStatus));
  };

  /** Get pass/fail/error counts for a submission to show in sidebar */
  const getSubmissionCounts = (submission: SubmissionInfoType) => {
    const subTests = getTestsForSubmission(submission.id);
    if (!subTests) return null;
    const latest = getLatestSubmissionTests(subTests);
    let passed = 0;
    let failed = 0;
    let error = 0;
    for (const t of latest) {
      if (t.passed) passed++;
      else if (t.isError) error++;
      else failed++;
    }
    return { passed, failed, error };
  };

  /** Filtered test results for the currently selected submission */
  const testsToShow = useMemo((): SubmissionTestType[] => {
    if (!filterSubmission) return [];
    const allTests = localTests[filterSubmission.id] || props.testsBySubmission[filterSubmission.id] || [];
    if (allTests.length === 0) return [];

    return getLatestSubmissionTests(allTests).filter((t) => {
      const meetsCategory = filterCategory ? t.testCategory === filterCategory.id : true;
      const meetsCase = filterCase ? t.testCase === filterCase.id : true;
      const meetsStatus = filterStatus !== undefined ? sameStatus(t, filterStatus) : true;
      return meetsCategory && meetsCase && meetsStatus;
    });
  }, [filterSubmission, props.testsBySubmission, localTests, filterCategory, filterCase, filterStatus]);

  /** Build a lookup from test case ID → TestCaseType */
  const testCaseMap = useMemo(() => {
    const map: Record<number, TestCaseType> = {};
    for (const cases of Object.values(props.casesByCategory)) {
      for (const tc of cases) {
        map[tc.id] = tc;
      }
    }
    return map;
  }, [props.casesByCategory]);

  /** Build a lookup from category ID → name */
  const categoryNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const cat of props.categories) {
      map[cat.id] = cat.name;
    }
    return map;
  }, [props.categories]);

  const availableCases =
    filterCategory && filterCategory.id in props.casesByCategory ? props.casesByCategory[filterCategory.id] : [];

  const contentHeight = Math.max(400, windowSize.height - 300);

  // ─── Render ───────────────────────────────────────────────

  const SubmissionRow = ({ index, style }: RowComponentProps) => {
    const sub = props.submissions[index];
    const isSelected = filterSubmission && filterSubmission.id === sub.id;
    const inactive = isInactive(sub);
    const counts = getSubmissionCounts(sub);
    const hasSubmission = sub.files && sub.files.length > 0;

    return (
      <div
        style={{
          ...style,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: '1px solid #f0f0f0',
          transition: 'all 0.15s',
          background: isSelected ? '#f6ffed' : '#fff',
          borderLeft: isSelected ? `4px solid ${colors.brandPrimary}` : '4px solid transparent',
        }}
        onClick={() => setFilterSubmission(sub)}
      >
        <Avatar
          size="small"
          icon={<UserOutlined />}
          style={{ backgroundColor: isSelected ? colors.brandPrimary : '#ccc', marginRight: 10, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 13,
              fontWeight: isSelected ? 600 : 400,
              color: inactive ? '#bbb' : '#333',
            }}
          >
            {sub.students.join(', ')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Counts */}
            {counts && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, fontSize: 10 }}>
                {counts.passed > 0 && <span style={{ color: colors.brandPrimary }}>{counts.passed} pass</span>}
                {counts.failed > 0 && <span style={{ color: colors.actionRed }}>{counts.failed} fail</span>}
                {counts.error > 0 && <span style={{ color: colors.actionBlue }}>{counts.error} err</span>}
              </div>
            )}
            {!hasSubmission && <Tag style={{ margin: 0, fontSize: 9 }}>No files</Tag>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      centered
      width={'85%'}
      open={props.open}
      onCancel={props.onCancel}
      title={
        <Typography.Text strong style={{ fontSize: 16 }}>
          Test Results Detail
        </Typography.Text>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px', gap: 8 }}>
          <Button
            disabled={!filterSubmission || running}
            loading={running}
            icon={<PlayCircleOutlined />}
            onClick={handleRunTests}
          >
            Run all tests
          </Button>
          <Button onClick={props.onCancel}>Close</Button>
        </div>
      }
      styles={{ body: { padding: 0 } }}
    >
      {/* ─── Filter bar ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <Select
            value={filterCategory?.id.toString() || '0'}
            onChange={handleCategoryChange}
            style={{ minWidth: 200 }}
            placeholder="Select a Category"
            options={[
              { value: '0', label: 'All Categories' },
              ...props.categories.map((cat) => ({ value: cat.id.toString(), label: cat.name })),
            ]}
          />

          <Select
            value={filterCase?.id.toString() || '0'}
            onChange={handleCaseChange}
            style={{ minWidth: 240 }}
            disabled={availableCases.length === 0}
            options={[
              { value: '0', label: 'All Tests' },
              ...availableCases.map((tc) => ({ value: tc.id.toString(), label: tc.description })),
            ]}
          />
        </div>

        <Segmented
          options={[
            'All',
            {
              label: 'Passed',
              value: RESULT_STATUS[RESULT_STATUS.Passed],
              icon: <CheckCircleFilled style={{ color: colors.brandPrimary }} />,
            },
            {
              label: 'Failed',
              value: RESULT_STATUS[RESULT_STATUS.Failed],
              icon: <CloseCircleFilled style={{ color: colors.actionRed }} />,
            },
            {
              label: 'Error',
              value: RESULT_STATUS[RESULT_STATUS.Error],
              icon: <ExclamationCircleFilled style={{ color: colors.actionBlue }} />,
            },
          ]}
          value={filterStatus !== undefined ? RESULT_STATUS[filterStatus] : 'All'}
          onChange={handleStatusChange}
        />
      </div>

      {/* ─── Main content: sidebar + results ─────────────── */}
      <div style={{ display: 'flex', height: contentHeight, background: '#f5f7fa' }}>
        {/* Sidebar */}
        <div
          style={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid #f0f0f0',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              background: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography.Text strong style={{ fontSize: 12, textTransform: 'uppercase', color: '#888' }}>
              Submissions ({props.submissions.length})
            </Typography.Text>
          </div>
          <div style={{ flex: 1 }}>
            <List
              rowCount={props.submissions.length}
              rowHeight={ROW_HEIGHT}
              rowComponent={SubmissionRow}
              rowProps={{}}
              style={{ height: contentHeight - 45 }}
            />
          </div>
        </div>

        {/* Results area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
          {filterSubmission && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {filterSubmission.students.join(', ')}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Submitted {new Date(filterSubmission.dateUploaded || '').toLocaleString()}
              </Typography.Text>
            </div>
          )}

          {/* Code preview */}
          {targetFile && <CodePreview file={targetFile} loading={fileLoading} />}

          {testsToShow.length > 0 ? (
            testsToShow.map((test) => (
              <TestResultCard
                key={test.id}
                test={test}
                testCase={testCaseMap[test.testCase]}
                categoryName={categoryNameMap[test.testCategory]}
              />
            ))
          ) : (
            <EmptyResults hasSubmission={!!filterSubmission} />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ResultDetail;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useEffect, useState, useContext } from 'react';
import { Button, Card, Collapse, Progress, Typography, message, Badge, Alert, Tag, Tooltip, Popover } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  PlayCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  MinusCircleFilled,
  CaretRightOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RubricCategory, SubmissionTest, TestCase, TestCategory } from '../../../api-client';
import { autograderApi, submissionsApi } from '../../../api-client/clients';
import { useTaskPolling } from '../../../hooks/useTaskPolling';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';
import { buildDemoExecutionResults } from './demoExecution';
import { getLatestSubmissionTests } from '../../../utils/submissionTests';

const { Panel } = Collapse;
const { Text, Title } = Typography;

interface TestsListProps {
  submissionId: number;
  tests: TestCase[];
  rubricCategories?: RubricCategory[];
  testCategories?: TestCategory[];
  fileOverrides?: Record<number, string>; // Map of file ID -> temporary content
  demoMode?: boolean;
  initialResults?: SubmissionTest[];
}

interface TestItem {
  definition: TestCase;
  result?: SubmissionTest;
}

interface ParsedTestResult {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  error?: string;
  description?: string;
  message?: string;
}

interface SyntaxInsight {
  hasSyntaxIssue: boolean;
  hasSyntaxLinkedFailure: boolean;
  showAdvisory: boolean;
}

type TestOutcome = 'not-run' | 'passed' | 'partial' | 'failed' | 'error';

const SYNTAX_ERROR_PATTERNS: RegExp[] = [
  /\bSyntaxError\b/i,
  /\bIndentationError\b/i,
  /\bTabError\b/i,
  /\bParseError\b/i,
  /invalid syntax/i,
  /unexpected EOF while parsing/i,
  /unterminated string literal/i,
  /EOL while scanning string literal/i,
  /compile(?:d|r)?\s*error/i,
  /compilation failed/i,
];

const getSyntaxInsight = (result?: SubmissionTest, parsedResults: ParsedTestResult[] = []): SyntaxInsight => {
  if (!result) {
    return { hasSyntaxIssue: false, hasSyntaxLinkedFailure: false, showAdvisory: false };
  }

  const candidateTexts = [result.logs || '', ...parsedResults.flatMap((r) => [r.error || '', r.message || ''])].filter(
    Boolean,
  );

  const hasSyntaxIssue = candidateTexts.some((text) => SYNTAX_ERROR_PATTERNS.some((pattern) => pattern.test(text)));

  const hasSyntaxLinkedFailure = parsedResults.some((r) => {
    if (r.passed) return false;
    const detail = `${r.error || ''}\n${r.message || ''}`;
    return SYNTAX_ERROR_PATTERNS.some((pattern) => pattern.test(detail));
  });

  const hasAdvisoryMarker = /notebook syntax advisory/i.test(result.logs || '');

  if (!hasSyntaxIssue) {
    return {
      hasSyntaxIssue: false,
      hasSyntaxLinkedFailure,
      showAdvisory: hasAdvisoryMarker,
    };
  }

  return {
    hasSyntaxIssue,
    hasSyntaxLinkedFailure,
    showAdvisory: !hasSyntaxLinkedFailure,
  };
};

const isSyntaxInvalidBoilerplateMessage = (message?: string): boolean => {
  if (!message) return false;
  return /student code syntax was invalid|fix syntax errors before running tests/i.test(message);
};

const extractSyntaxAdvisoryDetail = (result?: SubmissionTest): string => {
  if (!result?.logs) return '';

  const logs = result.logs;
  const fullDetailMatch = logs.match(/Full syntax details:\s*([\s\S]+)/i);
  if (fullDetailMatch?.[1]) {
    return fullDetailMatch[1].trim();
  }

  const rootCauseMatch = logs.match(/Root cause:\s*([^\n]+)/i);
  if (rootCauseMatch?.[1]) {
    return rootCauseMatch[1].trim();
  }

  const syntaxLine = logs.split('\n').find((line) => SYNTAX_ERROR_PATTERNS.some((pattern) => pattern.test(line)));

  return (syntaxLine || '').trim();
};

// Parse individual test results from log output
function parseTestLogs(logs: string): ParsedTestResult[] {
  const results: ParsedTestResult[] = [];

  // First try to parse JSON results from markers
  const jsonMatches = logs.matchAll(/<<<TEST_RESULT_JSON_START>>>(.*?)<<<TEST_RESULT_JSON_END>>>/gs);
  for (const match of jsonMatches) {
    try {
      const data = JSON.parse(match[1]);
      results.push({
        name: data.name || 'Unknown Test',
        passed: data.passed ?? data.status === 'passed',
        score: data.score ?? 0,
        maxScore: data.max_score ?? 1,
        error: data.error,
        message: data.message,
        description: data.description,
      });
    } catch (e) {
      // JSON parse failed, continue to fallback
    }
  }

  // If we found JSON results, return them
  if (results.length > 0) {
    return results;
  }

  // Try raw JSON payload fallback (some executions store logs as JSON directly)
  try {
    const raw = JSON.parse(logs);
    const normalized = Array.isArray(raw) ? raw : raw?.results;
    if (Array.isArray(normalized)) {
      return normalized.map((data: any) => ({
        name: data.name || 'Unknown Test',
        passed: data.passed ?? data.status === 'passed',
        score: typeof data.score === 'number' ? data.score : parseFloat(data.score || '0'),
        maxScore:
          typeof data.maxScore === 'number'
            ? data.maxScore
            : typeof data.max_score === 'number'
              ? data.max_score
              : parseFloat(data.maxScore || data.max_score || '0'),
        error: data.error,
        message: data.message,
        description: data.description,
      }));
    }
  } catch {
    // ignore and continue fallback parsing
  }

  // Fallback: Parse line-by-line format
  const lines = logs.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match passed tests: ✓ test_name: 10/10
    const passMatch = line.match(/^[✓✔]\s+(.+?):\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (passMatch) {
      // Look ahead for description
      let description = '';
      for (let j = i + 1; j < lines.length && j < i + 5; j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('Description:')) {
          description = nextLine.replace('Description:', '').trim();
          break;
        }
        // Stop if we hit another test result
        if (nextLine.match(/^[✓✔✗✘×]/)) break;
      }
      results.push({
        name: passMatch[1],
        passed: true,
        score: parseFloat(passMatch[2]),
        maxScore: parseFloat(passMatch[3]),
        description: description || undefined,
      });
      continue;
    }

    // Match failed tests: ✗ test_name: 0/5
    const failMatch = line.match(/^[✗✘×]\s+(.+?):\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (failMatch) {
      // Look ahead for description and error message
      let description = '';
      let errorMsg = '';
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('Description:')) {
          description = nextLine.replace('Description:', '').trim();
          continue;
        }
        if (nextLine.startsWith('Error:') || nextLine.startsWith('AssertionError:') || nextLine.includes('Error:')) {
          errorMsg = nextLine;
          break;
        }
        // Collect indented lines as part of error
        if (
          lines[j].startsWith('   ') &&
          nextLine &&
          !nextLine.startsWith('Description:') &&
          !nextLine.startsWith('Output:')
        ) {
          errorMsg += (errorMsg ? '\n' : '') + nextLine;
        }
        // Stop if we hit another test result
        if (nextLine.match(/^[✓✔✗✘×]/)) break;
      }

      results.push({
        name: failMatch[1],
        passed: false,
        score: parseFloat(failMatch[2]),
        maxScore: parseFloat(failMatch[3]),
        error: errorMsg || undefined,
        description: description || undefined,
      });
      continue;
    }
  }

  return results;
}

const TestsList: React.FC<TestsListProps> = ({
  submissionId,
  tests,
  rubricCategories,
  testCategories,
  fileOverrides,
  demoMode = false,
  initialResults,
}) => {
  const { consoleTheme } = useContext(ConsoleThemeContext);
  const isDarkTheme = consoleThemes.dark === consoleTheme;
  const secondaryText = isDarkTheme ? '#c9d1d9' : '#595959';
  const mutedText = isDarkTheme ? '#9da7b3' : '#595959';
  const emphasisText = isDarkTheme ? '#e6edf3' : '#262626';
  const darkSurface = 'rgba(255,255,255,0.08)';
  const darkBorder = '#6e7681';

  const [runningAll, setRunningAll] = useState(false);
  const [runningTestIds, setRunningTestIds] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<SubmissionTest[]>(initialResults ?? []);
  const [demoRunSequence, setDemoRunSequence] = useState(0);
  const isStudent = useCodeConsoleStore((s) => s.isStudent);
  const testsAffectGrade = useCodeConsoleStore((s) => s.assignment?.testsAffectGrade ?? true);
  const setStoreTests = useCodeConsoleStore((s) => s.setTests);

  const fetchResults = async () => {
    if (demoMode) {
      return;
    }

    try {
      const data = await submissionsApi.testResultsRetrieve({ id: submissionId });
      const nextResults = data.submissionTests || [];
      setResults(nextResults);
      setStoreTests(getLatestSubmissionTests(nextResults));
    } catch (error) {
      console.error('Failed to load test results', error);
    }
  };

  useEffect(() => {
    if (demoMode) {
      const nextResults = initialResults ?? [];
      setResults(nextResults);
      setStoreTests(getLatestSubmissionTests(nextResults));
      setDemoRunSequence(0);
      return;
    }

    if (submissionId) {
      fetchResults();
    }
  }, [demoMode, submissionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { pollTask } = useTaskPolling();

  const handleRunTests = async (testId?: number) => {
    if (testId) {
      setRunningTestIds((prev) => new Set(prev).add(testId));
    } else {
      setRunningAll(true);
    }

    try {
      if (demoMode) {
        const nextDemoRun = demoRunSequence + 1;
        await new Promise((resolve) => setTimeout(resolve, 300));
        setResults((previousResults) => {
          const updatedResults = buildDemoExecutionResults({
            submissionId,
            tests,
            existingResults: previousResults,
            targetTestId: testId,
            runNonce: nextDemoRun,
          });
          setStoreTests(getLatestSubmissionTests(updatedResults));
          return updatedResults;
        });
        setDemoRunSequence(nextDemoRun);

        message.success(testId ? 'Demo test run completed' : 'Demo run-all completed');
        return;
      }

      const payload: Record<string, unknown> = { testId: testId || null, submissionId };
      if (fileOverrides && Object.keys(fileOverrides).length > 0) {
        payload.fileOverrides = fileOverrides;
      }
      const response = await autograderApi.v2RunCreate({ testExecutionRequest: payload as any });

      const taskId = (response as any).taskId || (response as any).task_id;
      if (!taskId) throw new Error('No task ID returned');

      await pollTask(taskId);

      // Optimistic update or message?
      if (testId) {
        message.success('Test executed successfully');
      } else {
        message.success('All tests executed successfully');
      }

      await fetchResults();
    } catch (error) {
      console.error(error);
      message.error(testId ? 'Failed to run test' : 'Failed to run tests');
    } finally {
      if (testId) {
        setRunningTestIds((prev) => {
          const next = new Set(prev);
          next.delete(testId);
          return next;
        });
      } else {
        setRunningAll(false);
      }
    }
  };

  const combinedTests: TestItem[] = tests.map((test) => {
    const result = results.find((r) => r.testCase === test.id);
    return { definition: test, result };
  });

  const getParsedResults = (result?: SubmissionTest): ParsedTestResult[] => {
    if (!result) return [];

    // Prefer structured results from DB
    if (result.results && Array.isArray(result.results)) {
      return result.results.map((r: any) => ({
        name: r.name || 'Unknown Test',
        passed: r.passed,
        score: typeof r.score === 'number' ? r.score : parseFloat(r.score || '0'),
        maxScore:
          typeof r.maxScore === 'number'
            ? r.maxScore
            : typeof r.max_score === 'number'
              ? r.max_score
              : parseFloat(r.maxScore || r.max_score || '0'),
        error: r.error,
        message: r.message,
        description: r.description,
      }));
    }

    // Fallback to log parsing
    return parseTestLogs(result.logs || '');
  };

  const statusColors = isDarkTheme
    ? {
        passed: { main: '#49aa19', bg: 'rgba(73, 170, 25, 0.1)', border: '#274916' },
        failed: { main: '#d32029', bg: 'rgba(211, 32, 41, 0.1)', border: '#58181c' },
        error: { main: '#d32029', bg: 'rgba(211, 32, 41, 0.1)', border: '#58181c' },
        partial: { main: '#d89614', bg: 'rgba(216, 150, 20, 0.1)', border: '#593d10' },
        default: { main: '#9da7b3', bg: darkSurface, border: darkBorder },
      }
    : {
        passed: { main: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' }, // green-7, green-1, green-3
        failed: { main: '#cf1322', bg: '#fff1f0', border: '#ffa39e' }, // red-7, red-1, red-3
        error: { main: '#cf1322', bg: '#fff1f0', border: '#ffa39e' }, // red-7, red-1, red-3
        partial: { main: '#d48806', bg: '#fffbe6', border: '#ffe58f' }, // gold-7, gold-1, gold-3
        default: { main: '#595959', bg: '#fafafa', border: '#d9d9d9' }, // gray-7, gray-1, gray-5
      };

  const getOutcome = (result?: SubmissionTest): TestOutcome => {
    if (!result) return 'not-run';
    if (result.isError) return 'error';
    if (result.passed) return 'passed';

    const scoreRaw = result.score as unknown;
    const maxRaw = result.maxScore as unknown;
    const scoreVal = typeof scoreRaw === 'number' ? scoreRaw : parseFloat(String(scoreRaw ?? ''));
    const maxVal = typeof maxRaw === 'number' ? maxRaw : parseFloat(String(maxRaw ?? ''));

    if (Number.isFinite(scoreVal) && Number.isFinite(maxVal) && maxVal > 0) {
      if (scoreVal > 0 && scoreVal < maxVal) return 'partial';
      if (scoreVal <= 0) return 'failed';
      return 'passed';
    }

    const parsedResults = getParsedResults(result);
    if (parsedResults.length > 0) {
      const totalScore = parsedResults.reduce((acc, curr) => acc + curr.score, 0);
      const totalMax = parsedResults.reduce((acc, curr) => acc + curr.maxScore, 0);

      if (totalMax > 0 && totalScore > 0 && totalScore < totalMax) return 'partial';
      if (totalMax > 0 && totalScore <= 0) return 'failed';
      if (parsedResults.some((r) => r.passed)) return 'partial';
    }

    return 'failed';
  };

  const getStatusColorKey = (result?: SubmissionTest) => {
    const outcome = getOutcome(result);
    if (outcome === 'not-run') return 'default';
    if (outcome === 'passed') return 'passed';
    if (outcome === 'partial') return 'partial';
    if (outcome === 'error') return 'error';
    return 'failed';
  };

  const getStatusIcon = (result?: SubmissionTest) => {
    const outcome = getOutcome(result);
    const key = getStatusColorKey(result);
    const color = statusColors[key].main;

    if (outcome === 'not-run') return <ClockCircleOutlined style={{ fontSize: 24, color }} />;
    if (outcome === 'error') return <ExclamationCircleFilled style={{ fontSize: 24, color }} />;
    if (outcome === 'passed') return <CheckCircleFilled style={{ fontSize: 24, color }} />;
    if (outcome === 'partial') return <MinusCircleFilled style={{ fontSize: 24, color }} />;
    return <CloseCircleFilled style={{ fontSize: 24, color }} />;
  };

  const getStatusText = (result?: SubmissionTest) => {
    const outcome = getOutcome(result);
    if (outcome === 'not-run') return 'Not Run';
    if (outcome === 'error') return 'Error';
    if (outcome === 'passed') return 'Passed';
    if (outcome === 'partial') return 'Partial';
    return 'Failed';
  };

  // Calculate summary stats
  const totalTests = combinedTests.length;
  const passedTests = combinedTests.filter((t) => getOutcome(t.result) === 'passed').length;
  const partialTests = combinedTests.filter((t) => getOutcome(t.result) === 'partial').length;
  const failedTests = combinedTests.filter((t) => getOutcome(t.result) === 'failed').length;
  const errorTests = combinedTests.filter((t) => getOutcome(t.result) === 'error').length;
  const notRunTests = combinedTests.filter((t) => !t.result).length;

  const getCardStyle = (result?: SubmissionTest): React.CSSProperties => {
    const key = getStatusColorKey(result);
    const colors = statusColors[key];

    return {
      marginBottom: 12,
      borderRadius: 6,
      border: `1px solid ${isDarkTheme ? darkBorder : colors.border}`,
      borderLeft: `4px solid ${colors.main}`,
      backgroundColor: isDarkTheme ? darkSurface : '#ffffff',
      transition: 'all 0.2s ease',
      boxShadow: isDarkTheme ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.03)',
    };
  };

  const renderMarkdownMessage = (rawMessage: string) => {
    return (
      <div
        style={{
          fontSize: 12,
          color: isDarkTheme ? '#1e1e1e' : '#262626',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
            ul: ({ children }) => <ul style={{ margin: '4px 0 0 16px' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ margin: '4px 0 0 16px' }}>{children}</ol>,
          }}
        >
          {rawMessage}
        </ReactMarkdown>
      </div>
    );
  };

  const renderTestCard = (item: TestItem) => {
    const { definition, result } = item;
    let parsedResults = getParsedResults(result);
    const isRunning = runningTestIds.has(definition.id);
    const statusKey = getStatusColorKey(result);
    const statusColor = statusColors[statusKey];

    // Filter results to handle potential log leakage (where logs contain global summary)
    // If we have multiple results, we try to find the one matching this test card.
    if (parsedResults.length > 1) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normDesc = definition.description ? normalize(definition.description) : '';
      const normFunc = definition.functionName ? normalize(definition.functionName) : '';

      const matches = parsedResults.filter((r) => {
        const normName = normalize(r.name);
        const normDescParsed = r.description ? normalize(r.description) : '';

        // Match function name (Highest precision)
        if (normFunc && normName === normFunc) return true;

        // Match description (High precision, allows substring for truncation)
        if (normDesc && normDescParsed && normDescParsed.includes(normDesc)) return true;

        // Legacy: Match name to description (Low precision)
        if (normDesc && normName === normDesc) return true;

        return false;
      });

      if (matches.length > 0) {
        parsedResults = matches;
      }
    }

    const syntaxInsight = getSyntaxInsight(result, parsedResults);
    const syntaxAdvisoryDetail = extractSyntaxAdvisoryDetail(result);
    const syntaxAdvisoryPopupContent = (
      <div style={{ maxWidth: 420, fontSize: 12, whiteSpace: 'pre-wrap' }}>
        <div>
          Notebook has syntax/parse issues in one or more cells. This test can still score normally if it does not
          depend on those cells.
        </div>
        {syntaxAdvisoryDetail ? (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              borderRadius: 4,
              border: `1px solid ${isDarkTheme ? darkBorder : '#d9d9d9'}`,
              background: isDarkTheme ? 'rgba(0,0,0,0.25)' : '#fafafa',
              fontFamily: 'monospace',
              fontSize: 11,
              whiteSpace: 'pre-wrap',
              maxHeight: 260,
              overflow: 'auto',
            }}
          >
            {syntaxAdvisoryDetail}
          </div>
        ) : null}
      </div>
    );
    const primaryParsedResult = parsedResults.length === 1 ? parsedResults[0] : undefined;
    const showTupleMessage =
      !!primaryParsedResult?.message &&
      !(syntaxInsight.hasSyntaxIssue && isSyntaxInvalidBoilerplateMessage(primaryParsedResult.message));
    const syntaxDetailText = syntaxInsight.hasSyntaxIssue
      ? (primaryParsedResult?.error || result?.logs || primaryParsedResult?.message || '').trim()
      : '';

    // Determine current score and max score for display
    let currentScore = 0;
    let maxScore = definition.pointsPass || 0;
    if (parsedResults.length > 0) {
      currentScore = parsedResults.reduce((acc, curr) => acc + curr.score, 0);
      // If simplified to one result, use its max score. If multiple (subtests), sum them?
      // Typically if match found, it's 1 result. If multiple matches (subtests), sum scores.
      // However, usually we expect 1 match per test case.
      // If parsedResults has multiple after filtering, it means multiple subtests matched.
      // We should sum them for the card total.
      if (parsedResults.length === 1) {
        maxScore = parsedResults[0].maxScore;
      } else {
        maxScore = parsedResults.reduce((acc, curr) => acc + curr.maxScore, 0);
      }
    } else if (result?.passed) {
      currentScore = definition.pointsPass || 0;
    }

    return (
      <Card
        key={definition.id}
        size="small"
        style={getCardStyle(result)}
        bodyStyle={{ padding: '12px 16px' }}
        hoverable
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ paddingTop: 2 }}>{getStatusIcon(result)}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header: Title and Score Badge */}
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}
            >
              <div style={{ flex: 1, marginRight: 8, minWidth: 0 }}>
                <Text strong style={{ fontSize: 13, display: 'block', lineHeight: '1.4', color: consoleTheme.text }}>
                  {definition.description || `Test ${definition.id}`}
                </Text>

                {/* Description (subtitle) */}

                {/* Parsed Description Override (if different) */}
                {parsedResults.length === 1 &&
                  parsedResults[0].description &&
                  parsedResults[0].description !== definition.description && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2, color: mutedText }}>
                      {parsedResults[0].description}
                    </Text>
                  )}
              </div>

              {/* Score Badge */}
              <div
                style={{
                  flexShrink: 0,
                  textAlign: 'right',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 4,
                }}
              >
                {/* Run Button for Students/Staff */}
                {!isStudent && (
                  <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {syntaxInsight.showAdvisory && (
                      <Popover
                        trigger="click"
                        placement="leftTop"
                        title="Syntax advisory"
                        content={syntaxAdvisoryPopupContent}
                        overlayStyle={{ maxWidth: 460 }}
                      >
                        <Tag
                          style={{
                            margin: 0,
                            cursor: 'pointer',
                            borderColor: isDarkTheme ? '#3a6ea5' : '#91caff',
                            background: isDarkTheme ? 'rgba(24, 144, 255, 0.15)' : '#e6f7ff',
                            color: isDarkTheme ? '#91d5ff' : '#0958d9',
                          }}
                        >
                          Syntax
                        </Tag>
                      </Popover>
                    )}

                    <Tooltip title="Run this test only">
                      <Button
                        size="small"
                        type={isRunning ? 'dashed' : 'text'}
                        shape="circle"
                        icon={isRunning ? <LoadingOutlined /> : <PlayCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunTests(definition.id);
                        }}
                        disabled={runningAll || isRunning}
                        style={{
                          color: isRunning ? '#1890ff' : secondaryText,
                          borderColor: isRunning ? '#1890ff' : 'transparent',
                        }}
                      />
                    </Tooltip>
                  </div>
                )}

                {isStudent && syntaxInsight.showAdvisory && (
                  <div style={{ marginBottom: 4 }}>
                    <Popover
                      trigger="click"
                      placement="leftTop"
                      title="Syntax advisory"
                      content={syntaxAdvisoryPopupContent}
                      overlayStyle={{ maxWidth: 460 }}
                    >
                      <Tag
                        style={{
                          margin: 0,
                          cursor: 'pointer',
                          borderColor: isDarkTheme ? '#3a6ea5' : '#91caff',
                          background: isDarkTheme ? 'rgba(24, 144, 255, 0.15)' : '#e6f7ff',
                          color: isDarkTheme ? '#91d5ff' : '#0958d9',
                        }}
                      >
                        Syntax
                      </Tag>
                    </Popover>
                  </div>
                )}

                <Tag
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 500,
                    color: statusColor.main,
                    borderColor: statusColor.border,
                    background: statusColor.bg,
                  }}
                >
                  {result ? `${currentScore}/${maxScore} pts` : 'Not Run'}
                </Tag>
                <div style={{ fontSize: 10, color: mutedText, marginTop: 2, textAlign: 'right' }}>
                  {getStatusText(result)}
                </div>
              </div>
            </div>

            {/* Rubric Linkage Badge */}
            {(() => {
              if (!definition.rubricItem || !rubricCategories) return null;
              // Find the rubric item details... logic omitted for brevity as implementation is same
              // Re-implementing concise logic:
              const itemDetails = rubricCategories
                .flatMap((c) => (c.rubricComments as any[]) || [])
                .find((rc) => rc.id === definition.rubricItem);
              if (!itemDetails) return null;

              return (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Badge
                    status="processing"
                    text={
                      <Text type="secondary" style={{ fontSize: 11, color: mutedText }}>
                        Linked:{' '}
                        <Text strong style={{ color: emphasisText }}>
                          {itemDetails.text}
                        </Text>{' '}
                        ({itemDetails.pointDelta > 0 ? '-' : '+'}
                        {Math.abs(itemDetails.pointDelta)})
                      </Text>
                    }
                  />
                </div>
              );
            })()}

            {/* Sub-results list (Multiple subtests) */}
            {parsedResults.length > 1 && (
              <Collapse
                ghost
                size="small"
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                style={{ marginTop: 8, background: 'rgba(0,0,0,0.01)', borderRadius: 4 }}
              >
                <Panel
                  header={
                    <Text style={{ fontSize: 12, color: consoleTheme.text }}>
                      {' '}
                      {/* Darker for readability */}
                      {parsedResults.filter((r) => r.passed).length}/{parsedResults.length} subtests passed
                    </Text>
                  }
                  key="1"
                >
                  <div style={{ paddingLeft: 8 }}>
                    {parsedResults.map((pr, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {pr.passed ? (
                            <CheckCircleFilled style={{ color: statusColors.passed.main, fontSize: 12 }} />
                          ) : (
                            <CloseCircleFilled style={{ color: statusColors.error.main, fontSize: 12 }} />
                          )}
                          <Text style={{ fontSize: 12, color: consoleTheme.text }}>{pr.name}</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, color: mutedText }}>
                          {pr.score}/{pr.maxScore}
                        </Text>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Collapse>
            )}

            {/* Default Message / Feedback (Tuple Return) */}
            {parsedResults.length === 1 && showTupleMessage && (
              <div style={{ marginTop: 8 }}>
                <Alert
                  message={renderMarkdownMessage(primaryParsedResult?.message || '')}
                  type="info"
                  showIcon
                  style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    border: '1px solid #91caff',
                    backgroundColor: '#e6f7ff',
                  }}
                />
              </div>
            )}

            {/* Error Message */}
            {parsedResults.length === 1 && primaryParsedResult?.error && !syntaxInsight.hasSyntaxIssue && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px',
                  backgroundColor: statusColors.error.bg,
                  border: `1px solid ${statusColors.error.border}`,
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: statusColors.error.main, // Standard error red (usually accessible on light bg)
                  whiteSpace: 'pre-wrap',
                }}
              >
                {primaryParsedResult.error}
              </div>
            )}

            {/* Syntax/Parse Error Hint */}
            {!result?.passed && syntaxInsight.hasSyntaxIssue && syntaxInsight.hasSyntaxLinkedFailure && (
              <div style={{ marginTop: 8 }}>
                <Alert
                  type="warning"
                  showIcon
                  message="Syntax/parse issue detected"
                  description={
                    <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
                      {syntaxDetailText ||
                        'Student code appears to have a syntax/parse issue that may prevent tests from running as expected.'}
                    </div>
                  }
                />
              </div>
            )}

            {/* Raw Logs Fallback */}
            {result?.logs &&
              (parsedResults.length === 0 ||
                (parsedResults.length === 1 &&
                  !parsedResults[0].error &&
                  !parsedResults[0].message &&
                  !result.passed)) && (
                <div style={{ marginTop: 8 }}>
                  <Collapse ghost size="small">
                    <Panel header={<span style={{ color: consoleTheme.text }}>View Logs</span>} key="logs">
                      <pre
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          whiteSpace: 'pre-wrap',
                          padding: 8,
                          backgroundColor: isDarkTheme ? 'rgba(0,0,0,0.3)' : '#fafafa',
                          borderRadius: 4,
                          maxHeight: 150,
                          overflow: 'auto',
                          border: `1px solid ${isDarkTheme ? darkBorder : '#f0f0f0'}`,
                          color: consoleTheme.text,
                        }}
                      >
                        {result.logs}
                      </pre>
                    </Panel>
                  </Collapse>
                </div>
              )}
          </div>
        </div>
      </Card>
    );
  };

  const renderGroupedTests = () => {
    // Group tests by category
    const groups: { [categoryId: number]: TestItem[] } = {};
    const unknownCategory: TestItem[] = [];
    const testCategoryIds = new Set<number>();

    combinedTests.forEach((item) => {
      const catId = item.definition.testCategory;
      if (catId) {
        if (!groups[catId]) groups[catId] = [];
        groups[catId].push(item);
        testCategoryIds.add(catId);
      } else {
        unknownCategory.push(item);
      }
    });

    // Combine known categories with any orphans found in tests
    const knownCategories = testCategories || [];
    const knownIds = new Set(knownCategories.map((c) => c.id));

    // Identify orphaned IDs (present in tests but not in known categories)
    const orphanedIds = Array.from(testCategoryIds).filter((id) => !knownIds.has(id));

    const renderCategoryHeader = (category: TestCategory | undefined, title: string, items: TestItem[]) => {
      const totalPoints = items.reduce((sum, item) => {
        const pr = getParsedResults(item.result)[0];
        return sum + (pr ? pr.score : 0);
      }, 0);

      const totalMax = items.reduce((sum, item) => {
        const pr = getParsedResults(item.result)[0];
        return sum + (pr ? pr.maxScore : item.definition.pointsPass || 0);
      }, 0);

      // Avoid division by zero
      const percent = totalMax > 0 ? (totalPoints / totalMax) * 100 : 0;
      const isComplete = totalMax > 0 && totalPoints === totalMax;

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
          {/* Left Side: Title and Filename */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: 16 }}>
            <Title
              level={5}
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: consoleTheme.text,
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={title}
            >
              {title}
            </Title>
            {category?.targetFileName && (
              <Text
                type="secondary"
                code
                style={{
                  fontSize: 11,
                  marginTop: 2,
                  color: mutedText,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                }}
                title={category.targetFileName}
              >
                {category.targetFileName}
              </Text>
            )}
          </div>

          {/* Right Side: Points and Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
            <Text strong style={{ fontSize: 12, color: isComplete ? '#52c41a' : consoleTheme.text }}>
              {totalPoints} / {totalMax} pts
            </Text>
            <div style={{ width: 80, marginTop: 4 }}>
              <Progress
                percent={Math.round(percent)}
                size="small"
                showInfo={false}
                strokeColor={isComplete ? '#52c41a' : undefined}
              />
            </div>
          </div>
        </div>
      );
    };

    const activeKeys = [
      ...knownCategories.map((c) => c.id.toString()),
      ...orphanedIds.map((id) => `orphan-${id}`),
      unknownCategory.length > 0 ? 'unknown' : '',
    ].filter(Boolean);

    return (
      <Collapse defaultActiveKey={activeKeys} ghost>
        {/* Render Known Categories */}
        {knownCategories.map((category) => {
          const items = groups[category.id] || [];
          if (items.length === 0) return null;

          return (
            <Panel
              key={category.id.toString()}
              header={renderCategoryHeader(category, category.name, items)}
              style={{ marginBottom: 12 }}
            >
              {items.map((item) => renderTestCard(item))}
            </Panel>
          );
        })}

        {/* Render Orphaned Categories */}
        {orphanedIds.map((catId) => {
          const items = groups[catId] || [];
          return (
            <Panel
              key={`orphan-${catId}`}
              header={renderCategoryHeader(undefined, `Category ${catId}`, items)}
              style={{ marginBottom: 12 }}
            >
              {items.map((item) => renderTestCard(item))}
            </Panel>
          );
        })}

        {/* Render Uncategorized Tests */}
        {unknownCategory.length > 0 && (
          <Panel
            key="unknown"
            header={renderCategoryHeader(undefined, 'Other Tests', unknownCategory)}
            style={{ marginBottom: 12 }}
          >
            {unknownCategory.map((item) => renderTestCard(item))}
          </Panel>
        )}
      </Collapse>
    );
  };

  // Determine if we should use grouped rendering
  const hasCategories = testCategories && testCategories.length > 0;
  const hasCategorizedTests = combinedTests.some((t) => !!t.definition.testCategory);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 16px' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: isDarkTheme ? consoleTheme.mainBg : '#fff', // Use theme bg
          padding: '16px 0',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Test Results
        </Title>
        {!isStudent && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={runningAll}
            onClick={() => handleRunTests()}
            disabled={runningTestIds.size > 0}
            size="small"
          >
            Run All
          </Button>
        )}
      </div>

      {/* Summary Badges */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge
          count={`${passedTests} Passed`}
          style={{
            backgroundColor: statusColors.passed.main,
            color: '#fff',
            boxShadow: isDarkTheme ? 'none' : undefined,
          }}
        />
        <Badge
          count={`${failedTests} Failed`}
          style={{
            backgroundColor: failedTests > 0 ? statusColors.failed.main : statusColors.default.main,
            color: '#fff',
            boxShadow: isDarkTheme ? 'none' : undefined,
          }}
        />
        {partialTests > 0 && (
          <Badge
            count={`${partialTests} Partial`}
            style={{
              backgroundColor: statusColors.partial.main,
              color: '#fff',
              boxShadow: isDarkTheme ? 'none' : undefined,
            }}
          />
        )}
        {errorTests > 0 && (
          <Badge
            count={`${errorTests} Error`}
            style={{
              backgroundColor: statusColors.error.main,
              color: '#fff',
              boxShadow: isDarkTheme ? 'none' : undefined,
            }}
          />
        )}
        {notRunTests > 0 && (
          <Badge
            count={`${notRunTests} Not Run`}
            style={{
              backgroundColor: statusColors.default.main,
              color: '#fff',
              boxShadow: isDarkTheme ? 'none' : undefined,
            }}
          />
        )}
      </div>

      {/* Progress Bar */}
      {totalTests > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Progress
            percent={Math.round((passedTests / totalTests) * 100)}
            status={failedTests + errorTests > 0 ? 'exception' : passedTests === totalTests ? 'success' : 'active'}
            format={() => (
              <span style={{ color: consoleTheme.text }}>
                {passedTests}/{totalTests}
              </span>
            )}
            strokeColor={passedTests === totalTests ? statusColors.passed.main : undefined}
            trailColor={isDarkTheme ? 'rgba(255,255,255,0.25)' : undefined}
          />
        </div>
      )}

      {/* Tests don't affect grade banner */}
      {!testsAffectGrade && (
        <Alert
          title="Tests do not affect grade"
          description="Test results are for feedback only and do not count towards the submission grade."
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
        />
      )}

      {/* Test Cards */}
      {combinedTests.length === 0 ? (
        <Text type="secondary">No tests available for this assignment.</Text>
      ) : (
        <div>
          {hasCategories || hasCategorizedTests
            ? renderGroupedTests()
            : combinedTests.map((item) => renderTestCard(item))}
        </div>
      )}
    </div>
  );
};

export default TestsList;

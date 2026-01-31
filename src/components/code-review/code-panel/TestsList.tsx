import React, { useEffect, useState } from 'react';
import { Button, Card, Collapse, Progress, Typography, message, Badge, Alert, Tag } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  PlayCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  MinusCircleFilled,
  CaretRightOutlined,
} from '@ant-design/icons';
import { Submission as SubmissionModel } from '../../../infrastructure/submission';
import { TestCase, TestCaseType } from '../../../infrastructure/testCase';
import { SubmissionTestType } from '../../../infrastructure/submissionTest';
import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { TestCategoryType } from '../../../infrastructure/testCategory';

const { Panel } = Collapse;
const { Text, Title } = Typography;

interface TestsListProps {
  submissionId: number;
  tests: TestCaseType[];
  rubricCategories?: RubricCategoryType[];
  testCategories?: TestCategoryType[];
}

interface TestItem {
  definition: TestCaseType;
  result?: SubmissionTestType;
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

const TestsList: React.FC<TestsListProps> = ({ submissionId, tests, rubricCategories, testCategories }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SubmissionTestType[]>([]);

  const fetchResults = async () => {
    try {
      const data = await SubmissionModel.readTestResults(submissionId);
      setResults(data.submissionTests);
    } catch (error) {
      console.error('Failed to load test results', error);
    }
  };

  useEffect(() => {
    if (submissionId) {
      fetchResults();
    }
  }, [submissionId]);

  const handleRunTests = async () => {
    setRunning(true);
    try {
      await TestCase.runV2({ submissionId: submissionId.toString() });
      message.success('Tests executed successfully');
      await fetchResults();
    } catch (error) {
      message.error('Failed to run tests');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const combinedTests: TestItem[] = tests.map((test) => {
    const result = results.find((r) => r.testCase === test.id);
    return { definition: test, result };
  });

  // Calculate summary stats
  const totalTests = combinedTests.length;
  const passedTests = combinedTests.filter((t) => t.result?.passed).length;
  const failedTests = combinedTests.filter((t) => t.result && !t.result.passed).length;
  const notRunTests = combinedTests.filter((t) => !t.result).length;

  const getParsedResults = (result?: SubmissionTestType): ParsedTestResult[] => {
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

  const getStatusIcon = (result?: SubmissionTestType) => {
    if (!result) {
      return <ClockCircleOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
    }
    if (result.isError) {
      return <ExclamationCircleFilled style={{ fontSize: 24, color: '#faad14' }} />;
    }
    if (result.passed) {
      return <CheckCircleFilled style={{ fontSize: 24, color: '#52c41a' }} />;
    }
    // Check for partial credit
    const parsedResults = getParsedResults(result);
    const hasPartial = parsedResults.some((r) => r.score > 0 && r.score < r.maxScore);
    if (hasPartial) {
      return <MinusCircleFilled style={{ fontSize: 24, color: '#fa8c16' }} />;
    }
    return <CloseCircleFilled style={{ fontSize: 24, color: '#ff4d4f' }} />;
  };

  const getStatusText = (result?: SubmissionTestType) => {
    if (!result) return 'Not Run';
    if (result.isError) return 'Error';
    if (result.passed) return 'Passed';
    // Check for partial credit
    const parsedResults = getParsedResults(result);
    const hasPartial = parsedResults.some((r) => r.score > 0 && r.score < r.maxScore);
    if (hasPartial) return 'Partial';
    return 'Failed';
  };

  const getCardStyle = (result?: SubmissionTestType): React.CSSProperties => {
    const base: React.CSSProperties = {
      marginBottom: 8,
      borderRadius: 8,
      transition: 'all 0.2s ease',
    };

    if (!result) {
      return { ...base, borderLeft: '4px solid #8c8c8c' };
    }
    if (result.isError) {
      return { ...base, borderLeft: '4px solid #faad14', backgroundColor: 'rgba(250, 173, 20, 0.05)' };
    }
    if (result.passed) {
      return { ...base, borderLeft: '4px solid #52c41a', backgroundColor: 'rgba(82, 196, 26, 0.05)' };
    }
    // Check for partial credit
    const parsedResults = getParsedResults(result);
    const hasPartial = parsedResults.some((r) => r.score > 0 && r.score < r.maxScore);
    if (hasPartial) {
      return { ...base, borderLeft: '4px solid #fa8c16', backgroundColor: 'rgba(250, 140, 22, 0.05)' };
    }
    return { ...base, borderLeft: '4px solid #ff4d4f', backgroundColor: 'rgba(255, 77, 79, 0.05)' };
  };

  const renderTestCard = (item: TestItem) => {
    const { definition, result } = item;
    let parsedResults = getParsedResults(result);

    // Filter results to handle potential log leakage (where logs contain global summary)
    // If we have multiple results, we try to find the one matching this test card.
    if (parsedResults.length > 1) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normDesc = definition.description ? normalize(definition.description) : '';


      const matches = parsedResults.filter((r) => {
        const normName = normalize(r.name);
        return (
          (normDesc && normName === normDesc) ||
          (normDesc && normDesc.includes(normName))
        );
      });

      if (matches.length > 0) {
        parsedResults = matches;
      }
    }

    // Determine current score and max score for display
    let currentScore = 0;
    let maxScore = definition.pointsPass || 0;
    if (parsedResults.length > 0) {
      currentScore = parsedResults[0].score;
      maxScore = parsedResults[0].maxScore;
    } else if (result?.passed) {
      currentScore = definition.pointsPass;
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ flex: 1, marginRight: 8 }}>
                <Text strong style={{ fontSize: 13, display: 'block', lineHeight: '1.4' }}>
                  {definition.description || `Test ${definition.id}`}
                </Text>

                {/* Description (subtitle) */}


                {/* Parsed Description Override (if different) */}
                {parsedResults.length === 1 && parsedResults[0].description && parsedResults[0].description !== definition.description && (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                    {parsedResults[0].description}
                  </Text>
                )}
              </div>

              {/* Score Badge */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <Tag style={{ margin: 0, fontSize: 11, fontWeight: 500 }} color={result?.passed ? 'success' : result?.isError ? 'error' : 'default'}>
                  {result ? `${currentScore}/${maxScore} pts` : 'Not Run'}
                </Tag>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2, textAlign: 'right' }}>
                  {getStatusText(result)}
                </div>
              </div>
            </div>

            {/* Rubric Linkage Badge */}
            {(() => {
              if (!definition.rubricItem || !rubricCategories) return null;
              // Find the rubric item details... logic omitted for brevity as implementation is same
              // Re-implementing concise logic:
              const itemDetails = rubricCategories.flatMap(c => (c.rubricComments as any[]) || []).find(rc => rc.id === definition.rubricItem);
              if (!itemDetails) return null;

              return (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Badge
                    status="processing"
                    text={
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Linked: <Text strong>{itemDetails.text}</Text> ({itemDetails.pointDelta > 0 ? '-' : '+'}{Math.abs(itemDetails.pointDelta)})
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
                  header={<Text style={{ fontSize: 12 }}>{parsedResults.filter((r) => r.passed).length}/{parsedResults.length} subtests passed</Text>}
                  key="1"
                >
                  <div style={{ paddingLeft: 8 }}>
                    {parsedResults.map((pr, idx) => (
                      <div key={idx} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {pr.passed ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 12 }} />
                          ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 12 }} />
                          )}
                          <Text style={{ fontSize: 12 }}>{pr.name}</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{pr.score}/{pr.maxScore}</Text>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Collapse>
            )}

            {/* Default Message / Feedback (Tuple Return) */}
            {parsedResults.length === 1 && parsedResults[0].message && (
              <div style={{ marginTop: 8 }}>
                <Alert
                  message={<span style={{ fontSize: 12 }}>{parsedResults[0].message}</span>}
                  type="info"
                  showIcon
                  style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    border: '1px solid #91caff',
                    backgroundColor: '#e6f7ff'
                  }}
                />
              </div>
            )}

            {/* Error Message */}
            {parsedResults.length === 1 && parsedResults[0].error && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px',
                  backgroundColor: '#fff1f0',
                  border: '1px solid #ffccc7',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#cf1322',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {parsedResults[0].error}
              </div>
            )}

            {/* Raw Logs Fallback */}
            {result?.logs && (parsedResults.length === 0 || (parsedResults.length === 1 && !parsedResults[0].error && !parsedResults[0].message && !result.passed)) && (
              <div style={{ marginTop: 8 }}>
                <Collapse ghost size="small">
                  <Panel header="View Logs" key="logs">
                    <pre style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      whiteSpace: 'pre-wrap',
                      padding: 8,
                      backgroundColor: '#fafafa',
                      borderRadius: 4,
                      maxHeight: 150,
                      overflow: 'auto',
                      border: '1px solid #f0f0f0'
                    }}>
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

    const renderCategoryHeader = (category: TestCategoryType | undefined, title: string, items: TestItem[]) => {
      const totalPoints = items.reduce((sum, item) => {
        const pr = getParsedResults(item.result)[0];
        return sum + (pr ? pr.score : 0);
      }, 0);

      const totalMax = items.reduce((sum, item) => {
        const pr = getParsedResults(item.result)[0];
        return sum + (pr ? pr.maxScore : (item.definition.pointsPass || 0));
      }, 0);

      // Avoid division by zero
      const percent = totalMax > 0 ? (totalPoints / totalMax) * 100 : 0;
      const isComplete = totalMax > 0 && totalPoints === totalMax;

      return (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingRight: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <Title level={5} style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', color: '#595959', letterSpacing: '0.5px' }}>
                {title}
              </Title>
              {category?.targetFileName && (
                <Text type="secondary" code style={{ fontSize: 11, marginLeft: 8, color: '#8c8c8c' }}>
                  {category.targetFileName}
                </Text>
              )}
            </div>
            <Tag color={isComplete ? 'success' : 'default'} style={{ margin: 0 }}>
              {totalPoints} / {totalMax} pts
            </Tag>
          </div>
          <div style={{ width: 100 }}>
            <Progress percent={Math.round(percent)} size="small" showInfo={false} strokeColor={isComplete ? '#52c41a' : undefined} />
          </div>
        </div>
      );
    };

    const activeKeys = [
      ...knownCategories.map(c => c.id.toString()),
      ...orphanedIds.map(id => `orphan-${id}`),
      unknownCategory.length > 0 ? 'unknown' : ''
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
    <div style={{ padding: 15, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} style={{ margin: 0 }}>
          Test Results
        </Title>
        <Button type="primary" icon={<PlayCircleOutlined />} loading={running} onClick={handleRunTests} size="small">
          Run All
        </Button>
      </div>

      {/* Summary Badges */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Badge count={`${passedTests} Passed`} style={{ backgroundColor: '#52c41a' }} />
        <Badge count={`${failedTests} Failed`} style={{ backgroundColor: failedTests > 0 ? '#ff4d4f' : '#8c8c8c' }} />
        {notRunTests > 0 && <Badge count={`${notRunTests} Not Run`} style={{ backgroundColor: '#8c8c8c' }} />}
      </div>

      {/* Progress Bar */}
      {totalTests > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Progress
            percent={Math.round((passedTests / totalTests) * 100)}
            status={failedTests > 0 ? 'exception' : passedTests === totalTests ? 'success' : 'active'}
            format={() => `${passedTests}/${totalTests}`}
            strokeColor={passedTests === totalTests ? '#52c41a' : undefined}
          />
        </div>
      )}

      {/* Test Cards */}
      {combinedTests.length === 0 ? (
        <Text type="secondary">No tests available for this assignment.</Text>
      ) : (
        <div>{hasCategories || hasCategorizedTests ? renderGroupedTests() : combinedTests.map((item) => renderTestCard(item))}</div>
      )}
    </div>
  );
};

export default TestsList;

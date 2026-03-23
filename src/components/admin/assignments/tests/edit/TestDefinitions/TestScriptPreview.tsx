// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect, useState, useRef } from 'react';
import { Card, Empty, Typography, Tag, Space, Spin, Alert } from 'antd';
// import { parsePythonTests } from './TestScriptParser'; // Removed client-side parser
import { testCategoriesApi } from '../../../../../../api-client/clients';
import type { TestCategory } from '../../../../../../api-client/models';
import { ResponseError } from '../../../../../../api-client/runtime';

interface IProps {
  code: string;
  language: string;
}

interface ITestPreviewItem {
  functionName: string;
  name: string; // Title
  description: string; // Body
  points: number;
  timeout?: number;
  truncated?: boolean;
}

export const TestScriptPreview = ({ code, language }: IProps) => {
  const [items, setItems] = useState<ITestPreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const normalizedLanguage = (() => {
    const value = language.toLowerCase();
    if (value.includes('python')) return 'python';
    if (value.includes('java')) return 'java';
    if (value === 'r' || value.startsWith('r-')) return 'r';
    if (value.includes('c/c++') || value.includes('c++') || value.includes('cpp') || value === 'c') return 'cpp';
    if (
      value.includes('node') ||
      value.includes('javascript') ||
      value.includes('js') ||
      value.includes('typescript')
    ) {
      return 'js';
    }
    if (value.includes('ruby')) return 'ruby';
    if (value.includes('php')) return 'php';
    return 'other';
  })();

  const syntaxHint = (() => {
    switch (normalizedLanguage) {
      case 'python':
        return 'Use @test(name="Title", points=10, description="Optional", timeout=30) above a def.';
      case 'java':
        return 'Use @Test(name="Title", points=10, description="Optional", timeout=30) on a public method.';
      case 'r':
        return 'Use run_test("Title", 10, "Optional", function() { ... }, 30).';
      case 'cpp':
        return 'Use TEST(Name, 10.0), TEST_DESC(...), or TEST_TIMEOUT/TEST_DESC_TIMEOUT macros.';
      case 'js':
        return 'Use test("Title", 10, "Optional", () => { ... }, 30).';
      case 'ruby':
        return 'Use run_test("Title", 10, "Optional") do ... end (optionally add timeout as 4th arg).';
      case 'php':
        return 'Use Tester::test("Title", 10, "Optional", function () { ... }, 30).';
      default:
        return 'Preview parsing supports Python, Java, R, C/C++, Node/JS, Ruby, and PHP.';
    }
  })();

  useEffect(() => {
    if (!code) {
      setItems([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    setLoading(true);
    setError(null);

    debounceTimeout.current = setTimeout(async () => {
      try {
        // The generated client expects TestCategory object and returns TestCategory
        // But our backend endpoint returns a list of test definitions and expects specific fields.
        // We cast to any to bypass the strict type checks of the generated client
        // which thinks it's talking to standard CRUD endpoints.
        const testCategory = {
          testScript: code,
          language: language,
        } as unknown as Omit<TestCategory, 'id' | 'testCases' | 'resources'>;

        const response = await testCategoriesApi.previewScriptCreate({
          testCategory,
        });

        const maybeItems = response as unknown;
        if (Array.isArray(maybeItems)) {
          setItems(maybeItems as ITestPreviewItem[]);
        } else {
          setItems([]);
        }
      } catch (err: unknown) {
        console.error('Failed to preview script:', err);
        let msg = 'Failed to parse script. Check your syntax.';

        if (err instanceof ResponseError) {
          try {
            const body = await err.response.json();
            if (body && body.error) {
              msg = body.error;
            }
          } catch {
            // ignore json parse error
          }
        }

        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 800); // 800ms debounce

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [code, language]);

  if (!code) {
    return <Empty description="Write code to see preview" />;
  }

  return (
    <div style={{ padding: '16px', background: '#f5f7fa', height: '100%', overflowY: 'auto' }}>
      {loading && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="small" tip="Parsing..." />
        </div>
      )}

      {!loading && error && (
        <Alert type="warning" message={error} description={syntaxHint} showIcon style={{ marginBottom: 16 }} />
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
          <Typography.Text type="secondary">No tests detected.</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {syntaxHint}
          </Typography.Text>
        </div>
      )}

      <Space
        direction="vertical"
        style={{ width: '100%', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}
        size="middle"
      >
        {items.map((item) => (
          <Card
            key={item.functionName}
            size="small"
            style={{
              borderLeft: '4px solid #d9d9d9', // Default grey for sync
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Typography.Text strong style={{ fontSize: 15 }}>
                    {item.name}
                  </Typography.Text>
                  {item.truncated && (
                    <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>
                      truncated
                    </Tag>
                  )}
                  <code
                    style={{ fontSize: 10, color: '#999', background: '#f0f0f0', padding: '2px 4px', borderRadius: 4 }}
                  >
                    {item.functionName}
                  </code>
                </div>

                {item.description && (
                  <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                    {item.description}
                  </Typography.Paragraph>
                )}
              </div>

              <Space direction="vertical" align="end" size={0}>
                <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                  {item.points} pts
                </Tag>
                {item.timeout && (
                  <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                    {item.timeout}s
                  </Typography.Text>
                )}
              </Space>
            </div>
          </Card>
        ))}
      </Space>
    </div>
  );
};

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Staff-only sidebar panel showing autograder variant-robustness reruns (see
// AssignmentDataSet.autogradeAllVariants): did this submission's code still work when run
// against every OTHER dataset variant, not just the student's own? Self-contained — fetches
// its own data rather than going through the console store, since this is a rarely-used,
// opt-in check most submissions won't have any runs for.
import * as React from 'react';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { Collapse, Empty, Spin, Tag, Typography } from 'antd';
import { submissionsApi } from '../../../../api-client/clients';
import { SubmissionVariantRun } from '../../../../api-client';
import { useCodeConsoleStore } from '../../../../stores/useCodeConsoleStore';
import type { LayoutConfig, SidebarPanelDefinition } from '../SidebarRegistry';

interface VariantRunResult {
  status?: 'running' | 'success' | 'error';
  stdout?: string;
  stderr?: string;
  error?: string | null;
  executionTime?: number;
}

const STATUS_COLOR: Record<string, string> = { running: 'processing', success: 'green', error: 'red' };

function VariantRobustnessPanel() {
  const submission = useCodeConsoleStore((s) => s.submission);
  const readOnlySubmission = useCodeConsoleStore((s) => s.readOnlySubmission);
  const submissionId = (submission ?? readOnlySubmission)?.id;

  const [runs, setRuns] = React.useState<SubmissionVariantRun[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!submissionId) return;
    let cancelled = false;
    setLoading(true);
    submissionsApi
      .variantRunsList({ id: submissionId })
      .then((data) => {
        if (!cancelled) setRuns(data);
      })
      .catch(() => {
        if (!cancelled) setRuns([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  if (loading) return <Spin style={{ margin: 16 }} />;

  if (!runs || runs.length === 0) {
    return (
      <Empty
        style={{ margin: 16 }}
        description="No variant-robustness reruns for this submission. Enable 'Autograder checks every variant' on a dataset variant to turn this on."
      />
    );
  }

  const succeeded = runs.filter((r) => (r.result as VariantRunResult | null)?.status === 'success').length;

  return (
    <div style={{ padding: 12 }}>
      <Typography.Paragraph style={{ fontSize: 13 }}>
        This submission&apos;s code was rerun against every other dataset variant in the pool
        (not just the student&apos;s own) — {succeeded} of {runs.length} produced a clean run.
        A failure here can mean the code is hardcoded to the student&apos;s own numbers.
      </Typography.Paragraph>
      <Collapse
        size="small"
        items={runs.map((run) => {
          const result = (run.result as VariantRunResult | null) ?? {};
          return {
            key: run.id,
            label: (
              <span>
                {run.datasetName}{' '}
                <Tag color={STATUS_COLOR[result.status ?? ''] ?? 'default'} style={{ marginLeft: 4 }}>
                  {result.status ?? 'unknown'}
                </Tag>
              </span>
            ),
            children: (
              <div style={{ fontSize: 12 }}>
                {result.error && (
                  <Typography.Paragraph type="danger" style={{ fontSize: 12, marginBottom: 8 }}>
                    {result.error}
                  </Typography.Paragraph>
                )}
                {result.stdout && (
                  <>
                    <Typography.Text strong style={{ fontSize: 12 }}>
                      stdout
                    </Typography.Text>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, margin: '4px 0 8px' }}>{result.stdout}</pre>
                  </>
                )}
                {result.stderr && (
                  <>
                    <Typography.Text strong style={{ fontSize: 12 }}>
                      stderr
                    </Typography.Text>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, margin: '4px 0 0' }}>{result.stderr}</pre>
                  </>
                )}
              </div>
            ),
          };
        })}
      />
    </div>
  );
}

export function variantRobustnessDef(_config: LayoutConfig): SidebarPanelDefinition {
  return {
    key: 'variant-robustness',
    order: 25,
    icon: SafetyCertificateOutlined,
    title: 'Variant Check',
    tooltip: 'Autograder variant-robustness reruns (staff only)',
    visible: (cfg) => !cfg.isStudentView && !cfg.isFilesOnly && cfg.showTests,
    defaultWidth: 500,
    render: () => <VariantRobustnessPanel />,
  };
}

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Flex, Space, Tag, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import CPButton from '../../../core/CPButton';
import { quizAttemptsApi } from '../../../../api-client/clients';
import { StaffQuizAttempt, StaffQuizResponse } from '../../../../api-client';
import { useApiAction } from '../../../../hooks/useApiAction';

interface CodeExecutionResult {
  status?: 'running' | 'success' | 'error';
  stdout?: string;
  stderr?: string;
  error?: string | null;
  images?: string[];
  executionTime?: number;
}

/** "Run code" control for a code response: dispatches a sandbox run, polls until it lands,
 *  and shows stdout/stderr/plots. Staff-only (the endpoint is gated server-side). */
const RunCodeControls: React.FC<{
  attemptId: number;
  response: StaffQuizResponse;
  onUpdate: (updated: StaffQuizAttempt) => void;
}> = ({ attemptId, response, onUpdate }) => {
  const exec = (response.codeExecution as CodeExecutionResult | null) ?? null;
  const running = exec?.status === 'running';
  const { acting, run } = useApiAction();
  // Poll the attempt while a run is in flight, capped so a stuck run doesn't poll forever.
  const pollRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (!running) return;
    let elapsed = 0;
    const tick = async () => {
      elapsed += 2000;
      try {
        const updated = await quizAttemptsApi.retrieve({ id: attemptId });
        const fresh = updated.responses.find((r) => r.id === response.id);
        onUpdate(updated);
        if ((fresh?.codeExecution as CodeExecutionResult | null)?.status === 'running' && elapsed < 90000) {
          pollRef.current = setTimeout(tick, 2000);
        }
      } catch {
        // Stop polling on error; the last-known state stays shown.
      }
    };
    pollRef.current = setTimeout(tick, 2000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // Re-arm only when a new run starts (executionTime changes), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, exec?.executionTime, attemptId, response.id]);

  const trigger = () =>
    run(async () => {
      const updated = await quizAttemptsApi.runCodeCreate({
        id: attemptId,
        runQuizResponseCodeRequest: { response: response.id },
      });
      onUpdate(updated);
    }, 'Running the code…', 'Failed to run the code.');

  return (
    <Flex vertical gap={8} style={{ marginBottom: 16 }}>
      <Space>
        <CPButton
          cpType="default"
          small
          icon={<PlayCircleOutlined />}
          loading={acting || running}
          onClick={trigger}
          data-testid="run-code"
        >
          {running ? 'Running…' : exec ? 'Run again' : 'Run code'}
        </CPButton>
        {exec?.status === 'success' && <Tag color="green">Ran cleanly</Tag>}
        {exec?.status === 'error' && <Tag color="red">Error</Tag>}
        {exec?.executionTime != null && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {exec.executionTime.toFixed(2)}s
          </Typography.Text>
        )}
      </Space>
      {exec && exec.status !== 'running' && (
        <div style={{ fontSize: 12 }}>
          {exec.error && (
            <Typography.Paragraph type="danger" style={{ fontSize: 12, marginBottom: 8 }}>
              {exec.error}
            </Typography.Paragraph>
          )}
          {exec.stdout && (
            <>
              <Typography.Text strong style={{ fontSize: 12 }}>
                stdout
              </Typography.Text>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, margin: '4px 0 8px' }}>{exec.stdout}</pre>
            </>
          )}
          {exec.stderr && (
            <>
              <Typography.Text strong style={{ fontSize: 12 }}>
                stderr
              </Typography.Text>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, margin: '4px 0 8px' }}>{exec.stderr}</pre>
            </>
          )}
          {(exec.images ?? []).map((img, idx) => (
            <img
              key={idx}
              src={`data:image/png;base64,${img}`}
              alt={`Plot ${idx + 1}`}
              style={{ maxWidth: '100%', marginTop: 8 }}
            />
          ))}
        </div>
      )}
    </Flex>
  );
};

export default RunCodeControls;

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Flex, Space, Tag, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, LoadingOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Resizable } from 're-resizable';
import CPButton from '../../../core/CPButton';
import { quizAttemptsApi } from '../../../../api-client/clients';
import { StaffQuizAttempt, StaffQuizResponse } from '../../../../api-client';
import { useApiAction } from '../../../../hooks/useApiAction';
import { apiErrorMessage } from '../../../../lib/apiError';
import { copyTextToClipboard } from '../../../utils/Browser';

interface CodeExecutionResult {
  status?: 'running' | 'success' | 'error';
  stdout?: string;
  stderr?: string;
  error?: string | null;
  images?: string[];
  executionTime?: number;
}

const MONO = "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const GREY = '#A9A9A9';

/** Sandbox runner for a code response, styled like the code console's pseudo-terminal:
 *  a dark header bar (language, status, runtime, copy, Run) over a resizable terminal body
 *  showing stdout, stderr, and plots. Dispatches an async run and polls until it lands.
 *  Staff-only (the endpoint is gated server-side). */
const RunCodeControls: React.FC<{
  attemptId: number;
  response: StaffQuizResponse;
  onUpdate: (updated: StaffQuizAttempt) => void;
}> = ({ attemptId, response, onUpdate }) => {
  const exec = (response.codeExecution as CodeExecutionResult | null) ?? null;
  // A run/poll problem on our side (dispatch failed, connection lost, timeout) — shown in
  // the terminal AND toasted, so a broken run never fails silently into the console.
  const [localError, setLocalError] = React.useState<string | null>(null);
  React.useEffect(() => setLocalError(null), [response.id]);
  // A local error ends the run from the UI's perspective, even if the server still says
  // running — otherwise the Run button would stay stuck on "Running…" forever.
  const running = exec?.status === 'running' && !localError;
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
        const freshExec = (fresh?.codeExecution as CodeExecutionResult | null) ?? null;
        if (freshExec?.status === 'running') {
          if (elapsed < 90000) {
            pollRef.current = setTimeout(tick, 2000);
          } else {
            setLocalError('The run timed out after 90 seconds — the sandbox may be stuck. Try running it again.');
            message.error('The sandbox run timed out.');
          }
        } else if (freshExec?.status === 'error') {
          message.error('The sandbox run failed — see the output below.');
        }
      } catch (e) {
        setLocalError(apiErrorMessage(e) ?? 'Lost connection to the server while waiting for the run.');
        message.error('Lost connection to the sandbox while waiting for the run.');
      }
    };
    pollRef.current = setTimeout(tick, 2000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // Re-arm only when a new run starts (executionTime changes), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, exec?.executionTime, attemptId, response.id]);

  const trigger = async () => {
    setLocalError(null);
    const ok = await run(async () => {
      const updated = await quizAttemptsApi.runCodeCreate({
        id: attemptId,
        runQuizResponseCodeRequest: { response: response.id },
      });
      onUpdate(updated);
    }, 'Running the code…', 'Failed to run the code.');
    // The toast already fired; mirror it in the terminal so the failure stays visible.
    if (!ok) setLocalError('Could not start the run — the request to the server failed.');
  };

  const copyOutput = () =>
    copyTextToClipboard(
      [exec?.error && `error: ${exec.error}`, exec?.stdout, exec?.stderr && `stderr:\n${exec.stderr}`]
        .filter(Boolean)
        .join('\n'),
    );

  const language = (response.question as { language?: string | null }).language;

  return (
    <Resizable
      defaultSize={{ width: '100%', height: 240 }}
      minHeight={140}
      maxHeight={560}
      enable={{ bottom: true }}
      style={{ marginBottom: 16 }}
    >
      <div
        data-testid="run-code-terminal"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid rgb(70,70,70)',
        }}
      >
        <Flex
          align="center"
          justify="space-between"
          gap={8}
          style={{
            flex: 'none',
            background: 'rgb(34,34,34)',
            borderBottom: '1px solid rgb(101,101,101)',
            padding: '4px 10px',
            minHeight: 34,
          }}
        >
          <Space size={8}>
            <Typography.Text strong style={{ color: 'rgb(36,190,133)', fontSize: 12 }}>
              Sandbox
            </Typography.Text>
            {language && <Tag style={{ marginRight: 0 }}>{language}</Tag>}
            {running && (
              <Typography.Text style={{ color: GREY, fontSize: 12 }}>
                <LoadingOutlined /> running…
              </Typography.Text>
            )}
            {!running && exec?.status === 'success' && <Tag color="green">ran cleanly</Tag>}
            {!running && exec?.status === 'error' && <Tag color="red">error</Tag>}
            {!running && exec?.executionTime != null && (
              <Typography.Text style={{ color: GREY, fontSize: 12 }}>{exec.executionTime.toFixed(2)}s</Typography.Text>
            )}
          </Space>
          <Space size={4}>
            {exec && !running && (
              <Tooltip title="Copy output">
                <CPButton
                  cpType="link"
                  small
                  icon={<CopyOutlined style={{ color: GREY }} />}
                  onClick={copyOutput}
                  aria-label="Copy output"
                  data-testid="run-code-copy"
                />
              </Tooltip>
            )}
            <CPButton
              cpType="primary"
              small
              icon={<PlayCircleOutlined />}
              loading={acting || running}
              onClick={trigger}
              data-testid="run-code"
            >
              {running ? 'Running…' : exec ? 'Run again' : 'Run code'}
            </CPButton>
          </Space>
        </Flex>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            background: 'black',
            color: 'white',
            fontFamily: MONO,
            fontSize: 12.5,
            lineHeight: 1.5,
            padding: '10px 14px',
          }}
        >
          {localError && (
            <div style={{ color: '#ff8383', whiteSpace: 'pre-wrap', marginBottom: 8 }} role="alert" data-testid="run-code-error">
              {localError}
            </div>
          )}
          {!exec && !localError && (
            <span style={{ color: GREY }}>Run the student's code in the sandbox to see what it produces.</span>
          )}
          {running && <span style={{ color: GREY }}>Running in the sandbox…</span>}
          {exec && !running && (
            <>
              {exec.error && <div style={{ color: '#ffd666', whiteSpace: 'pre-wrap' }}>{exec.error}</div>}
              {exec.stdout && <div style={{ whiteSpace: 'pre-wrap' }}>{exec.stdout}</div>}
              {exec.stderr && (
                <div style={{ whiteSpace: 'pre-wrap', color: '#ff8383', marginTop: exec.stdout ? 8 : 0 }}>
                  {exec.stderr}
                </div>
              )}
              {!exec.error && !exec.stdout && !exec.stderr && (
                <span style={{ color: GREY }}>(no output)</span>
              )}
              {(exec.images ?? []).map((img, idx) => (
                <img
                  key={idx}
                  src={`data:image/png;base64,${img}`}
                  alt={`Plot ${idx + 1}`}
                  style={{ maxWidth: '100%', marginTop: 8, background: 'white', borderRadius: 2 }}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </Resizable>
  );
};

export default RunCodeControls;

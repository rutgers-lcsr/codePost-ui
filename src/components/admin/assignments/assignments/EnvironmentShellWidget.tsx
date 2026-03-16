// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Button, Card, Checkbox, Space, Tag, Typography, message } from 'antd';
import { PoweroffOutlined } from '@ant-design/icons';
import { Terminal } from '@xterm/xterm';
import type { IDisposable } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

import { ShellStartResponse } from '../../../../services/environmentShell';
import { getAuthToken } from '../../../../utils/auth';

interface IProps {
  environmentId?: number | null;
  hasAssignmentFiles: boolean;
}

const terminalStyles: React.CSSProperties = {
  background: '#0b0f13',
  borderRadius: 6,
  border: '1px solid #1f2937',
  boxSizing: 'border-box',
  padding: '10px 8px',
  overflow: 'hidden',
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  return fallback;
};

export const EnvironmentShellWidget: React.FC<IProps> = ({ environmentId, hasAssignmentFiles }) => {
  const [session, setSession] = React.useState<ShellStartResponse | null>(null);
  const [socket, setSocket] = React.useState<WebSocket | null>(null);
  const socketRef = React.useRef<WebSocket | null>(null);
  const terminalInstanceRef = React.useRef<Terminal | null>(null);
  const terminalContainerRef = React.useRef<HTMLDivElement | null>(null);
  const terminalDataDisposableRef = React.useRef<IDisposable | null>(null);
  const fitAddonRef = React.useRef<FitAddon | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [stopping, setStopping] = React.useState(false);
  const [includeDatasets, setIncludeDatasets] = React.useState(true);
  const [includeAssignmentFiles, setIncludeAssignmentFiles] = React.useState(true);

  const canUseShell = Boolean(environmentId) && (!includeAssignmentFiles || hasAssignmentFiles);

  const writeTerminal = (text: string) => {
    terminalInstanceRef.current?.write(text);
  };

  React.useEffect(() => {
    if (!terminalContainerRef.current) return;
    if (terminalInstanceRef.current) return;

    const term = new Terminal({
      disableStdin: false,
      cursorBlink: true,
      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12,
      lineHeight: 1.3,
      theme: {
        background: '#0b0f13',
        foreground: '#d1d5db',
      },
    });

    terminalInstanceRef.current = term;
    term.open(terminalContainerRef.current);

    // Initialize and load FitAddon
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);

    // Fit terminal to container size
    fitAddon.fit();

    term.writeln('Ready to connect...');

    terminalDataDisposableRef.current = term.onData((data: string) => {
      const ws = socketRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminalDataDisposableRef.current?.dispose();
      terminalDataDisposableRef.current = null;
      fitAddonRef.current = null;
      term.dispose();
      terminalInstanceRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (terminalInstanceRef.current && socket) {
      terminalInstanceRef.current.focus();
    }
  }, [socket]);

  const handleStart = async () => {
    if (!environmentId) return;
    setStarting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        message.error('Missing auth token. Please refresh and sign in again.');
        return;
      }

      const baseUrl = process.env.REACT_APP_API_URL!;
      const wsBase = baseUrl.replace(/^http/i, 'ws');
      const qs = new URLSearchParams({
        token,
        includeDatasets: includeDatasets ? 'true' : 'false',
        includeAssignmentFiles: includeAssignmentFiles ? 'true' : 'false',
      });
      const wsUrl = `${wsBase}/ws/autograder/environments/${environmentId}/shell/?${qs.toString()}`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      ws.onmessage = (event) => {
        const handleText = (text: string) => {
          try {
            const parsed = JSON.parse(text);
            if (parsed?.type === 'ready') {
              setSession({
                containerId: parsed.containerId,
                image: parsed.image || 'environment',
                expiresAt: parsed.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                workingDir: parsed.workingDir || '/work',
                mounts: parsed.mounts || [],
              });

              // Build dynamic welcome message
              const mounts = parsed.mounts || [];
              const datasetMounts = mounts.filter((m: any) => m.type === 'dataset');

              let message = '\r\n';
              message += '\x1b[90m----------------- Codepost Environment -----------------\x1b[0m\r\n';
              message += '\r\n';
              message += '\x1b[1;32mREADY\x1b[0m  Shell session initialized\r\n';
              message += '\r\n';

              // Show what's available
              message += '\x1b[1mAvailable:\x1b[0m\r\n';
              if (includeAssignmentFiles) {
                message += '  \x1b[32m✓\x1b[0m Assignment files (injected into /work)\r\n';
              }
              if (datasetMounts.length > 0) {
                message += `  \x1b[32m✓\x1b[0m ${datasetMounts.length} dataset${datasetMounts.length > 1 ? 's' : ''} (mounted)\r\n`;
                datasetMounts.forEach((m: any) => {
                  message += `    \x1b[90m→\x1b[0m ${m.container}\r\n`;
                });
              }
              if (!includeAssignmentFiles && datasetMounts.length === 0) {
                message += '  \x1b[90m(none)\x1b[0m\r\n';
              }
              message += '\r\n';

              // Show info about execution
              message += '\x1b[1;36mHow it works:\x1b[0m\r\n';
              message += '  Student code is wrapped in a template.\r\n';
              if (includeAssignmentFiles) {
                message += '  Assignment files are available at execution time.\r\n';
              }
              if (datasetMounts.length > 0) {
                message += '  Datasets are mounted read-only.\r\n';
              }
              message += '\r\n';

              message += 'Working directory: \x1b[36m' + (parsed.workingDir || '/work') + '\x1b[0m\r\n';
              message += '\r\n';

              writeTerminal(message);
              return;
            }
            if (parsed?.type === 'data') {
              if (typeof parsed.data === 'string') {
                writeTerminal(parsed.data);
              }
              return;
            }
            if (parsed?.type === 'error') {
              writeTerminal(
                `\x1b[33m\x1b[1m[Warning]\x1b[0m Some containers might not have an interactive mode, we might not be able to spawn a shell.\r\n\r\n\x1b[31m\x1b[1m[Error]\x1b[0m ${parsed.message || 'Shell error'}\r\n`,
              );
              return;
            }
            if (parsed?.type === 'closed') {
              writeTerminal(`\r\nShell session closed\r\n`);
              return;
            }
          } catch {
            // Not JSON; treat as shell output
          }
          writeTerminal(text);
        };

        if (typeof event.data === 'string') {
          handleText(event.data);
        } else if (event.data instanceof ArrayBuffer) {
          handleText(new TextDecoder().decode(event.data));
        } else if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => handleText(String(reader.result || ''));
          reader.readAsText(event.data);
        }
      };
      ws.onerror = () => {
        writeTerminal(`\r\nConnection error. URL: ${wsUrl}\r\n`);
        message.error('Shell connection failed');
      };
      ws.onclose = (event) => {
        setSocket(null);
        socketRef.current = null;
        setSession(null);
        writeTerminal(`\r\nShell session closed (code ${event.code})\r\n`);
      };

      ws.onopen = () => {
        setSocket(ws);
        socketRef.current = ws;
        const term = terminalInstanceRef.current;
        term?.reset();
        setTimeout(() => terminalInstanceRef.current?.focus(), 50);
        writeTerminal('Connecting to shell session...\r\n');
        // Trigger an initial prompt
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('\n');
          }
        }, 50);
      };
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to start shell session'));
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    if (!environmentId) return;
    setStopping(true);
    try {
      if (socket) socket.close();
      setSocket(null);
      setSession(null);
      writeTerminal('\r\nSession stopped\r\n');
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to stop session'));
    } finally {
      setStopping(false);
    }
  };

  const renderGateMessage = () => {
    if (includeAssignmentFiles && !hasAssignmentFiles) {
      return 'Upload assignment files to enable shell testing.';
    }
    if (!environmentId) {
      return 'Create an environment first to enable shell testing.';
    }
    return '';
  };

  return (
    <Card
      title="Environment Shell"
      extra={
        <Space>
          <Button onClick={handleStart} loading={starting} disabled={!canUseShell || !!socket}>
            Start
          </Button>
          <Button danger icon={<PoweroffOutlined />} onClick={handleStop} loading={stopping} disabled={!session}>
            Stop
          </Button>
        </Space>
      }
      style={{ marginTop: 8 }}
    >
      {!canUseShell ? (
        <Alert type="info" title={renderGateMessage()} showIcon />
      ) : (
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Space align="center">
            <Tag color={socket ? 'green' : 'default'}>{socket ? 'Active' : 'Idle'}</Tag>
            <Checkbox
              checked={includeDatasets}
              onChange={(e) => setIncludeDatasets(e.target.checked)}
              disabled={!!socket}
            >
              Include datasets
            </Checkbox>
            <Checkbox
              checked={includeAssignmentFiles}
              onChange={(e) => setIncludeAssignmentFiles(e.target.checked)}
              disabled={!!socket}
            >
              Include assignment files
            </Checkbox>
            <Typography.Text type="secondary">Short-lived sandbox for verifying mounts</Typography.Text>
          </Space>

          <div
            style={terminalStyles}
            ref={terminalContainerRef}
            onMouseDown={() => terminalInstanceRef.current?.focus()}
            onClick={() => terminalInstanceRef.current?.focus()}
            tabIndex={0}
            role="textbox"
            aria-label="Shell terminal"
          />
        </Space>
      )}
    </Card>
  );
};

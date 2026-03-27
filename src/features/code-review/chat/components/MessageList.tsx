// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ChatMessage } from '../../../../stores/useChatStore';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  ToolOutlined,
  RightOutlined,
  DownOutlined,
  WarningOutlined,
  MessageOutlined,
} from '@ant-design/icons';

interface MessageListProps {
  messages: ChatMessage[];
}

// ---------------------------------------------------------------------------
// Relative timestamp helper
// ---------------------------------------------------------------------------

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Shared markdown components factory (used by MessageList + StreamingMessage)
// ---------------------------------------------------------------------------

export function markdownComponents(isDark: boolean) {
  return {
    // Override `pre` so SyntaxHighlighter doesn't get double-wrapped
    pre({ children }: { children: React.ReactNode }) {
      return <>{children}</>;
    },
    code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { className?: string }) {
      const match = /language-(\w+)/.exec(className || '');
      if (match) {
        return (
          <CodeBlock language={match[1]} isDark={isDark}>
            {String(children).replace(/\n$/, '')}
          </CodeBlock>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // Open external links safely
    a({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as Record<string, React.ComponentType<any>>;
}

// ---------------------------------------------------------------------------
// Code block with copy button
// ---------------------------------------------------------------------------

function CodeBlock({ language, isDark, children }: { language: string; isDark: boolean; children: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', marginBottom: 4 }}>
      <button
        onClick={handleCopy}
        title="Copy code"
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isDark ? '#888' : '#999',
          fontSize: 13,
          padding: 2,
          lineHeight: 1,
          zIndex: 1,
          opacity: 0.7,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        {copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
      </button>
      <SyntaxHighlighter style={dracula} language={language} PreTag="div">
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessageList
// ---------------------------------------------------------------------------

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDark = consoleTheme.consoleTheme === consoleThemes.dark;

  // Group consecutive tool_call + tool_result messages into a single collapsible block
  const grouped = groupToolMessages(messages);

  const mdComponents = React.useMemo(() => markdownComponents(isDark), [isDark]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          gap: 8,
          color: isDark ? '#666' : '#aaa',
        }}
      >
        <MessageOutlined style={{ fontSize: 28 }} />
        <span style={{ fontSize: 13 }}>Send a message to start the conversation</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
      {grouped.map((item) => {
        if (item.type === 'tool_group') {
          return <ToolGroup key={item.key} calls={item.calls} results={item.results} isDark={isDark} />;
        }

        const msg = item.message;
        if (msg.role === 'summary') return null;

        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isUser ? 'flex-end' : 'flex-start',
              padding: '4px 12px',
              gap: 2,
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                backgroundColor: isUser ? (isDark ? '#1a3a5c' : '#e6f4ff') : isDark ? '#2a2a2a' : '#f0f0f0',
                color: isDark ? '#e0e0e0' : '#333',
                fontSize: 13,
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
              className="chat-message-content"
            >
              {isUser ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
            {/* Timestamp */}
            {msg.created && (
              <span
                style={{
                  fontSize: 10,
                  color: isDark ? '#555' : '#bbb',
                  marginTop: 1,
                  marginLeft: isUser ? 0 : 4,
                  marginRight: isUser ? 4 : 0,
                }}
              >
                {relativeTime(msg.created)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tool group: VS-Code-style collapsible block
// ---------------------------------------------------------------------------

function ToolGroup({ calls, results, isDark }: { calls: ChatMessage[]; results: ChatMessage[]; isDark: boolean }) {
  const [expanded, setExpanded] = React.useState(false);

  // Determine overall status from tool calls
  const hasError = results.some((r) => r.content.toLowerCase().startsWith('error'));
  const allApproved = calls.length > 0 && calls.every((c) => c.toolStatus === 'approved');
  const allRejected = calls.length > 0 && calls.every((c) => c.toolStatus === 'rejected');
  const hasPending = calls.some((c) => c.toolStatus === 'pending');

  const statusIcon = hasError ? (
    <WarningOutlined style={{ color: '#faad14', fontSize: 11 }} />
  ) : allRejected ? (
    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 11 }} />
  ) : allApproved ? (
    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 11 }} />
  ) : hasPending ? (
    <ToolOutlined style={{ color: '#1677ff', fontSize: 11 }} />
  ) : calls.length === 0 && results.length > 0 ? (
    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 11 }} />
  ) : (
    <ToolOutlined style={{ color: isDark ? '#666' : '#999', fontSize: 11 }} />
  );

  // Summary label — count from whichever set has entries
  const totalCount = calls.length || results.length;
  const toolNames = [...new Set([...calls.map((c) => c.toolName), ...results.map((r) => r.toolName)].filter(Boolean))];
  let label: string;
  if (totalCount === 1) {
    label = calls[0]?.content || `Used ${toolNames[0] || 'tool'}`;
  } else if (toolNames.length > 0) {
    label = `Used ${totalCount} tools (${toolNames.join(', ')})`;
  } else {
    label = `Used ${totalCount} tools`;
  }

  const muted = isDark ? '#777' : '#999';
  const hoverBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const detailBg = isDark ? '#1e1e1e' : '#fafafa';
  const borderColor = isDark ? '#333' : '#e8e8e8';

  return (
    <div style={{ padding: '2px 12px' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: muted,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 6,
          transition: 'background-color 0.15s',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {expanded ? <DownOutlined style={{ fontSize: 9 }} /> : <RightOutlined style={{ fontSize: 9 }} />}
        {statusIcon}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>

      {expanded && (
        <div
          style={{
            margin: '4px 0 4px 18px',
            padding: '8px 10px',
            backgroundColor: detailBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.6,
            color: isDark ? '#bbb' : '#555',
          }}
        >
          {calls.map((call) => {
            const matchingResult = results.find((r) => r.toolName === call.toolName);
            return (
              <div key={call.id} style={{ marginBottom: results.length > 0 || calls.length > 1 ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, marginBottom: 2 }}>
                  <ToolOutlined style={{ fontSize: 11 }} />
                  <span>{call.toolName}</span>
                  {call.toolStatus === 'approved' && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 11 }} />}
                  {call.toolStatus === 'rejected' && <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 11 }} />}
                </div>
                {call.content && <div style={{ color: muted, marginLeft: 16, marginBottom: 2 }}>{call.content}</div>}
                {matchingResult && (
                  <div
                    style={{
                      marginLeft: 16,
                      padding: '4px 8px',
                      backgroundColor: isDark ? '#252525' : '#f0f0f0',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                      fontSize: 11,
                      maxHeight: 120,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {matchingResult.content}
                  </div>
                )}
              </div>
            );
          })}
          {/* Show any unmatched results (e.g. server-side tools without a tool_call message) */}
          {results
            .filter((r) => !calls.some((c) => c.toolName === r.toolName))
            .map((result) => (
              <div key={result.id}>
                <div
                  style={{
                    padding: '4px 8px',
                    backgroundColor: isDark ? '#252525' : '#f0f0f0',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    maxHeight: 120,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {result.content}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group consecutive tool_call/tool_result messages
// ---------------------------------------------------------------------------

type GroupedItem =
  | { type: 'message'; message: ChatMessage; key: string }
  | { type: 'tool_group'; calls: ChatMessage[]; results: ChatMessage[]; key: string };

function groupToolMessages(messages: ChatMessage[]): GroupedItem[] {
  const items: GroupedItem[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];
    // Don't group pending tool_call messages — they need to stay visible
    // as actionable ToolCallCards rather than being collapsed into a group.
    if (msg.role === 'tool_call' && msg.toolStatus === 'pending') {
      items.push({ type: 'message', message: msg, key: `m-${msg.id}` });
      i++;
      continue;
    }
    if (msg.role === 'tool_call' || msg.role === 'tool_result') {
      const calls: ChatMessage[] = [];
      const results: ChatMessage[] = [];
      while (
        i < messages.length &&
        (messages[i].role === 'tool_call' || messages[i].role === 'tool_result') &&
        !(messages[i].role === 'tool_call' && messages[i].toolStatus === 'pending')
      ) {
        if (messages[i].role === 'tool_call') calls.push(messages[i]);
        else results.push(messages[i]);
        i++;
      }
      items.push({ type: 'tool_group', calls, results, key: `tg-${calls[0]?.id ?? results[0]?.id}` });
    } else {
      items.push({ type: 'message', message: msg, key: `m-${msg.id}` });
      i++;
    }
  }

  return items;
}

export default MessageList;

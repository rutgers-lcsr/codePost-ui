// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import { useChatStore } from '../../../../stores/useChatStore';
import { useCodeConsoleStore } from '../../../../stores/useCodeConsoleStore';
import {
  connectChat,
  disconnectChat,
  sendChatMessage,
  approveToolCall,
  rejectToolCall,
} from '../services/chatWebSocket';
import {
  listConversations,
  createConversation,
  getConversation,
  deleteConversation as deleteConvApi,
  renameConversation as renameConvApi,
} from '../services/chatApi';
import { getTool } from '../tools/registry';
import '../tools'; // Register all tools

import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import StreamingMessage from './StreamingMessage';
import ThinkingMessage from './ThinkingMessage';
import ToolCallCard from './ToolCallCard';
import SummaryBanner from './SummaryBanner';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';
import type { ToolFileInfo } from '../tools/types';

interface ChatPanelProps {
  submissionId: number;
  /** Callback invoked when a client-side tool is approved. The parent (CodeConsole) handles execution. */
  onToolExecute?: (toolName: string, args: Record<string, unknown>) => Promise<string>;
  /** Submission files for resolving file IDs to names in tool descriptions. */
  files?: ToolFileInfo[];
}

/** Walk up the DOM to find the line number from a code panel line element. */
function getLineFromNode(node: Node | null): number | null {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement) {
      // The code panel renders lines as <div id="line-{n}"> or <div data-line-number="{n}">
      const lineId = current.id?.match(/^line-(\d+)$/);
      if (lineId) return parseInt(lineId[1], 10);
      const lineAttr = current.getAttribute?.('data-line-number');
      if (lineAttr) return parseInt(lineAttr, 10);
    }
    current = current.parentNode;
  }
  return null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ submissionId, onToolExecute, files }) => {
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDark = consoleTheme.consoleTheme === consoleThemes.dark;

  const {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    isThinking,
    streamingText,
    pendingToolCall,
    attachedContext,
    latestSummary,
    isLoadingConversations,
    isLoadingMessages,
    isConnected,
    setConversations,
    addConversation,
    removeConversation,
    updateConversation,
    setActiveConversationId,
    setMessages,
    addMessage,
    setIsLoadingConversations,
    setIsLoadingMessages,
    setPendingToolCall,
    setAttachedContext,
    setLatestSummary,
  } = useChatStore();

  const scrollEndRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change, streaming updates, or a tool card appears
  React.useEffect(() => {
    // Small delay so the DOM has time to render after loading finishes
    const timer = setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length, streamingText, pendingToolCall, isLoadingMessages]);

  // -----------------------------------------------------------------------
  // Load conversations on mount
  // -----------------------------------------------------------------------
  React.useEffect(() => {
    if (!submissionId) return;
    setIsLoadingConversations(true);
    listConversations(submissionId)
      .then(setConversations)
      .catch(() => {})
      .finally(() => setIsLoadingConversations(false));
  }, [submissionId, setConversations, setIsLoadingConversations]);

  // -----------------------------------------------------------------------
  // WebSocket connection lifecycle
  // -----------------------------------------------------------------------
  React.useEffect(() => {
    if (!submissionId) return;
    connectChat(submissionId);
    return () => disconnectChat();
  }, [submissionId]);

  // -----------------------------------------------------------------------
  // Load messages when active conversation changes
  // -----------------------------------------------------------------------
  React.useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setLatestSummary(null);
      return;
    }
    setIsLoadingMessages(true);
    setLatestSummary(null);
    getConversation(activeConversationId)
      .then((data) => setMessages(data.messages))
      .catch(() => setMessages([]))
      .finally(() => setIsLoadingMessages(false));
  }, [activeConversationId, setMessages, setIsLoadingMessages, setLatestSummary]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleNewConversation = async () => {
    try {
      const conv = await createConversation(submissionId);
      addConversation(conv);
      setActiveConversationId(conv.id);
    } catch {
      // TODO: show error toast
    }
  };

  const handleSelectConversation = (id: number) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConvApi(id);
      removeConversation(id);
    } catch {
      // ignore
    }
  };

  const handleRenameConversation = async (id: number, title: string) => {
    try {
      await renameConvApi(id, title);
      updateConversation(id, { title });
    } catch {
      // ignore
    }
  };

  const handleSend = (text: string) => {
    if (!activeConversationId || !isConnected) return;

    // Optimistically add user message to the UI (include context label if present)
    const contextLabel = attachedContext
      ? attachedContext.startLine === attachedContext.endLine
        ? `[${attachedContext.fileName}:${attachedContext.startLine}]`
        : `[${attachedContext.fileName}:${attachedContext.startLine}-${attachedContext.endLine}]`
      : null;

    addMessage({
      id: Date.now(),
      role: 'user',
      content: contextLabel ? `${contextLabel}\n${text}` : text,
      created: new Date().toISOString(),
    });

    sendChatMessage(activeConversationId, text, attachedContext);
    setAttachedContext(null);
  };

  /** Capture the current editor selection as context. */
  const handleAttachContext = () => {
    const { selectedFile } = useCodeConsoleStore.getState();
    if (!selectedFile || !selectedFile.id) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString()?.trim() || '';

    if (!selectedText) {
      // No selection — attach entire file reference
      setAttachedContext({
        fileId: selectedFile.id,
        fileName: selectedFile.name,
        startLine: 1,
        endLine: 1,
        selectedText: '',
      });
      return;
    }

    // Find line numbers from the DOM selection
    let startLine = 1;
    let endLine = 1;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      startLine = getLineFromNode(range.startContainer) ?? 1;
      endLine = getLineFromNode(range.endContainer) ?? startLine;
      if (startLine > endLine) [startLine, endLine] = [endLine, startLine];
    }

    // Limit attached text to ~2000 chars to avoid oversized payloads
    const trimmedText = selectedText.length > 2000 ? selectedText.slice(0, 2000) + '...' : selectedText;

    setAttachedContext({
      fileId: selectedFile.id,
      fileName: selectedFile.name,
      startLine,
      endLine,
      selectedText: trimmedText,
    });
  };

  const handleRemoveContext = () => {
    setAttachedContext(null);
  };

  const handleApprove = async (messageId: number) => {
    if (!pendingToolCall) return;

    const tool = getTool(pendingToolCall.name);
    let result = 'Tool executed successfully.';

    // If we have an external handler (CodeConsole), delegate to it
    if (onToolExecute) {
      try {
        result = await onToolExecute(pendingToolCall.name, pendingToolCall.args);
      } catch {
        result = 'Tool execution failed.';
      }
    } else if (tool) {
      try {
        result = await tool.execute(pendingToolCall.args);
      } catch {
        result = 'Tool execution failed.';
      }
    }

    setPendingToolCall(null);
    approveToolCall(messageId, result);
  };

  const handleReject = (messageId: number) => {
    setPendingToolCall(null);
    rejectToolCall(messageId);
  };

  const handleBack = () => {
    setActiveConversationId(null);
    // Refresh conversation list
    listConversations(submissionId)
      .then(setConversations)
      .catch(() => {});
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (!activeConversationId) {
    return (
      <ConversationList
        conversations={conversations}
        loading={isLoadingConversations}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
      />
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          fontSize: 12,
          color: isDark ? '#aaa' : '#666',
        }}
      >
        <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={handleBack} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {conversations.find((c) => c.id === activeConversationId)?.title || 'Chat'}
        </span>
        {!isConnected && <span style={{ fontSize: 11, color: '#ff4d4f' }}>Disconnected</span>}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoadingMessages ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin size="small" />
          </div>
        ) : (
          <>
            {latestSummary && <SummaryBanner summary={latestSummary} />}
            <MessageList messages={messages} />
            {isThinking && !streamingText && <ThinkingMessage />}
            {isStreaming && streamingText && <StreamingMessage text={streamingText} />}
            {isStreaming && !isThinking && !streamingText && <ThinkingMessage />}
            {pendingToolCall && (
              <ToolCallCard
                toolCall={pendingToolCall}
                onApprove={handleApprove}
                onReject={handleReject}
                files={files}
              />
            )}
            <div ref={scrollEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={isStreaming || !isConnected || !!pendingToolCall}
        attachedContext={attachedContext}
        onRemoveContext={handleRemoveContext}
        onAttachContext={handleAttachContext}
      />

      {/* CSS for cursor blink animation */}
      <style>{`
        @keyframes chatCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .chat-message-content p { margin: 0 0 8px 0; }
        .chat-message-content p:last-child { margin-bottom: 0; }
        .chat-message-content pre {
          background: ${isDark ? '#1a1a1a' : '#f5f5f5'};
          padding: 8px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
        .chat-message-content code {
          background: ${isDark ? '#1a1a1a' : '#f5f5f5'};
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 12px;
        }
        .chat-message-content pre code {
          background: none;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default ChatPanel;

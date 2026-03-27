// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { getAuthToken } from '../../../../utils/auth';
import { useChatStore, type PendingToolCall, type CodeContext } from '../../../../stores/useChatStore';

/**
 * WebSocket service for the chat panel.
 *
 * Manages the connection lifecycle (connect / disconnect / reconnect)
 * and dispatches incoming messages to the Zustand chat store.
 */

type ChatWSMessage =
  | { type: 'chat.token'; content: string }
  | { type: 'chat.thinking' }
  | { type: 'chat.thinking_done' }
  | { type: 'chat.tool_call'; message_id: number; name: string; args: Record<string, unknown>; description: string }
  | { type: 'chat.tool_result'; message_id: number; name: string; result: string }
  | { type: 'chat.done'; input_tokens: number; output_tokens: number }
  | { type: 'chat.error'; message: string }
  | { type: 'chat.summary'; summary: string };

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentSubmissionId: number | null = null;
let streamingInactivityTimer: ReturnType<typeof setTimeout> | null = null;

/** How long without any WS message before we assume the stream is dead (ms). */
const STREAMING_TIMEOUT_MS = 60_000;

function getWsBaseUrl(): string {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  return apiUrl.replace(/^http/, 'ws');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function connectChat(submissionId: number): void {
  if (ws && currentSubmissionId === submissionId && ws.readyState === WebSocket.OPEN) {
    return; // Already connected
  }

  disconnectChat();

  const token = getAuthToken();
  if (!token) return;

  const url = `${getWsBaseUrl()}/ws/chat/${submissionId}/?token=${encodeURIComponent(token)}`;
  currentSubmissionId = submissionId;
  ws = new WebSocket(url);

  ws.onopen = () => {
    useChatStore.getState().setIsConnected(true);
  };

  ws.onclose = () => {
    useChatStore.getState().setIsConnected(false);
    ws = null;
    // Auto-reconnect after 3 seconds if we still expect to be connected
    if (currentSubmissionId === submissionId) {
      reconnectTimer = setTimeout(() => connectChat(submissionId), 3000);
    }
  };

  ws.onerror = () => {
    // onclose will fire after onerror
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ChatWSMessage;
      handleMessage(data);
    } catch {
      // Ignore malformed messages
    }
  };
}

export function disconnectChat(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  clearStreamingTimeout();
  currentSubmissionId = null;
  if (ws) {
    ws.onclose = null; // Prevent reconnect
    ws.close();
    ws = null;
  }
  useChatStore.getState().setIsConnected(false);
}

export function sendChatMessage(conversationId: number, text: string, context?: CodeContext | null): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const store = useChatStore.getState();
  store.setIsStreaming(true);
  store.setIsThinking(false);
  store.clearStreamingText();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = { type: 'chat.message', conversation_id: conversationId, text };
  if (context) {
    payload.context = {
      file_id: context.fileId,
      file_name: context.fileName,
      start_line: context.startLine,
      end_line: context.endLine,
      selected_text: context.selectedText,
    };
  }
  ws.send(JSON.stringify(payload));
  resetStreamingTimeout();
}

export function approveToolCall(messageId: number, result?: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const store = useChatStore.getState();
  store.setIsStreaming(true);
  store.clearStreamingText();
  ws.send(
    JSON.stringify({ type: 'tool.approve', message_id: messageId, result: result || 'Tool executed successfully.' }),
  );
  resetStreamingTimeout();
}

export function rejectToolCall(messageId: number, reason?: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const store = useChatStore.getState();
  store.setIsStreaming(true);
  store.clearStreamingText();
  ws.send(JSON.stringify({ type: 'tool.reject', message_id: messageId, reason: reason || 'Rejected by grader.' }));
  resetStreamingTimeout();
}

// ---------------------------------------------------------------------------
// Internal message handler
// ---------------------------------------------------------------------------

function handleMessage(data: ChatWSMessage): void {
  const store = useChatStore.getState();

  // Reset inactivity timer on every incoming message while streaming
  resetStreamingTimeout();

  switch (data.type) {
    case 'chat.token':
      store.setIsThinking(false);
      store.appendStreamingText(data.content);
      break;

    case 'chat.thinking':
      store.setIsThinking(true);
      break;

    case 'chat.thinking_done':
      store.setIsThinking(false);
      break;

    case 'chat.tool_call': {
      // Finalize any streaming text into a message before showing the tool call
      finalizeStreamingMessage();
      const toolCall: PendingToolCall = {
        messageId: data.message_id,
        name: data.name,
        args: data.args,
        description: data.description,
      };
      store.setPendingToolCall(toolCall);
      store.setIsStreaming(false);
      break;
    }

    case 'chat.tool_result':
      // For server-side tools (executed without user approval), add a tool_call
      // message first so the tool group has both a call and a result.
      store.addMessage({
        id: data.message_id,
        role: 'tool_call',
        content: `Executing ${data.name}`,
        toolName: data.name,
        toolStatus: 'approved',
        created: new Date().toISOString(),
      });
      store.addMessage({
        id: Date.now(), // Temp ID for display
        role: 'tool_result',
        content: data.result,
        toolName: data.name,
        created: new Date().toISOString(),
      });
      break;

    case 'chat.done':
      finalizeStreamingMessage();
      store.setIsStreaming(false);
      store.setIsThinking(false);
      break;

    case 'chat.error':
      finalizeStreamingMessage();
      store.setIsStreaming(false);
      store.setIsThinking(false);
      // Add error as a special assistant message
      store.addMessage({
        id: Date.now(),
        role: 'assistant',
        content: `⚠️ ${data.message}`,
        created: new Date().toISOString(),
      });
      break;

    case 'chat.summary':
      store.setLatestSummary(data.summary);
      break;
  }
}

function finalizeStreamingMessage(): void {
  clearStreamingTimeout();
  const store = useChatStore.getState();
  const text = store.streamingText.trim();
  if (text) {
    store.addMessage({
      id: Date.now(),
      role: 'assistant',
      content: text,
      created: new Date().toISOString(),
    });
    store.clearStreamingText();
  }
}

/** Start or reset the inactivity timer while the AI is streaming. */
function resetStreamingTimeout(): void {
  clearStreamingTimeout();
  const store = useChatStore.getState();
  if (!store.isStreaming && !store.isThinking) return;

  streamingInactivityTimer = setTimeout(() => {
    const s = useChatStore.getState();
    if (s.isStreaming || s.isThinking) {
      // Finalize whatever partial text we have and reset
      finalizeStreamingMessage();
      s.setIsStreaming(false);
      s.setIsThinking(false);
    }
  }, STREAMING_TIMEOUT_MS);
}

function clearStreamingTimeout(): void {
  if (streamingInactivityTimer) {
    clearTimeout(streamingInactivityTimer);
    streamingInactivityTimer = null;
  }
}

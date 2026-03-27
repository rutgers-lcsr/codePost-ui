// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatConversation {
  id: number;
  submission: number;
  assignment: number;
  title: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'summary';
  content: string;
  toolName?: string | null;
  toolArgs?: Record<string, unknown> | null;
  toolStatus?: 'pending' | 'approved' | 'rejected' | null;
  tokenCount?: number;
  created: string;
}

export interface PendingToolCall {
  messageId: number;
  name: string;
  args: Record<string, unknown>;
  description: string;
}

/** Context from the code editor attached to a chat message. */
export interface CodeContext {
  /** File ID in the submission. */
  fileId: number;
  /** Display name of the file. */
  fileName: string;
  /** 1-based start line of the selection (inclusive). */
  startLine: number;
  /** 1-based end line of the selection (inclusive). */
  endLine: number;
  /** The selected text snippet. */
  selectedText: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ChatStoreState {
  // Session list
  conversations: ChatConversation[];
  activeConversationId: number | null;

  // Active conversation messages
  messages: ChatMessage[];

  // Streaming state
  isStreaming: boolean;
  isThinking: boolean;
  streamingText: string;

  // Tool confirmation
  pendingToolCall: PendingToolCall | null;

  // Attached editor context
  attachedContext: CodeContext | null;

  // Summary
  latestSummary: string | null;

  // Loading
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // Connection
  isConnected: boolean;
}

interface ChatStoreActions {
  // Conversation management
  setConversations: (conversations: ChatConversation[]) => void;
  addConversation: (conversation: ChatConversation) => void;
  removeConversation: (conversationId: number) => void;
  updateConversation: (conversationId: number, updates: Partial<ChatConversation>) => void;
  setActiveConversationId: (id: number | null) => void;

  // Messages
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;

  // Streaming
  setIsStreaming: (streaming: boolean) => void;
  setIsThinking: (thinking: boolean) => void;
  appendStreamingText: (text: string) => void;
  clearStreamingText: () => void;

  // Tool calls
  setPendingToolCall: (toolCall: PendingToolCall | null) => void;

  // Attached context
  setAttachedContext: (ctx: CodeContext | null) => void;

  // Summary
  setLatestSummary: (summary: string | null) => void;

  // Loading
  setIsLoadingConversations: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;

  // Connection
  setIsConnected: (connected: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState: ChatStoreState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  isThinking: false,
  streamingText: '',
  pendingToolCall: null,
  attachedContext: null,
  latestSummary: null,
  isLoadingConversations: false,
  isLoadingMessages: false,
  isConnected: false,
};

export const useChatStore = create<ChatStoreState & ChatStoreActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) => set((state) => ({ conversations: [conversation, ...state.conversations] })),
      removeConversation: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== conversationId),
          activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
          messages: state.activeConversationId === conversationId ? [] : state.messages,
        })),
      updateConversation: (conversationId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) => (c.id === conversationId ? { ...c, ...updates } : c)),
        })),
      setActiveConversationId: (id) => set({ activeConversationId: id }),

      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

      setIsStreaming: (streaming) => set({ isStreaming: streaming }),
      setIsThinking: (thinking) => set({ isThinking: thinking }),
      appendStreamingText: (text) => set((state) => ({ streamingText: state.streamingText + text })),
      clearStreamingText: () => set({ streamingText: '' }),

      setPendingToolCall: (toolCall) => set({ pendingToolCall: toolCall }),

      setAttachedContext: (ctx) => set({ attachedContext: ctx }),

      setLatestSummary: (summary) => set({ latestSummary: summary }),

      setIsLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
      setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

      setIsConnected: (connected) => set({ isConnected: connected }),

      reset: () => set(initialState),
    }),
    { name: 'chat-store' },
  ),
);

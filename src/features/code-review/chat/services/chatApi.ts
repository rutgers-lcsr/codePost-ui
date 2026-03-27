// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { getAuthToken } from '../../../../utils/auth';
import type { ChatConversation, ChatMessage } from '../../../../stores/useChatStore';

/**
 * REST API service for managing chat conversations.
 * Handles CRUD operations against the /chatConversations/ endpoint.
 */

function getBaseUrl(): string {
  return process.env.REACT_APP_API_URL || 'http://localhost:8000';
}

function getHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listConversations(submissionId: number): Promise<ChatConversation[]> {
  const response = await fetch(`${getBaseUrl()}/chatConversations/?submission=${submissionId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to list conversations: ${response.status}`);
  return response.json();
}

export async function createConversation(submissionId: number, title?: string): Promise<ChatConversation> {
  const response = await fetch(`${getBaseUrl()}/chatConversations/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ submission: submissionId, title: title || '' }),
  });
  if (!response.ok) throw new Error(`Failed to create conversation: ${response.status}`);
  return response.json();
}

interface ConversationDetail extends ChatConversation {
  messages: ChatMessage[];
}

export async function getConversation(conversationId: number): Promise<ConversationDetail> {
  const response = await fetch(`${getBaseUrl()}/chatConversations/${conversationId}/`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to get conversation: ${response.status}`);
  return response.json();
}

export async function renameConversation(conversationId: number, title: string): Promise<ChatConversation> {
  const response = await fetch(`${getBaseUrl()}/chatConversations/${conversationId}/`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error(`Failed to rename conversation: ${response.status}`);
  return response.json();
}

export async function deleteConversation(conversationId: number): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/chatConversations/${conversationId}/`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to delete conversation: ${response.status}`);
}

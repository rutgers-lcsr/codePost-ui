/**
 * AI Service Infrastructure
 *
 * Provides API client functions for AI-powered comment generation.
 */

import * as t from 'io-ts';
import { getHeaders } from './generics';

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

/** AI provider options */
export type AIProvider = 'gemini' | 'openai' | 'ollama' | 'custom';

/** AI Settings for a course */
export const CourseAISettingsV = t.intersection([
  t.type({
    id: t.number,
    ai_enabled: t.boolean,
  }),
  t.partial({
    ai_provider: t.union([t.string, t.null]),
    ai_base_url: t.union([t.string, t.null]),
    ai_model: t.union([t.string, t.null]),
    ai_disabled: t.boolean,
    // Note: ai_api_key is write-only, never returned from API
  }),
]);

export type CourseAISettingsType = t.TypeOf<typeof CourseAISettingsV>;

/** Request body for generating a comment */
export interface GenerateCommentRequest {
  file_id: number;
  start_line: number;
  end_line: number;
  rubric_comment_id?: number;
  existing_text?: string;
  points?: number;
}

/** Response from comment generation */
export interface GenerateCommentResponse {
  text: string;
}

/** Error response */
export interface GenerateCommentError {
  error: string;
}

/**********************************************************************************************************************/
/* API Functions
/**********************************************************************************************************************/

/**
 * Get AI settings for a course
 */
export async function getCourseAISettings(courseId: number): Promise<CourseAISettingsType> {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/courses/${courseId}/aiSettings/`, {
    headers: getHeaders(),
    method: 'GET',
  });

  if (res.status === 200) {
    return res.json();
  }

  if (res.status === 403) {
    // User doesn't have permission to view AI settings
    return { id: courseId, ai_enabled: false };
  }

  throw new Error(`Failed to get AI settings: ${res.status}`);
}

/**
 * Update AI settings for a course
 */
export async function updateCourseAISettings(
  courseId: number,
  settings: {
    ai_provider?: AIProvider | null;
    ai_api_key?: string;
    ai_base_url?: string | null;
    ai_model?: string | null;
    ai_disabled?: boolean;
  },
): Promise<CourseAISettingsType> {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/courses/${courseId}/aiSettings/`, {
    headers: getHeaders(),
    method: 'PATCH',
    body: JSON.stringify(settings),
  });

  if (res.status === 200) {
    return res.json();
  }

  const error = await res.json();
  throw new Error(error.detail || error.error || 'Failed to update AI settings');
}

/**
 * Generate an AI-powered comment suggestion
 */
export async function generateComment(params: GenerateCommentRequest): Promise<string> {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/comments/generate/`, {
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify({
      file_id: params.file_id,
      start_line: params.start_line,
      end_line: params.end_line,
      rubric_comment_id: params.rubric_comment_id,
      existing_text: params.existing_text || '',
      points: params.points,
    }),
  });

  if (res.status === 200) {
    const data: GenerateCommentResponse = await res.json();
    return data.text;
  }

  if (res.status === 400) {
    const error: GenerateCommentError = await res.json();
    throw new Error(error.error || 'Invalid request');
  }

  if (res.status === 403) {
    throw new Error('You do not have permission to generate comments');
  }

  if (res.status === 500) {
    const error: GenerateCommentError = await res.json();
    throw new Error(error.error || 'AI generation failed');
  }

  throw new Error(`Unexpected error: ${res.status}`);
}

/**********************************************************************************************************************/
/* Utility Functions
/**********************************************************************************************************************/

/** Default AI providers with display names */
export const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'ollama', label: 'Ollama (Self-hosted)' },
  { value: 'custom', label: 'Custom Provider' },
];

/** Default models for each provider */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  ollama: 'llama3.2',
  custom: 'default',
};

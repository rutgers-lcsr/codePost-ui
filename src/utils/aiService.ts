// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { commentsApi, coursesApi } from '../api-client/clients';
import type { CourseAISettings, PatchedCourseAISettings } from '../api-client';
import { PatchedCourseAISettingsAiProviderEnum } from '../api-client/models';

export type AIProvider = PatchedCourseAISettingsAiProviderEnum;

export interface GenerateCommentRequest {
  file_id: number;
  start_line: number;
  end_line: number;
  rubric_comment_id?: number;
  existing_text?: string;
  points?: number;
}

export async function getCourseAISettings(courseId: number): Promise<CourseAISettings> {
  try {
    return await coursesApi.aiSettingsRetrieve({ id: courseId });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: Response }).response;
      if (response?.status === 403) {
        return {
          id: courseId,
          aiEnabled: false,
          aiCommentsEnabled: false,
        } as CourseAISettings;
      }
    }
    throw error;
  }
}

export async function updateCourseAISettings(
  courseId: number,
  settings: Omit<PatchedCourseAISettings, 'id' | 'aiEnabled' | 'aiCommentsEnabled'>,
): Promise<CourseAISettings> {
  return await coursesApi.aiSettingsPartialUpdate({
    id: courseId,
    patchedCourseAISettings: settings,
  });
}

export async function generateComment(params: GenerateCommentRequest): Promise<string> {
  const response = await commentsApi.generateCreateRaw({
    comment: {
      file_id: params.file_id,
      start_line: params.start_line,
      end_line: params.end_line,
      rubric_comment_id: params.rubric_comment_id,
      existing_text: params.existing_text || '',
      points: params.points,
    } as unknown as Omit<import('../api-client').Comment, 'id' | 'feedback' | 'color'>,
  });

  const data = (await response.raw.json()) as { text?: string };
  return data.text ?? '';
}

export const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: PatchedCourseAISettingsAiProviderEnum.Gemini, label: 'Google Gemini' },
  { value: PatchedCourseAISettingsAiProviderEnum.Openai, label: 'OpenAI' },
  { value: PatchedCourseAISettingsAiProviderEnum.Ollama, label: 'Ollama (Self-hosted)' },
  { value: PatchedCourseAISettingsAiProviderEnum.Custom, label: 'Custom Provider' },
];

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  [PatchedCourseAISettingsAiProviderEnum.Gemini]: 'gemini-2.5-flash',
  [PatchedCourseAISettingsAiProviderEnum.Openai]: 'gpt-4o-mini',
  [PatchedCourseAISettingsAiProviderEnum.Ollama]: 'llama3.2',
  [PatchedCourseAISettingsAiProviderEnum.Custom]: 'default',
};

import { commentsApi, coursesApi } from '../api-client/clients';
import type { CourseAISettings, PatchedCourse } from '../api-client';

export type AIProvider = 'gemini' | 'openai' | 'ollama' | 'custom';

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
  settings: {
    aiProvider?: AIProvider | null;
    aiApiKey?: string;
    aiBaseUrl?: string | null;
    aiModel?: string | null;
    aiDisabled?: boolean;
    aiCommentsDisabled?: boolean;
  },
): Promise<CourseAISettings> {
  return await coursesApi.aiSettingsPartialUpdate({
    id: courseId,
    patchedCourse: settings as unknown as PatchedCourse,
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
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'ollama', label: 'Ollama (Self-hosted)' },
  { value: 'custom', label: 'Custom Provider' },
];

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  ollama: 'llama3.2',
  custom: 'default',
};

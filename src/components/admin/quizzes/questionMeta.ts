// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { QuestionTypeEnum } from '../../../api-client';

/** Display label + tag color for each question type. */
export const TYPE_META: Record<string, { label: string; color: string }> = {
  [QuestionTypeEnum.MultipleChoice]: { label: 'Multiple choice', color: 'geekblue' },
  [QuestionTypeEnum.MultipleAnswers]: { label: 'Multiple answers', color: 'blue' },
  [QuestionTypeEnum.TrueFalse]: { label: 'True / False', color: 'cyan' },
  [QuestionTypeEnum.ShortAnswer]: { label: 'Short answer', color: 'green' },
  [QuestionTypeEnum.Numerical]: { label: 'Numerical', color: 'lime' },
  [QuestionTypeEnum.Essay]: { label: 'Essay', color: 'gold' },
  [QuestionTypeEnum.Code]: { label: 'Code', color: 'purple' },
};

export const typeMeta = (t?: string) => TYPE_META[t ?? ''] ?? { label: t ?? 'Unknown', color: 'default' };

/** Map an Environment.language value to a Monaco language id for syntax highlighting. */
export const monacoLang = (lang?: string | null): string => {
  if (!lang) return 'plaintext';
  if (lang.startsWith('python')) return 'python';
  if (lang.startsWith('java')) return 'java';
  if (lang.startsWith('c/c++')) return 'cpp';
  if (lang.startsWith('node')) return 'javascript';
  if (lang.startsWith('r-')) return 'r';
  if (lang === 'ruby') return 'ruby';
  if (lang === 'php') return 'php';
  return 'plaintext';
};

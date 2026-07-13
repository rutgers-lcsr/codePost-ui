// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Question, QuestionChoice, QuestionTypeEnum } from '../../../api-client';

export type LocalChoice = { text: string; isCorrect: boolean };

// Types whose correctness is a single pick (radio) vs. several (checkbox).
const SINGLE_CORRECT: QuestionTypeEnum[] = [QuestionTypeEnum.MultipleChoice, QuestionTypeEnum.TrueFalse];
const MULTI_CORRECT: QuestionTypeEnum[] = [QuestionTypeEnum.MultipleAnswers];
// Types whose "choices" are accepted free-text answers (all correct).
const ACCEPTED_ANSWERS: QuestionTypeEnum[] = [QuestionTypeEnum.ShortAnswer, QuestionTypeEnum.Numerical];

export const isSingleCorrect = (t?: QuestionTypeEnum) => !!t && SINGLE_CORRECT.includes(t);
export const isAcceptedAnswers = (t?: QuestionTypeEnum) => !!t && ACCEPTED_ANSWERS.includes(t);
export const isCode = (t?: QuestionTypeEnum) => t === QuestionTypeEnum.Code;

/** Essay/code responses are graded by staff, not auto-graded — the UI mirror of the
 *  backend's quiz_grading.MANUAL_TYPES. */
export const isManuallyGraded = (t?: string) =>
  t === QuestionTypeEnum.Essay || t === QuestionTypeEnum.Code;

/** Whether a type uses the choices/accepted-answers editor at all (essay & code don't). */
export const hasChoiceEditor = (t?: QuestionTypeEnum) =>
  !!t && (SINGLE_CORRECT.includes(t) || MULTI_CORRECT.includes(t) || ACCEPTED_ANSWERS.includes(t));

export const defaultChoicesFor = (t: QuestionTypeEnum): LocalChoice[] => {
  if (t === QuestionTypeEnum.TrueFalse) {
    return [
      { text: 'True', isCorrect: true },
      { text: 'False', isCorrect: false },
    ];
  }
  if (ACCEPTED_ANSWERS.includes(t)) return [{ text: '', isCorrect: true }];
  if (hasChoiceEditor(t)) {
    return [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ];
  }
  return [];
};

export const toLocalChoices = (choices?: QuestionChoice[] | null): LocalChoice[] =>
  (choices ?? []).map((c) => ({ text: c.text, isCorrect: !!c.isCorrect }));

/** Drop blank rows and assign sort order for the API payload. */
export const choicesPayload = (choices: LocalChoice[]): QuestionChoice[] =>
  choices
    .filter((c) => c.text.trim() !== '')
    .map((c, i) => ({ text: c.text, isCorrect: c.isCorrect, sortKey: i }));

/** Returns an error string if the choices are invalid for the type, else null. */
export const validateChoices = (t: QuestionTypeEnum, choices: LocalChoice[]): string | null => {
  if (!hasChoiceEditor(t)) return null;
  const filled = choices.filter((c) => c.text.trim() !== '');
  const accepted = ACCEPTED_ANSWERS.includes(t);
  if (filled.length < (accepted ? 1 : 2)) {
    return accepted ? 'Add at least one accepted answer.' : 'Add at least two choices.';
  }
  if (!accepted && !filled.some((c) => c.isCorrect)) {
    return 'Mark at least one choice as correct.';
  }
  return null;
};

/** Convenience: omit-typed create/update payload shape for a Question. */
export type QuestionPayload = Omit<Question, 'id' | 'source' | 'createdBy' | 'metadata'>;

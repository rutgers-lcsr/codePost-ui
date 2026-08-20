// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { QuestionTypeEnum, StudentQuizResponse } from '../../../../api-client';
import { isAnswered, initialAnswer } from '../QuestionAnswerer';

const STARTER = 'def add(a, b):\n    # your code here\n    pass\n';

/** A minimal response of a given type — only the fields isAnswered/initialAnswer read. */
const response = (
  questionType: QuestionTypeEnum,
  extra: { starterCode?: string; answerText?: string; selectedChoices?: number[] } = {},
) =>
  ({
    id: 1,
    answerText: extra.answerText ?? '',
    selectedChoices: extra.selectedChoices ?? [],
    question: { questionType, starterCode: extra.starterCode ?? null },
  }) as unknown as StudentQuizResponse;

describe('isAnswered', () => {
  it('does not count a code question still holding its unedited starter code', () => {
    const r = response(QuestionTypeEnum.Code, { starterCode: STARTER, answerText: STARTER });
    expect(isAnswered(r, initialAnswer(r))).toBe(false);
  });

  it('ignores surrounding whitespace when comparing against the starter code', () => {
    const r = response(QuestionTypeEnum.Code, { starterCode: STARTER });
    expect(isAnswered(r, { answerText: `\n${STARTER}  `, selectedChoices: [] })).toBe(false);
  });

  it('counts a code question once the student edits the starter code', () => {
    const r = response(QuestionTypeEnum.Code, { starterCode: STARTER });
    expect(isAnswered(r, { answerText: 'def add(a, b):\n    return a + b\n', selectedChoices: [] })).toBe(true);
  });

  it('counts a code question with no starter code as soon as anything is typed', () => {
    const r = response(QuestionTypeEnum.Code);
    expect(isAnswered(r, { answerText: 'x = 1', selectedChoices: [] })).toBe(true);
    expect(isAnswered(r, { answerText: '   ', selectedChoices: [] })).toBe(false);
  });

  it('counts a fresh essay as unanswered and a written one as answered', () => {
    const r = response(QuestionTypeEnum.Essay);
    expect(isAnswered(r, initialAnswer(r))).toBe(false);
    expect(isAnswered(r, { answerText: 'A stack is LIFO.', selectedChoices: [] })).toBe(true);
  });

  it('counts any selected choice as an answer', () => {
    const r = response(QuestionTypeEnum.MultipleChoice);
    expect(isAnswered(r, initialAnswer(r))).toBe(false);
    expect(isAnswered(r, { answerText: '', selectedChoices: [7] })).toBe(true);
  });
});

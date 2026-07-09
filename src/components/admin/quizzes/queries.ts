// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useQuery } from '@tanstack/react-query';
import {
  assignmentsApi, coursesApi, generatedQuestionSetsApi, questionsApi, questionBanksApi, quizzesApi,
} from '../../../api-client/clients';
import { quizKeys } from '../../../lib/queryKeys';
import { getCourseAISettings } from '../../../utils/aiService';
import {
  GeneratedQuestionSet, GeneratedQuestionSetList, PromptVariable,
  QuestionBank, Question, Quiz, QuizQuestion, SuggestedQuizQuestion,
} from '../../../api-client';

/** A course's question banks. List endpoints are blocked, so we fetch via the
 *  course parent action (`courses/{id}/questionBanks/`). */
export const useQuestionBanks = (courseId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.banks(courseId ?? -1),
    queryFn: (): Promise<QuestionBank[]> => coursesApi.questionBanksList({ id: courseId! }),
    enabled: !!courseId,
  });

/** The questions in a single bank (`questionBanks/{id}/questions/`). */
export const useBankQuestions = (bankId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.bankQuestions(bankId ?? -1),
    queryFn: (): Promise<Question[]> => questionBanksApi.questionsList({ id: bankId! }),
    enabled: !!bankId,
  });

/** All of a course's questions (`courses/{id}/questions/`) — used to populate the
 *  quiz-builder picker and to join membership rows to their question content. */
export const useCourseQuestions = (courseId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.courseQuestions(courseId ?? -1),
    queryFn: (): Promise<Question[]> => coursesApi.questionsList({ id: courseId! }),
    enabled: !!courseId,
  });

/** A course's quizzes (`courses/{id}/quizzes/`). */
export const useCourseQuizzes = (courseId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.list(courseId ?? -1),
    queryFn: (): Promise<Quiz[]> => coursesApi.quizzesList({ id: courseId! }),
    enabled: !!courseId,
  });

/** A quiz's ordered question memberships (`quizzes/{id}/questions/`). */
export const useQuizMembership = (quizId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.membership(quizId ?? -1),
    queryFn: (): Promise<QuizQuestion[]> => quizzesApi.questionsList({ id: quizId! }),
    enabled: !!quizId,
  });

/** A single quiz with its nested settings, ``quizQuestions`` and ``questionGroups``.
 *  Used as the live source of truth in the builder so edits reflect after invalidation. */
export const useQuizDetail = (quizId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.detail(quizId ?? -1),
    queryFn: (): Promise<Quiz> => quizzesApi.retrieve({ id: quizId! }),
    enabled: !!quizId,
  });

/** Pending AI quiz-question suggestions for an assignment
 *  (`assignments/{id}/suggestedQuizQuestions/`). */
export const useAssignmentSuggestions = (assignmentId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.suggestions(assignmentId ?? -1),
    queryFn: (): Promise<SuggestedQuizQuestion[]> =>
      assignmentsApi.suggestedQuizQuestionsList({ id: assignmentId! }),
    enabled: !!assignmentId,
  });

/** Pending AI refresh suggestions seeded from an existing question
 *  (`questions/{id}/regenerationSuggestions/`). */
export const useRegenerationSuggestions = (questionId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.regeneration(questionId ?? -1),
    queryFn: (): Promise<SuggestedQuizQuestion[]> =>
      questionsApi.regenerationSuggestionsList({ id: questionId! }),
    enabled: !!questionId,
  });

/** The {variables} usable in a quiz's AI-generated section prompts
 *  (`quizzes/{id}/promptVariables/`) — feeds the prompt editor's autocomplete. */
export const usePromptVariables = (quizId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.promptVariables(quizId ?? -1),
    queryFn: (): Promise<PromptVariable[]> => quizzesApi.promptVariablesList({ id: quizId! }),
    enabled: !!quizId,
  });

/** Per-student generated question sets on a quiz (`quizzes/{id}/generatedSets/`).
 *  Polls while any set is still pending/generating (the review screen is long-lived). */
export const useGeneratedSets = (quizId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.generatedSets(quizId ?? -1),
    queryFn: (): Promise<GeneratedQuestionSetList[]> =>
      quizzesApi.generatedSetsList({ id: quizId! }),
    enabled: !!quizId,
    refetchInterval: (query) =>
      (query.state.data ?? []).some((s) => s.status === 'pending' || s.status === 'generating')
        ? 4000
        : false,
  });

/** One generated set with its editable questions (`generatedQuestionSets/{id}/`). */
export const useGeneratedSetDetail = (setId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.generatedSetDetail(setId ?? -1),
    queryFn: (): Promise<GeneratedQuestionSet> =>
      generatedQuestionSetsApi.retrieve({ id: setId! }),
    enabled: !!setId,
  });

/** Whether the AI-Generated Quiz Questions feature is enabled for this course (AI
 *  configured + the personalized_quiz_generation feature resolved on) — gates the
 *  authoring surface in the builder. Resolution mirrors AISettingsCard. */
export const useAIQuizGenerationEnabled = (courseId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.aiGenerationEnabled(courseId ?? -1),
    queryFn: async (): Promise<boolean> => {
      const settings = await getCourseAISettings(courseId!);
      const featureStatus = (settings as unknown as { aiFeatures?: Record<string, boolean> }).aiFeatures;
      return Boolean(settings.aiEnabled) && featureStatus?.personalized_quiz_generation === true;
    },
    enabled: !!courseId,
  });

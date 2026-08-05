// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useQuery } from '@tanstack/react-query';
import {
  assignmentsApi, coursesApi, generatedQuestionSetsApi, questionsApi, questionBanksApi, quizzesApi,
  sectionsApi,
} from '../../../api-client/clients';
import { quizKeys } from '../../../lib/queryKeys';
import {
  BackfillPreviewResponse, GeneratedQuestionSet, GeneratedQuestionSetList, PromptVariable,
  QuestionBank, Question, Quiz, QuizQuestion, QuizResultRow, QuizSectionTemplate, Section,
  StaffQuizAttempt, SuggestedQuizQuestion,
} from '../../../api-client';

/** The course's sections, for staff viewers — feeds the section filters in quiz grading
 *  and generated-question review. Admins page through the bulk endpoint; graders can't
 *  call it, so they fall back to per-id fetches of the course's section ids (only the
 *  sections they may read resolve — typically the ones they lead), mirroring the grader
 *  console's section loading. */
export const useStaffSections = (courseId: number | undefined, enabled: boolean) =>
  useQuery({
    queryKey: quizKeys.staffSections(courseId ?? -1),
    queryFn: async (): Promise<Section[]> => {
      try {
        const pageSize = 200;
        let page = 1;
        let all: Section[] = [];
        for (;;) {
          const response = await coursesApi.sectionsList({ id: courseId!, page, pageSize });
          all = all.concat(response.results ?? []);
          if (!response.next) return all;
          page += 1;
        }
      } catch {
        const course = await coursesApi.retrieve({ id: courseId! });
        const ids = Array.isArray(course.sections) ? course.sections : [];
        const settled = await Promise.allSettled(ids.map((id) => sectionsApi.retrieve({ id })));
        return settled
          .filter((r): r is PromiseFulfilledResult<Section> => r.status === 'fulfilled')
          .map((r) => r.value);
      }
    },
    enabled: !!courseId && enabled,
    staleTime: 5 * 60_000,
  });

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

/** Starter templates for a quiz's AI-generated section prompts
 *  (`quizzes/{id}/promptTemplates/`) — feeds the "start from a template" picker. */
export const usePromptTemplates = (quizId: number | undefined) =>
  useQuery({
    queryKey: quizKeys.promptTemplates(quizId ?? -1),
    queryFn: (): Promise<QuizSectionTemplate[]> => quizzesApi.promptTemplatesList({ id: quizId! }),
    enabled: !!quizId,
  });

/** A quiz's submitted attempts for grading (`quizzes/{id}/attempts/`), optionally only
 *  those awaiting manual grading. Quiz graders / admins only — a 403 (plain staff
 *  peeking, e.g. the builder's count badge) is surfaced as an error, never retried. */
export const useQuizAttempts = (
  quizId: number | undefined,
  { needsGrading = false, enabled = true }: { needsGrading?: boolean; enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: quizKeys.attempts(quizId ?? -1, needsGrading),
    queryFn: (): Promise<StaffQuizAttempt[]> =>
      quizzesApi.attemptsList({ id: quizId!, needsGrading: needsGrading || undefined }),
    enabled: enabled && !!quizId,
    retry: false,
  });

/** Per-student official results (`quizzes/{id}/results/`). */
export const useQuizResults = (quizId: number | undefined, enabled = true) =>
  useQuery({
    queryKey: quizKeys.results(quizId ?? -1),
    queryFn: (): Promise<QuizResultRow[]> => quizzesApi.resultsList({ id: quizId! }),
    enabled: enabled && !!quizId,
    retry: false,
  });

/** How many students a generation backfill would touch (`quizzes/{id}/backfillPreview/`). */
export const useBackfillPreview = (quizId: number | undefined, enabled = true) =>
  useQuery({
    queryKey: quizKeys.backfillPreview(quizId ?? -1),
    queryFn: (): Promise<BackfillPreviewResponse> =>
      quizzesApi.backfillPreviewRetrieve({ id: quizId! }),
    enabled: enabled && !!quizId,
    retry: false,
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

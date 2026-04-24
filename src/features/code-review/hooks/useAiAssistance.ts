// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import { useCallback, useEffect, useState } from 'react';
import { submissionsApi, suggestedCommentsApi } from '../../../api-client/clients';
import type { RubricComment } from '../../../api-client';
import type { CommentType, SuggestedCommentType, SubmissionSummaryType } from '../../../types/models';
import type { IRubricCategoryToRubricCommentsMap } from '../../../types/common';
import type { FileWithId } from '../../../utils/file';
import { addCommentToState, addToCommentRubricCommentsState } from '../codeConsoleUtils';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import type { PromptType } from '../../../services/promptLab';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AbModalState {
  open: boolean;
  promptType: PromptType;
  experimentId: number;
  variantAId: number;
  variantBId: number;
  resultA: string;
  resultB: string;
  isCustomContext: boolean;
}

export interface PromptMeta {
  promptVariantId?: number;
  experimentId?: number;
  isCustomContext?: boolean;
}

interface UseAiAssistanceOptions {
  /** Submission ID (undefined while loading) */
  submissionId: number | undefined;
  /** Whether the current user has the `generate_ai_comments` capability */
  canGenerate: boolean;
  /** Whether AI is enabled for this course */
  aiEnabled: boolean;
  /** Per-feature enabled flags from the course settings */
  aiFeatureStatus: Record<string, boolean>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAiAssistance({
  submissionId,
  canGenerate,
  aiEnabled,
  aiFeatureStatus,
}: UseAiAssistanceOptions) {
  // --- Suggested comments ---
  const [suggestedComments, setSuggestedComments] = useState<SuggestedCommentType[]>([]);
  const [isGeneratingFileSuggestions, setIsGeneratingFileSuggestions] = useState(false);
  const [suggestionsMeta, setSuggestionsMeta] = useState<PromptMeta>({});

  // --- Submission summary ---
  const [submissionSummary, setSubmissionSummary] = useState<SubmissionSummaryType | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryMeta, setSummaryMeta] = useState<PromptMeta>({});

  // --- A/B experiment modal ---
  const [abModal, setAbModal] = useState<AbModalState | null>(null);

  // ── Auto-fetch suggestions + summary on mount ─────────────────────────
  useEffect(() => {
    if (!canGenerate || !submissionId || !aiEnabled) return;
    let cancelled = false;

    if (aiFeatureStatus.suggested_comments !== false) {
      submissionsApi
        .suggestedCommentsList({ id: submissionId })
        .then((data) => {
          if (cancelled) return;
          const suggestions = data as unknown as SuggestedCommentType[];
          setSuggestedComments(suggestions);
          const meta = suggestions[0]?.generationMetadata as Record<string, unknown> | undefined;
          if (meta?.variant_id) {
            setSuggestionsMeta((prev) => ({ ...prev, promptVariantId: meta.variant_id as number }));
          }
        })
        .catch(() => { /* best-effort */ });
    }

    if (aiFeatureStatus.submission_summary !== false) {
      submissionsApi
        .summaryRetrieve({ id: submissionId })
        .then((data) => {
          if (cancelled) return;
          setSubmissionSummary(data as unknown as SubmissionSummaryType);
          const meta = (data as unknown as Record<string, unknown>)?.generationMetadata as
            | Record<string, unknown>
            | undefined;
          if (meta?.variant_id) {
            setSummaryMeta((prev) => ({ ...prev, promptVariantId: meta.variant_id as number }));
          }
        })
        .catch(() => { /* summary may not exist yet */ });
    }

    return () => { cancelled = true; };
  }, [canGenerate, submissionId, aiEnabled, aiFeatureStatus]);

  // ── Accept a suggestion → real comment ────────────────────────────────
  const handleAcceptSuggestion = useCallback(async (suggestion: SuggestedCommentType) => {
    const newComment = (await suggestedCommentsApi.acceptCreate({ id: suggestion.id })) as unknown as CommentType;
    setSuggestedComments((prev) => prev.filter((s) => s.id !== suggestion.id));

    // Optimistically add the returned comment to the store
    const store = useCodeConsoleStore.getState();
    const nextComments = addCommentToState(store.comments, newComment, { id: suggestion.file } as FileWithId);
    const nextRubricComments = suggestion.rubricComment
      ? addToCommentRubricCommentsState(
          store.commentRubricComments,
          newComment.id,
          Object.values(store.rubricComments as IRubricCategoryToRubricCommentsMap)
            .flat()
            .find((rc: RubricComment) => rc.id === suggestion.rubricComment),
        )
      : store.commentRubricComments;

    store.setState({ comments: nextComments, commentRubricComments: nextRubricComments });
  }, []);

  // ── Reject a suggestion ───────────────────────────────────────────────
  const handleRejectSuggestion = useCallback(async (suggestion: SuggestedCommentType) => {
    await suggestedCommentsApi.rejectCreate({ id: suggestion.id });
    setSuggestedComments((prev) => prev.filter((s) => s.id !== suggestion.id));
  }, []);

  // ── Generate suggestions for a single file ────────────────────────────
  const handleGenerateFileSuggestions = useCallback(async (fileId: number) => {
    const submission = useCodeConsoleStore.getState().submission;
    if (!submission) return;
    setIsGeneratingFileSuggestions(true);
    try {
      const rawResponse = await submissionsApi.generateFileSuggestionsCreateRaw({
        id: submission.id,
        generateFileSuggestionsRequest: { fileId },
      });
      const data = await rawResponse.raw.json();

      // A/B test response
      if (data && typeof data === 'object' && data.isAbTest) {
        const ab = data as {
          isAbTest: true;
          experimentId: number;
          variantAId: number;
          variantBId: number;
          isCustomContext: boolean;
          resultA: string[];
          resultB: string[];
        };
        setAbModal({
          open: true,
          promptType: 'suggested_comments',
          experimentId: ab.experimentId,
          variantAId: ab.variantAId,
          variantBId: ab.variantBId,
          resultA: ab.resultA.join('\n\n---\n\n'),
          resultB: ab.resultB.join('\n\n---\n\n'),
          isCustomContext: ab.isCustomContext,
        });
        setSuggestionsMeta({ experimentId: ab.experimentId, isCustomContext: ab.isCustomContext });
        return;
      }

      // Normal response
      const hasWrapper = data && typeof data === 'object' && 'suggestions' in data;
      const newSuggestions = (hasWrapper ? data.suggestions : data) as unknown as SuggestedCommentType[];
      setSuggestedComments((prev) => {
        const withoutFile = prev.filter((s) => s.file !== fileId);
        return [...withoutFile, ...newSuggestions];
      });
      if (hasWrapper) {
        setSuggestionsMeta({
          promptVariantId: data.promptVariantId ?? undefined,
          isCustomContext: data.isCustomContext ?? undefined,
        });
      }
    } catch (err: unknown) {
      let detail = 'Failed to generate AI suggestions for this file.';
      if (err instanceof Response) {
        try {
          const body = await err.json();
          if (body?.error) detail = body.error;
        } catch { /* ignore parse failure */ }
      } else if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body?: { error?: string } }).body;
        if (body?.error) detail = body.error;
      }
      throw new Error(detail);
    } finally {
      setIsGeneratingFileSuggestions(false);
    }
  }, []);

  // ── Generate submission summary ───────────────────────────────────────
  const handleGenerateSummary = useCallback(async () => {
    const submission = useCodeConsoleStore.getState().submission;
    if (!submission) return;
    setIsGeneratingSummary(true);
    try {
      const rawResponse = await submissionsApi.generateSummaryCreateRaw({ id: submission.id });
      const data = await rawResponse.raw.json();

      // A/B test response
      if (data && typeof data === 'object' && data.isAbTest) {
        const ab = data as {
          isAbTest: true;
          experimentId: number;
          variantAId: number;
          variantBId: number;
          isCustomContext: boolean;
          resultA: { text: string; success: boolean; error?: string };
          resultB: { text: string; success: boolean; error?: string };
        };
        setAbModal({
          open: true,
          promptType: 'submission_summary',
          experimentId: ab.experimentId,
          variantAId: ab.variantAId,
          variantBId: ab.variantBId,
          resultA: ab.resultA.text ?? '',
          resultB: ab.resultB.text ?? '',
          isCustomContext: ab.isCustomContext,
        });
        setSummaryMeta({ experimentId: ab.experimentId, isCustomContext: ab.isCustomContext });
        return;
      }

      // Normal response
      setSubmissionSummary(data as unknown as SubmissionSummaryType);
      if (data && typeof data === 'object') {
        setSummaryMeta({
          promptVariantId: data.promptVariantId ?? undefined,
          isCustomContext: data.isCustomContext ?? undefined,
        });
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  }, []);

  // ── Close the A/B modal ───────────────────────────────────────────────
  const closeAbModal = useCallback(() => setAbModal(null), []);

  return {
    // State
    suggestedComments,
    submissionSummary,
    isGeneratingFileSuggestions,
    isGeneratingSummary,
    abModal,
    suggestionsMeta,
    summaryMeta,

    // Actions
    handleAcceptSuggestion,
    handleRejectSuggestion,
    handleGenerateFileSuggestions,
    handleGenerateSummary,
    closeAbModal,
  };
}

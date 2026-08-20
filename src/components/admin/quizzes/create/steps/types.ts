// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { QuizCreateDraft } from '../quizDraft';

/** Every wizard step edits the shared draft directly — no per-step form state, so values
 *  survive the step unmounting on navigation. */
export interface StepProps {
  draft: QuizCreateDraft;
  patch: (p: Partial<QuizCreateDraft>) => void;
  courseId: number;
}

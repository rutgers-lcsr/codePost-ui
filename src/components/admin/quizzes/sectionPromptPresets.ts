// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Starter prompt templates for AI-generated quiz sections. General-purpose (not tied to any
// one subject) — each targets a different way of checking a student actually understands the
// code they submitted, rather than having it written for them. All reference {submission_files}
// so questions are generated per student from what they turned in; every {variable} they use
// must be registered in core/prompts/variables.py (validated server-side on save).
//
// `<<SAMPLE_ROWS>>` is a client-side-only placeholder (deliberately not `{variable}` syntax —
// it's never sent to the server unresolved) substituted with the instructor's chosen sample
// size before the prompt is applied to the form.

export const SAMPLE_ROWS_TOKEN = '<<SAMPLE_ROWS>>';

export interface SectionPromptPreset {
  key: string;
  label: string;
  /** Shown under the option to help the instructor pick. */
  description: string;
  /** Whether this preset only makes sense on a quiz attached to an assignment
   *  (it references the student's submission). */
  attachedOnly: boolean;
  prompt: string;
  questionTypes?: string[];
}

export const SECTION_PROMPT_PRESETS: SectionPromptPreset[] = [
  {
    key: 'retasking',
    label: 'Retasking — rewrite your own code',
    description:
      "Quotes a piece of the student's own code and asks them to adapt it to different inputs or parameters — proves they understand it well enough to reuse it, not just that it runs.",
    attachedOnly: true,
    questionTypes: ['code'],
    prompt: `Ask questions that "retask" this student's own submitted code: quote an exact expression, function, or short block from their submission (as a fenced code block in the question's description), then ask them to rewrite it applied to different variables, parameters, or inputs — using the same underlying approach they used.

Each question must:
- Quote the student's actual code, not a generic example.
- Ask for a rewritten version applied to something different (a different column, group, parameter, or input) — not a verbatim repeat.
- Be answerable only by someone who understands what their original code does, not by someone who can just copy-paste it.

Their submission:
{submission_files}`,
  },
  {
    key: 'manual-evaluation',
    label: 'Manual evaluation — hand-compute a small example',
    description:
      "Gives the student a tiny sample of data and asks them to hand-compute, step by step, what their own code would return on it — confirms they understand the logic, not just that the code runs.",
    attachedOnly: true,
    questionTypes: ['numerical', 'short_answer'],
    prompt: `Ask questions that test whether this student can hand-compute the result of their own code on a small example, without running it.

For each question:
- Quote a specific expression, function, or line from their submission (in the description).
- Make up a tiny example — about ${SAMPLE_ROWS_TOKEN} rows/values — small enough to compute by hand, and show it in the description as a table or short list.
- Ask what their code would return on that exact example.
- Use question type numerical or short_answer, with the correct computed result as the accepted answer.

Their submission:
{submission_files}`,
  },
  {
    key: 'understanding-check',
    label: 'Understanding check — retasking + manual evaluation',
    description:
      'The combined approach: some questions ask the student to retask their own code to new inputs, others ask them to hand-compute a small example — a well-rounded post-submission comprehension check.',
    attachedOnly: true,
    questionTypes: ['code', 'numerical', 'short_answer', 'essay'],
    prompt: `Ask questions that check whether this student truly understands the code they submitted (as opposed to having it written for them). Use a mix of two styles:

1. Retasking: quote an exact expression or block from their submission (as a fenced code block in the description) and ask them to rewrite it applied to different variables, parameters, or inputs, using the same approach.
2. Manual evaluation: quote a specific expression from their submission, make up a tiny example (about ${SAMPLE_ROWS_TOKEN} rows/values, shown in the description as a table or short list), and ask what their code would return on it, computed by hand.

Their submission:
{submission_files}`,
  },
  {
    key: 'explain-your-code',
    label: 'Explain your code',
    description:
      "Quotes a block of the student's own code and asks them to explain, in their own words, what it does and why — no rewriting required, purely conceptual. Catches code a student can't describe.",
    attachedOnly: true,
    questionTypes: ['essay'],
    prompt: `Ask essay questions that quote a specific block of this student's submitted code (as a fenced code block in the description) and ask them to explain, in their own words, what it does and why they wrote it that way. No rewriting or computation required — this checks conceptual understanding, not code-writing ability.

Their submission:
{submission_files}`,
  },
];

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { WizardStepKey } from './quizDraft';

const ul: React.CSSProperties = { margin: 0, paddingLeft: 18 };

/** "About this step" content shown in the wizard's help panel — what each group of
 *  settings affects beyond the field labels, including cross-step implications. */
export const STEP_HELP: Record<WizardStepKey, React.ReactNode> = {
  basics: (
    <ul style={ul}>
      <li>The title is how students find the quiz; the description appears at the top of the quiz page while they take it — use it for instructions, context, or an honor pledge. It supports Markdown and images.</li>
      <li>Only the title is required. Every later step has sensible defaults, so you can Skip &amp; create at any point and adjust in the builder&apos;s Quiz Settings.</li>
    </ul>
  ),
  availability: (
    <ul style={ul}>
      <li>A standalone quiz opens and closes on fixed dates (or stays available whenever it&apos;s published, if you leave both empty).</li>
      <li>Attaching an assignment ties the quiz to that assignment&apos;s lifecycle instead — it can open during the assignment, after the deadline, after each student submits, or after feedback — e.g. a comprehension check right after each submission.</li>
      <li>Attaching also unlocks per-student AI-generated questions: in the builder&apos;s Questions tab you can add an AI section whose prompt pulls in the assignment and each student&apos;s own submission, generating personalized questions about their actual code.</li>
      <li>&quot;End in-progress attempts at the close time&quot; auto-submits open attempts at close; without it, the close only blocks new attempts.</li>
    </ul>
  ),
  attempts: (
    <ul style={ul}>
      <li>The time limit counts down per attempt from the moment a student starts.</li>
      <li>Allowing several (or unlimited) attempts turns the quiz into practice — &quot;Score to keep&quot; decides which attempt counts toward their grade.</li>
      <li>A passing score marks each graded attempt passed/failed against the threshold — useful for mastery checks (e.g. &quot;retake until you pass&quot;).</li>
    </ul>
  ),
  results: (
    <ul style={ul}>
      <li>Releasing results &quot;after the quiz closes&quot; hides scores, points, and the answer key until the close — with multiple attempts or a whole-class window, releasing immediately would let early finishers share the key. This requires a close to be configured in Availability.</li>
      <li>&quot;Reopen submitted attempts&quot; controls whether students can revisit their work at all; the remaining options control how much they see there (scores only, their answers, the correct answers).</li>
    </ul>
  ),
  security: (
    <ul style={ul}>
      <li>Safe Exam Browser locks the student&apos;s machine to the quiz — no other apps or tabs. Students click &quot;Launch in Safe Exam Browser&quot;; nothing to configure on their end. Per-student exemptions (e.g. Linux/ChromeOS users) are set on the roster.</li>
      <li>The Config Key is only needed if you distribute your own custom .seb file instead of the built-in launch.</li>
      <li>Shuffling questions and one-at-a-time delivery deter over-the-shoulder copying and answer sharing during in-person quizzes.</li>
    </ul>
  ),
  ai: (
    <ul style={ul}>
      <li>These options take effect once you add an AI-generated section in the builder&apos;s Questions tab. Each student gets their own generated question set — with an attached assignment, prompts can reference their actual submission.</li>
      <li>By default you review generated questions before students see them; auto-publish skips that review. The grader toggles delegate reviewing (and optionally generating) to course graders.</li>
      <li>Manual generation means sets are only created when staff trigger them (or at the optional scheduled time); turning it off generates automatically as students become eligible.</li>
    </ul>
  ),
  review: (
    <ul style={ul}>
      <li>Warnings here flag likely mistakes (e.g. an answer key students could carry into a retake) — the quiz can still be created unless a setting is invalid.</li>
      <li>A draft is invisible to students until you publish it (Settings, or the toggle in the builder). Publishing now makes it live the moment it&apos;s within its availability window.</li>
      <li>Next step after creating: add questions from your question banks in the builder.</li>
    </ul>
  ),
};

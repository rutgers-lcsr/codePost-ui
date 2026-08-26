// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Screenshot manifest for the in-app documentation (/docs). Each entry describes how to
// reproduce one image referenced from src/docs/content/*.md, against the seeded demo
// course (see e2e/global.setup.ts). Images are written to public/assets/docs/ — the
// path the docs markdown serves them from.
//
// To add a documentation image: add an entry here, run `npm run docs:screenshots`, and
// reference `/assets/docs/<file>` from the markdown. Keep files stable — docs pages
// link them by name.
import type { APIRequestContext, Page } from '@playwright/test';
import { COURSE_NAME, COURSE_PERIOD } from '../constants';

const course = `${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}`;

export interface DocShot {
  /** Output file name under public/assets/docs/ */
  file: string;
  /** Which saved auth state to browse with (see e2e/.auth/) */
  auth: 'none' | 'student' | 'instructor';
  /** App route to open, or a resolver when the route needs seeded object ids. */
  path: string | ((api: APIRequestContext) => Promise<string>);
  /** Wait for this locator before shooting (beyond network-idle). */
  readySelector?: string;
  /** Extra interactions before the shot (open a popover, switch a tab, ...). */
  prepare?: (page: Page) => Promise<void>;
  /** Clip to this locator instead of the viewport. */
  clipSelector?: string;
  /** Full scrollable page instead of the viewport. */
  fullPage?: boolean;
}

/** Resolve a submission id on the seeded released assignment ("9. Released+Frozen"). */
async function releasedSubmissionPath(api: APIRequestContext): Promise<string> {
  const courses = await (await api.get('/users/me/')).json();
  const courseObj = [...(courses.courseadminCourses ?? []), ...(courses.studentCourses ?? [])].find(
    (c: { name: string; period: string }) => c.name === COURSE_NAME && c.period === COURSE_PERIOD,
  );
  if (!courseObj) throw new Error(`Seeded course "${COURSE_NAME}" not found — run the setup project first.`);
  for (const assignmentId of courseObj.assignments as number[]) {
    const assignment = await (await api.get(`/assignments/${assignmentId}/`)).json();
    if (assignment.name?.startsWith('9.')) {
      const subs = await (await api.get(`/assignments/${assignmentId}/submissions/`)).json();
      const finalized = (Array.isArray(subs) ? subs : (subs.results ?? [])).find(
        (s: { isFinalized: boolean }) => s.isFinalized,
      );
      if (finalized) return `/code/${finalized.id}`;
    }
  }
  throw new Error('No finalized submission on the released demo assignment — reseed with create_demo_course.');
}

export const DOC_SHOTS: DocShot[] = [
  // ── Pre-auth ────────────────────────────────────────────────────────────────
  {
    file: 'login_page.png',
    auth: 'none',
    path: '/login',
    readySelector: 'input',
  },
  {
    file: 'signup_page.png',
    auth: 'none',
    path: '/signup',
    readySelector: 'button',
  },

  // ── Student ────────────────────────────────────────────────────────────────
  {
    file: 'student_dashboard.png',
    auth: 'student',
    path: '/student',
    readySelector: 'text=Demo Course',
    prepare: async (page) => {
      // Course cards stream in their assignment counts; don't shoot mid-load.
      await page
        .waitForFunction(() => !document.body.innerText.includes('Loading'), undefined, { timeout: 30_000 })
        .catch(() => {});
    },
  },
  {
    file: 'student_assignment_list.png',
    auth: 'student',
    path: `/student/${course}`,
    readySelector: 'text=Released',
  },
  {
    file: 'student_feedback_view.png',
    auth: 'student',
    path: releasedSubmissionPath,
    readySelector: '[class*="console"], [data-testid="rubric-panel"], .ant-layout',
  },

  // ── Instructor ─────────────────────────────────────────────────────────────
  {
    file: 'instructor_dashboard.png',
    auth: 'instructor',
    path: `/admin/${course}/assignments`,
    readySelector: 'text=Feedback',
  },
  {
    file: 'instructor_status_picker.png',
    auth: 'instructor',
    path: `/admin/${course}/assignments`,
    readySelector: 'text=Feedback',
    prepare: async (page) => {
      await page.getByRole('button', { name: /Assignment status:/ }).first().click();
      await page.getByText('Hidden from students while you set it up.').waitFor();
    },
    clipSelector: '.ant-popover:visible',
  },
  {
    file: 'instructor_feedback_picker.png',
    auth: 'instructor',
    path: `/admin/${course}/assignments`,
    readySelector: 'text=Feedback',
    prepare: async (page) => {
      await page.getByRole('button', { name: /^Feedback:/ }).first().click();
      await page.getByText('Grading in progress').first().waitFor();
    },
    clipSelector: '.ant-popover:visible',
  },
  {
    file: 'instructor_grading_interface.png',
    auth: 'instructor',
    path: releasedSubmissionPath,
    readySelector: 'text=Files',
  },
  {
    file: 'instructor_grading_rubric_panel.png',
    auth: 'instructor',
    path: releasedSubmissionPath,
    readySelector: 'text=Files',
    prepare: async (page) => {
      // The rubric lives in a sidebar tab; Ctrl+Shift+G toggles it (documented hotkey).
      await page.keyboard.press('Control+Shift+KeyG');
      await page.locator('[data-testid="rubric-panel"]').waitFor({ timeout: 10_000 });
    },
    clipSelector: '[data-testid="rubric-panel"]',
  },
  {
    file: 'instructor_quiz_seb_settings.png',
    auth: 'instructor',
    path: `/admin/${course}/quizzes`,
    readySelector: 'text=Question Banks',
    prepare: async (page) => {
      // The builder is selection-state, not a route: open the Quizzes tab, pick the
      // seeded SEB quiz, and scroll its Exam security section into view.
      await page.getByRole('tab', { name: 'Quizzes', exact: true }).click();
      await page.getByText('QT · Safe Exam Browser required').first().click();
      const section = page.locator('[data-testid="quiz-exam-security"]');
      await section.waitFor({ timeout: 10_000 });
      await section.scrollIntoViewIfNeeded();
    },
    clipSelector: '[data-testid="quiz-exam-security"]',
  },
  {
    file: 'student_quiz_seb_gate.png',
    auth: 'student',
    path: `/student/${course}/quizzes`,
    readySelector: '[data-testid="student-quiz-card"]',
    prepare: async (page) => {
      // Starting the seeded SEB quiz outside SEB 403s into the gate screen.
      await page
        .getByTestId('student-quiz-card')
        .filter({ hasText: 'Safe Exam Browser required' })
        .getByTestId('student-quiz-action')
        .click();
      await page.getByTestId('quiz-seb-launch').waitFor({ timeout: 10_000 });
    },
    clipSelector: '.ant-result',
  },
  {
    file: 'instructor_section_leaders.png',
    auth: 'instructor',
    path: `/admin/${course}/roster/sections/assign`,
    readySelector: 'text=Assign Graders to Sections',
  },
  {
    file: 'instructor_quiz_grading_progress.png',
    auth: 'instructor',
    path: `/admin/${course}/quizzes/grading-progress`,
    readySelector: 'text=Quiz Grading Progress',
  },
  {
    file: 'instructor_quiz_focused_grader.png',
    auth: 'instructor',
    path: `/admin/${course}/quizzes`,
    readySelector: 'text=Question Banks',
    prepare: async (page) => {
      // The builder is selection-state, not a route: open the Quizzes tab, pick the seeded
      // essay quiz, then open the first pending attempt from its Grading tab.
      await page.getByRole('tab', { name: 'Quizzes', exact: true }).click();
      await page.getByRole('cell', { name: 'QT · Essay · manual grading', exact: true }).click();
      await page.getByRole('tab', { name: /Grading \(\d+\)/ }).click();
      await page.getByTestId('grading-open-attempt').first().click();
      await page.getByTestId('grading-drawer').waitFor({ timeout: 15_000 });
    },
    clipSelector: '[data-testid="grading-drawer"]',
  },
  {
    file: 'instructor_ai_settings.png',
    auth: 'instructor',
    path: `/admin/${course}/settings`,
    readySelector: 'text=AI Features',
    prepare: async (page) => {
      await page.getByText('AI Features', { exact: true }).first().click();
      await page.waitForTimeout(400); // tab transition
    },
  },
  {
    file: 'instructor_api_keys.png',
    auth: 'instructor',
    path: `/admin/${course}/settings`,
    readySelector: 'text=API Keys',
    prepare: async (page) => {
      await page.getByText('API Keys', { exact: true }).first().click();
      await page.waitForTimeout(400); // tab transition
      // Seed one key so the table isn't empty. The demo course survives reseeds
      // (get_or_create), so only create it when the empty state is showing.
      if (await page.getByText('No API keys yet').isVisible()) {
        await page.getByRole('button', { name: 'Create Key' }).click();
        await page.getByPlaceholder('e.g., Jupyter Integration, Grading Script').fill('Claude');
        await page.getByRole('button', { name: 'Create', exact: true }).click();
        await page.getByRole('button', { name: 'Done' }).click();
        // Let the "API key created" toast expire before shooting.
        await page.getByText('API key created.').waitFor({ state: 'hidden', timeout: 10000 });
        await page.waitForTimeout(400); // table refresh
      }
    },
    clipSelector: '[data-testid="course-api-keys-card"]',
  },
];

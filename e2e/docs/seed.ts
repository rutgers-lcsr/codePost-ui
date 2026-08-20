// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Extra fixtures the documentation screenshots need on top of the global setup seed.
// The demo course ships with one grader and no sections, and seed_test_quizzes clears
// every attempt — so the sections matrix, the quiz grading-progress page and the focused
// grader would all render their empty states. Each helper is idempotent: the capture run
// is re-run constantly while iterating on a shot.
import type { APIRequestContext, Browser } from '@playwright/test';
import { BASE_URL, COURSE_NAME, COURSE_PERIOD } from '../constants';

/** Extra graders (seeded by createtestusers) added to the demo course for the matrix shot. */
const EXTRA_GRADERS = ['grader_rubric@dev.edu', 'grader_super@dev.edu'];

/** Sections for the leaders matrix. R03 is deliberately left unled — the page's "no leader"
 *  warning banner is part of what the docs describe. */
const DOC_SECTIONS: { name: string; leaders: string[] }[] = [
  { name: 'R01', leaders: ['grader_basic@dev.edu'] },
  { name: 'R02', leaders: ['grader_rubric@dev.edu'] },
  { name: 'R03', leaders: [] },
];

const ESSAY_QUIZ = 'QT · Essay · manual grading';

export async function resolveCourseId(api: APIRequestContext): Promise<number> {
  const me = await (await api.get('/users/me/')).json();
  const course = [...(me.courseadminCourses ?? []), ...(me.studentCourses ?? [])].find(
    (c: { name: string; period: string }) => c.name === COURSE_NAME && c.period === COURSE_PERIOD,
  );
  if (!course) throw new Error(`Seeded course "${COURSE_NAME}" not found — run the setup project first.`);
  return course.id as number;
}

/** Put extra graders on the roster and build the R01–R03 sections with their leaders. */
export async function seedSectionsAndGraders(api: APIRequestContext, courseId: number): Promise<void> {
  await api.patch(`/courses/${courseId}/addToRoster/`, { data: { graders: EXTRA_GRADERS } });

  const listed = await (await api.get(`/courses/${courseId}/sections/?page_size=200`)).json();
  const existing = new Map<string, number>(
    ((Array.isArray(listed) ? listed : (listed.results ?? [])) as { name: string; id: number }[]).map(
      (s) => [s.name, s.id],
    ),
  );

  for (const { name, leaders } of DOC_SECTIONS) {
    const id = existing.get(name);
    if (id == null) {
      await api.post('/sections/', { data: { name, course: courseId, students: [], leaders } });
    } else {
      // Re-pin the leaders so a previous capture run's edits don't change the shot.
      await api.patch(`/sections/${id}/`, { data: { leaders } });
    }
  }
}

/**
 * Leave the essay quiz with one graded and one pending response, so the grading-progress
 * page has real throughput to show and the focused grader has something to open.
 * The attempts are submitted through the student UI (the same path the quiz e2e uses —
 * the taking flow is a lot of state to fake over the API); grading goes through the API
 * as grader_basic so the progress page attributes it to a grader row.
 */
export async function seedQuizGrading(
  browser: Browser,
  graderApi: APIRequestContext,
  quizId: number,
): Promise<void> {
  const pending = await gradingQueue(graderApi, quizId);
  const needed = 2 - pending.length;
  for (let i = 0; i < needed; i++) await submitEssayAttempt(browser);

  // Grade the oldest pending response; keep the newest awaiting grading.
  const queue = await gradingQueue(graderApi, quizId);
  if (queue.length > 1) {
    const { attemptId, responseId } = queue[0];
    await graderApi.post(`/quizAttempts/${attemptId}/gradeResponse/`, {
      data: {
        response: responseId,
        pointsEarned: 4,
        graderFeedback: 'Clear distinction, good example. Mention complexity next time.',
      },
    });
  }
}

/** Attempts on the quiz with an ungraded essay/code response, oldest first. */
async function gradingQueue(
  api: APIRequestContext,
  quizId: number,
): Promise<{ attemptId: number; responseId: number }[]> {
  const attempts = await (await api.get(`/quizzes/${quizId}/attempts/?needsGrading=true`)).json();
  const rows = (Array.isArray(attempts) ? attempts : (attempts.results ?? [])) as {
    id: number;
    status: string;
    responses?: { id: number; needsManualGrading?: boolean }[];
  }[];
  const queue: { attemptId: number; responseId: number }[] = [];
  for (const attempt of rows) {
    if (attempt.status !== 'submitted') continue;
    for (const response of attempt.responses ?? []) {
      if (response.needsManualGrading) queue.push({ attemptId: attempt.id, responseId: response.id });
    }
  }
  return queue;
}

async function submitEssayAttempt(browser: Browser): Promise<void> {
  const context = await browser.newContext({ storageState: 'e2e/.auth/student.json' });
  const page = await context.newPage();
  try {
    await page.goto(
      `${BASE_URL}/student/${encodeURIComponent(COURSE_NAME)}/${encodeURIComponent(COURSE_PERIOD)}/quizzes`,
    );
    const card = page.getByTestId('student-quiz-card').filter({ hasText: ESSAY_QUIZ });
    await card.getByTestId('student-quiz-action').click();
    await page.getByTestId('quiz-taking').waitFor({ timeout: 30_000 });
    await page
      .getByTestId('quiz-answer-text')
      .fill(
        'A stack is LIFO — the last item pushed is the first popped — while a queue is FIFO, ' +
          'so items leave in the order they arrived.',
      );
    const confirm = page.getByRole('button', { name: 'Submit', exact: true });
    if (!(await confirm.isVisible())) await page.getByTestId('quiz-submit').click();
    await confirm.click();
    await page.getByTestId('quiz-results').waitFor({ timeout: 30_000 });
  } finally {
    await context.close();
  }
}

/** Id of the seeded essay quiz (the one with a manually graded question). */
export async function resolveEssayQuizId(api: APIRequestContext, courseId: number): Promise<number> {
  const quizzes = await (await api.get(`/courses/${courseId}/quizzes/`)).json();
  const rows = Array.isArray(quizzes) ? quizzes : (quizzes.results ?? []);
  const quiz = rows.find((q: { title: string }) => q.title === ESSAY_QUIZ);
  if (!quiz) throw new Error(`Seeded quiz "${ESSAY_QUIZ}" not found — run seed_test_quizzes.`);
  return quiz.id as number;
}

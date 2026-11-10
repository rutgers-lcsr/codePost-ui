// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Course Settings > Webhooks. The section card has no side padding of its own, so the
// "Add a new webhook" button used to sit on the card's left border instead of inside it.
import { test, expect } from '@playwright/test';
import { adminBase, signIn } from '../rubric/helpers';

test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1440, height: 1000 } });

test('the Add a new webhook button sits inside the card, in line with the first column', async ({ context, page }) => {
  await signIn(context, 'course_admin');
  await page.goto(`${adminBase}/settings?section=webhooks`);

  const add = page.getByRole('button', { name: /Add a new webhook/ });
  await expect(add).toBeVisible({ timeout: 30_000 });
  const firstColumn = page.locator('thead').getByText('Enabled', { exact: true });
  await expect(firstColumn).toBeVisible();

  const button = (await add.boundingBox())!;
  const header = (await firstColumn.boundingBox())!;
  // On the border, the button's left edge was 16px left of the column text (the cell's padding).
  expect(Math.abs(button.x - header.x)).toBeLessThanOrEqual(4);
});

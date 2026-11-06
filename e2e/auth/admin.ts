// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Django-admin (session login on the API origin) helpers for the disabled-account scenarios.
import { expect, type Page } from '@playwright/test';
import { API_URL } from '../constants';
import { SUPERUSER_PASSWORD, SUPERUSER_USERNAME } from './helpers';

export async function loginAtAdmin(page: Page) {
  await page.goto(`${API_URL}/admin/login/?next=/admin/`);
  await page.locator('#id_username').fill(SUPERUSER_USERNAME);
  await page.locator('#id_password').fill(SUPERUSER_PASSWORD);
  await page.locator('input[type=submit]').click();
  await expect(page).toHaveURL(/\/admin\/$/);
}

/** Tick / untick "Active" on the user's admin form and save. */
export async function setActiveInAdmin(page: Page, userId: number, active: boolean) {
  await page.goto(`${API_URL}/admin/auth/user/${userId}/change/`);
  const box = page.locator('#id_is_active');
  if (active) await box.check();
  else await box.uncheck();
  await page.locator('input[name=_save]').click();
  await expect(page.locator('.messagelist .success')).toBeVisible();
}

// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Password login / logout through the real login form, plus the account-state gates on it:
// a wrong password is refused, a staff-disabled account cannot log in until staff re-enable it.
import { test, expect, type Page } from '@playwright/test';
import { createUser, ownClientIp, uniqueEmail, userState } from './helpers';
import { loginAtAdmin, setActiveInAdmin } from './admin';

test.use({ storageState: { cookies: [], origins: [] } });

const PASSWORD = 'Sup3r-secret-pw!';

async function submitCredentials(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click(); // no SSO for this domain -> password step
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
}

test.describe('password login', () => {
  test('logs in with the right password, keeps the session on reload, and logs out', async ({ page }) => {
    await ownClientIp(page);
    const user = createUser({ email: uniqueEmail('pw'), password: PASSWORD });
    await submitCredentials(page, user.email, PASSWORD);

    await expect(page).not.toHaveURL(/\/login/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();

    await page.reload();
    await expect(page.getByPlaceholder('Email address')).toHaveCount(0);
    // In no course yet: Home says so instead of showing an empty role list.
    await expect(page.getByText("You're not enrolled in any course yet")).toBeVisible();

    // Opening /logout directly used to re-run the logout forever (blank page, endless
    // "Maximum update depth exceeded"); it must sign out once and land on the start page.
    const loops: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('Maximum update depth')) loops.push(msg.text());
    });
    await page.goto('/logout');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    await page.goto('/login');
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    expect(loops).toEqual([]);
  });

  test('refuses a wrong password and stores no token', async ({ page }) => {
    await ownClientIp(page);
    const user = createUser({ email: uniqueEmail('wrongpw'), password: PASSWORD });
    await submitCredentials(page, user.email, 'not-the-password');

    await expect(page.getByText('The email and password you entered are invalid.')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });

  test('a staff-disabled account cannot log in, and can again once staff re-enable it', async ({
    page,
    browser,
  }) => {
    await ownClientIp(page);
    const user = createUser({ email: uniqueEmail('disabled'), password: PASSWORD });

    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    await loginAtAdmin(admin);

    await setActiveInAdmin(admin, user.id, false);
    expect(userState(user.email)).toMatchObject({ isActive: false, isDisabled: true });

    await submitCredentials(page, user.email, PASSWORD);
    await expect(page.getByText('The email and password you entered are invalid.')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();

    await setActiveInAdmin(admin, user.id, true);
    expect(userState(user.email)).toMatchObject({ isActive: true, isDisabled: false });
    await adminContext.close();

    await submitCredentials(page, user.email, PASSWORD);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();
  });
});

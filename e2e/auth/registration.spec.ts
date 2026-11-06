// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Account activation and registration endpoints: activation links (pending invitees activate;
// staff-disabled accounts do not), token-verify endpoints that never disclose an email, the
// organization's verify_user gate, the invite-code join on a course without admins, and the
// auth throttle. Backend-only behaviour is driven over real HTTP; the set-password page is
// driven through the UI.
import { test, expect, type APIRequestContext } from '@playwright/test';
import { API_URL } from '../constants';
import { loginAtAdmin, setActiveInAdmin } from './admin';
import { activationLink, createUser, freshIpHeader, ownClientIp, pyShell, uniqueEmail, userState } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

const NEW_PASSWORD = 'Brand-new-pw-123!';

async function post(request: APIRequestContext, path: string, data: object, headers = freshIpHeader()) {
  return request.post(`${API_URL}${path}`, { data, headers });
}

test.describe('activation links', () => {
  test('a pending invitee opens the emailed link, sets a password and can then log in', async ({ page }) => {
    await ownClientIp(page);
    const invitee = createUser({ email: uniqueEmail('invitee'), isActive: false });

    await page.goto(`/activate/${invitee.uid}/${invitee.token}`);
    await expect(page.getByText(invitee.email)).toBeVisible(); // the valid link shows whose account it is
    await page.getByLabel('Password', { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel('Confirm password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Success!')).toBeVisible();

    expect(userState(invitee.email)).toMatchObject({ isActive: true, isPasswordSet: true });
    await page.goto('/login');
    await page.getByPlaceholder('Email address').fill(invitee.email);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByPlaceholder('Password').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();
  });

  test('an account staff disabled in the Django admin is not switched back on by its activation link', async ({
    page,
    browser,
  }) => {
    await ownClientIp(page);
    // Active but never set a password: exactly the account whose disabling used to be undone
    // by its still-valid activation link.
    const user = createUser({ email: uniqueEmail('adminoff'), isActive: true });
    const adminContext = await browser.newContext();
    const admin = await adminContext.newPage();
    await loginAtAdmin(admin);
    await setActiveInAdmin(admin, user.id, false);
    await adminContext.close();
    expect(userState(user.email)).toMatchObject({ isActive: false, isDisabled: true });

    const link = activationLink(user.email);
    await page.goto(`/activate/${link.uid}/${link.token}`);
    await expect(page.getByText("There's something wrong with your link.")).toBeVisible();

    const direct = await post(page.request, '/registration/registerAndSetPassword/', {
      uid: link.uid,
      token: link.token,
      password1: NEW_PASSWORD,
      password2: NEW_PASSWORD,
    });
    expect(direct.status()).toBe(400);
    expect(userState(user.email)).toMatchObject({ isActive: false, isDisabled: true });
  });

  test('a marked or previously-passworded inactive account is refused and shown no email', async ({
    request,
  }) => {
    const marked = createUser({ email: uniqueEmail('marked'), isActive: false, isDisabled: true });
    const legacy = createUser({ email: uniqueEmail('legacy'), password: 'Old-pass-123!', isActive: false });
    for (const user of [marked, legacy]) {
      const verify = await post(request, '/registration/verifyRegistrationToken/', {
        uid: user.uid,
        token: user.token,
      });
      expect(await verify.json()).toEqual({ isValid: false }); // no email for a refused link
      const reg = await post(request, '/registration/registerAndSetPassword/', {
        uid: user.uid,
        token: user.token,
        password1: NEW_PASSWORD,
        password2: NEW_PASSWORD,
      });
      expect(reg.status()).toBe(400);
      expect(userState(user.email).isActive).toBe(false);
    }
  });
});

test.describe('token verification does not disclose accounts', () => {
  test('verify endpoints return the email only for a valid token', async ({ request }) => {
    const user = createUser({ email: uniqueEmail('verify'), isActive: false });
    for (const path of ['/registration/verifyRegistrationToken/', '/registration/verifyResetToken/']) {
      const good = await (await post(request, path, { uid: user.uid, token: user.token })).json();
      expect(good).toEqual({ isValid: true, email: user.email });

      const forged = await post(request, path, { uid: user.uid, token: 'a'.repeat(30) });
      const forgedBody = await forged.json();
      expect(forgedBody.isValid).toBe(false);
      expect(JSON.stringify(forgedBody)).not.toContain(user.email);

      const unknownUid = await post(request, path, { uid: 'MTIzNDU2Nw', token: user.token });
      expect(JSON.stringify(await unknownUid.json())).not.toContain('@');

      const garbageUid = await post(request, path, { uid: '!!not-base64!!', token: user.token });
      expect(garbageUid.status()).toBeLessThan(500);
      expect(JSON.stringify(await garbageUid.json())).not.toContain('@');
    }
  });

  test('the throttle answers 429 with a detail once an address sends too many', async ({ request }) => {
    const headers = freshIpHeader(); // this test's own client; nothing else shares the bucket
    const statuses: number[] = [];
    let last: { detail?: string } = {};
    for (let i = 0; i < 14; i += 1) {
      const res = await post(request, '/registration/verifyRegistrationToken/', { uid: 'MQ', token: 'x'.repeat(30) }, headers);
      statuses.push(res.status());
      if (res.status() === 429) {
        last = await res.json();
        break;
      }
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses).toContain(429);
    expect(typeof last.detail).toBe('string');
    expect(last.detail?.length).toBeGreaterThan(0);
  });
});

test.describe('organization verify_user', () => {
  async function staffToken(request: APIRequestContext): Promise<string> {
    const res = await request.post(`${API_URL}/dev-auth/login-as/`, { data: { role: 'staff' } });
    return (await res.json()).token as string;
  }

  test('approves only pending users; an established member is neither promoted nor deleted', async ({
    request,
  }) => {
    const orgId = pyShell<number>(`
from core.models import Organization
emit(Organization.objects.get(shortname='DEVORG').id)
`);
    const pending = createUser({ email: uniqueEmail('pending'), isActive: false });
    pyShell(`
from django.contrib.auth.models import User
u = User.objects.get(email=${JSON.stringify(pending.email)})
u.profile.pendingValidation = True
u.profile.isDisabled = True
u.profile.save()
emit(True)
`);
    const member = createUser({ email: uniqueEmail('member'), password: 'Member-pass-1!' });
    const headers = { Authorization: `Bearer ${await staffToken(request)}` };
    const verify = (email: string, action: string) =>
      request.post(`${API_URL}/organizations/${orgId}/verify_user/`, {
        data: { user_email: email, action },
        headers,
      });

    const memberDecline = await verify(member.email, 'decline');
    expect(memberDecline.status()).toBe(400);
    expect(typeof (await memberDecline.json()).detail).toBe('string');
    const memberApprove = await verify(member.email, 'approve');
    expect(memberApprove.status()).toBe(400);
    expect(userState(member.email)).toMatchObject({ isActive: true }); // still exists, untouched

    const approved = await verify(pending.email, 'approve');
    expect(approved.status()).toBe(200);
    expect(userState(pending.email)).toMatchObject({ isActive: true, isDisabled: false });
  });
});

test.describe('invite-code join', () => {
  test('a course with no admins answers a clean 400 with a detail and creates no account', async ({ request }) => {
    const email = uniqueEmail('joiner');
    const code = `E${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    pyShell(`
from core.models import Course, Organization
org = Organization.objects.get(shortname='DEVORG')
Course.objects.create(name='E2E No Admin ' + ${JSON.stringify(code)}, period='Fall 2026', organization=org,
                      inviteCode=${JSON.stringify(code)}, inviteCodeEnabled=True)
emit(True)
`);
    const res = await post(request, '/registration/emailRegistration/', { email, token: code });
    expect(res.status()).toBe(400);
    expect(typeof (await res.json()).detail).toBe('string');
    const exists = pyShell<boolean>(`
from django.contrib.auth.models import User
emit(User.objects.filter(email=${JSON.stringify(email)}).exists())
`);
    expect(exists).toBe(false);
  });
});

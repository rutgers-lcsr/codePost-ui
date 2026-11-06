// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Helpers for the auth e2e area: seed data through `manage.py shell`, per-test throttle
// isolation, and the constants of the local docker CAS (Apereo CAS on https://localhost:8443,
// casuser / Mellon, started by whoever runs the suite; the API must trust its certificate via
// REQUESTS_CA_BUNDLE).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';
import { API_URL } from '../constants';

const API_DIR = process.env.E2E_API_DIR ?? path.resolve(__dirname, '../../../codePost-api');
const PYTHON = process.env.E2E_PYTHON ?? path.join(API_DIR, '.venv/bin/python');

export const CAS_LOGIN_URL = process.env.E2E_CAS_URL ?? 'https://localhost:8443/cas/login';
export const CAS_USER = 'casuser';
export const CAS_PASSWORD = 'Mellon';
/** The CAS org's email domain: CAS answers `casuser`, which becomes casuser@example.org. */
export const CAS_EMAIL_DOMAIN = 'example.org';
export const CAS_ORG_SHORTNAME = 'E2ECAS';
export const CAS_EMAIL = `${CAS_USER}@${CAS_EMAIL_DOMAIN}`;

export const SUPERUSER_USERNAME = 'e2e-super@dev.edu';
export const SUPERUSER_PASSWORD = 'E2e-Superuser-1!';

/** Run python in the API's `manage.py shell` and return the JSON it printed with `emit(...)`. */
export function pyShell<T = unknown>(code: string): T {
  const prelude = ['import json', 'def emit(value):', '    print("E2E_JSON:" + json.dumps(value))'].join('\n');
  const env = { ...process.env, DEBUG: 'TRUE' } as NodeJS.ProcessEnv;
  delete env.DB_HOSTNAME;
  const out = execFileSync(PYTHON, ['manage.py', 'shell', '-c', `${prelude}\n${code}`], {
    cwd: API_DIR,
    env,
    encoding: 'utf8',
  });
  const line = out.split('\n').find((l) => l.startsWith('E2E_JSON:'));
  return (line ? JSON.parse(line.slice('E2E_JSON:'.length)) : null) as T;
}

/** Idempotent: the CAS organization (deliberately not the main org, so /login keeps its email step). */
export function seedCasOrg(): { orgId: number } {
  return pyShell(`
from core.models import Organization
org, _ = Organization.objects.get_or_create(shortname='${CAS_ORG_SHORTNAME}', defaults=dict(name='E2E CAS Org'))
org.email_domain = '${CAS_EMAIL_DOMAIN}'
org.sso_enabled = True
org.sso_provider = 'CAS'
org.sso_config = {'cas_server_url': '${CAS_LOGIN_URL}', 'cas_version': '3'}
org.is_main_org = False
org.save()
emit({'orgId': org.id})
`);
}

export interface SeededUser {
  id: number;
  email: string;
  uid: string;
  token: string;
}

let counter = 0;
/** A unique, re-runnable e-mail address. */
export function uniqueEmail(label: string): string {
  counter += 1;
  return `e2e-auth-${label}-${Date.now().toString(36)}${counter}@dev.edu`;
}

/** Create a user in the dev org in the given state; returns an activation-link uid/token. */
export function createUser(opts: {
  email: string;
  password?: string | null;
  isActive?: boolean;
  isDisabled?: boolean;
}): SeededUser {
  const { email, password = null, isActive = true, isDisabled = false } = opts;
  return pyShell(`
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from core.models import Organization
email = ${JSON.stringify(email)}
password = ${password === null ? 'None' : JSON.stringify(password)}
user = User.objects.create(username=email, email=email, is_active=${isActive ? 'True' : 'False'})
if password:
    user.set_password(password)
    user.save()
user.profile.organization = Organization.objects.get(shortname='DEVORG')
user.profile.isPasswordSet = bool(password)
user.profile.isDisabled = ${isDisabled ? 'True' : 'False'}
user.profile.save()
emit({'id': user.id, 'email': email,
      'uid': urlsafe_base64_encode(force_bytes(user.pk)),
      'token': default_token_generator.make_token(user)})
`);
}

export interface UserState {
  isActive: boolean;
  isDisabled: boolean;
  isPasswordSet: boolean;
}

export function userState(email: string): UserState {
  return pyShell(`
from django.contrib.auth.models import User
user = User.objects.get(email=${JSON.stringify(email)})
emit({'isActive': user.is_active, 'isDisabled': user.profile.isDisabled,
      'isPasswordSet': user.profile.isPasswordSet})
`);
}

/** Fresh uid/token for an existing user (the token changes whenever password/last_login do). */
export function activationLink(email: string): { uid: string; token: string } {
  return pyShell(`
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
user = User.objects.get(email=${JSON.stringify(email)})
emit({'uid': urlsafe_base64_encode(force_bytes(user.pk)), 'token': default_token_generator.make_token(user)})
`);
}

let ipCounter = 0;
function fakeIp(): string {
  ipCounter += 1;
  return `10.${Math.floor(Math.random() * 250)}.${ipCounter % 250}.${Math.floor(Math.random() * 250)}`;
}

/**
 * The auth throttles (login 10/min, SSO 20/min, registration 10/min) are per client IP and the
 * API trusts X-Forwarded-For, so each test claims its own "client" and never drains another
 * test's bucket. Added at the network layer (route.continue), so it causes no CORS preflight.
 */
export async function ownClientIp(target: Page | BrowserContext): Promise<string> {
  const ip = fakeIp();
  await target.route(`${API_URL}/**`, (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': ip } }),
  );
  return ip;
}

/** A fresh X-Forwarded-For header for direct `request` fixture calls. */
export function freshIpHeader(): Record<string, string> {
  return { 'X-Forwarded-For': fakeIp() };
}

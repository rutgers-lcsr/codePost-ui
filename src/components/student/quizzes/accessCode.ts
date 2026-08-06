// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { ResponseError } from '../../../api-client';

/** The JSON body the quiz-attempt endpoints return on a structured 403: a closed,
 *  code-gated quiz ({ accessCodeRequired }) or a Safe Exam Browser–required quiz
 *  accessed outside SEB ({ lockdownRequired, lockdownReason }). */
export interface AccessCode403 {
  accessCodeRequired?: boolean;
  lockdownRequired?: boolean;
  lockdownReason?: 'missing_header' | 'invalid_key' | 'not_configured';
  detail?: string;
}

/** Parse a generated-client error as a 403 JSON body, or null when it isn't one. The generated
 *  ResponseError carries only the raw Response, so apiErrorMessage (which reads `.body`) can't
 *  see the `accessCodeRequired` / `detail` fields — read them off the response directly. The
 *  response body is consumed here, so call this once per error. */
export const parseAccessCode403 = async (e: unknown): Promise<AccessCode403 | null> => {
  if (e instanceof ResponseError && e.response.status === 403) {
    try {
      return await e.response.json();
    } catch {
      return null;
    }
  }
  return null;
};

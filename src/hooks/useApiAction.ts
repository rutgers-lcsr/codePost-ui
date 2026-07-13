// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useState } from 'react';

import { message } from 'antd';

import { apiErrorMessage } from '../lib/apiError';

/** Wrap async API actions with a shared busy flag + success/error messaging.
 *
 * `onSuccess` (usually a query invalidation) runs after every successful action.
 * The server's error detail is surfaced when present; `errorFallback` otherwise.
 */
export function useApiAction(onSuccess?: () => void) {
  const [acting, setActing] = useState(false);

  const run = async (
    fn: () => Promise<unknown>,
    successMsg?: string,
    errorFallback = 'The action failed.',
  ): Promise<boolean> => {
    setActing(true);
    try {
      await fn();
      if (successMsg) message.success(successMsg);
      onSuccess?.();
      return true;
    } catch (e) {
      message.error(apiErrorMessage(e) ?? errorFallback);
      return false;
    } finally {
      setActing(false);
    }
  };

  return { acting, run };
}

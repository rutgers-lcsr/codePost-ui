// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// The Safe Exam Browser handoff pages, rendered for /seb/* BEFORE any auth branching:
// SEB opens the generated config's startURL (/seb/launch?ott=…&redirect=…) in a fresh
// session with no stored tokens, so this page exchanges the one-time token for a normal
// session and reloads into the quiz take route. /seb/quit is the config's quitURL.
import * as React from 'react';
import { Flex, Result, Spin } from 'antd';
import { ottApi } from '../../../api-client/clients';
import { resolveSafeRedirectPath, setTokens } from '../../../utils/auth';

const SebLaunch: React.FC = () => {
  const isQuit = window.location.pathname.startsWith('/seb/quit');
  const [failed, setFailed] = React.useState(false);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (isQuit || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const ott = params.get('ott');
      const redirect = params.get('redirect');
      if (!ott) {
        setFailed(true);
        return;
      }
      try {
        const pair = await ottApi.exchangeCreate({ exchangeOTTRequest: { token: ott } });
        setTokens(pair.token, pair.refresh);
        // Full reload so the app boots cleanly with the new session.
        window.location.replace((redirect && resolveSafeRedirectPath(redirect)) || '/');
      } catch {
        setFailed(true);
      }
    })();
  }, [isQuit]);

  if (isQuit) {
    return (
      <Result
        status="success"
        title="You're done"
        subTitle="You can close Safe Exam Browser now."
        data-testid="seb-quit"
      />
    );
  }

  if (failed) {
    return (
      <Result
        status="warning"
        title="This launch link is no longer valid"
        subTitle="Launch links are single-use and expire after a few minutes. Return to your normal browser, go back to the quiz, and press “Launch in Safe Exam Browser” again."
        data-testid="seb-launch-failed"
      />
    );
  }

  return (
    <Flex vertical align="center" justify="center" gap={16} style={{ minHeight: '60vh' }} data-testid="seb-launch">
      <Spin size="large" />
      Opening your quiz…
    </Flex>
  );
};

export default SebLaunch;

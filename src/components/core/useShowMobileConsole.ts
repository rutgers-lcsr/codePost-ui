// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.

import useWindowSize from './useWindowSize';

const MOBILE_BREAKPOINT = 768;

const MOBILE_UA_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return MOBILE_UA_REGEX.test(navigator.userAgent);
};

/**
 * Returns true when the mobile dashboard console should render.
 *
 * Real mobile devices always get the mobile console. On desktop, the mobile
 * console is only available in development builds (so the team can iterate on
 * it by narrowing the browser window) — in production, narrowing a desktop
 * browser keeps the desktop layout.
 */
const useShowMobileConsole = (): boolean => {
  const { width } = useWindowSize();
  const isDev = process.env.NODE_ENV === 'development';
  if (isMobileDevice()) return true;
  return isDev && width < MOBILE_BREAKPOINT;
};

export default useShowMobileConsole;

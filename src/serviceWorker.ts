// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

// Service worker registration was removed — it relied on CRA conventions
// (process.env.PUBLIC_URL, /service-worker.js) that don't apply under Vite.
// If PWA/offline support is needed in the future, use vite-plugin-pwa:
// https://vite-pwa-org.netlify.app/

const isLocalhost = Boolean(
  typeof window !== 'undefined' &&
  window.location &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)),
);

export const hostname = () => {
  if (isLocalhost) {
    return 'http://localhost:3000';
  } else {
    return 'https://codepost.cs.rutgers.edu';
  }
};

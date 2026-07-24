// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Keep the conventional `type: subject` structure (feat/fix/…), but lift the length caps
  // that block detailed, meaningful commit messages.
  rules: {
    // config-conventional hard-wraps body/footer lines at 100 chars, which rejects normal
    // prose paragraphs — turn the wrap off so bodies can explain the "why" freely.
    'body-max-line-length': [0, 'always'],
    'footer-max-line-length': [0, 'always'],
    // Give the subject line room for a descriptive summary (default cap is 100).
    'header-max-length': [2, 'always', 120],
  },
};
